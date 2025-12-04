# PROJECT CONTEXT - MESH (ANIAD)

## Project Overview
**Name**: MESH (formerly ANIAD - AI-Powered Animation Platform)
**Type**: Full-stack AI Animation Generation Platform
**Status**: Active Development
**Version**: 1.0.0

**Primary Features**:
- 2D to 3D model conversion using AI depth estimation
- Interactive 3D model viewer
- AI script generation
- AI voice generation
- AI music generation
- Emotion detection
- Animation generation
- User authentication with role-based access (Admin/Creator)
- Conversion history tracking

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14.2.33 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: Radix UI + shadcn/ui
- **3D Rendering**: React Three Fiber 9.4.0 + Three.js 0.181.2 + Drei 10.7.7
- **Animations**: Framer Motion 12.23.24
- **State Management**: Zustand 5.0.8 (with persist middleware)
- **Form Handling**: React Hook Form 7.66.1 + Zod 4.1.12
- **HTTP Client**: Axios 1.13.2
- **File Upload**: React Dropzone 14.3.8

### Backend
- **Framework**: Flask 3.0.0
- **Database**: Supabase (PostgreSQL) with SQLAlchemy ORM
- **Authentication**: Supabase Auth with JWT
- **CORS**: Flask-CORS 4.0.0
- **Image Processing**: Pillow 10.1.0, OpenCV 4.8.1.78
- **Deep Learning**: PyTorch 2.1.1, Torchvision 0.16.1, Transformers 4.36.0
- **3D Processing**: Open3D 0.18.0, Trimesh 4.0.5
- **Depth Estimation**: timm 0.9.12 (for MiDaS models)
- **Task Queue**: Celery 5.3.4 + Redis 5.0.1
- **Production Server**: Gunicorn 21.2.0

---

## Project Structure

```
Mesh/
├── frontend/                       # Next.js Frontend
│   ├── app/                        # App Router (Next.js 14)
│   │   ├── (auth)/                 # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/            # Dashboard route group
│   │   │   ├── admin/page.tsx      # Admin dashboard
│   │   │   └── creator/            # Creator area
│   │   │       ├── layout.tsx      # Creator dashboard layout
│   │   │       ├── page.tsx        # Creator dashboard home
│   │   │       └── 2d-to-3d/page.tsx  # 2D to 3D conversion tool
│   │   ├── features/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── creator/                # Creator-specific components
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── ConversionSettings.tsx
│   │   │   ├── ConversionHistory.tsx
│   │   │   └── ModelViewer.tsx     # 3D model viewer (Three.js)
│   │   ├── landing/                # Landing page components
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Examples.tsx
│   │   │   └── CTA.tsx
│   │   ├── shared/                 # Shared components
│   │   │   ├── Logo.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ScrollToTop.tsx
│   │   └── ui/                     # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── textarea.tsx
│   │       ├── tabs.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── separator.tsx
│   │       ├── scroll-area.tsx
│   │       ├── form.tsx
│   │       └── table.tsx
│   ├── store/
│   │   └── authStore.ts            # Zustand auth state
│   ├── lib/                        # Utility functions
│   ├── public/                     # Static assets
│   └── package.json
│
├── backend/                        # Flask Backend
│   ├── api/                        # API Route Handlers (Blueprints)
│   │   ├── __init__.py
│   │   ├── conversion_routes.py    # 2D to 3D conversion endpoints
│   │   ├── auth_routes.py          # Authentication endpoints
│   │   ├── script_routes.py        # AI script generation endpoints
│   │   ├── voice_routes.py         # AI voice generation endpoints
│   │   ├── animation_routes.py     # Animation generation endpoints
│   │   └── admin_routes.py         # Admin panel endpoints
│   ├── models/                     # ML Models & DB Models
│   │   ├── __init__.py
│   │   ├── two_d_to_three_d/       # 2D to 3D Conversion
│   │   │   ├── converter.py        # Main converter
│   │   │   ├── depth_estimator.py  # Depth estimation (MiDaS)
│   │   │   ├── mesh_generator.py   # Mesh generation
│   │   │   └── model_weights/      # Pre-trained weights
│   │   ├── emotion_detector/       # Emotion detection AI
│   │   ├── music_generator/        # Music generation AI
│   │   ├── script_processor/       # Script processing AI
│   │   └── voice_generator/        # Voice generation AI
│   ├── services/                   # Business Logic
│   │   ├── __init__.py
│   │   ├── conversion_service.py   # Conversion orchestration
│   │   └── storage_service.py      # File storage handling
│   ├── database/                   # Database
│   │   ├── __init__.py
│   │   ├── models.py               # SQLAlchemy models
│   │   ├── schema.sql              # Database schema
│   │   └── migrations/             # Database migrations
│   ├── utils/                      # Utility Functions
│   │   ├── file_handler.py
│   │   ├── validators.py
│   │   └── response_formatter.py
│   ├── supabase_client/            # Supabase Integration
│   │   └── supabase_config.py
│   ├── uploads/                    # User Uploads
│   │   ├── input/                  # Input images
│   │   └── output/                 # Generated 3D models
│   ├── logs/                       # Application logs
│   ├── tests/                      # Unit & integration tests
│   ├── scripts/                    # Utility scripts
│   ├── app.py                      # Flask app entry point
│   ├── config.py                   # Configuration (Dev/Prod/Test)
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Environment template
│   └── .env                        # Environment variables (gitignored)
│
├── .claude/                        # Claude Code config
├── .git/                           # Git repository
├── README.md                       # Project documentation
├── SUPABASE_SETUP.md              # Supabase setup guide
└── PROJECT_CONTEXT.md             # This file
```

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login with Supabase Auth
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/verify-otp` - Verify email OTP

### 2D to 3D Conversion (`/api/convert`)
- `POST /api/convert/2d-to-3d` - Upload & convert image to 3D model
- `GET /api/convert/download/<job_id>` - Download generated 3D model
- `GET /api/convert/status/<job_id>` - Check conversion status
- `GET /api/convert/supported-formats` - Get supported formats

### Script Generation (`/api/script`)
- Script generation endpoints (to be implemented)

### Voice Generation (`/api/voice`)
- Voice generation endpoints (to be implemented)

### Animation (`/api/animation`)
- Animation generation endpoints (to be implemented)

### Admin (`/api/admin`)
- User management endpoints (to be implemented)

### Health Check
- `GET /health` - Service health check
- `GET /` - API root information

---

## Configuration & Environment

### Frontend Environment Variables
Location: `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Backend Environment Variables
Location: `backend/.env`

**Required**:
- `FLASK_ENV` - Environment (development/production/testing)
- `SECRET_KEY` - Flask secret key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/public key
- `PORT` - Server port (default: 5001)

**Optional**:
- `CORS_ORIGINS` - Comma-separated allowed origins
- `UPLOAD_FOLDER` - Upload directory (default: uploads)
- `MAX_CONTENT_LENGTH` - Max file size (default: 100MB)
- `ENABLE_GPU` - Enable GPU for ML models (default: true)
- `OPENAI_API_KEY` - OpenAI API key (for future features)
- `ELEVENLABS_API_KEY` - ElevenLabs API key (for voice)
- `AWS_ACCESS_KEY_ID` - AWS S3 credentials (optional)
- `AWS_SECRET_ACCESS_KEY` - AWS S3 credentials (optional)
- `AWS_S3_BUCKET` - S3 bucket name (optional)
- `REDIS_URL` - Redis URL for Celery (optional)

---

## Database Schema (Supabase/PostgreSQL)

### Tables

#### `users`
- `id` (UUID, PK) - User ID (from Supabase Auth)
- `email` (TEXT, UNIQUE) - User email
- `name` (TEXT) - Full name
- `role` (TEXT) - User role ('admin' or 'creator')
- `avatar_url` (TEXT) - Profile picture URL
- `created_at` (TIMESTAMP) - Account creation
- `last_login` (TIMESTAMP) - Last login time

#### `conversions`
- `id` (UUID, PK) - Conversion job ID
- `user_id` (UUID, FK -> users) - Owner
- `input_image_url` (TEXT) - Original image URL
- `output_model_url` (TEXT) - Generated 3D model URL
- `status` (TEXT) - Status (pending/processing/completed/failed)
- `output_format` (TEXT) - Format (obj/glb/gltf)
- `quality` (TEXT) - Quality (low/medium/high)
- `metadata` (JSONB) - Additional data
- `created_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)

#### `scripts`
- Script generation records (schema defined in schema.sql)

#### `animations`
- Animation generation records (schema defined in schema.sql)

**Row Level Security (RLS)**: Enabled on all tables with policies for user data isolation.

---

## Authentication Flow

1. **Signup**:
   - Frontend → `POST /api/auth/signup` → Supabase Auth creates user
   - Backend creates user profile in `users` table
   - Returns JWT access token & refresh token

2. **Login**:
   - Frontend → `POST /api/auth/login` → Supabase Auth validates credentials
   - Backend fetches user profile from `users` table
   - Returns JWT access token & refresh token

3. **Token Storage**:
   - Tokens stored in Zustand store (with persist middleware)
   - Also stored in localStorage as `authToken`

4. **Authenticated Requests**:
   - Frontend includes `Authorization: Bearer <token>` header
   - Backend validates token with Supabase Auth

5. **Token Refresh**:
   - Frontend → `POST /api/auth/refresh` with refresh_token
   - Returns new access token

---

## Key Features & How They Work

### 1. 2D to 3D Conversion

**Frontend Flow**:
1. User uploads image via `ImageUploader.tsx` (react-dropzone)
2. Selects quality & format via `ConversionSettings.tsx`
3. Sends POST to `/api/convert/2d-to-3d`
4. Receives job_id and polls `/api/convert/status/<job_id>`
5. When complete, displays in `ModelViewer.tsx` (React Three Fiber)
6. User can download via `/api/convert/download/<job_id>`

**Backend Flow**:
1. `conversion_routes.py` receives upload
2. Validates file format (png/jpg/jpeg/gif)
3. Saves to `uploads/input/<job_id>_<filename>`
4. `ConversionService` orchestrates:
   - `DepthEstimator` (MiDaS model) generates depth map
   - `MeshGenerator` creates 3D mesh from depth map
   - Exports to GLB/OBJ/GLTF format
5. Saves to `uploads/output/<job_id>_model.<format>`
6. Returns download URL

**Technologies**:
- **Depth Estimation**: MiDaS (via Transformers + timm)
- **Mesh Generation**: Open3D + Trimesh
- **3D Formats**: GLB (binary), GLTF (JSON), OBJ (text)

### 2. User Roles

**Creator Role**:
- Access to creator dashboard
- Can convert 2D to 3D
- Can generate scripts, voices, animations
- View own conversion history

**Admin Role**:
- Access to admin dashboard
- User management
- System analytics
- All creator permissions

**Role Assignment**:
- Default role: `creator`
- Admin role assigned via SQL:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'admin@aniad.com';
  ```

### 3. File Upload Handling

**Allowed Extensions**:
- **Input Images**: png, jpg, jpeg, gif
- **3D Models**: obj, glb, gltf, fbx
- **Max Size**: 100MB (configurable)

**Upload Flow**:
1. Frontend: React Dropzone validates client-side
2. Backend: `file_handler.py` validates server-side
3. Secure filename via `werkzeug.secure_filename`
4. Save with UUID prefix to prevent collisions
5. Organized in `uploads/input/` and `uploads/output/`

---

## Development Workflow

### Running the Project

**Prerequisites**:
- Node.js 18+
- Python 3.10+
- Supabase account (free tier)

**Backend Setup**:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase credentials
PORT=5001 python3 app.py
```

**Frontend Setup**:
```bash
cd frontend
npm install
npm run dev
```

**Servers**:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

### Database Setup

1. Create Supabase project at https://supabase.com
2. Get credentials (Project URL + anon key)
3. Update `backend/.env`:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=eyJhbGc...
   ```
4. Run schema: Copy `backend/database/schema.sql` to Supabase SQL Editor
5. Create admin user (see SUPABASE_SETUP.md)

---

## Design System & Theming

### Color Palette

**Primary Colors**:
- Blue: `#3B82F6` (blue-600)
- Purple: `#8B5CF6` (purple-600)
- Gradient: `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)`

**Neutral Colors**:
- White: `#FFFFFF`
- Gray-50: `#F9FAFB`
- Gray-100: `#F3F4F6`
- Gray-200: `#E5E7EB`
- Gray-600: `#4B5563`
- Gray-900: `#111827`

**Semantic Colors**:
- Success: `#10B981` (green-500)
- Success Background: `#ECFDF5` (green-50)
- Warning: `#F59E0B` (yellow-500)
- Warning Background: `#FEF3C7` (yellow-50)
- Error: `#EF4444` (red-500)
- Error Background: `#FEE2E2` (red-50)

### Typography

**Headings**:
- H1: `text-4xl md:text-5xl font-bold text-gray-900` (36px-48px)
- H2: `text-2xl font-bold text-gray-900` (24px)
- H3: `text-xl font-bold text-gray-900` (20px)
- Body: `text-xl text-gray-600` (20px) for subtitles
- Body Text: `text-sm font-medium text-gray-600` (14px)

### Components Design Standards

**Cards**:
```tsx
className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
```
- Background: White
- Border: `border-gray-100` (light gray)
- Border Radius: `rounded-2xl` (16px)
- Shadow: `shadow-sm` default, `hover:shadow-xl` on hover
- Transition: All properties, 300ms duration

**Stat Cards** (Dashboard metrics):
```tsx
<div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 h-full">
  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
    <Icon className="h-7 w-7 text-blue-600" />
  </div>
  <div className="space-y-2">
    <p className="text-sm font-medium text-gray-600">Label</p>
    <div className="flex items-end justify-between">
      <p className="text-4xl font-bold text-gray-900">Value</p>
      <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
        +12%
      </span>
    </div>
  </div>
</div>
```
- Icon Container: `w-14 h-14 rounded-xl` with subtle blue-purple gradient
- Icon: Always `text-blue-600` for consistency
- Hover: Card lifts up (`hover:y: -8`) and icon scales (`group-hover:scale-110`)

**Buttons**:

Primary Button (Gradient):
```tsx
className="gradient-button text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
```
- Uses global `gradient-button` class (blue to purple gradient)
- Border Radius: `rounded-xl` (12px)
- Padding: `px-6 py-3`
- Shadow: Elevates on hover

Outline Button:
```tsx
className="border-gray-200 rounded-xl hover:bg-gray-50"
```
- Border: `border-gray-200`
- Hover: Light gray background

**Badges**:
```tsx
// Status badges
className="bg-blue-50 text-blue-600 border-0 font-medium"  // Role/Type
className="bg-green-50 text-green-600 border-0 font-medium"  // Success/Active
className="bg-yellow-50 text-yellow-600 border-0 font-medium"  // Warning/Processing
className="bg-gray-100 text-gray-600 border-0 font-medium"  // Inactive
```
- Always use light background (`-50` shade) with darker text (`-600` shade)
- No borders (`border-0`)
- Font weight: `font-medium`

**Input Fields**:
```tsx
className="border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
```
- Border: `border-gray-200`
- Border Radius: `rounded-xl`
- Focus: Blue ring

**Tables**:
- Header: `text-gray-600 font-medium`
- Rows: `border-gray-100 hover:bg-gray-50`
- Cells: `text-gray-900` for primary data, `text-gray-600` for secondary

**Avatars**:
```tsx
<Avatar className="border-2 border-blue-100">
  <AvatarFallback className="bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600 font-semibold">
    AB
  </AvatarFallback>
</Avatar>
```

### Layout Standards

**Page Container**:
```tsx
<div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white p-6 lg:p-8">
  <div className="max-w-6xl mx-auto">
    {/* Content */}
  </div>
</div>
```
- Background: Subtle gradient from white through light blue back to white
- Padding: `p-6 lg:p-8` (responsive)
- Max width: `max-w-6xl` for content areas, `max-w-7xl` for dashboards

**Spacing**:
- Between sections: `mb-12` (48px)
- Between cards in grid: `gap-8` (32px)
- Card internal padding: `p-6` or `p-8` (24px or 32px)

**Grid Layouts**:
- Stats cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Project cards: `grid-cols-1 md:grid-cols-2`

### Animation Standards

**Motion Settings**:
```tsx
// Page entry
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}

// Staggered items
transition={{ delay: index * 0.08 }}

// Hover lift effect
whileHover={{ y: -8, transition: { duration: 0.3 } }}
```

**Hover Transitions**:
- All interactive elements: `transition-all duration-300`
- Card hover: Lift (`y: -8`), shadow increase, border color change
- Icon hover: Scale (`scale-110`)
- Button hover: Shadow increase

### Consistent Patterns Across Pages

1. **Page Headers**: Always `text-4xl md:text-5xl font-bold text-gray-900` with subtitle `text-xl text-gray-600`
2. **Section Headers**: Always inside cards with border-bottom: `border-b border-gray-100 p-6`
3. **Icon Colors**: Always `text-blue-600` for primary icons (changed from multi-color to single blue)
4. **Card Borders**: Always `border-gray-100` (subtle, not heavy)
5. **Hover States**: Cards always lift up and increase shadow on hover
6. **Gradients**: Only use blue-purple gradient, removed pink/green/yellow gradients

### Design Principles

1. **Minimalism**: Clean, white cards with subtle shadows
2. **Consistency**: Same blue-purple color scheme throughout
3. **Subtle Animations**: Smooth transitions, no jarring movements
4. **Visual Hierarchy**: Clear heading sizes, consistent spacing
5. **Accessibility**: High contrast text, readable font sizes
6. **Professional**: No flashy colors, maintains serious aesthetic

### CSS Utility Classes

Custom classes defined in `globals.css`:
- `gradient-button`: Blue to purple gradient (primary CTA button)
- `particle`: Floating background particle effect
- `animate-pulse-subtle`: Subtle pulsing animation
- `animate-float-slow`: Slow floating animation

---

## Code Conventions & Patterns

### Backend (Python/Flask)

**Blueprint Pattern**:
- Each feature has its own blueprint in `api/`
- Registered in `app.py` with URL prefix
- Example: `conversion_routes.bp` → `/api/convert`

**Configuration**:
- Environment-specific configs in `config.py`
- `DevelopmentConfig`, `ProductionConfig`, `TestingConfig`
- Selected via `FLASK_ENV` environment variable

**Response Format**:
```python
# Success
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

# Error
{
  "success": false,
  "error": "Error Type",
  "message": "Error description"
}
```

**Error Handling**:
- Global error handlers in `app.py`
- Custom errors via `response_formatter.py`
- Logging to `logs/animate.log`

### Frontend (TypeScript/React)

**App Router Structure**:
- Route groups: `(auth)` and `(dashboard)`
- Layouts: Shared UI for route groups
- Pages: Each route has `page.tsx`

**Component Organization**:
- `components/ui/` - Reusable UI primitives (shadcn)
- `components/shared/` - Shared across app
- `components/creator/` - Feature-specific
- `components/landing/` - Landing page sections

**State Management**:
- **Global Auth State**: Zustand (`store/authStore.ts`)
- **Local Component State**: React useState
- **Form State**: React Hook Form

**Styling**:
- Tailwind utility classes
- shadcn/ui components (styled with Tailwind)
- CSS variables for theming (in `app/globals.css`)

---

## Common Tasks & Where to Make Changes

### Adding a New API Endpoint

1. Create route in appropriate blueprint file (`backend/api/`)
2. Add service logic if needed (`backend/services/`)
3. Update error handling if needed
4. Test with curl or Postman

**Example**:
```python
# backend/api/conversion_routes.py
@bp.route('/my-new-endpoint', methods=['POST'])
def my_new_endpoint():
    # Your logic here
    return success_response(data, 'Success message')
```

### Adding a New Frontend Page

1. Create `page.tsx` in appropriate `app/` directory
2. Add to navigation if needed (`components/shared/Navbar.tsx`)
3. Add authentication if needed (check user role)

**Example**:
```tsx
// app/(dashboard)/creator/my-new-page/page.tsx
export default function MyNewPage() {
  return <div>My New Page</div>
}
```

### Adding a New AI Model

1. Create model directory: `backend/models/my_model/`
2. Add model files: `my_model.py`, `__init__.py`
3. Add model weights to `model_weights/` (gitignored)
4. Create service: `backend/services/my_model_service.py`
5. Create API routes: `backend/api/my_model_routes.py`
6. Register blueprint in `app.py`

### Adding New Database Table

1. Add table to `backend/database/schema.sql`
2. Run SQL in Supabase SQL Editor
3. Add RLS policies for security
4. Create SQLAlchemy model in `database/models.py` (if needed)

### Modifying Authentication

- **Auth logic**: `backend/api/auth_routes.py`
- **Supabase config**: `backend/supabase_client/supabase_config.py`
- **Frontend auth state**: `frontend/store/authStore.ts`
- **Protected routes**: Check `isAuthenticated` in page components

---

## Known Issues & TODOs

### Current Issues
- `trimesh` library warning on backend startup (non-critical)
- Email confirmation disabled for development (enable in production)

### Planned Features
- [ ] Admin user management UI
- [ ] Conversion history page
- [ ] Script generation implementation
- [ ] Voice generation implementation
- [ ] Music generation implementation
- [ ] Animation generation implementation
- [ ] Background job processing with Celery
- [ ] S3 storage integration for production
- [ ] API rate limiting
- [ ] WebSocket for real-time conversion progress
- [ ] Multiple 3D export formats (STL, PLY, FBX)
- [ ] Texture mapping for 3D models
- [ ] Batch conversion support

---

## Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test  # (to be configured)
```

---

## Deployment

### Production Checklist
- [ ] Set `FLASK_ENV=production`
- [ ] Use strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Enable HTTPS
- [ ] Configure production database (PostgreSQL)
- [ ] Set up Redis for Celery
- [ ] Configure S3 for file storage
- [ ] Enable email confirmation
- [ ] Set up monitoring (Sentry)
- [ ] Configure CORS for production domain
- [ ] Use Gunicorn for Flask
- [ ] Build Next.js for production (`npm run build`)

---

## External Services & Integrations

### Current
- **Supabase**: Authentication & Database
  - Project URL: Configured in `.env`
  - Dashboard: https://app.supabase.com

### Planned
- **OpenAI API**: Script generation, chat features
- **ElevenLabs**: Voice generation
- **AWS S3**: File storage (production)
- **Redis**: Task queue (Celery)
- **Sentry**: Error monitoring

---

## Important Files to Reference

### Configuration
- `backend/config.py` - All environment configs
- `backend/.env.example` - Environment variable template
- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.ts` - Tailwind configuration

### Entry Points
- `backend/app.py` - Flask application factory
- `frontend/app/layout.tsx` - Root React layout
- `frontend/app/page.tsx` - Landing page

### Core Logic
- `backend/services/conversion_service.py` - Conversion orchestration
- `backend/models/two_d_to_three_d/` - ML model implementations
- `frontend/components/creator/ModelViewer.tsx` - 3D rendering
- `frontend/store/authStore.ts` - Auth state management

---

## Git Workflow

**Current Branch**: `fakhir`
**Main Branch**: `main`

**Recent Commits**:
- `059dded` - Add Supabase integration with admin dashboard
- `eb2b696` - Added a readme file
- `70c704f` - Changed design and implemented mesh
- `83f67b2` - Add sidebar navigation to creator dashboard
- `bd036e5` - Initial commit: AniMate - AI Animation Platform

**Modified Files** (current):
- `SUPABASE_SETUP.md`

---

## Support & Resources

- **Documentation**: README.md, SUPABASE_SETUP.md
- **Issues**: Track in GitHub Issues
- **MiDaS Depth Estimation**: https://github.com/isl-org/MiDaS
- **Open3D**: http://www.open3d.org/
- **shadcn/ui**: https://ui.shadcn.com/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
- **Supabase Docs**: https://supabase.com/docs

---

## Quick Reference Commands

```bash
# Start backend
cd backend && PORT=5001 python3 app.py

# Start frontend
cd frontend && npm run dev

# Install backend dependencies
cd backend && pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install

# Run tests
cd backend && pytest
cd frontend && npm run test

# Format code
cd backend && black .
cd frontend && npm run lint

# Create git commit
git add . && git commit -m "Your message"

# Push to remote
git push origin fakhir
```

---

## Recent Design Updates (2025-12-03)

### Dashboard Redesign
All dashboard pages (Admin & Creator) have been updated to match the landing page's clean, minimal aesthetic:

**Changes Made**:
1. **Color Scheme Unification**:
   - Removed multi-color gradients (purple-pink, green-emerald, blue-cyan, yellow-orange)
   - Unified to single blue-purple gradient throughout
   - All icons now use `text-blue-600` instead of varied colors
   - Icon backgrounds use subtle `from-blue-50 to-purple-50` gradient

2. **Card Styling**:
   - Changed from `shadow-lg` to `shadow-sm` with `hover:shadow-xl`
   - Updated border radius to `rounded-2xl` (16px) everywhere
   - Borders changed to subtle `border-gray-100`
   - Added consistent hover lift effect (`hover:y: -8`)

3. **Typography Updates**:
   - Headers increased: `text-3xl` → `text-4xl md:text-5xl`
   - Subtitles increased: `text-gray-500` → `text-xl text-gray-600`
   - Consistent font weights: `font-medium` for labels, `font-bold` for values

4. **Badge Redesign**:
   - Gradient badges → Subtle background with colored text
   - Example: `bg-green-50 text-green-600` instead of `from-green-500 to-emerald-500`

5. **Button Updates**:
   - All primary buttons now use `gradient-button` class
   - Border radius changed to `rounded-xl` (12px)
   - Consistent shadow: `shadow-lg hover:shadow-xl`

6. **Background**:
   - Changed from `bg-gray-50` to `bg-gradient-to-b from-white via-blue-50/30 to-white`
   - Matches landing page's subtle gradient background

7. **Spacing Adjustments**:
   - Grid gaps: `gap-4 mb-8` → `gap-8 mb-12`
   - Card padding: `p-5` → `p-8` for more breathing room

**Files Modified**:
- `frontend/app/(dashboard)/admin/page.tsx` - Admin dashboard
- `frontend/app/(dashboard)/creator/page.tsx` - Creator dashboard main
- `frontend/app/(dashboard)/creator/2d-to-3d/page.tsx` - 2D to 3D converter
- `PROJECT_CONTEXT.md` - Added comprehensive design system documentation

**Result**: Consistent, professional, minimal design across all pages with subtle blue-purple theme.

---

**Last Updated**: 2025-12-03
**Project Status**: Active Development
**Maintainers**: Fakhir Hassan

---

## Notes for Claude/AI Assistants

When working on this project:
1. Always check this file first to understand the architecture
2. Backend changes go in `backend/` (Python/Flask)
3. Frontend changes go in `frontend/` (TypeScript/React/Next.js)
4. API endpoints are defined in `backend/api/` blueprints
5. Authentication uses Supabase - check `auth_routes.py` and `authStore.ts`
6. 2D to 3D conversion logic is in `backend/models/two_d_to_three_d/`
7. UI components use shadcn/ui - check `components/ui/`
8. State management uses Zustand - check `store/`
9. Database schema is in `backend/database/schema.sql`
10. Both servers must be running for full functionality

**Environment Files**:
- Backend: `backend/.env` (create from `.env.example`)
- Frontend: `frontend/.env.local` (set `NEXT_PUBLIC_API_URL`)

**Default Ports**:
- Frontend: 3000
- Backend: 5001

**Supabase Required**: Project uses Supabase for auth and database. See SUPABASE_SETUP.md for setup instructions.
