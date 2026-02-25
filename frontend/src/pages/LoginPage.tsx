import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGenerateOTP, useVerifyOTP, useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { BarChart3, Users, Sun, Zap, Mail, ShieldCheck, ArrowLeft, RefreshCw, Clock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

type LoginStep = 'email' | 'otp';

function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (s: number) => {
    setSeconds(s);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return { seconds, start, formatTime, isExpired: seconds === 0 };
}

export default function LoginPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const generateOTP = useGenerateOTP();
  const verifyOTP = useVerifyOTP();
  const { data: userProfile, isFetched: profileFetched } = useGetCallerUserProfile();
  const { seconds, start: startCountdown, formatTime, isExpired } = useCountdown(600);

  // Redirect if already authenticated
  useEffect(() => {
    if (identity) {
      navigate({ to: '/dashboard' });
    }
  }, [identity, navigate]);

  // After OTP verification success, redirect to dashboard
  useEffect(() => {
    if (verifySuccess && profileFetched) {
      if (userProfile) {
        navigate({ to: '/dashboard' });
      } else {
        navigate({ to: '/dashboard' });
      }
    }
  }, [verifySuccess, profileFetched, userProfile, navigate]);

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const handleSendOTP = async () => {
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setEmailError('');
    try {
      const code = await generateOTP.mutateAsync(email.trim().toLowerCase());
      setGeneratedOTP(code);
      setStep('otp');
      startCountdown(600);
      setOtp('');
      setOtpError('');
    } catch {
      setEmailError('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }
    setOtpError('');
    try {
      const result = await verifyOTP.mutateAsync({ email: email.trim().toLowerCase(), otp });
      if (result.__kind__ === 'success') {
        setVerifySuccess(true);
      } else if (result.__kind__ === 'expired') {
        setOtpError('OTP has expired. Please request a new one.');
        setGeneratedOTP('');
      } else {
        setOtpError('Invalid OTP. Please check and try again.');
      }
    } catch {
      setOtpError('Verification failed. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    setOtpError('');
    setOtp('');
    try {
      const code = await generateOTP.mutateAsync(email.trim().toLowerCase());
      setGeneratedOTP(code);
      startCountdown(600);
    } catch {
      setOtpError('Failed to resend OTP. Please try again.');
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setOtpError('');
    setGeneratedOTP('');
    generateOTP.reset();
    verifyOTP.reset();
  };

  const features = [
    { icon: BarChart3, label: 'Deal Pipeline', desc: 'Track deals from lead to close' },
    { icon: Users, label: 'Customer CRM', desc: 'Manage all your relationships' },
    { icon: Sun, label: 'Solar Projects', desc: 'Site surveys & installations' },
    { icon: Zap, label: 'Smart Reminders', desc: 'Never miss a follow-up' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-sidebar p-12">
        <div>
          <div className="mb-12">
            <img
              src="/assets/generated/vcrm-logo.dim_512x512.png"
              alt="VCRM Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-display font-bold text-sidebar-foreground leading-tight mb-4">
            Manage Solar Projects<br />
            <span className="text-orange">& Customer Relations</span>
          </h1>
          <p className="text-sidebar-foreground/60 text-lg leading-relaxed">
            The complete CRM solution for solar energy businesses. Track leads, manage installations, and grow your pipeline.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-sidebar-accent/40 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center mb-3">
                <Icon size={16} className="text-sidebar-primary" />
              </div>
              <p className="text-sm font-semibold text-sidebar-foreground">{label}</p>
              <p className="text-xs text-sidebar-foreground/50 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-sidebar-foreground/30 text-xs">
          © {new Date().getFullYear()} VCRM. Built with{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'vcrm-app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <img
              src="/assets/generated/vcrm-logo.dim_512x512.png"
              alt="VCRM Logo"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
              step === 'email' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
            )}>
              {step === 'otp' ? <CheckCircle2 size={16} /> : '1'}
            </div>
            <div className={cn('flex-1 h-0.5 rounded transition-all', step === 'otp' ? 'bg-primary' : 'bg-border')} />
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
              step === 'otp' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              2
            </div>
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  {step === 'email' ? (
                    <Mail size={20} className="text-primary" />
                  ) : (
                    <ShieldCheck size={20} className="text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground">
                    {step === 'email' ? 'Sign In to VCRM' : 'Verify Your Identity'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {step === 'email'
                      ? 'Enter your email to receive a one-time password'
                      : `OTP sent to ${email}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 space-y-5">
              {/* Success state */}
              {verifySuccess && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Verification Successful!</p>
                    <p className="text-sm text-muted-foreground mt-1">Redirecting to your dashboard…</p>
                  </div>
                  <Loader2 size={18} className="animate-spin text-primary mt-1" />
                </div>
              )}

              {/* Step 1: Email */}
              {!verifySuccess && step === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                        className={cn('pl-9', emailError && 'border-destructive focus-visible:ring-destructive')}
                        disabled={generateOTP.isPending}
                        autoFocus
                      />
                    </div>
                    {emailError && (
                      <div className="flex items-center gap-1.5 text-destructive text-xs">
                        <AlertCircle size={13} />
                        <span>{emailError}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    disabled={generateOTP.isPending || !email.trim()}
                    className="w-full h-11 font-semibold"
                    size="lg"
                  >
                    {generateOTP.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Sending OTP…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mail size={16} />
                        Send OTP
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {/* Step 2: OTP */}
              {!verifySuccess && step === 'otp' && (
                <div className="space-y-5">
                  {/* OTP Info Banner */}
                  {generatedOTP && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck size={16} className="text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-primary mb-1">
                            Your OTP (Simulated Delivery)
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xl font-bold tracking-[0.3em] text-foreground">
                              {showOTP ? generatedOTP : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowOTP(!showOTP)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showOTP ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            In production, this would be sent to your email.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Countdown timer */}
                  <div className={cn(
                    'flex items-center gap-2 text-sm rounded-lg px-3 py-2',
                    isExpired
                      ? 'bg-destructive/10 text-destructive'
                      : seconds < 60
                        ? 'bg-orange/10 text-orange'
                        : 'bg-muted text-muted-foreground'
                  )}>
                    <Clock size={14} className="shrink-0" />
                    {isExpired ? (
                      <span className="font-medium">OTP expired — please request a new one</span>
                    ) : (
                      <span>
                        OTP expires in <span className="font-mono font-bold">{formatTime(seconds)}</span>
                      </span>
                    )}
                  </div>

                  {/* OTP Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Enter 6-Digit OTP</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(val) => {
                          setOtp(val);
                          if (otpError) setOtpError('');
                        }}
                        disabled={verifyOTP.isPending || isExpired}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {otpError && (
                      <div className="flex items-center justify-center gap-1.5 text-destructive text-xs">
                        <AlertCircle size={13} />
                        <span>{otpError}</span>
                      </div>
                    )}
                  </div>

                  {/* Verify button */}
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={verifyOTP.isPending || otp.length !== 6 || isExpired}
                    className="w-full h-11 font-semibold"
                    size="lg"
                  >
                    {verifyOTP.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Verifying…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={16} />
                        Verify OTP
                      </span>
                    )}
                  </Button>

                  {/* Resend & Back */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft size={13} />
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={generateOTP.isPending}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                      {generateOTP.isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'vcrm-app')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
