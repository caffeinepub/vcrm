import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const saveProfile = useSaveCallerUserProfile();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  // Track how long we've been waiting for the actor
  const [actorWaitSeconds, setActorWaitSeconds] = useState(0);

  const actorNotReady = !actor || actorFetching;

  useEffect(() => {
    if (actorNotReady) {
      const interval = setInterval(() => {
        setActorWaitSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setActorWaitSeconds(0);
    }
  }, [actorNotReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Reset any previous error state
    saveProfile.reset();

    try {
      await saveProfile.mutateAsync({ name: name.trim(), email: email.trim() });
      toast.success('Profile saved! Welcome to VCRM.');
    } catch {
      // Error is displayed inline via saveProfile.error — no toast needed here
    }
  };

  const handleRetry = () => {
    saveProfile.reset();
    // Invalidate actor to force re-initialization
    queryClient.invalidateQueries({ queryKey: ['actor'] });
    setActorWaitSeconds(0);
  };

  // Determine the user-facing error message — never reference auth/session expiry
  const errorMessage = saveProfile.error
    ? (() => {
        const err = saveProfile.error as Error & { type?: string };
        const type = err.type ?? '';
        const msg = err.message ?? String(saveProfile.error);

        if (type === 'actor_not_ready' || msg.includes('still initializing') || msg.includes('connection not ready')) {
          return {
            type: 'retry' as const,
            text: 'Backend connection not ready. Please wait a moment and try again.',
          };
        }

        // All other errors — show a generic message, never mention auth/session
        return {
          type: 'retry' as const,
          text: 'Unable to save profile. Please try again.',
        };
      })()
    : null;

  const actorTimedOut = actorNotReady && actorWaitSeconds >= 12;

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

        {/* Actor still loading indicator — only show after a brief delay */}
        {actorNotReady && !actorTimedOut && actorWaitSeconds >= 2 && (
          <div className="flex items-center gap-2 rounded-md bg-muted/60 border border-border px-3 py-2.5 text-sm text-muted-foreground">
            <Loader2 size={15} className="animate-spin shrink-0" />
            <span>Connecting to backend… please wait.</span>
          </div>
        )}

        {/* Actor timed out */}
        {actorTimedOut && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p>Unable to connect to backend. Please try refreshing.</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-1 flex items-center gap-1 text-xs underline underline-offset-2 hover:no-underline"
              >
                <RefreshCw size={11} /> Retry connection
              </button>
            </div>
          </div>
        )}

        {/* Mutation error banner — generic message only, no auth/session references */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <span>{errorMessage.text}</span>
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
              disabled={saveProfile.isPending}
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
              disabled={saveProfile.isPending}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending || !name.trim() || actorNotReady}
          >
            {saveProfile.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Saving…
              </span>
            ) : actorNotReady ? (
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
