'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  animated?: boolean;
  showTagline?: boolean;
  linkTo?: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

const sizeConfig = {
  sm: { icon: 24, text: 'text-lg', tagline: 'text-[8px]', gap: 'gap-1.5' },
  md: { icon: 32, text: 'text-xl', tagline: 'text-[10px]', gap: 'gap-2' },
  lg: { icon: 40, text: 'text-2xl', tagline: 'text-xs', gap: 'gap-2.5' },
  xl: { icon: 56, text: 'text-4xl', tagline: 'text-sm', gap: 'gap-3' },
};

// Premium geometric logo mark - Abstract "A" with 3D cube/animation frames
function LogoMark({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  const iconContent = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        {/* Primary gradient - Blue to Purple */}
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        {/* Subtle highlight gradient */}
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        {/* Dark accent */}
        <linearGradient id="darkGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>

      {/* Main hexagonal frame - represents animation frames/film */}
      <path
        d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Inner geometric "A" shape - abstract and modern */}
      <path
        d="M24 12L34 32H28L26 28H22L20 32H14L24 12Z"
        fill="url(#logoGradient)"
      />

      {/* Cutout in the A - creates depth */}
      <path
        d="M24 20L26.5 26H21.5L24 20Z"
        fill="white"
      />

      {/* 3D cube accent - small geometric element */}
      <g transform="translate(32, 8)">
        <path d="M0 4L6 0V8L0 12V4Z" fill="url(#highlightGradient)" opacity="0.8" />
        <path d="M6 0L12 4V12L6 8V0Z" fill="url(#darkGradient)" opacity="0.6" />
        <path d="M0 4L6 8L12 4L6 0L0 4Z" fill="url(#logoGradient)" opacity="0.9" />
      </g>

      {/* Animation lines - represent motion/frames */}
      <path
        d="M8 20L4 20"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M8 24L2 24"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M8 28L4 28"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {iconContent}
      </motion.div>
    );
  }

  return iconContent;
}

// Alternative minimal logo mark - cleaner, more abstract
function LogoMarkMinimal({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  const iconContent = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="minimalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Outer rounded square - represents frame */}
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="10"
        fill="none"
        stroke="url(#minimalGradient)"
        strokeWidth="2.5"
      />

      {/* Stylized "A" with play button integrated */}
      <path
        d="M24 10L38 36H32L28 28H20L16 36H10L24 10Z"
        fill="url(#minimalGradient)"
      />
      <path
        d="M24 22L27 28H21L24 22Z"
        fill="white"
      />

      {/* Small accent dot - represents animation point */}
      <circle cx="38" cy="10" r="4" fill="url(#minimalGradient)" />
    </svg>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {iconContent}
      </motion.div>
    );
  }

  return iconContent;
}

// Sleek wordmark with custom styling
function LogoText({
  size = 'md',
  showTagline = false,
  theme = 'auto'
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}) {
  const config = sizeConfig[size];

  const textColorClass = theme === 'light'
    ? 'text-gray-900'
    : theme === 'dark'
      ? 'text-white'
      : 'text-gray-900 dark:text-white';

  const taglineColorClass = theme === 'light'
    ? 'text-gray-500'
    : theme === 'dark'
      ? 'text-gray-400'
      : 'text-gray-500 dark:text-gray-400';

  return (
    <div className="flex flex-col">
      <span className={`${config.text} font-bold tracking-tight ${textColorClass}`}>
        ANI
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AD
        </span>
      </span>
      {showTagline && (
        <span className={`${config.tagline} ${taglineColorClass} tracking-widest uppercase font-medium -mt-0.5`}>
          AI Animation Studio
        </span>
      )}
    </div>
  );
}

// Main Logo Component
export default function Logo({
  size = 'md',
  variant = 'full',
  animated = true,
  showTagline = false,
  linkTo = '/',
  className = '',
  theme = 'auto',
}: LogoProps) {
  const config = sizeConfig[size];

  const logoContent = (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {(variant === 'full' || variant === 'icon') && (
        <LogoMark size={config.icon} animated={animated} />
      )}
      {(variant === 'full' || variant === 'text') && (
        <LogoText size={size} showTagline={showTagline} theme={theme} />
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

// Export individual components for flexible usage
export { LogoMark, LogoMarkMinimal, LogoText };
