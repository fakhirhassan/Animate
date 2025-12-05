# Issues Found and Fixes Needed

## Issues Identified:

### 1. **Model Preview Not Working**
**Problem**: The 3D model preview shows a loading spinner but doesn't display the model
**Root Cause**:
- OBJ files need proper CORS headers
- The model URL might not be accessible from the frontend
- Three.js OBJLoader requires proper file paths

**Fix**: Need to add CORS middleware to Flask backend

### 2. **Eye Button Not Working in History**
**Problem**: Clicking the eye icon in history doesn't load the model in the viewer
**Root Cause**: The `handleViewHistoryItem` function sets the modelUrl but the viewer might not be refreshing

**Current Code** (page.tsx:213-219):
```typescript
const handleViewHistoryItem = (item: ConversionHistoryItem) => {
  // Only set modelUrl if the item has a valid model URL
  if (item.modelUrl && item.modelUrl.length > 0) {
    setModelUrl(item.modelUrl);
    setConversion({ status: 'completed', progress: 100, message: '' });
  }
};
```

**Issue**: This should also scroll to the viewer or provide visual feedback

### 3. **Advanced Parameters Not Being Used**
**Problem**: The advanced settings (depthEstimation, smoothness, detailLevel) are shown in the UI but NOT sent to the backend

**Current Settings Being Sent** (page.tsx:86-90):
```typescript
const formData = new FormData();
formData.append('file', selectedFile.file);
formData.append('output_format', settings.outputFormat);
formData.append('quality', settings.quality);
```

**Missing**:
- `withTexture`
- `depthEstimation`
- `smoothness`
- `detailLevel`

**Backend Doesn't Support These Yet**: The TripoSR converter only accepts:
- quality (low/medium/high → marching cubes resolution)
- output_format (obj/glb)

## Recommended Fixes:

### Fix 1: Add CORS to Backend
```python
# In backend/app.py
from flask_cors import CORS

# After creating the Flask app
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
```

### Fix 2: Update Model Viewer to Handle Model Loading Better
The ModelViewer is already set up correctly. The issue is likely the model URL format.

**Check**:
- Model URLs should be: `http://localhost:5001/api/convert/download/{job_id}`
- Make sure the backend is serving files with proper headers

### Fix 3: Either Use Advanced Parameters or Hide Them

**Option A**: Hide the advanced parameters (recommended for TripoSR)
Since TripoSR doesn't use depth estimation like MiDaS, these parameters don't apply:
- Remove `depthEstimation`, `smoothness`, `detailLevel` from UI
- Keep only `quality`, `outputFormat`, and `withTexture`

**Option B**: Map parameters to TripoSR settings
- `quality` → marching cubes resolution (already done)
- `withTexture` → bake_texture parameter (needs backend update)
- Remove depth/smoothness/detail as they don't apply to TripoSR

### Fix 4: Add Backend Support for Texture Parameter
Update the conversion endpoint to accept `withTexture`:

```python
# In conversion_routes.py
with_texture = request.form.get('with_texture', 'false').lower() == 'true'

result = conversion_service.convert(
    input_path=input_path,
    job_id=job_id,
    output_format=output_format,
    quality=quality,
    with_texture=with_texture  # Add this
)
```

Then update TripoSR converter to use bake_texture parameter.

## Summary:

**Main Issues**:
1. ✅ TripoSR is working and generating models
2. ✅ Preview now loading (CORS headers added)
3. ✅ Eye button with scroll feedback
4. ✅ Advanced parameters simplified for TripoSR

**Completed Fixes**:
1. ✅ Added CORS headers to backend download endpoint
2. ✅ Simplified advanced settings UI (removed MiDaS-specific params)
3. ✅ Improved eye button feedback with scroll behavior
4. ⚠️  withTexture support exists but texture baking not yet implemented (vertex colors used instead)

## Changes Made:

### Backend Changes:
1. **conversion_routes.py** - Updated download endpoint:
   - Added CORS preflight handling
   - Added explicit CORS headers (Access-Control-Allow-Origin: *)
   - Changed OBJ MIME type to text/plain for browser compatibility
   - Added support for download vs preview mode

### Frontend Changes:
1. **ConversionSettings.tsx** - Simplified settings:
   - Removed depthEstimation parameter (MiDaS-specific)
   - Removed smoothness parameter (MiDaS-specific)
   - Removed detailLevel parameter (MiDaS-specific)
   - Removed Advanced Settings section entirely
   - Kept only: quality, outputFormat, withTexture

2. **page.tsx (2d-to-3d)** - Enhanced history view:
   - Added scroll behavior when eye button is clicked
   - Viewer scrolls into view smoothly
   - Updated settings state to match simplified interface

3. **Model Viewer** - Already correctly configured for OBJ loading with Three.js
