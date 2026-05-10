"""
Chat Service
Conversational assistant for MESH. Auto-routes between Gemini (production
on EC2 / when GEMINI_API_KEY is set), Groq's hosted llama-3.1 (when
GROQ_API_KEY is set), and local Ollama (development fallback).

Two modes:
  - "assistant": general help about MESH features and how to use them
  - "refine": rewrite a user's prompt to improve generation quality
"""

import os
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


OLLAMA_MODEL = os.getenv('OLLAMA_CHAT_MODEL', 'llama3.1:8b')
GROQ_MODEL = os.getenv('GROQ_CHAT_MODEL', 'llama-3.1-8b-instant')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '').strip()
GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
GEMINI_MODEL = os.getenv('GEMINI_CHAT_MODEL', 'gemini-1.5-flash')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip()
GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'


# --- Personality / system prompts ----------------------------------------

_BASE_CONTEXT = """You are the in-app assistant for MESH, an AI-powered creative platform.

About MESH:
- MESH lets users generate AI content from text or images.
- Four core features: 2D-to-3D model conversion, text-to-animation video, text-to-image, and text-to-speech voice generation.
- Built with Next.js, Flask, Supabase, and uses RunPod cloud GPU for heavy generation.

What you do:
- Answer questions about MESH features clearly and concisely.
- Explain what each tool does, when to use it, and how to get good results.
- Be helpful, friendly, and direct. No marketing fluff.
- Keep answers short (2-4 sentences) unless the user asks for detail.
- If a user asks something MESH can't do, say so honestly — don't make up features.
"""

_PAGE_CONTEXTS = {
    '/creator': "The user is on the creator dashboard — a hub showing their stats and recent projects.",
    '/creator/2d-to-3d': (
        "The user is on the 2D-to-3D conversion page. They upload an image and MESH generates "
        "a 3D model (GLB/OBJ/GLTF). Best results: clear subject, plain background, front-facing pose."
    ),
    '/creator/animate': (
        "The user is on the Text-to-Animation page. They describe a scene and MESH generates a video "
        "with AI voiceover. Single mode = one prompt. Multi-scene mode = sequence of clips with "
        "consistent characters across scenes."
    ),
    '/creator/text-to-image': (
        "The user is on the Text-to-Image page. They write a prompt and MESH generates a still image "
        "via SDXL/Flux on cloud GPU. Good prompts include subject, style, lighting, and composition."
    ),
    '/creator/assets': "The user is on the Assets page where they manage all their generated content (3D, images, videos).",
    '/creator/settings': "The user is on the Settings page for their account.",
}

_REFINE_PROMPT = """You are a prompt engineer for AI generation tools (image, video, 3D).

The user will give you a rough idea or a weak prompt. Your job is to rewrite it so it produces
better results, without changing the user's intent.

Rules:
- Output ONLY the improved prompt. No preamble, no explanation, no quotes.
- Keep the user's subject and style intent — just make it more specific and visual.
- Add useful details: lighting, composition, style anchors, camera angle, mood.
- Stay under 60 words.
- Do not invent content the user didn't ask for (no extra characters, no unrelated objects).
"""


def _build_system_prompt(page: Optional[str], mode: str) -> str:
    if mode == 'refine':
        return _REFINE_PROMPT
    page_context = _PAGE_CONTEXTS.get(page or '', '')
    if page_context:
        return f"{_BASE_CONTEXT}\n\nCurrent page context: {page_context}"
    return _BASE_CONTEXT


# --- Backend selection ---------------------------------------------------

def _select_backend() -> str:
    """Priority: Gemini > Groq > Ollama (local fallback)."""
    if GEMINI_API_KEY:
        return 'gemini'
    if GROQ_API_KEY:
        return 'groq'
    return 'ollama'


def get_status() -> Dict[str, Any]:
    """Report which backend is active and whether it's reachable."""
    backend = _select_backend()
    if backend == 'gemini':
        return {'available': True, 'backend': 'gemini', 'model': GEMINI_MODEL}
    if backend == 'groq':
        return {'available': True, 'backend': 'groq', 'model': GROQ_MODEL}

    try:
        import ollama
        models = ollama.list()
        names = [m.model for m in models.models]
        available = any(OLLAMA_MODEL in n for n in names)
        return {
            'available': available,
            'backend': 'ollama',
            'model': OLLAMA_MODEL,
            'message': '' if available else f'Run: ollama pull {OLLAMA_MODEL}',
        }
    except Exception as e:
        return {
            'available': False,
            'backend': 'ollama',
            'model': OLLAMA_MODEL,
            'message': f'Ollama not running: {e}',
        }


# --- Chat completion -----------------------------------------------------

def _chat_via_ollama(messages: List[Dict[str, str]]) -> str:
    import ollama
    response = ollama.chat(
        model=OLLAMA_MODEL,
        messages=messages,
        options={'temperature': 0.5, 'num_predict': 512},
    )
    return response.message.content.strip()


def _chat_via_gemini(messages: List[Dict[str, str]]) -> str:
    """Gemini uses a different message shape: system instruction is separate,
    and roles are 'user' / 'model' (not 'assistant')."""
    import requests
    system_instruction = ''
    contents = []
    for m in messages:
        role = m['role']
        if role == 'system':
            system_instruction = m['content']
            continue
        gemini_role = 'model' if role == 'assistant' else 'user'
        contents.append({'role': gemini_role, 'parts': [{'text': m['content']}]})

    payload: Dict[str, Any] = {
        'contents': contents,
        'generationConfig': {'temperature': 0.5, 'maxOutputTokens': 512},
    }
    if system_instruction:
        payload['systemInstruction'] = {'parts': [{'text': system_instruction}]}

    resp = requests.post(
        f'{GEMINI_URL}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}',
        headers={'Content-Type': 'application/json'},
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get('candidates', [])
    if not candidates:
        raise RuntimeError(f'Gemini returned no candidates: {data}')
    parts = candidates[0].get('content', {}).get('parts', [])
    text = ''.join(p.get('text', '') for p in parts).strip()
    if not text:
        raise RuntimeError(f'Gemini returned empty text: {data}')
    return text


def _chat_via_groq(messages: List[Dict[str, str]]) -> str:
    import requests
    resp = requests.post(
        GROQ_URL,
        headers={
            'Authorization': f'Bearer {GROQ_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'model': GROQ_MODEL,
            'messages': messages,
            'temperature': 0.5,
            'max_tokens': 512,
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data['choices'][0]['message']['content'].strip()


def chat(
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    page: Optional[str] = None,
    mode: str = 'assistant',
) -> Dict[str, Any]:
    """
    Send a user message to the chat backend and return the reply.

    Args:
        user_message: The current user message
        history: Prior turns as [{role: 'user'|'assistant', content: str}, ...]
        page: Current frontend route — used to tailor system prompt
        mode: 'assistant' for general help, 'refine' for prompt rewriting

    Returns:
        {'reply': str, 'backend': 'ollama'|'groq', 'model': str}
    """
    if not user_message or not user_message.strip():
        raise ValueError('Empty message')

    messages: List[Dict[str, str]] = [
        {'role': 'system', 'content': _build_system_prompt(page, mode)},
    ]
    if history:
        # Trim to last 8 turns to keep context window small.
        for turn in history[-8:]:
            role = turn.get('role')
            content = turn.get('content', '')
            if role in ('user', 'assistant') and content:
                messages.append({'role': role, 'content': content})
    messages.append({'role': 'user', 'content': user_message.strip()})

    backend = _select_backend()
    model = {'gemini': GEMINI_MODEL, 'groq': GROQ_MODEL, 'ollama': OLLAMA_MODEL}[backend]
    logger.info(f'Chat via {backend} ({model}), mode={mode}, page={page}')

    try:
        if backend == 'gemini':
            reply = _chat_via_gemini(messages)
        elif backend == 'groq':
            reply = _chat_via_groq(messages)
        else:
            reply = _chat_via_ollama(messages)
    except Exception as e:
        logger.error(f'{backend} chat failed: {e}')
        raise RuntimeError(f'{backend} chat failed: {e}')

    return {'reply': reply, 'backend': backend, 'model': model}
