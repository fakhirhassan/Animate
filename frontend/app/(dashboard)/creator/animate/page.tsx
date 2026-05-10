'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Download,
  Settings2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Mic,
  Plus,
  X as XIcon,
  GripVertical,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { animationAPI, voiceAPI, conversionAPI } from '@/lib/api';
import { useGenerationStore } from '@/store/generationStore';
import RatingDialog, { useHasRated } from '@/components/shared/RatingDialog';
import { Star } from 'lucide-react';

type Stage = 'input' | 'generating' | 'preview';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
const HISTORY_LIMIT = 12;

interface VoicePreset {
  id: string;
  name: string;
  language: string;
  gender?: 'female' | 'male' | 'neutral';
}

function inferVoiceGender(preset: VoicePreset): 'female' | 'male' | 'neutral' {
  if (preset.gender) return preset.gender;
  const prefix = preset.id.slice(0, 2).toLowerCase();
  if (prefix === 'af' || prefix === 'bf') return 'female';
  if (prefix === 'am' || prefix === 'bm') return 'male';
  const n = preset.name.toLowerCase();
  if (n.includes('female')) return 'female';
  if (n.includes('male')) return 'male';
  return 'neutral';
}

interface VideoHistoryItem {
  id: string;
  url: string;
  prompt: string;
  filename: string;
  duration: string;
  createdAt: string;
}

async function fetchVideoHistory(): Promise<VideoHistoryItem[]> {
  try {
    const response = await conversionAPI.getHistory({ limit: HISTORY_LIMIT, type: 'animation' });
    const rows = response?.data?.data?.conversions || [];
    return rows.map((r: any) => ({
      id: r.id,
      url: r.model_url?.startsWith('http') ? r.model_url : `${API_BASE}${r.model_url}`,
      prompt: r.settings?.prompt || r.file_name || 'Untitled',
      filename: r.file_name || 'animation.mp4',
      duration: r.settings?.duration ? `${r.settings.duration}s` : '',
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

// Duration presets — each chooses sensible num_clips + frames/clip combos.
// Wan2.1 caps per-clip around ~81 frames (~5s @ 16fps); longer durations
// use more clips stitched with crossfades.
const DURATION_PRESETS = [
  { seconds: 5,  num_clips: 1, frames_per_clip: 81, label: '5s'  },
  { seconds: 10, num_clips: 2, frames_per_clip: 81, label: '10s' },
  { seconds: 20, num_clips: 4, frames_per_clip: 81, label: '20s' },
  { seconds: 30, num_clips: 6, frames_per_clip: 81, label: '30s' },
  { seconds: 60, num_clips: 8, frames_per_clip: 120, label: '60s' },
] as const;

type DurationSeconds = typeof DURATION_PRESETS[number]['seconds'];

type GenMode = 'single' | 'multi' | 'image';

export default function AnimatePage() {
  const [mode, setMode] = useState<GenMode>('single');
  const [prompt, setPrompt] = useState('');
  const [scenes, setScenes] = useState<string[]>(['', '']);
  const [narration, setNarration] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('input');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<any>(null);
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const hasRated = useHasRated('t2v', videoMeta?.conversion_id || videoUrl || undefined);
  const [voicePresets, setVoicePresets] = useState<VoicePreset[]>([]);
  const [durationSeconds, setDurationSeconds] = useState<DurationSeconds>(20);
  const [settings, setSettings] = useState({
    num_frames_per_segment: 81,
    num_inference_steps: 30,
    fps: 16,
    voice_preset: 'af_heart',
    num_clips: 4,
  });

  const applyDurationPreset = (seconds: DurationSeconds) => {
    const preset = DURATION_PRESETS.find((p) => p.seconds === seconds)!;
    setDurationSeconds(seconds);
    setSettings((s) => ({
      ...s,
      num_clips: preset.num_clips,
      num_frames_per_segment: preset.frames_per_clip,
    }));
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to the global animate job so navigation away & back doesn't
  // reset the in-flight request. The HTTP call started by `runAnimateJob`
  // continues running across route changes; when it lands the store
  // updates and the effect below re-syncs this page's UI.
  const animateJob = useGenerationStore((s) => s.jobs.animate);
  const runAnimateJob = useGenerationStore((s) => s.run);
  const resetAnimateJob = useGenerationStore((s) => s.reset);

  useEffect(() => {
    if (animateJob.status === 'running' && stage !== 'generating') {
      setStage('generating');
    } else if (animateJob.status === 'success' && animateJob.result) {
      const data = animateJob.result;
      if (data?.video_url) {
        setVideoUrl(`${API_BASE}${data.video_url}`);
        setVideoMeta(data);
        setStage('preview');
      }
    } else if (animateJob.status === 'error') {
      setError(animateJob.error || 'Failed to generate animation');
      setStage('input');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateJob.status, animateJob.finishedAt]);

  const handleImagePick = (file: File | null) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
      return;
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  useEffect(() => {
    fetchVideoHistory().then(setVideoHistory);
    voiceAPI.getPresets()
      .then((res) => {
        if (res.data?.data?.presets) {
          setVoicePresets(res.data.data.presets);
        }
      })
      .catch(() => {
        setVoicePresets([
          { id: 'af_heart', name: 'Heart (Female)', language: 'en-us' },
          { id: 'am_adam', name: 'Adam (Male)', language: 'en-us' },
          { id: 'af_bella', name: 'Bella (Female)', language: 'en-us' },
          { id: 'am_michael', name: 'Michael (Male)', language: 'en-us' },
          { id: 'bf_emma', name: 'Emma (Female, British)', language: 'en-gb' },
          { id: 'bm_george', name: 'George (Male, British)', language: 'en-gb' },
        ]);
      });
  }, []);

  const handleGenerate = async () => {
    setError(null);

    // Validate based on mode
    if (mode === 'single') {
      if (prompt.trim().length < 10) {
        setError('Please describe your scene in at least 10 characters');
        return;
      }
    } else if (mode === 'image') {
      if (!imageFile) {
        setError('Please upload a starting image');
        return;
      }
      if (prompt.trim().length < 5) {
        setError('Please describe how the image should animate (at least 5 characters)');
        return;
      }
    } else {
      const nonEmpty = scenes.map((s) => s.trim()).filter((s) => s.length >= 5);
      if (nonEmpty.length < 2) {
        setError('Please provide at least 2 scenes (each 5+ characters)');
        return;
      }
    }

    const promptLabel =
      mode === 'single'
        ? prompt.trim()
        : mode === 'image'
          ? `Image animation: ${prompt.trim()}`
          : scenes.map((s, i) => `Scene ${i + 1}: ${s.trim()}`).filter((_, i) => scenes[i].trim()).join(' | ');

    // Capture mode + form values at submit time so the closure is stable
    // even if the user navigates away and the page unmounts.
    const submitMode = mode;
    const submitImage = imageFile;
    const submitPrompt = prompt.trim();
    const submitScenes = scenes.map((s) => s.trim()).filter((s) => s.length > 0);
    const submitNarration = narration.trim();
    const submitSettings = settings;

    setStage('generating');
    try {
      const data = await runAnimateJob('animate', promptLabel, async () => {
        let response;
        if (submitMode === 'single') {
          response = await animationAPI.generate({
            text: submitPrompt,
            num_frames_per_segment: submitSettings.num_frames_per_segment,
            num_inference_steps: submitSettings.num_inference_steps,
            fps: submitSettings.fps,
            voice_preset: submitSettings.voice_preset,
            num_clips: submitSettings.num_clips,
          });
        } else if (submitMode === 'image') {
          const fd = new FormData();
          fd.append('image', submitImage!);
          fd.append('text', submitPrompt);
          fd.append('num_frames', String(submitSettings.num_frames_per_segment));
          fd.append('num_inference_steps', String(submitSettings.num_inference_steps));
          fd.append('fps', String(submitSettings.fps));
          fd.append('voice_preset', submitSettings.voice_preset);
          response = await animationAPI.imageAnimate(fd);
        } else {
          response = await animationAPI.generateMultiScene({
            scenes: submitScenes,
            num_frames_per_scene: submitSettings.num_frames_per_segment,
            num_inference_steps: submitSettings.num_inference_steps,
            fps: submitSettings.fps,
            voice_preset: submitSettings.voice_preset,
            narration: submitNarration,
          });
        }
        const body = response.data;
        if (!body?.success || !body?.data?.video_url) {
          throw new Error(body?.message || 'Failed to generate animation');
        }
        return body.data;
      });
      // Effect above will mirror this into local state. Refresh history.
      fetchVideoHistory().then(setVideoHistory);
      // Suppress unused warning — `data` is consumed via the store effect.
      void data;
    } catch {
      // Error already captured in the store; the effect above syncs it.
    }
  };

  // Multi-scene helpers
  const addScene = () => setScenes((prev) => [...prev, '']);
  const removeScene = (idx: number) => setScenes((prev) => prev.filter((_, i) => i !== idx));
  const updateScene = (idx: number, value: string) =>
    setScenes((prev) => prev.map((s, i) => (i === idx ? value : s)));
  const moveScene = (idx: number, dir: -1 | 1) => {
    setScenes((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleNewVideo = () => {
    setStage('input');
    setVideoUrl(null);
    setVideoMeta(null);
    setError(null);
    resetAnimateJob('animate');
  };
  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = videoMeta?.filename || 'animation.mp4';
    a.click();
  };

  const estimatedDuration = (settings.num_frames_per_segment / settings.fps) * settings.num_clips;

  return (
    <div className="min-h-screen bg-background px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-foreground uppercase tracking-tight">Text to Animation</h1>
            <p className="text-sm text-muted">Describe your scene and generate an animated video with AI voice</p>
          </div>
        </div>
      </div>

      <PipelineProgress stage={stage} />

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-destructive text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Stage: Input */}
        {stage === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-6 bloom-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-sm font-bold text-foreground uppercase tracking-tight">
                  {mode === 'single'
                    ? 'Describe Your Scene'
                    : mode === 'image'
                      ? 'Animate an Image'
                      : 'Describe Your Scenes'}
                </h2>
                {/* Mode switcher */}
                <div className="inline-flex bg-surface-high rounded-lg p-0.5 border border-border">
                  <button
                    onClick={() => setMode('single')}
                    className={`px-3 py-1.5 rounded-md text-xs font-label uppercase tracking-widest transition-all ${
                      mode === 'single' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setMode('image')}
                    className={`px-3 py-1.5 rounded-md text-xs font-label uppercase tracking-widest transition-all flex items-center gap-1 ${
                      mode === 'image' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" />
                    Image
                  </button>
                  <button
                    onClick={() => setMode('multi')}
                    className={`px-3 py-1.5 rounded-md text-xs font-label uppercase tracking-widest transition-all ${
                      mode === 'multi' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    Multi-Scene
                  </button>
                </div>
              </div>

              {mode === 'single' ? (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                  placeholder="A cat walking through a sunlit garden, looking around curiously. The cat says 'What a beautiful day!' with a happy expression."
                  className="w-full h-40 bg-input border border-border rounded-lg p-4 text-foreground placeholder:text-muted/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              ) : mode === 'image' ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted font-label">
                    Upload a starting image and describe how it should move. Runs on the cloud GPU (Wan2.2).
                  </p>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImagePick(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  {imagePreviewUrl ? (
                    <div className="relative bg-input border border-border rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreviewUrl}
                        alt="Starting frame"
                        className="w-full max-h-64 object-contain bg-void-black"
                      />
                      <div className="flex items-center justify-between p-2 border-t border-border">
                        <span className="text-xs text-muted font-label truncate">
                          {imageFile?.name}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="text-xs text-muted hover:text-foreground font-label uppercase tracking-widest"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImagePick(null)}
                            className="text-xs text-muted hover:text-destructive font-label uppercase tracking-widest"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full h-32 bg-input border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted hover:text-foreground hover:border-primary/50 transition-all"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-xs font-label uppercase tracking-widest">
                        Click to upload starting image
                      </span>
                      <span className="text-[10px] text-muted/60">PNG, JPG, WebP</span>
                    </button>
                  )}
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                    placeholder="Describe the motion: e.g. 'the cat slowly turns its head and blinks, soft camera push-in'"
                    className="w-full h-24 bg-input border border-border rounded-lg p-3 text-foreground placeholder:text-muted/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted font-label">
                    Each scene becomes its own clip. Characters from Scene 1 keep the same look across all scenes.
                  </p>
                  {scenes.map((scene, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex flex-col items-center pt-2 gap-1">
                        <span className="text-[10px] font-label text-muted uppercase tracking-widest">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => moveScene(idx, -1)}
                          disabled={idx === 0}
                          className="text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveScene(idx, 1)}
                          disabled={idx === scenes.length - 1}
                          className="text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <textarea
                        value={scene}
                        onChange={(e) => updateScene(idx, e.target.value)}
                        placeholder={
                          idx === 0
                            ? "Scene 1: establish the main character (e.g. 'A young woman in a red coat walks through a snowy forest')"
                            : `Scene ${idx + 1}: what happens next`
                        }
                        className="flex-1 h-20 bg-input border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removeScene(idx)}
                        disabled={scenes.length <= 1}
                        className="mt-2 text-muted hover:text-destructive disabled:opacity-20 transition-colors"
                        title="Remove scene"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addScene}
                    disabled={scenes.length >= 12}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-label uppercase tracking-widest text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add Scene {scenes.length >= 12 && '(max 12)'}
                  </button>

                  <div className="pt-2 border-t border-border/50">
                    <label className="font-label text-[10px] text-muted uppercase tracking-widest block mb-1.5">
                      Narration (optional) &mdash; one voiceover for the whole video
                    </label>
                    <textarea
                      value={narration}
                      onChange={(e) => setNarration(e.target.value)}
                      placeholder="Leave empty for no voiceover, or write what the narrator should say across all scenes."
                      className="w-full h-16 bg-input border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Duration selector — primary control */}
              <div className="mt-4">
                <label className="font-label text-[10px] text-muted uppercase tracking-widest block mb-2">
                  {mode === 'single' ? 'Duration' : 'Length Per Scene'}
                </label>
                {mode === 'single' ? (
                  <div className="flex gap-2 flex-wrap">
                    {DURATION_PRESETS.map((preset) => {
                      const active = durationSeconds === preset.seconds;
                      return (
                        <button
                          key={preset.seconds}
                          onClick={() => applyDurationPreset(preset.seconds)}
                          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            active
                              ? 'bg-primary/20 border border-primary/50 text-primary'
                              : 'bg-surface-high border border-border text-muted hover:border-primary/30'
                          }`}
                        >
                          {preset.label}
                          <span className="block text-[9px] font-label text-muted/60 mt-0.5">
                            {preset.num_clips} clip{preset.num_clips !== 1 ? 's' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { frames: 41, label: '~2.5s' },
                      { frames: 65, label: '~4s' },
                      { frames: 81, label: '~5s' },
                      { frames: 120, label: '~7.5s' },
                    ].map((opt) => {
                      const active = settings.num_frames_per_segment === opt.frames;
                      return (
                        <button
                          key={opt.frames}
                          onClick={() => setSettings((s) => ({ ...s, num_frames_per_segment: opt.frames }))}
                          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            active
                              ? 'bg-primary/20 border border-primary/50 text-primary'
                              : 'bg-surface-high border border-border text-muted hover:border-primary/30'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[10px] text-muted/50 font-label mt-2">
                  {mode === 'single'
                    ? 'Longer videos = more clips stitched with crossfades. 30s+ takes noticeably longer to generate.'
                    : `Total video ≈ ${(settings.num_frames_per_segment / settings.fps * scenes.filter((s) => s.trim()).length).toFixed(1)}s across ${scenes.filter((s) => s.trim()).length} scenes.`}
                </p>
              </div>

              {/* Settings Toggle */}
              <div className="mt-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors font-label uppercase tracking-widest"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Advanced Settings
                  {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        <SettingInput label="Frames/Clip" value={settings.num_frames_per_segment} onChange={(v) => setSettings({ ...settings, num_frames_per_segment: v })} min={17} max={120} step={8} hint={`~${(settings.num_frames_per_segment / settings.fps).toFixed(1)}s each`} />
                        <SettingInput label="Number of Clips" value={settings.num_clips} onChange={(v) => setSettings({ ...settings, num_clips: v })} min={1} max={12} hint={`~${estimatedDuration.toFixed(0)}s total`} />
                        <SettingInput label="Quality Steps" value={settings.num_inference_steps} onChange={(v) => setSettings({ ...settings, num_inference_steps: v })} min={10} max={50} />
                      </div>
                      <p className="text-[10px] text-muted/50 font-label mt-2">
                        Fine-tune overrides the duration preset above.
                      </p>

                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Mic className="h-3.5 w-3.5 text-muted" />
                            <label className="font-label text-[10px] text-muted uppercase tracking-widest">Voice</label>
                          </div>
                          {(() => {
                            const current = voicePresets.find((v) => v.id === settings.voice_preset);
                            const g = current ? inferVoiceGender(current) : 'neutral';
                            if (g === 'neutral') return null;
                            return (
                              <span className="text-[10px] font-label text-muted/70 normal-case">
                                Character will be rendered as {g === 'female' ? 'a woman' : 'a man'} to match the voice
                              </span>
                            );
                          })()}
                        </div>
                        {(['female', 'male', 'neutral'] as const).map((group) => {
                          const groupVoices = voicePresets.filter((v) => inferVoiceGender(v) === group);
                          if (groupVoices.length === 0) return null;
                          const groupLabel = group === 'female' ? 'Female Voices' : group === 'male' ? 'Male Voices' : 'Other';
                          return (
                            <div key={group} className="mb-3 last:mb-0">
                              <p className="font-label text-[10px] text-muted/60 uppercase tracking-widest mb-1.5">{groupLabel}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {groupVoices.map((preset) => (
                                  <button
                                    key={preset.id}
                                    onClick={() => setSettings({ ...settings, voice_preset: preset.id })}
                                    className={`px-3 py-2 rounded-lg text-xs text-left transition-all duration-200 ${
                                      settings.voice_preset === preset.id
                                        ? 'bg-primary/20 border border-primary/50 text-primary'
                                        : 'bg-surface-high border border-border text-muted hover:border-primary/30'
                                    }`}
                                  >
                                    <span className="block font-medium">{preset.name}</span>
                                    <span className="text-[10px] font-label text-muted/50">{preset.language}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted font-label">
                  {mode === 'single'
                    ? <>{prompt.length} chars &middot; ~{estimatedDuration.toFixed(0)}s video &middot; Cmd+Enter to generate</>
                    : mode === 'image'
                      ? <>{imageFile ? '1 image' : 'no image'} &middot; {prompt.length} chars &middot; ~{(settings.num_frames_per_segment / settings.fps).toFixed(1)}s clip</>
                      : <>{scenes.filter((s) => s.trim()).length} scene(s) &middot; ~{(settings.num_frames_per_segment / settings.fps * scenes.filter((s) => s.trim()).length).toFixed(1)}s total</>
                  }
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={mode === 'single'
                    ? prompt.trim().length < 10
                    : mode === 'image'
                      ? !imageFile || prompt.trim().length < 5
                      : scenes.filter((s) => s.trim().length >= 5).length < 2}
                  className="font-headline text-xs tracking-widest"
                >
                  <Film className="h-4 w-4 mr-2" />Generate Animation
                </Button>
              </div>
            </div>

            {/* Example Prompts */}
            <div>
              <h3 className="font-label text-[10px] uppercase tracking-widest text-muted mb-3">Try an example</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setPrompt(example.text)}
                    className="text-left p-4 bg-surface hover:bg-surface-high border border-border rounded-lg transition-all duration-200 hover:border-primary"
                  >
                    <p className="text-sm font-semibold text-foreground mb-1">{example.title}</p>
                    <p className="text-xs text-muted line-clamp-2">{example.text}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage: Generating */}
        {stage === 'generating' && (
          <motion.div key="generating" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-surface border border-border rounded-lg p-8 text-center bloom-shadow">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-headline font-bold text-foreground mb-2 uppercase tracking-tight">Generating Animation</h2>
              <p className="text-sm text-muted mb-2">Building your scene with AI video + voice generation...</p>
              <p className="text-xs text-muted/50 mb-6 font-label">This takes 5-15 minutes on RTX A4000. Please be patient.</p>

              {(() => {
                const activeScenes = scenes.filter((s) => s.trim()).length;
                const clipsToGen = mode === 'single' ? settings.num_clips : activeScenes;
                const totalSec = mode === 'single'
                  ? estimatedDuration
                  : (settings.num_frames_per_segment / settings.fps) * activeScenes;
                const promptText = mode === 'single'
                  ? prompt
                  : scenes.map((s, i) => `Scene ${i + 1}: ${s.trim()}`).filter((_, i) => scenes[i].trim()).join(' | ');
                return (
                  <>
                    <div className="max-w-sm mx-auto space-y-2 mb-6">
                      {[
                        { label: mode === 'single' ? 'Parsing scene description' : `Parsing ${activeScenes} scenes`, icon: '1' },
                        { label: `Generating ${clipsToGen} video clip${clipsToGen !== 1 ? 's' : ''}`, icon: '2' },
                        { label: 'Creating AI voiceover', icon: '3' },
                        { label: 'Stitching final video', icon: '4' },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-left">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold font-label">{step.icon}</div>
                          <span className="text-xs text-muted">{step.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="max-w-md mx-auto bg-surface-high rounded-lg p-4 text-left border border-border">
                      <p className="text-xs text-muted font-label">Prompt: {promptText.length > 120 ? promptText.slice(0, 120) + '...' : promptText}</p>
                      <p className="text-xs text-muted/50 font-label mt-1">
                        {clipsToGen} clip{clipsToGen !== 1 ? 's' : ''} &times; {settings.num_frames_per_segment} frames @ {settings.fps}fps = ~{totalSec.toFixed(0)}s &middot; Voice: {settings.voice_preset}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* Stage: Preview */}
        {stage === 'preview' && videoUrl && (
          <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
            <div className="bg-surface border border-border rounded-lg overflow-hidden bloom-shadow">
              <div className="relative bg-void-black aspect-video">
                <video ref={videoRef} src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-headline font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                      Generated Animation
                      {videoMeta?.has_audio !== false && <Volume2 className="h-4 w-4 text-accent" />}
                    </h2>
                    {videoMeta && (
                      <p className="text-xs text-muted mt-1 font-label">
                        {videoMeta.duration}s &middot; {videoMeta.num_segments} clips &middot; {videoMeta.fps}fps
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleNewVideo} className="text-muted hover:text-foreground">
                      <RotateCcw className="h-4 w-4 mr-2" />New Animation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRatingOpen(true)}
                      disabled={hasRated}
                      className="border-border"
                    >
                      <Star className={`h-4 w-4 mr-2 ${hasRated ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      {hasRated ? 'Rated' : 'Rate'}
                    </Button>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />Download MP4
                    </Button>
                  </div>
                </div>
                {videoMeta?.scene && (
                  <div className="mt-4 p-3 bg-surface-high rounded-lg border border-border">
                    <p className="text-[10px] font-label text-muted uppercase tracking-widest mb-1">Scene parsed:</p>
                    <p className="text-sm text-foreground">{videoMeta.scene.title || 'Untitled Scene'}</p>
                    {videoMeta.scene.objects?.length > 0 && (
                      <p className="text-xs text-muted mt-1 font-label">Objects: {videoMeta.scene.objects.map((o: any) => o.name).join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video History */}
      {videoHistory.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10">
          <h3 className="font-label text-[10px] uppercase tracking-widest text-muted mb-4">Recent Videos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {videoHistory.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition-all cursor-pointer"
                onClick={() => { setVideoUrl(item.url); setStage('preview'); }}
              >
                <div className="aspect-video bg-void-black flex items-center justify-center relative">
                  <video src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="h-6 w-6 text-white opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs text-foreground line-clamp-1">{item.prompt}</p>
                  <p className="text-[10px] text-muted font-label mt-0.5">{item.duration} · {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <RatingDialog
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        featureType="t2v"
        conversionId={videoMeta?.conversion_id}
        itemKey={videoMeta?.conversion_id || videoUrl || undefined}
      />
    </div>
  );
}

function PipelineProgress({ stage }: { stage: Stage }) {
  const steps = [
    { id: 'input', label: 'Describe' },
    { id: 'generating', label: 'Generate' },
    { id: 'preview', label: 'Preview' },
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['input', 'generating', 'preview'];
    const currentIdx = order.indexOf(stage);
    const stepIdx = order.indexOf(stepId);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((step, i) => {
        const status = getStepStatus(step.id);
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-label font-medium uppercase tracking-widest transition-colors ${
              status === 'completed' ? 'bg-accent/20 text-accent' :
              status === 'active' ? 'bg-primary/20 text-primary ring-1 ring-primary/50' :
              'bg-surface-high text-muted'
            }`}>
              {status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">{i + 1}</span>}
              {step.label}
            </div>
            {i < steps.length - 1 && <div className={`w-8 h-px ${status === 'completed' ? 'bg-accent/50' : 'bg-border'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function SettingInput({ label, value, onChange, min, max, step = 1, hint }: {
  label: string; value: number; onChange: (val: number) => void; min: number; max: number; step?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1 font-label uppercase tracking-widest">
        {label} {hint && <span className="text-muted/50 normal-case tracking-normal">({hint})</span>}
      </label>
      <input
        type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
      />
    </div>
  );
}

const EXAMPLE_PROMPTS = [
  { title: 'Garden Cat', text: 'A cute orange tabby cat walking through a sunlit garden with colorful flowers. The cat looks around curiously and says "What a beautiful day!" with a happy expression.' },
  { title: 'Robot Dance', text: 'A friendly robot dancing on a futuristic stage with colorful spotlights. The robot says "Watch my moves!" with an excited tone.' },
  { title: 'Ocean Sunset', text: 'A cinematic aerial view of turquoise ocean waves crashing on a sandy beach at sunset, golden light reflecting on the water.' },
  { title: 'Knight\'s Quest', text: 'A knight in shining armor approaches a castle gate and says "Open the gates!" with an urgent expression. Epic medieval atmosphere.' },
  { title: 'Space Journey', text: 'A spacecraft flying through a colorful nebula in deep space, stars twinkling, cinematic camera slowly rotating around the ship.' },
  { title: 'Forest Walk', text: 'Walking through a misty enchanted forest with rays of sunlight filtering through tall ancient trees. A narrator says "In the heart of the forest, magic awaits."' },
];
