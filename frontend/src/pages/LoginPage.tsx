import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Sun, Zap } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate({ to: '/dashboard' });
    }
  }, [identity, navigate]);

  const isLoggingIn = loginStatus === 'logging-in';

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
          {/* VCRM Logo */}
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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="/assets/generated/vcrm-logo.dim_512x512.png"
              alt="VCRM Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to access your VCRM dashboard</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-card space-y-6">
            <div className="space-y-2 text-center">
              {/* Logo in login card */}
              <div className="flex justify-center mb-4">
                <img
                  src="/assets/generated/vcrm-logo.dim_512x512.png"
                  alt="VCRM Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <h3 className="font-display font-semibold text-foreground">Secure Login</h3>
              <p className="text-sm text-muted-foreground">
                Use Internet Identity for secure, passwordless authentication
              </p>
            </div>

            <Button
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                'Sign In with Internet Identity'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              New users will be prompted to set up their profile after signing in.
            </p>
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
