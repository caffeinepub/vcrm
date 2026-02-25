import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useUpdateCallerUserProfile, useGenerateOTP, useVerifyOTP, useIsCallerAdmin, useIsCallerApproved } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  User, Mail, Phone, Shield, CheckCircle2, Clock, Edit3, Save, X, ShieldCheck,
  Eye, EyeOff, RefreshCw, AlertCircle, Loader2, Calendar, Crown, UserCheck
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
    return () => { if (intervalId) clearInterval(intervalId); };
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
  const updateProfile = useUpdateCallerUserProfile();
  const generateOTP = useGenerateOTP();
  const verifyOTP = useVerifyOTP();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string }>({});

  // Re-verify OTP modal state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [showOTPCode, setShowOTPCode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { seconds, start: startCountdown, formatTime, isExpired } = useCountdown();

  // Redirect if not authenticated
  useEffect(() => {
    if (!identity) {
      navigate({ to: '/login' });
    }
  }, [identity, navigate]);

  // Populate edit form when profile loads
  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditEmail(userProfile.email);
      setEditPhone(userProfile.phone ?? '');
    }
  }, [userProfile]);

  const startEditing = () => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditEmail(userProfile.email);
      setEditPhone(userProfile.phone ?? '');
      setEditErrors({});
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditErrors({});
  };

  const validateEditForm = () => {
    const errors: { name?: string; email?: string } = {};
    if (!editName.trim()) errors.name = 'Name is required';
    if (!editEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) errors.email = 'Invalid email format';
    return errors;
  };

  const handleSaveProfile = async () => {
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim(),
      });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleOpenOTPModal = async () => {
    if (!userProfile?.email) return;
    setShowOTPModal(true);
    setOtpValue('');
    setOtpError('');
    setGeneratedOTP('');
    setOtpSent(false);
    setShowOTPCode(false);
    // Auto-send OTP
    try {
      const code = await generateOTP.mutateAsync(userProfile.email);
      setGeneratedOTP(code);
      setOtpSent(true);
      startCountdown(600);
    } catch {
      setOtpError('Failed to send OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (!userProfile?.email) return;
    setOtpValue('');
    setOtpError('');
    try {
      const code = await generateOTP.mutateAsync(userProfile.email);
      setGeneratedOTP(code);
      setOtpSent(true);
      startCountdown(600);
      toast.success('New OTP sent!');
    } catch {
      setOtpError('Failed to resend OTP.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!userProfile?.email || otpValue.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }
    try {
      const result = await verifyOTP.mutateAsync({ email: userProfile.email, otp: otpValue });
      if (result.__kind__ === 'success') {
        setShowOTPModal(false);
        toast.success('Identity verified successfully!');
      } else if (result.__kind__ === 'expired') {
        setOtpError('OTP has expired. Please request a new one.');
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    } catch {
      setOtpError('Verification failed. Please try again.');
    }
  };

  const getApprovalBadge = () => {
    if (isAdmin) return { label: 'Admin', variant: 'default' as const, icon: Crown, color: 'text-orange' };
    if (isApproved) return { label: 'Approved', variant: 'default' as const, icon: CheckCircle2, color: 'text-primary' };
    return { label: 'Pending Approval', variant: 'secondary' as const, icon: Clock, color: 'text-muted-foreground' };
  };

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Administrator', color: 'bg-orange/10 text-orange border-orange/30' };
    return { label: 'User', color: 'bg-primary/10 text-primary border-primary/30' };
  };

  const approvalInfo = getApprovalBadge();
  const roleInfo = getRoleBadge();
  const ApprovalIcon = approvalInfo.icon;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  const principalId = identity?.getPrincipal().toString() ?? '';
  const shortPrincipal = principalId ? `${principalId.slice(0, 8)}…${principalId.slice(-6)}` : '—';

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account information and security</p>
        </div>
        {!isEditing && (
          <Button onClick={startEditing} variant="outline" size="sm" className="gap-2">
            <Edit3 size={15} />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        {/* Header banner */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-xl bg-primary/10 flex items-center justify-center">
                <User size={32} className="text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          {/* Name & role row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {userProfile?.name || 'Unknown User'}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', roleInfo.color)}>
                  <Shield size={11} />
                  {roleInfo.label}
                </span>
                <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', approvalInfo.color,
                  isAdmin ? 'bg-orange/10 border border-orange/30' : isApproved ? 'bg-primary/10 border border-primary/30' : 'bg-muted border border-border'
                )}>
                  <ApprovalIcon size={11} />
                  {approvalInfo.label}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenOTPModal}
              className="gap-2 text-xs shrink-0"
              disabled={generateOTP.isPending}
            >
              <ShieldCheck size={14} />
              Re-verify via OTP
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Edit form or display */}
          {isEditing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium flex items-center gap-1.5">
                    <User size={13} className="text-muted-foreground" />
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); setEditErrors(p => ({ ...p, name: undefined })); }}
                    placeholder="Your full name"
                    className={cn(editErrors.name && 'border-destructive')}
                  />
                  {editErrors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle size={11} /> {editErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium flex items-center gap-1.5">
                    <Mail size={13} className="text-muted-foreground" />
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => { setEditEmail(e.target.value); setEditErrors(p => ({ ...p, email: undefined })); }}
                    placeholder="your@email.com"
                    className={cn(editErrors.email && 'border-destructive')}
                  />
                  {editErrors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle size={11} /> {editErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-phone" className="text-sm font-medium flex items-center gap-1.5">
                    <Phone size={13} className="text-muted-foreground" />
                    Phone Number <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                  className="gap-2"
                >
                  {updateProfile.isPending ? (
                    <><Loader2 size={15} className="animate-spin" /> Saving…</>
                  ) : (
                    <><Save size={15} /> Save Changes</>
                  )}
                </Button>
                <Button variant="outline" onClick={cancelEditing} disabled={updateProfile.isPending} className="gap-2">
                  <X size={15} /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ProfileField icon={User} label="Full Name" value={userProfile?.name} />
              <ProfileField icon={Mail} label="Email Address" value={userProfile?.email} />
              <ProfileField
                icon={Phone}
                label="Phone Number"
                value={userProfile?.phone || undefined}
                placeholder="Not provided"
              />
              <ProfileField
                icon={Calendar}
                label="Member Since"
                value="Active Member"
              />
            </div>
          )}
        </div>
      </div>

      {/* Security & Account Info card */}
      <div className="bg-card border border-border rounded-2xl shadow-card p-6 space-y-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Account & Security
        </h3>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
            <div className="flex items-center gap-2">
              {isAdmin ? <Crown size={15} className="text-orange" /> : <UserCheck size={15} className="text-primary" />}
              <span className="text-sm font-medium text-foreground">{isAdmin ? 'Administrator' : 'User'}</span>
              <span className="text-xs text-muted-foreground">(read-only)</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Status</p>
            <div className="flex items-center gap-2">
              <ApprovalIcon size={15} className={approvalInfo.color} />
              <span className="text-sm font-medium text-foreground">{approvalInfo.label}</span>
              <span className="text-xs text-muted-foreground">(read-only)</span>
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Principal ID</p>
            <p className="text-sm font-mono text-foreground/70 break-all">{shortPrincipal}</p>
          </div>
        </div>
      </div>

      {/* Re-verify OTP Modal */}
      <Dialog open={showOTPModal} onOpenChange={(open) => { if (!open) setShowOTPModal(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="font-display">Re-verify Identity</DialogTitle>
                <DialogDescription>
                  Verify your identity via OTP for {userProfile?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* OTP Banner */}
            {otpSent && generatedOTP && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={15} className="text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-primary mb-1">Your OTP (Simulated)</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold tracking-[0.3em] text-foreground">
                        {showOTPCode ? generatedOTP : '••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowOTPCode(!showOTPCode)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showOTPCode ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sending state */}
            {generateOTP.isPending && !otpSent && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={15} className="animate-spin" />
                Sending OTP to your email…
              </div>
            )}

            {/* Countdown */}
            {otpSent && (
              <div className={cn(
                'flex items-center gap-2 text-sm rounded-lg px-3 py-2',
                isExpired ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
              )}>
                <Clock size={13} />
                {isExpired
                  ? 'OTP expired — request a new one'
                  : <span>Expires in <span className="font-mono font-bold">{formatTime(seconds)}</span></span>
                }
              </div>
            )}

            {/* OTP Input */}
            {otpSent && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Enter 6-Digit OTP</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={(val) => { setOtpValue(val); if (otpError) setOtpError(''); }}
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
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendOTP}
              disabled={generateOTP.isPending}
              className="gap-2"
            >
              {generateOTP.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Resend OTP
            </Button>
            <Button
              onClick={handleVerifyOTP}
              disabled={verifyOTP.isPending || otpValue.length !== 6 || isExpired || !otpSent}
              className="gap-2"
            >
              {verifyOTP.isPending ? (
                <><Loader2 size={15} className="animate-spin" /> Verifying…</>
              ) : (
                <><ShieldCheck size={15} /> Verify</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  placeholder = '—',
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Icon size={11} />
        {label}
      </p>
      <p className={cn('text-sm font-medium', value ? 'text-foreground' : 'text-muted-foreground italic')}>
        {value || placeholder}
      </p>
    </div>
  );
}
