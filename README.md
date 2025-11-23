# ANIAD - AI-Powered Animation Platform

ANIAD is a full-stack web application that transforms 2D images into 3D models using AI-powered depth estimation and mesh generation. Built with Next.js 14 for the frontend and Flask for the backend.

## Features

- **2D to 3D Conversion**: Upload images and convert them to 3D models using AI depth estimation
- **Interactive 3D Viewer**: Real-time 3D model visualization with React Three Fiber
- **User Authentication**: Secure login/signup with role-based access (Creator/Admin)
- **Conversion History**: Track and manage your converted models
- **Multiple Export Formats**: Support for GLB, OBJ, GLTF, PLY, and STL formats
- **Quality Settings**: Configurable depth estimation, smoothness, and detail levels

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **3D Rendering**: React Three Fiber + Three.js
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod

### Backend
- **Framework**: Flask 3.0
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Flask-JWT-Extended
- **Image Processing**: Pillow, OpenCV
- **Deep Learning**: PyTorch, Transformers (for depth estimation)
- **3D Processing**: Open3D, Trimesh
- **Task Queue**: Celery + Redis (for async processing)

## Project Structure

```
ANIAD/
├── frontend/                 # Next.js frontend application
│   ├── app/                  # App router pages
│   │   ├── (auth)/           # Authentication pages (login, signup)
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   │   ├── admin/        # Admin panel
│   │   │   └── creator/      # Creator dashboard & tools
│   │   └── page.tsx          # Landing page
│   ├── components/           # React components
│   │   ├── creator/          # Creator-specific components
│   │   ├── shared/           # Shared components (Logo, Navbar, Footer)
│   │   └── ui/               # shadcn/ui components
│   ├── store/                # Zustand state stores
│   ├── lib/                  # Utility functions
│   └── public/               # Static assets
│
├── backend/                  # Flask backend application
│   ├── api/                  # API route handlers
│   ├── models/               # ML models and database models
│   │   └── two_d_to_three_d/ # 2D to 3D conversion pipeline
│   │       ├── depth_estimator.py
│   │       ├── mesh_generator.py
│   │       └── model_weights/  # Pre-trained model weights
│   ├── services/             # Business logic services
│   ├── utils/                # Utility functions
│   ├── database/             # Database configuration & migrations
│   ├── uploads/              # User uploaded files
│   └── app.py                # Flask application entry point
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL (optional, SQLite for development)
- Redis (optional, for async task processing)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:
   ```bash
   cp .env.example .env
   ```

5. Start the Flask server:
   ```bash
   python app.py
   ```

   The backend API will be available at `http://localhost:5001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### 2D to 3D Conversion
- `POST /api/convert/upload` - Upload image for conversion
- `POST /api/convert/process` - Start conversion process
- `GET /api/convert/status/:id` - Check conversion status
- `GET /api/convert/download/:id` - Download converted model

### User Management (Admin)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Backend (.env)
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=postgresql://user:password@localhost:5432/aniad
REDIS_URL=redis://localhost:6379/0
```

## Development

### Running Both Servers

For convenience, you can run both servers simultaneously:

**Terminal 1 (Frontend):**
```bash
cd frontend && npm run dev
```

**Terminal 2 (Backend):**
```bash
cd backend && source venv/bin/activate && python app.py
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `python app.py` - Start development server
- `flask db migrate` - Create database migration
- `flask db upgrade` - Apply migrations
- `pytest` - Run tests
- `black .` - Format code
- `flake8` - Lint code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [MiDaS](https://github.com/isl-org/MiDaS) for depth estimation models
- [Open3D](http://www.open3d.org/) for 3D processing
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) for 3D rendering

---

Built with passion by the ANIAD Team
