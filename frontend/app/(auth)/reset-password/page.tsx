'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Lock, Loader2, CheckCircle2, Eye, EyeOff, Zap, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/lib/api';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const floatingOrbs = [
  { size: 110, x: '15%', y: '25%', delay: 0, duration: 9, color: 'bg-neon-violet/10' },
  { size: 75, x: '75%', y: '55%', delay: 2, duration: 8, color: 'bg-neon-cyan/10' },
  { size: 55, x: '55%', y: '10%', delay: 1, duration: 7, color: 'bg-neon-pink/10' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const hash = window.location.hash;
    let tokenFromUrl = searchParams.get('token') || searchParams.get('access_token');

    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      tokenFromUrl = params.get('access_token');
    }

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authAPI.resetPassword(token, data.password);
      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      setError('Failed to reset password. The link may have expired. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Side: Visual Branding */}
      <section className="hidden lg:flex flex-col flex-1 relative items-center justify-center bg-void-black dot-grid border-r border-border">
        {/* Floating Orbs */}
        {floatingOrbs.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${orb.color} blur-2xl`}
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
            animate={{
              y: [0, -30, 0, 30, 0],
              x: [0, 20, 0, -20, 0],
              scale: [1, 1.2, 1, 0.9, 1],
            }}
            transition={{
              duration: orb.duration,
              delay: orb.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="z-10 flex flex-col items-center gap-12 max-w-lg text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 20px rgba(139, 92, 246, 0.3)',
                '0 0 40px rgba(139, 92, 246, 0.5)',
                '0 0 20px rgba(139, 92, 246, 0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-32 h-32 bg-void-elevated rounded-full flex items-center justify-center border-2 border-neon-violet"
          >
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <KeyRound className="w-16 h-16 text-neon-cyan" />
            </motion.div>
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, letterSpacing: '0.3em' }}
              animate={{ opacity: 1, letterSpacing: '-0.05em' }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="font-headline text-5xl font-black text-neon-cyan uppercase"
            >
              ANIAD AI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-xl text-void-muted font-light tracking-wide leading-relaxed"
            >
              Reset your <span className="text-neon-pink font-bold uppercase">Password</span>.
              <br />Enter your new password below.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* Right Side: Form */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-background relative">
        {/* Subtle background glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:hidden absolute top-8 left-8 flex items-center gap-3"
        >
          <Zap className="w-5 h-5 text-primary" fill="currentColor" />
          <span className="font-headline text-xl font-bold tracking-tighter uppercase">ANIAD</span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-8 z-10"
        >
          <motion.div variants={itemVariants} className="text-center lg:text-left">
            <h2 className="font-headline text-3xl font-bold text-foreground mb-2 uppercase tracking-tight">
              Reset Password
            </h2>
            <p className="text-muted font-medium">Enter your new password below</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ boxShadow: '0 0 30px rgba(139, 92, 246, 0.1)' }}
            className="bg-surface border border-border p-8 rounded-lg shadow-2xl"
          >
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded mb-6 flex items-center gap-2"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                </motion.div>
                <span>Password reset successfully! Redirecting to login...</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, x: -10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded mb-6"
              >
                {error}
              </motion.div>
            )}

            {!success && token && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2 group">
                  <Label htmlFor="password" className="font-label text-xs font-semibold uppercase tracking-widest text-muted group-focus-within:text-primary transition-colors">
                    New Password
                  </Label>
                  <motion.div whileFocusWithin={{ scale: 1.01 }} className="relative flex items-center">
                    <Lock className="absolute left-4 h-5 w-5 text-muted" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className="pl-12 pr-12 bg-input border-border text-foreground placeholder:text-muted/40 focus:ring-1 focus:ring-primary focus:border-primary h-12"
                      {...register('password')}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-muted hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </motion.button>
                  </motion.div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-destructive text-sm"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2 group">
                  <Label htmlFor="confirmPassword" className="font-label text-xs font-semibold uppercase tracking-widest text-muted group-focus-within:text-primary transition-colors">
                    Confirm Password
                  </Label>
                  <motion.div whileFocusWithin={{ scale: 1.01 }} className="relative flex items-center">
                    <Lock className="absolute left-4 h-5 w-5 text-muted" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      className="pl-12 pr-12 bg-input border-border text-foreground placeholder:text-muted/40 focus:ring-1 focus:ring-primary focus:border-primary h-12"
                      {...register('confirmPassword')}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 text-muted hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </motion.button>
                  </motion.div>
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-destructive text-sm"
                    >
                      {errors.confirmPassword.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full h-12 font-headline font-bold uppercase tracking-widest"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            )}

            {!token && !success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <p className="text-muted mb-4">
                  The reset link is invalid or has expired.
                </p>
                <Link href="/forgot-password" className="text-accent hover:text-primary font-semibold transition-colors">
                  Request a new password reset
                </Link>
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="text-center pt-4">
            <Link href="/login" className="text-accent hover:text-primary font-semibold transition-colors">
              Back to Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
