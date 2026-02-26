import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { toast } from 'sonner';
import { User, AlertCircle, Loader2, CheckCircle2, WifiOff, ShieldAlert, ServerCrash } from 'lucide-react';

// ─── Error Categorization ─────────────────────────────────────────────────────

type ErrorCategory = 'auth' | 'network' | 'validation' | 'server' | 'unknown';

interface CategorizedError {
  category: ErrorCategory;
  title: string;
  message: string;
}

function categorizeError(err: unknown): CategorizedError {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('connection') ||
    lower.includes('timeout') ||
    lower.includes('actor not available')
  ) {
    return {
      category: 'network',
      title: 'Connection error',
      message: 'Could not reach the server. Please check your internet connection and try again.',
    };
  }

  if (
    lower.includes('unauthorized') ||
    lower.includes('anonymous') ||
    lower.includes('only admins') ||
    lower.includes('assign user roles') ||
    lower.includes('not authenticated')
  ) {
    return {
      category: 'auth',
      title: 'Session error',
      message: 'Your session could not be verified. Please sign out and sign in again to continue.',
    };
  }

  if (
    lower.includes('invalid') ||
    lower.includes('required') ||
    lower.includes('too long') ||
    lower.includes('too short') ||
    lower.includes('format')
  ) {
    return {
      category: 'validation',
      title: 'Invalid data',
      message: raw,
    };
  }

  if (
    lower.includes('trap') ||
    lower.includes('canister') ||
    lower.includes('error:') ||
    lower.includes('rejected')
  ) {
    return {
      category: 'server',
      title: 'Server error',
      message: 'The server encountered an error while saving your profile. Please try again in a moment.',
    };
  }

  return {
    category: 'unknown',
    title: 'Unable to save profile',
    message: 'Something went wrong. Please try again or contact support if the issue persists.',
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
}

function validateFields(name: string, email: string, phone: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!name.trim()) {
    errors.name = 'Full name is required.';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.trim().length > 100) {
    errors.name = 'Name must be 100 characters or fewer.';
  }

  if (email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. you@example.com).';
    }
  }

  if (phone.trim()) {
    const phoneRegex = /^[+\d\s\-().]{7,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      errors.phone = 'Please enter a valid phone number.';
    }
  }

  return errors;
}

// ─── Error Icon ───────────────────────────────────────────────────────────────

function ErrorIcon({ category }: { category: ErrorCategory }) {
  switch (category) {
    case 'network':
      return <WifiOff size={16} className="mt-0.5 shrink-0" />;
    case 'auth':
      return <ShieldAlert size={16} className="mt-0.5 shrink-0" />;
    case 'server':
      return <ServerCrash size={16} className="mt-0.5 shrink-0" />;
    default:
      return <AlertCircle size={16} className="mt-0.5 shrink-0" />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSetupModal() {
  // Pre-fill email from localStorage (set during OTP login)
  const loggedInEmail = localStorage.getItem('vcrm_logged_in_email') ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(loggedInEmail);
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const saveProfile = useSaveCallerUserProfile();
  const { actor, isFetching: actorFetching } = useActor();

  // Actor is ready when it exists and is not currently fetching.
  const isActorReady = !!actor && !actorFetching;

  // Keep email in sync if localStorage changes (e.g. after login)
  useEffect(() => {
    if (loggedInEmail && !email) {
      setEmail(loggedInEmail);
    }
  }, [loggedInEmail]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateFields(name, email, phone);
    setFieldErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ name: true, email: true, phone: true });

    const errors = validateFields(name, email, phone);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;
    if (!isActorReady) return;

    saveProfile.reset();

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      toast.success('Profile saved! Welcome to VCRM.');
    } catch {
      // Error displayed inline via saveProfile.error
    }
  };

  const categorizedError = saveProfile.error
    ? categorizeError(saveProfile.error)
    : null;

  const isSubmitting = saveProfile.isPending;

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display">Welcome to VCRM!</DialogTitle>
              <DialogDescription>Set up your profile to get started.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Actor readiness indicator */}
        {!isActorReady && !isSubmitting && (
          <div className="flex items-center gap-2 rounded-md bg-muted/60 border border-border px-3 py-2 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin shrink-0" />
            <span>Connecting to backend…</span>
          </div>
        )}

        {isActorReady && !saveProfile.error && !isSubmitting && (
          <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary">
            <CheckCircle2 size={13} className="shrink-0" />
            <span>Connected — ready to save your profile.</span>
          </div>
        )}

        {/* Saving indicator */}
        {isSubmitting && (
          <div className="flex items-center gap-2 rounded-md bg-muted/60 border border-border px-3 py-2.5 text-sm text-muted-foreground">
            <Loader2 size={15} className="animate-spin shrink-0" />
            <span>Saving your profile…</span>
          </div>
        )}

        {/* Error banner */}
        {categorizedError && !isSubmitting && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
            <ErrorIcon category={categorizedError.category} />
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-snug">{categorizedError.title}</p>
              <p className="text-xs mt-0.5 text-destructive/80 leading-snug">{categorizedError.message}</p>
              <button
                type="button"
                onClick={() => saveProfile.reset()}
                className="mt-1.5 text-xs underline underline-offset-2 hover:no-underline opacity-80 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched.name) {
                  const errors = validateFields(e.target.value, email, phone);
                  setFieldErrors((prev) => ({ ...prev, name: errors.name }));
                }
              }}
              onBlur={() => handleBlur('name')}
              disabled={isSubmitting}
              aria-invalid={!!(touched.name && fieldErrors.name)}
              className={touched.name && fieldErrors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {touched.name && fieldErrors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle size={11} />
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) {
                  const errors = validateFields(name, e.target.value, phone);
                  setFieldErrors((prev) => ({ ...prev, email: errors.email }));
                }
              }}
              onBlur={() => handleBlur('email')}
              disabled={isSubmitting}
              aria-invalid={!!(touched.email && fieldErrors.email)}
              className={touched.email && fieldErrors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {touched.email && fieldErrors.email && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle size={11} />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone Number{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (touched.phone) {
                  const errors = validateFields(name, email, e.target.value);
                  setFieldErrors((prev) => ({ ...prev, phone: errors.phone }));
                }
              }}
              onBlur={() => handleBlur('phone')}
              disabled={isSubmitting}
              aria-invalid={!!(touched.phone && fieldErrors.phone)}
              className={touched.phone && fieldErrors.phone ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {touched.phone && fieldErrors.phone && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle size={11} />
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !isActorReady}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Saving…
              </span>
            ) : !isActorReady ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Connecting…
              </span>
            ) : (
              'Save Profile & Continue'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
