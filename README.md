# AniMate - AI-Powered Animation Platform

![AniMate](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

A modern AI-powered animation generation platform built with Next.js 14, featuring stunning UI with glassmorphism effects, smooth animations, and comprehensive dashboards for creators and admins.

## Features

- **AI-Powered Animation Generation**: Transform text scripts into animations using advanced AI
- **2D to 3D Conversion**: Convert 2D animations into stunning 3D models
- **Creator Dashboard**: Manage projects, upload scripts, and create animations
- **Admin Dashboard**: User management and system monitoring
- **Modern UI**: Glassmorphism effects, gradient backgrounds, and smooth animations
- **Authentication**: Complete auth system with login/signup
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
cd animate
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Flask API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
animate/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── (dashboard)/
│   │   ├── admin/          # Admin dashboard
│   │   └── creator/        # Creator dashboard
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/
│   ├── landing/            # Landing page components
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   └── CTA.tsx
│   ├── shared/             # Shared components
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── api.ts              # API client & endpoints
│   └── utils.ts            # Utility functions
└── store/
    └── authStore.ts        # Zustand auth store
```

## Key Pages

### Landing Page (`/`)
- Hero section with animations
- Features showcase
- How it works section
- Call-to-action

### Authentication
- **Login** (`/login`): User authentication with form validation
- **Signup** (`/signup`): New user registration with role selection

### Dashboards
- **Creator Dashboard** (`/creator`):
  - Script to animation converter
  - 2D to 3D converter
  - Project management
  - Quick stats

- **Admin Dashboard** (`/admin`):
  - User management
  - System statistics
  - User search and filtering

## API Integration

The project is set up to integrate with a Flask backend. API endpoints are configured in `lib/api.ts`:

- **Auth API**: Login, signup, logout
- **Projects API**: CRUD operations for projects
- **Admin API**: User management and system stats
- **Animation API**: Generate and convert animations

## Styling Features

- **Glassmorphism**: Modern glass-like UI elements
- **Gradient Backgrounds**: Purple/pink AI-themed gradients
- **Custom Animations**: Float, glow, and fade effects
- **Dark Theme**: Professional dark mode by default
- **Responsive**: Mobile-first design approach

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint Code

```bash
npm run lint
```

## Customization

### Changing Colors

Edit the CSS variables in `app/globals.css`:

```css
:root {
  --primary: 263 70% 50%;  /* Purple */
  --secondary: 240 4% 16%;
  /* ... */
}
```

### Adding New Components

Use shadcn/ui CLI to add components:

```bash
npx shadcn@latest add [component-name]
```

## Flask Backend Setup

This frontend expects a Flask backend running on `http://localhost:5000`. Make sure to:

1. Set up your Flask API with the following endpoints:
   - `/api/auth/login`
   - `/api/auth/signup`
   - `/api/projects`
   - `/api/admin/users`
   - `/api/animation/generate`

2. Configure CORS to allow requests from `http://localhost:3000`

## Contributing

This is a FYP (Final Year Project) at 30% completion. Future updates will include:

- Real-time animation preview
- Advanced editing tools
- Collaboration features
- Export in multiple formats
- AI model training interface

## License

This project is part of an academic final year project.

## Contact

for issues contact: Fakhirhassanllc@gmail.com

---

