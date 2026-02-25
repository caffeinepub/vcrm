import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldOff size={32} className="text-destructive" />
      </div>
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        You don't have permission to access this page. Please contact your administrator.
      </p>
      <Button onClick={() => navigate({ to: '/dashboard' })}>
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Button>
    </div>
  );
}
