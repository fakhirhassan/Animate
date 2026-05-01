# Mesh RunPod Worker

GPU worker for text-to-video (Wan2.1) and text-to-image (SDXL) generation.

## Deploy to RunPod

### 1. Build and push Docker image
```bash
cd runpod-worker
docker build -t yourusername/mesh-gpu-worker:latest .
docker push yourusername/mesh-gpu-worker:latest
```

### 2. Create RunPod Serverless Endpoint
1. Go to [RunPod Console](https://www.runpod.io/console/serverless) → Serverless → "+ New Endpoint"
2. Docker Image: `yourusername/mesh-gpu-worker:latest`
3. GPU: RTX 4090 (best price/performance)
4. Min Workers: 0 (scales to zero — no cost when idle)
5. Max Workers: 1
6. Idle Timeout: 30 seconds
7. Execution Timeout: 600 seconds

### 3. Configure Backend
Add to `backend/.env`:
```env
GPU_MODE=cloud
RUNPOD_API_KEY=your_api_key_here
RUNPOD_ENDPOINT_ID=your_endpoint_id_here
```

### 4. Test
```bash
curl -X POST http://localhost:5001/api/animation/text-to-video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"prompt": "A cat walking in a garden", "num_frames": 33}'
```

## Cost Estimate
- RTX 4090 on RunPod: ~$0.34/hr
- 1 video (480p, 5s): ~60s = ~$0.006
- 1 image (1024x1024): ~10s = ~$0.001
- Full FYP demo (5 videos + 10 images): ~$0.05
