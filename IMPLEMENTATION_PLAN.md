# Implementation Plan: Dynamic Dashboards & Database Integration

## Current Issues

1. ✅ **Model Preview Fixed** - Environment component removed (HDR loading error)
2. ❌ **Conversions Not Saved** - Currently only in local state, need database integration
3. ❌ **Static Dashboards** - Hardcoded data in admin and creator dashboards
4. ❌ **No Assets Page** - No dedicated page for viewing saved 3D models

## Implementation Steps

### Phase 1: Backend - Database Integration for Conversions

#### 1.1 Create Conversion Database Service
**File**: `backend/services/conversion_db_service.py`

**Functions**:
- `save_conversion(user_id, conversion_data)` - Save conversion to database
- `get_user_conversions(user_id, limit=10)` - Get user's conversions
- `get_conversion_by_id(conversion_id)` - Get specific conversion
- `delete_conversion(conversion_id, user_id)` - Delete conversion
- `get_conversion_stats(user_id=None)` - Get statistics (for dashboards)

#### 1.2 Update Conversion Routes
**File**: `backend/api/conversion_routes.py`

**Changes**:
- After successful conversion, save to database
- Add endpoint `GET /api/convert/history` - Get user's conversion history
- Add endpoint `DELETE /api/convert/history/<conversion_id>` - Delete conversion
- Update metadata to include database ID

#### 1.3 Create Admin Stats Service
**File**: `backend/services/admin_stats_service.py`

**Functions**:
- `get_system_stats()` - Get total users, projects, system health
- `get_user_growth_data()` - Get monthly user growth
- `get_conversion_activity()` - Get daily/weekly conversion activity
- `get_recent_activities()` - Get recent system activities

### Phase 2: Frontend - Dynamic Dashboards

#### 2.1 Create API Client Functions
**File**: `frontend/lib/api.ts`

**Add endpoints**:
```typescript
conversionAPI: {
  getHistory: () => axios.get('/api/convert/history'),
  deleteConversion: (id: string) => axios.delete(`/api/convert/history/${id}`),
  getStats: () => axios.get('/api/convert/stats'),
}

adminAPI: {
  getSystemStats: () => axios.get('/api/admin/stats'),
  getUserGrowth: () => axios.get('/api/admin/analytics/user-growth'),
  getConversionActivity: () => axios.get('/api/admin/analytics/conversions'),
  getRecentActivities: () => axios.get('/api/admin/activities'),
}
```

#### 2.2 Update Creator Dashboard
**File**: `frontend/app/(dashboard)/creator/page.tsx`

**Changes**:
- Fetch real conversion stats from API
- Show actual project count
- Display real storage used
- Fetch recent projects from conversion history

#### 2.3 Update Admin Dashboard
**File**: `frontend/app/(dashboard)/admin/page.tsx`

**Changes**:
- Fetch real system stats
- Display actual user growth data
- Show real conversion activity
- Fetch real recent activities

#### 2.4 Update 2D to 3D Page
**File**: `frontend/app/(dashboard)/creator/2d-to-3d/page.tsx`

**Changes**:
- After conversion, save to database via API
- Load conversion history from database instead of local state
- Implement pagination for history
- Add delete confirmation dialog

### Phase 3: Assets Page

#### 3.1 Create Assets Page
**File**: `frontend/app/(dashboard)/creator/assets/page.tsx`

**Features**:
- Grid view of all saved 3D models
- Filter by format (OBJ, GLB, GLTF)
- Filter by quality
- Search by filename
- Preview model on click
- Download model
- Delete model
- Show model metadata (created date, file size, vertices, faces)

#### 3.2 Update Creator Layout
**File**: `frontend/app/(dashboard)/creator/layout.tsx`

**Changes**:
- Add "Assets" link to sidebar
- Use icon: `Box` or `Folder` from lucide-react

### Phase 4: Database Schema Verification

**Ensure conversions table exists with**:
```sql
conversions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  file_name VARCHAR(255),
  original_image_url TEXT,
  model_url TEXT,
  thumbnail_url TEXT,
  output_format VARCHAR(10),
  quality VARCHAR(20),
  status VARCHAR(50),
  file_size VARCHAR(20),
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## API Endpoints to Create

### Conversion History Endpoints
```
GET  /api/convert/history?limit=10&offset=0  - Get user's conversions
GET  /api/convert/history/:id                - Get specific conversion
DELETE /api/convert/history/:id              - Delete conversion
GET  /api/convert/stats                      - Get user's conversion stats
```

### Admin Endpoints
```
GET  /api/admin/stats                         - System stats
GET  /api/admin/analytics/user-growth         - User growth data
GET  /api/admin/analytics/conversions         - Conversion activity data
GET  /api/admin/activities                    - Recent activities
GET  /api/admin/users                         - All users (already exists)
```

## File Structure After Implementation

```
backend/
├── api/
│   ├── conversion_routes.py (updated)
│   └── admin_routes.py (updated)
├── services/
│   ├── conversion_db_service.py (new)
│   └── admin_stats_service.py (new)
└── database/
    └── schema.sql (verify exists)

frontend/
├── app/(dashboard)/
│   ├── admin/page.tsx (updated)
│   └── creator/
│       ├── page.tsx (updated)
│       ├── 2d-to-3d/page.tsx (updated)
│       ├── assets/page.tsx (new)
│       └── layout.tsx (updated)
├── lib/
│   └── api.ts (updated)
└── components/creator/
    └── AssetCard.tsx (new, optional)
```

## Order of Implementation

1. ✅ Fix model preview (DONE - Environment component removed)
2. Create backend database services
3. Update backend API routes
4. Update frontend API client
5. Update 2D to 3D page to save to database
6. Update Creator dashboard with real data
7. Update Admin dashboard with real data
8. Create Assets page
9. Update sidebar navigation

## Testing Checklist

- [ ] Conversions save to database after completion
- [ ] Conversion history loads from database
- [ ] Creator dashboard shows real statistics
- [ ] Admin dashboard shows real statistics
- [ ] Assets page displays all saved models
- [ ] Model preview works after conversion
- [ ] Delete conversion removes from database
- [ ] Filters work on Assets page
- [ ] Search works on Assets page
- [ ] Pagination works on Assets page

## Notes

- Keep MiDaS for now (TripoSR not working due to missing 'tsr' module)
- Ensure proper authentication on all endpoints
- Add loading states for all API calls
- Add error handling with user-friendly messages
- Use optimistic updates where appropriate
- Add confirmation dialogs for delete operations
