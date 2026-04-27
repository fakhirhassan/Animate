'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Box,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Film,
  Zap,
  HelpCircle,
  ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  {
    name: 'Dashboard',
    href: '/creator',
    icon: Home,
    description: 'Overview & quick actions',
  },
  {
    name: '2D to 3D',
    href: '/creator/2d-to-3d',
    icon: Box,
    description: 'Convert images to 3D models',
  },
  {
    name: 'Animate',
    href: '/creator/animate',
    icon: Film,
    description: 'Text to 3D animation',
  },
  {
    name: 'Text to Image',
    href: '/creator/text-to-image',
    icon: ImageIcon,
    description: 'Generate images from text',
  },
  {
    name: 'Assets',
    href: '/creator/assets',
    icon: FolderOpen,
    description: 'View and manage your 3D models',
  },
  {
    name: 'Projects',
    href: '/creator/projects',
    icon: FolderOpen,
    description: 'Manage your projects',
    disabled: true,
  },
  {
    name: 'Settings',
    href: '/creator/settings',
    icon: Settings,
    description: 'Account preferences',
  },
];

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }
    setAuthChecked(true);
  }, [token, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1f]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/creator') {
      return pathname === '/creator';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-border z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-surface-high rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-muted" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" fill="currentColor" />
            </div>
            <span className="font-headline font-bold text-sm tracking-widest uppercase text-foreground">ANIAD</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-surface z-50 shadow-xl"
            >
              <MobileSidebar
                user={user}
                isActive={isActive}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border flex-col z-40">
        <DesktopSidebar
          user={user}
          isActive={isActive}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function DesktopSidebar({
  user,
  isActive,
  onLogout,
}: {
  user: any;
  isActive: (href: string) => boolean;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-8 py-8 mb-2">
        <Link href="/creator" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xs font-semibold tracking-widest font-label text-foreground uppercase">
              Creator Hub
            </h1>
            <p className="text-[10px] text-muted font-label">The Electric Void</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
          />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-6 py-4 mt-auto space-y-2">
        <Button className="w-full font-label text-xs tracking-widest uppercase">
          New Project
        </Button>
        <Link
          href="/"
          className="flex items-center gap-4 text-muted px-6 py-4 hover:text-accent transition-colors w-full"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-[10px] font-label uppercase tracking-widest">Back to Site</span>
        </Link>
        <button className="flex items-center gap-4 text-muted px-6 py-4 hover:text-primary transition-colors w-full">
          <HelpCircle className="h-5 w-5" />
          <span className="text-[10px] font-label uppercase tracking-widest">Help Center</span>
        </button>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full border border-border bg-surface-high flex items-center justify-center text-sm font-bold text-primary">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-muted hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </>
  );
}

function MobileSidebar({
  user,
  isActive,
  onClose,
  onLogout,
}: {
  user: any;
  isActive: (href: string) => boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="font-headline font-bold text-sm tracking-widest uppercase">ANIAD</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-surface-high rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-muted" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            onClick={onClose}
          />
        ))}
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-4 px-6 py-4 text-muted hover:text-accent hover:bg-surface-high transition-colors border-l-4 border-transparent"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-widest font-label uppercase">Back to Site</span>
        </Link>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full border border-border bg-surface-high flex items-center justify-center text-sm font-bold text-primary">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-muted hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </>
  );
}

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div className="relative flex items-center gap-4 px-6 py-4 text-muted/50 cursor-not-allowed">
        <Icon className="h-5 w-5" />
        <span className="text-xs font-semibold tracking-widest font-label uppercase">{item.name}</span>
        <span className="ml-auto text-[9px] uppercase tracking-wide bg-surface-high text-muted px-1.5 py-0.5 rounded">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        relative flex items-center gap-4 px-6 py-4 transition-all duration-200
        ${
          isActive
            ? 'bg-primary/10 text-primary border-l-4 border-primary'
            : 'text-muted hover:bg-surface-high hover:text-accent border-l-4 border-transparent'
        }
      `}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-semibold tracking-widest font-label uppercase">{item.name}</span>

      {isActive && (
        <ChevronRight className="h-4 w-4 ml-auto" />
      )}
    </Link>
  );
}
