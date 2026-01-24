# MESH Frontend

Next.js 14 frontend for the MESH platform.

## Setup

```bash
npm install
npm run dev
```

## Structure

```
app/
├── (auth)/          # Login, Signup pages
├── (dashboard)/     # Admin and Creator dashboards
└── page.tsx         # Landing page

components/
├── creator/         # 2D to 3D components
├── landing/         # Landing page sections
├── shared/          # Navbar, Footer
└── ui/              # shadcn components
```

## Environment

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

See [../PROJECT_PLAN.md](../PROJECT_PLAN.md) for full documentation.
