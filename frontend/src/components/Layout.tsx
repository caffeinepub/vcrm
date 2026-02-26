import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  Bell,
  Sun,
  User,
  LogOut,
  Shield,
  Clock,
} from 'lucide-react';
import { isOTPAuthenticated, clearOTPAuthenticated } from '../pages/LoginPage';
import { useGetCallerRole, useIsCallerApproved, useRequestApproval } from '../hooks/useQueries';
import { UserRole } from '../backend';
import ProfileSetupModal from './ProfileSetupModal';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SUPER_ADMIN_EMAIL = 'vcrm.com@gmail.com';

function getSuperAdminEmail(): string | null {
  return localStorage.getItem('vcrm_logged_in_email');
}

function isSuperAdminEmail(): boolean {
  const email = getSuperAdminEmail();
  return email === SUPER_ADMIN_EMAIL;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/customers', label: 'Customers', icon: UserCheck },
  { path: '/deals', label: 'Deals', icon: Briefcase },
  { path: '/reminders', label: 'Reminders', icon: Bell },
  { path: '/solar-projects', label: 'Solar Projects', icon: Sun },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requestedApproval, setRequestedApproval] = useState(false);

  const { data: callerRole, isLoading: roleLoading } = useGetCallerRole();
  const { data: isApproved, isLoading: approvalLoading } = useIsCallerApproved();
  const { mutate: requestApproval, isPending: requestingApproval } = useRequestApproval();

  const isSuperAdmin = isSuperAdminEmail();
  const isAdmin = isSuperAdmin || callerRole === UserRole.admin;
  const isCheckingAccess = roleLoading || approvalLoading;

  // Access is granted if: super admin email, or admin role, or approved
  const hasAccess = isSuperAdmin || callerRole === UserRole.admin || isApproved === true;
  const isAccessPending = !isCheckingAccess && !hasAccess;

  useEffect(() => {
    const authenticated = isOTPAuthenticated();
    if (!authenticated) {
      navigate({ to: '/login' });
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const handleSignOut = () => {
    clearOTPAuthenticated();
    localStorage.removeItem('vcrm_logged_in_email');
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const handleRequestApproval = () => {
    requestApproval(undefined, {
      onSuccess: () => {
        setRequestedApproval(true);
        toast.success('Approval request submitted successfully!');
      },
      onError: () => {
        toast.error('Failed to submit approval request. Please try again.');
      },
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <ProfileSetupModal />

      {/* Sidebar */}
      <aside className="w-[145px] bg-sidebar flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img src="/assets/generated/vcrm-logo.dim_512x512.png" alt="VCRM" className="w-8 h-8 rounded" />
            <div>
              <div className="text-sidebar-foreground font-bold text-sm">VCRM</div>
              <div className="text-sidebar-foreground/60 text-xs">Solar CRM</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => navigate({ to: item.path })}
                className={`w-full flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-center leading-tight">{item.label}</span>
              </button>
            );
          })}

          {/* Admin Panel link - only for admins */}
          {isAdmin && (
            <button
              onClick={() => navigate({ to: '/admin' })}
              className={`w-full flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-colors ${
                location.pathname === '/admin'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="text-center leading-tight">Admin</span>
            </button>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => navigate({ to: '/profile' })}
            className={`w-full flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-colors ${
              location.pathname === '/profile'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {navItems.find((n) => location.pathname.startsWith(n.path))?.label ||
              (location.pathname === '/admin' ? 'Admin Panel' : 'Profile')}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Badge variant="outline" className="text-xs border-primary text-primary">
                Admin
              </Badge>
            )}
            {!isCheckingAccess && !hasAccess && (
              <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
                Access Pending Approval
              </Badge>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {isCheckingAccess ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isAccessPending ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Access Pending</h2>
                <p className="text-muted-foreground max-w-md">
                  Your account is pending approval by an administrator.
                  You'll be notified once access is granted.
                </p>
              </div>
              {!requestedApproval ? (
                <Button
                  onClick={handleRequestApproval}
                  disabled={requestingApproval}
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  {requestingApproval ? 'Requesting...' : 'Request Approval'}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <UserCheck className="w-4 h-4" />
                  <span>Approval request submitted. Please wait for admin review.</span>
                </div>
              )}
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
