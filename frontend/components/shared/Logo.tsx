'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap } from 'lucide-react';

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
  sm: { icon: 20, text: 'text-lg', tagline: 'text-[8px]', gap: 'gap-1.5', iconBox: 'w-8 h-8' },
  md: { icon: 24, text: 'text-xl', tagline: 'text-[10px]', gap: 'gap-2', iconBox: 'w-10 h-10' },
  lg: { icon: 28, text: 'text-2xl', tagline: 'text-xs', gap: 'gap-2.5', iconBox: 'w-12 h-12' },
  xl: { icon: 36, text: 'text-4xl', tagline: 'text-sm', gap: 'gap-3', iconBox: 'w-14 h-14' },
};

function LogoMark({ size = 'md', animated = false }: { size?: 'sm' | 'md' | 'lg' | 'xl'; animated?: boolean }) {
  const config = sizeConfig[size];

  const iconContent = (
    <div className={`${config.iconBox} rounded-lg bg-primary flex items-center justify-center`}>
      <Zap className="text-white" size={config.icon} fill="currentColor" />
    </div>
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

function LogoText({
  size = 'md',
  showTagline = false,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}) {
  const config = sizeConfig[size];

  return (
    <div className="flex flex-col">
      <span className={`${config.text} font-headline font-black tracking-tighter uppercase text-primary`}>
        ANIAD
      </span>
      {showTagline && (
        <span className={`${config.tagline} font-label text-muted tracking-widest uppercase`}>
          The Electric Void
        </span>
      )}
    </div>
  );
}

export default function Logo({
  size = 'md',
  variant = 'full',
  animated = true,
  showTagline = false,
  linkTo = '/',
  className = '',
}: LogoProps) {
  const config = sizeConfig[size];

  const logoContent = (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {(variant === 'full' || variant === 'icon') && (
        <LogoMark size={size} animated={animated} />
      )}
      {(variant === 'full' || variant === 'text') && (
        <LogoText size={size} showTagline={showTagline} />
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export { LogoMark, LogoText };
