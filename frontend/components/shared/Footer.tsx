'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function Footer() {
  const pathname = usePathname();

  // Hide footer on dashboard and auth pages
  const isDashboard = pathname?.startsWith('/creator') || pathname?.startsWith('/admin');
  const isAuth = pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/forgot-password') || pathname?.startsWith('/reset-password');

  if (isDashboard || isAuth) return null;

  const footerLinks = [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Twitter', href: '#' },
    { label: 'Discord', href: '#' },
    { label: 'Github', href: '#' },
  ];

  return (
    <footer className="w-full py-12 px-8 border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="font-headline font-black text-primary text-2xl tracking-tighter uppercase">
            ANIAD
          </div>
          <div className="text-[10px] font-label tracking-widest text-muted uppercase">
            &copy; {new Date().getFullYear()} ANIAD AI. Powered by The Electric Void.
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted text-[10px] font-label tracking-widest uppercase hover:text-primary transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[10px] font-label tracking-widest text-success uppercase">
            SYSTEMS OPERATIONAL
          </span>
        </div>
      </div>
    </footer>
  );
}
