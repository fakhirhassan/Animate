'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, Zap, Play, Box, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const floatingOrbs = [
  { size: 120, x: '15%', y: '20%', delay: 0, duration: 8, color: 'bg-neon-violet/10' },
  { size: 80, x: '75%', y: '60%', delay: 2, duration: 10, color: 'bg-neon-cyan/10' },
  { size: 60, x: '60%', y: '15%', delay: 4, duration: 7, color: 'bg-neon-pink/10' },
  { size: 100, x: '25%', y: '75%', delay: 1, duration: 9, color: 'bg-neon-cyan/5' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      const { user, token } = result.data;
      login(user, token);
      setSuccess(true);

      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/creator');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Failed to connect to server. Please try again.');
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
          {/* Logo Mark */}
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
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Zap className="w-16 h-16 text-neon-cyan" fill="currentColor" />
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
              Your <span className="text-neon-pink font-bold uppercase">AI Animation Studio</span>.
              <br />Transform images, generate videos, and bring ideas to life.
            </motion.p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-sm">
            {[
              { icon: Box, label: '2D to 3D', status: 'READY' },
              { icon: Film, label: 'Text to Video', status: 'READY' },
              { icon: Play, label: 'Animation', status: 'READY' },
            ].map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 + i * 0.15 }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(0, 255, 255, 0.5)' }}
                className="bg-void-elevated p-3 rounded border border-void-border transition-colors"
              >
                <feature.icon className="w-5 h-5 text-neon-violet mx-auto mb-2" />
                <p className="font-label text-[9px] text-void-muted uppercase tracking-widest">{feature.label}</p>
                <p className="font-headline text-sm text-neon-cyan">{feature.status}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Right Side: Login Form */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-background relative">
        {/* Subtle background glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Mobile Logo */}
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
              Welcome Back
            </h2>
            <p className="text-muted font-medium">Sign in to your animation studio</p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ boxShadow: '0 0 30px rgba(139, 92, 246, 0.1)' }}
            className="bg-surface border border-border p-8 rounded-lg shadow-2xl transition-shadow"
          >
            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded mb-6 flex items-center gap-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </motion.div>
                <span>Login successful! Redirecting...</span>
              </motion.div>
            )}

            {/* Error Message */}
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <motion.div
                variants={itemVariants}
                className="space-y-2 group"
              >
                <Label htmlFor="email" className="font-label text-xs font-semibold uppercase tracking-widest text-muted group-focus-within:text-primary transition-colors">
                  Email
                </Label>
                <motion.div
                  whileFocusWithin={{ scale: 1.01 }}
                  className="relative flex items-center"
                >
                  <Mail className="absolute left-4 h-5 w-5 text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-12 bg-input border-border text-foreground placeholder:text-muted/40 focus:ring-1 focus:ring-primary focus:border-primary h-12"
                    {...register('email')}
                  />
                </motion.div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-destructive text-sm"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div
                variants={itemVariants}
                className="space-y-2 group"
              >
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-label text-xs font-semibold uppercase tracking-widest text-muted group-focus-within:text-primary transition-colors">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="font-label text-[10px] text-highlight hover:text-accent uppercase transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <motion.div
                  whileFocusWithin={{ scale: 1.01 }}
                  className="relative flex items-center"
                >
                  <Lock className="absolute left-4 h-5 w-5 text-muted" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
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

              {/* Submit */}
              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 font-headline font-bold uppercase tracking-widest"
                    disabled={isLoading || success}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Authenticating...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Authenticated
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>

          {/* Sign Up Link */}
          <motion.div variants={itemVariants} className="text-center pt-4">
            <p className="text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-accent hover:text-primary font-semibold transition-colors">
                Sign Up
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
