FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

WORKDIR /

# Upgrade PyTorch and install compatible diffusers
RUN pip install --no-cache-dir --timeout=300 \
    torch==2.5.1 \
    torchvision==0.20.1 \
    runpod>=1.7.0 \
    diffusers==0.32.2 \
    transformers>=4.46.0 \
    accelerate>=0.34.0 \
    sentencepiece \
    safetensors \
    huggingface_hub

# Download Wan2.1-T2V-1.3B model (baked into image)
RUN python -c "from huggingface_hub import snapshot_download; \
    snapshot_download('Wan-AI/Wan2.1-T2V-1.3B-Diffusers', local_dir='/models/wan21-t2v')"

COPY runpod-worker/handler.py /handler.py

CMD ["python", "-u", "/handler.py"]
