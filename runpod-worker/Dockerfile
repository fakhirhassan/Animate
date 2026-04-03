FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

WORKDIR /

# Install on top of base image PyTorch (don't override it)
RUN pip install --no-cache-dir --timeout=300 \
    runpod>=1.7.0 \
    diffusers==0.33.0 \
    transformers==4.49.0 \
    accelerate>=0.34.0 \
    sentencepiece \
    safetensors \
    huggingface_hub

# Download Wan2.1-T2V-1.3B model (baked into image)
RUN python -c "from huggingface_hub import snapshot_download; \
    snapshot_download('Wan-AI/Wan2.1-T2V-1.3B-Diffusers', local_dir='/models/wan21-t2v')"

COPY runpod-worker/handler.py /handler.py

CMD ["python", "-u", "/handler.py"]
