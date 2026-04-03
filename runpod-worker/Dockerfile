FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

WORKDIR /

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

# Download Wan2.2-TI2V-5B model (5x better quality than 1.3B, same 24GB GPU)
RUN python -c "from huggingface_hub import snapshot_download; \
    snapshot_download('Wan-AI/Wan2.2-TI2V-5B-Diffusers', local_dir='/models/wan22-ti2v-5b')"

COPY runpod-worker/handler.py /handler.py

CMD ["python", "-u", "/handler.py"]
