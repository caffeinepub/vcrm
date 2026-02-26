import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useActor } from '../hooks/useActor';
import { Sun, Mail, KeyRound, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const OTP_AUTH_KEY = 'vcrm_otp_authenticated';
const EMAIL_KEY = 'vcrm_logged_in_email';

export function setOTPAuthenticated(email: string) {
  localStorage.setItem(OTP_AUTH_KEY, 'true');
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearOTPAuthenticated() {
  localStorage.removeItem(OTP_AUTH_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function isOTPAuthenticated(): boolean {
  return localStorage.getItem(OTP_AUTH_KEY) === 'true';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { actor } = useActor();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  useEffect(() => {
    if (isOTPAuthenticated()) {
      navigate({ to: '/dashboard' });
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!actor) {
      toast.error('System not ready. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const code = await actor.generateOTP(email.trim().toLowerCase());
      setGeneratedOtp(code);
      setStep('otp');
      setCountdown(600);
      toast.success(`OTP sent! Check your email. (Dev: ${code})`);
    } catch (err) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    if (!actor) {
      toast.error('System not ready. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await actor.verifyOTP(email.trim().toLowerCase(), otp.trim());

      if (result.__kind__ === 'success') {
        setOTPAuthenticated(email.trim().toLowerCase());
        toast.success('Login successful! Welcome to VCRM.');
        navigate({ to: '/dashboard' });
      } else if (result.__kind__ === 'expired') {
        toast.error('OTP has expired. Please request a new one.');
        setStep('email');
        setOtp('');
      } else {
        toast.error('Invalid OTP. Please check and try again.');
      }
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!actor) return;
    setIsLoading(true);
    try {
      const code = await actor.generateOTP(email.trim().toLowerCase());
      setGeneratedOtp(code);
      setCountdown(600);
      toast.success(`New OTP sent! (Dev: ${code})`);
    } catch {
      toast.error('Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sun className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">VCRM</h1>
          <p className="text-muted-foreground mt-1">Solar CRM Platform</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {step === 'email' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Sign In</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a one-time password</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={isLoading || !email.trim()}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Enter OTP</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                </p>
                {generatedOtp && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    Dev mode — OTP: <span className="font-mono font-bold">{generatedOtp}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="otp">One-Time Password</Label>
                  <div className="relative mt-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                      className="pl-10 font-mono tracking-widest text-center text-lg"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length < 6}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => { setStep('email'); setOtp(''); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Change email
                  </button>
                  {countdown > 0 ? (
                    <span className="text-muted-foreground">
                      Resend in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="text-primary hover:underline transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>{' '}
          © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
