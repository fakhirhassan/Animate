'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { LogoMark } from '@/components/shared/Logo';

// Enhanced validation schema
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

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<SignupStep>('form');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
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

  // Password strength indicator
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

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  // Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP (simulated - in production, call backend API)
  const sendOTP = async (email: string) => {
    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);

    // In production, this would call your backend API to send email
    // For demo, we'll show the OTP in console and alert
    console.log(`OTP for ${email}: ${newOtp}`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Show OTP in alert for demo purposes
    // In production, remove this and send via email
    alert(`Demo Mode: Your OTP is ${newOtp}\n\nIn production, this would be sent to ${email}`);

    // Start resend timer (60 seconds)
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle form submission (Step 1)
  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Call backend API for signup
      const response = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      // Store form data and send OTP
      setFormData(data);
      await sendOTP(data.email);
      setStep('otp');
    } catch (err: unknown) {
      console.error('Signup error:', err);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
  };

  // Handle OTP key down (for backspace)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Verify OTP and complete registration
  const verifyOTP = async () => {
    setIsLoading(true);
    setError('');

    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setIsLoading(false);
      return;
    }

    // For demo, still check against generated OTP
    // In production with Supabase, this would verify via backend
    if (enteredOtp !== generatedOtp) {
      setError('Invalid verification code. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      if (!formData) return;

      // Call backend to verify OTP (in production, Supabase handles this)
      // For now, we simulate successful verification
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Verification failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Login the user with backend token
      const { user, access_token } = result.data;
      login(user, access_token);
      setStep('success');

      // Redirect after success animation
      setTimeout(() => {
        router.push('/creator');
      }, 2000);
    } catch (err: unknown) {
      console.error('Verification error:', err);
      setError('Failed to verify account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (resendTimer > 0 || !formData) return;
    setIsLoading(true);
    setError('');
    setOtp(['', '', '', '', '', '']);

    try {
      await sendOTP(formData.email);
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <AnimatePresence mode="wait">
            {/* Step 1: Registration Form */}
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-4"
                  >
                    <LogoMark size="lg" animated={true} />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Create Account
                  </h1>
                  <p className="text-gray-600">Start your animation journey today</p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        {...register('name')}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-600 text-sm">{errors.name.message}</p>
                    )}
                    <p className="text-gray-400 text-xs">Letters and spaces only</p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-600 text-sm">{errors.email.message}</p>
                    )}
                    <p className="text-gray-400 text-xs">We&apos;ll send a verification code to this email</p>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-600 text-sm">{errors.password.message}</p>
                    )}
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength ? getStrengthColor() : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${getStrengthColor().replace('bg-', 'text-')}`}>
                          Password strength: {getStrengthText()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full gradient-button text-white py-6 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending verification code...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link
                      href="/login"
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Back Button */}
                <button
                  onClick={() => {
                    setStep('form');
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                  }}
                  className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <KeyRound className="h-8 w-8 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Verify your email
                  </h1>
                  <p className="text-gray-600">
                    We sent a 6-digit code to<br />
                    <span className="font-medium text-gray-900">{formData?.email}</span>
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
                  >
                    {error}
                  </motion.div>
                )}

                {/* OTP Input */}
                <div className="flex justify-center gap-3 mb-6">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-bold border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <Button
                  onClick={verifyOTP}
                  className="w-full gradient-button text-white py-6 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading || otp.join('').length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>

                {/* Resend Code */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Didn&apos;t receive the code?{' '}
                    {resendTimer > 0 ? (
                      <span className="text-gray-400">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        onClick={resendOTP}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Resend code
                      </button>
                    )}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6"
                >
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Account Created!
                </h1>
                <p className="text-gray-600 mb-4">
                  Welcome to ANIAD, {formData?.name}!
                </p>
                <p className="text-gray-500 text-sm">
                  Redirecting to your dashboard...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Note */}
        {step === 'form' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
