'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle2, ArrowLeft, Zap, ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const floatingOrbs = [
  { size: 100, x: '20%', y: '30%', delay: 0, duration: 8, color: 'bg-neon-violet/10' },
  { size: 70, x: '70%', y: '60%', delay: 2, duration: 10, color: 'bg-neon-cyan/10' },
  { size: 60, x: '50%', y: '15%', delay: 1, duration: 7, color: 'bg-neon-pink/10' },
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

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authAPI.forgotPassword(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      console.error('Forgot password error:', err);
      setError('Failed to send reset email. Please try again.');
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
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShieldQuestion className="w-16 h-16 text-neon-cyan" />
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
              Forgot your <span className="text-neon-pink font-bold uppercase">Password</span>?
              <br />No worries, we&apos;ll help you reset it.
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
              Forgot Password
            </h2>
            <p className="text-muted font-medium">
              Enter your email and we&apos;ll send you reset instructions
            </p>
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
                <span>Check your email for reset instructions!</span>
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <motion.div variants={itemVariants} className="space-y-2 group">
                <Label htmlFor="email" className="font-label text-xs font-semibold uppercase tracking-widest text-muted group-focus-within:text-primary transition-colors">
                  Email Address
                </Label>
                <motion.div whileFocusWithin={{ scale: 1.01 }} className="relative flex items-center">
                  <Mail className="absolute left-4 h-5 w-5 text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-12 bg-input border-border text-foreground placeholder:text-muted/40 focus:ring-1 focus:ring-primary focus:border-primary h-12"
                    {...register('email')}
                    disabled={success}
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

              <motion.div variants={itemVariants}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 font-headline font-bold uppercase tracking-widest"
                    disabled={isLoading || success}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Email Sent
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center pt-4">
            <Link
              href="/login"
              className="text-accent hover:text-primary font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <motion.div whileHover={{ x: -4 }} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
