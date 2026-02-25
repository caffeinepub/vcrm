import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, AlertCircle, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const saveProfile = useSaveCallerUserProfile();
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Actor is ready when it exists, is not fetching, and identity is authenticated (non-anonymous)
  const isActorReady =
    !!actor &&
    !actorFetching &&
    !!identity &&
    !identity.getPrincipal().isAnonymous();

  // Auto-submit ref: if user submitted before actor was ready, fire once it becomes ready
  const pendingSubmitRef = useRef<{ name: string; email: string; phone: string } | null>(null);

  useEffect(() => {
    if (isActorReady && pendingSubmitRef.current) {
      const pending = pendingSubmitRef.current;
      pendingSubmitRef.current = null;
      const t = setTimeout(() => {
        saveProfile.reset();
        saveProfile.mutateAsync({ name: pending.name, email: pending.email, phone: pending.phone })
          .then(() => {
            toast.success('Profile saved! Welcome to VCRM.');
          })
          .catch(() => {
            // Error displayed inline via saveProfile.error
          });
      }, 200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActorReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveProfile.reset();

    if (!isActorReady) {
      pendingSubmitRef.current = { name: name.trim(), email: email.trim(), phone: phone.trim() };
      try {
        await saveProfile.mutateAsync({ name: name.trim(), email: email.trim(), phone: phone.trim() });
        toast.success('Profile saved! Welcome to VCRM.');
      } catch {
        // Error displayed inline
      }
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      toast.success('Profile saved! Welcome to VCRM.');
    } catch {
      // Error displayed inline via saveProfile.error
    }
  };

  const handleRetry = () => {
    saveProfile.reset();
    pendingSubmitRef.current = null;
    queryClient.invalidateQueries({ queryKey: ['actor'] });
    queryClient.removeQueries({ queryKey: ['currentUserProfile'] });
  };

  const errorMessage = saveProfile.error
    ? (() => {
        if (!identity || identity.getPrincipal().isAnonymous()) {
          return 'Please log in to continue.';
        }
        return 'Unable to save profile. Please try again.';
      })()
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
        {!isActorReady && !saveProfile.error && !isSubmitting && (
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
        {errorMessage && !isSubmitting && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-1 flex items-center gap-1 text-xs underline underline-offset-2 hover:no-underline"
              >
                <RefreshCw size={11} /> Try again
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Saving…
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
