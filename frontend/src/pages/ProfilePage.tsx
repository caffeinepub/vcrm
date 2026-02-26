import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useGenerateOTP,
  useVerifyOTP,
  useIsCallerAdmin,
  useIsCallerApproved,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Clock,
  Edit3,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  Loader2,
  Crown,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  const start = (s: number) => {
    setSeconds(s);
    if (intervalId) clearInterval(intervalId);
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(id);
  };

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return { seconds, start, formatTime, isExpired: seconds === 0 };
}

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: isApproved } = useIsCallerApproved();
  const updateProfile = useSaveCallerUserProfile();
  const generateOTP = useGenerateOTP();
  const verifyOTP = useVerifyOTP();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const countdown = useCountdown();

  const principalId = identity?.getPrincipal().toString() ?? '—';
  const loggedInEmail = localStorage.getItem('vcrm_logged_in_email') ?? '';

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditEmail(userProfile.email);
      setEditPhone(userProfile.phone);
    }
  }, [userProfile]);

  const handleStartEdit = () => {
    setEditName(userProfile?.name ?? '');
    setEditEmail(userProfile?.email ?? loggedInEmail);
    setEditPhone(userProfile?.phone ?? '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(msg);
    }
  };

  const handleSendOTP = async () => {
    if (!otpEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }
    try {
      await generateOTP.mutateAsync(otpEmail.trim());
      setOtpStep('code');
      countdown.start(600);
      toast.success('OTP sent to your email');
    } catch {
      toast.error('Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    try {
      const result = await verifyOTP.mutateAsync({ email: otpEmail, otp: otpCode });
      if (result.__kind__ === 'success') {
        toast.success('Email verified successfully');
        setShowOTPDialog(false);
        setOtpCode('');
        setOtpStep('email');
      } else if (result.__kind__ === 'expired') {
        toast.error('OTP has expired. Please request a new one.');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
              {updateProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Avatar + Role */}
      <div className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">
            {userProfile?.name || 'No Name Set'}
          </h2>
          <p className="text-sm text-muted-foreground truncate">{userProfile?.email || loggedInEmail}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {isAdmin ? (
              <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
                <Crown className="w-3 h-3" />
                Admin
              </Badge>
            ) : isApproved ? (
              <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                <UserCheck className="w-3 h-3" />
                Approved
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
                <Clock className="w-3 h-3" />
                Pending Approval
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
        <Separator />

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-muted-foreground text-xs">
            <User className="w-3.5 h-3.5" /> Full Name
          </Label>
          {isEditing ? (
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your full name" />
          ) : (
            <p className="text-sm font-medium text-foreground">{userProfile?.name || '—'}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-muted-foreground text-xs">
            <Mail className="w-3.5 h-3.5" /> Email Address
          </Label>
          {isEditing ? (
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="your@email.com"
            />
          ) : (
            <p className="text-sm font-medium text-foreground">{userProfile?.email || loggedInEmail || '—'}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-muted-foreground text-xs">
            <Phone className="w-3.5 h-3.5" /> Phone Number
          </Label>
          {isEditing ? (
            <Input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          ) : (
            <p className="text-sm font-medium text-foreground">{userProfile?.phone || '—'}</p>
          )}
        </div>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Security</h3>
        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Principal ID</p>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">{principalId}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Email Verification</p>
              <p className="text-xs text-muted-foreground">Re-verify your email via OTP</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOtpEmail(userProfile?.email || loggedInEmail);
              setOtpStep('email');
              setOtpCode('');
              setShowOTPDialog(true);
            }}
          >
            Verify
          </Button>
        </div>
      </div>

      {/* OTP Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Verify Email</DialogTitle>
            <DialogDescription>
              {otpStep === 'email'
                ? 'Enter your email to receive a verification OTP.'
                : `Enter the 6-digit OTP sent to ${otpEmail}`}
            </DialogDescription>
          </DialogHeader>

          {otpStep === 'email' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOTPDialog(false)}>Cancel</Button>
                <Button onClick={handleSendOTP} disabled={generateOTP.isPending}>
                  {generateOTP.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send OTP
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {!countdown.isExpired && (
                <p className="text-center text-sm text-muted-foreground">
                  Expires in {countdown.formatTime(countdown.seconds)}
                </p>
              )}
              {countdown.isExpired && (
                <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  OTP expired.{' '}
                  <button
                    className="underline"
                    onClick={() => {
                      setOtpStep('email');
                      setOtpCode('');
                    }}
                  >
                    Request new OTP
                  </button>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOtpStep('email'); setOtpCode(''); }}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleVerifyOTP} disabled={verifyOTP.isPending || otpCode.length !== 6}>
                  {verifyOTP.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
