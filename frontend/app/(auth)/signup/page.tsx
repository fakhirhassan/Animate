'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, KeyRound, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;
type SignupStep = 'form' | 'otp' | 'success';

const floatingOrbs = [
  { size: 100, x: '10%', y: '25%', delay: 0, duration: 9, color: 'bg-neon-violet/10' },
  { size: 70, x: '80%', y: '55%', delay: 3, duration: 8, color: 'bg-neon-cyan/10' },
  { size: 50, x: '55%', y: '10%', delay: 1, duration: 7, color: 'bg-neon-pink/10' },
  { size: 90, x: '30%', y: '80%', delay: 2, duration: 10, color: 'bg-neon-cyan/5' },
];

const formFieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<SignupStep>('form');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState<SignupFormData | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch('password', '');

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const strengthColors = ['bg-destructive', 'bg-destructive', 'bg-destructive', 'bg-warning', 'bg-accent', 'bg-neon-violet'];
  const strengthTexts = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  const sendOTP = async (email: string, name: string, pwd: string, isResend: boolean = false) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password: pwd, is_resend: isResend }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to send OTP');

      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);

      return true;
    } catch (error) {
      throw error;
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    try {
      setFormData(data);
      await sendOTP(data.email, data.name, data.password);
      setStep('otp');
    } catch (err: unknown) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyOTP = async () => {
    setIsLoading(true);
    setError('');
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      if (!formData) return;
      const response = await fetch('http://localhost:5001/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, token: enteredOtp, name: formData.name }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.message || 'Invalid or expired verification code. Please try again.');
        setIsLoading(false);
        return;
      }

      const { user, token } = result.data;
      login(user, token);
      setStep('success');
      setTimeout(() => { router.push('/creator'); }, 2000);
    } catch (err: unknown) {
      console.error('Verification error:', err);
      setError('Failed to verify account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendTimer > 0 || !formData) return;
    setIsLoading(true);
    setError('');
    setOtp(['', '', '', '', '', '']);

    try {
      await sendOTP(formData.email, formData.name, formData.password, true);
    } catch (err) {
      console.error('Resend error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepIndex = ['form', 'otp', 'success'].indexOf(step);

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
              y: [0, -25, 0, 25, 0],
              x: [0, 15, 0, -15, 0],
              scale: [1, 1.15, 1, 0.9, 1],
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
              Create your <span className="text-neon-pink font-bold uppercase">Account</span>.
              <br />Start creating AI-powered animations today.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* Right Side: Form */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-background relative overflow-y-auto">
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md py-20 lg:py-8 z-10"
        >
          {/* Progress Pills */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {['form', 'otp', 'success'].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: i * 0.1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-label transition-all duration-300 ${
                    step === s ? 'bg-primary text-white neon-glow-primary' :
                    stepIndex > i ? 'bg-accent text-white' :
                    'bg-surface-high text-muted border border-border'
                  }`}
                >
                  {stepIndex > i ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    i + 1
                  )}
                </motion.div>
                {i < 2 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                    className={`w-12 h-px origin-left ${stepIndex > i ? 'bg-accent' : 'bg-border'}`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Registration Form */}
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-center lg:text-left mb-6"
                >
                  <h2 className="font-headline text-3xl font-bold text-foreground mb-2 uppercase tracking-tight">
                    Create Account
                  </h2>
                  <p className="text-muted font-medium">Set up your AI animation studio</p>
                </motion.div>

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

                <motion.div
                  whileHover={{ boxShadow: '0 0 30px rgba(139, 92, 246, 0.1)' }}
                  className="bg-surface border border-border p-8 rounded-lg shadow-2xl"
                >
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Name */}
                    <motion.div
                      custom={0}
                      variants={formFieldVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2 group"
                    >
                      <Label htmlFor="name" className="font-label text-xs font-semibold uppercase tracking-widest text-muted group-focus-within:text-primary transition-colors">
                        Full Name
                      </Label>
                      <motion.div whileFocusWithin={{ scale: 1.01 }} className="relative flex items-center">
                        <User className="absolute left-4 h-5 w-5 text-muted" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          className="pl-12 bg-input border-border text-foreground placeholder:text-muted/40 focus:ring-1 focus:ring-primary focus:border-primary h-12"
                          {...register('name')}
                        />
                      </motion.div>
                      {errors.name && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-destructive text-sm">
                          {errors.name.message}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Email */}
                    <motion.div
                      custom={1}
                      variants={formFieldVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2 group"
                    >
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
                        />
                      </motion.div>
                      {errors.email && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-destructive text-sm">
                          {errors.email.message}
                        </motion.p>
                      )}
                      <p className="text-muted text-[10px] font-label tracking-wider uppercase">Verification code will be sent here</p>
                    </motion.div>

                    {/* Password */}
                    <motion.div
                      custom={2}
                      variants={formFieldVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2 group"
                    >
                      <Label htmlFor="password" className="font-label text-xs font-semibold uppercase tracking-widest text-muted group-focus-within:text-primary transition-colors">
                        Password
                      </Label>
                      <motion.div whileFocusWithin={{ scale: 1.01 }} className="relative flex items-center">
                        <Lock className="absolute left-4 h-5 w-5 text-muted" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
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
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-destructive text-sm">
                          {errors.password.message}
                        </motion.p>
                      )}
                      {/* Password Strength */}
                      {password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-1"
                        >
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <motion.div
                                key={level}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.3, delay: level * 0.05 }}
                                className={`h-1 flex-1 rounded-full origin-left transition-colors duration-300 ${
                                  level <= passwordStrength ? strengthColors[passwordStrength] : 'bg-surface-high'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-[10px] font-label tracking-wider uppercase ${
                            passwordStrength <= 2 ? 'text-destructive' :
                            passwordStrength <= 3 ? 'text-warning' :
                            passwordStrength <= 4 ? 'text-accent' : 'text-neon-violet'
                          }`}>
                            Strength: {strengthTexts[passwordStrength]}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Confirm Password */}
                    <motion.div
                      custom={3}
                      variants={formFieldVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2 group"
                    >
                      <Label htmlFor="confirmPassword" className="font-label text-xs font-semibold uppercase tracking-widest text-muted group-focus-within:text-primary transition-colors">
                        Confirm Password
                      </Label>
                      <motion.div whileFocusWithin={{ scale: 1.01 }} className="relative flex items-center">
                        <Lock className="absolute left-4 h-5 w-5 text-muted" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
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
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-destructive text-sm">
                          {errors.confirmPassword.message}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div
                      custom={4}
                      variants={formFieldVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          className="w-full h-12 font-headline font-bold uppercase tracking-widest mt-2"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            'Sign Up'
                          )}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </form>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 text-center"
                >
                  <p className="text-sm text-muted">
                    Already have an account?{' '}
                    <Link href="/login" className="text-accent hover:text-primary font-semibold transition-colors">
                      Sign In
                    </Link>
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
              >
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ x: -4 }}
                  onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); setError(''); }}
                  className="flex items-center text-muted hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="font-label text-xs uppercase tracking-widest">Back</span>
                </motion.button>

                <motion.div
                  whileHover={{ boxShadow: '0 0 30px rgba(139, 92, 246, 0.1)' }}
                  className="bg-surface border border-border p-8 rounded-lg shadow-2xl"
                >
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/20 mb-4 border border-primary/30"
                    >
                      <KeyRound className="h-8 w-8 text-primary" />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="font-headline text-2xl font-bold text-foreground mb-2 uppercase tracking-tight"
                    >
                      Verify Email
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-muted"
                    >
                      We sent a 6-digit code to<br />
                      <span className="font-semibold text-accent">{formData?.email}</span>
                    </motion.p>
                  </div>

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

                  {/* OTP Input */}
                  <div className="flex justify-center gap-3 mb-8">
                    {otp.map((digit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.08, type: 'spring', stiffness: 300 }}
                      >
                        <motion.div whileFocusWithin={{ scale: 1.1 }}>
                          <Input
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            className="w-12 h-14 text-center text-2xl font-headline font-bold bg-input border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={verifyOTP}
                        className="w-full h-12 font-headline font-bold uppercase tracking-widest"
                        disabled={isLoading || otp.join('').length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Authenticating...
                          </>
                        ) : (
                          'Verify Code'
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6 text-center"
                  >
                    <p className="text-muted text-sm">
                      Didn&apos;t receive the code?{' '}
                      {resendTimer > 0 ? (
                        <span className="text-muted/50 font-label text-xs">
                          Retry in {resendTimer}s
                        </span>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={resendOTP}
                          disabled={isLoading}
                          className="text-accent hover:text-primary font-semibold transition-colors"
                        >
                          Resend Code
                        </motion.button>
                      )}
                    </p>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-surface border border-border p-8 rounded-lg shadow-2xl"
              >
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/20 mb-6 border border-success/30"
                  >
                    <CheckCircle2 className="h-10 w-10 text-success" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="font-headline text-2xl font-bold text-foreground mb-2 uppercase tracking-tight"
                  >
                    Account Created
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-muted mb-4"
                  >
                    Welcome to ANIAD AI, {formData?.name}!
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-neon-violet animate-pulse" />
                    <p className="text-muted/50 text-sm font-label tracking-wider uppercase">
                      Redirecting to dashboard...
                    </p>
                    <Sparkles className="h-4 w-4 text-neon-violet animate-pulse" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
