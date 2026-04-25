FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

WORKDIR /

# System deps for trimesh/rembg/torchmcubes
RUN apt-get update && apt-get install -y --no-install-recommends \
    git build-essential libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install on top of base image PyTorch (don't override it)
RUN pip install --no-cache-dir --timeout=300 \
    runpod>=1.7.0 \
    git+https://github.com/huggingface/diffusers \
    transformers==4.49.0 \
    accelerate>=0.34.0 \
    sentencepiece \
    safetensors \
    huggingface_hub \
    ftfy \
    imageio \
    imageio-ffmpeg

# TripoSR deps (single-image-to-3D)
RUN pip install --no-cache-dir --timeout=300 \
    omegaconf \
    einops \
    trimesh \
    rembg \
    onnxruntime \
    xatlas \
    pymeshlab \
    git+https://github.com/tatsy/torchmcubes.git

# Pull TripoSR's tsr/ module into PYTHONPATH
RUN git clone --depth 1 https://github.com/VAST-AI-Research/TripoSR /opt/TripoSR
ENV PYTHONPATH=/opt/TripoSR:$PYTHONPATH

# Models are NOT baked — they download to /runpod-volume/models on first run.
# This keeps the image ~3GB instead of 15GB. Attach a Network Volume to your
# RunPod endpoint so models persist across cold starts.

COPY runpod-worker/handler.py /handler.py

CMD ["python", "-u", "/handler.py"]
