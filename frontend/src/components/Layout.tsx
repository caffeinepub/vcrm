import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import ProfileSetupModal from './ProfileSetupModal';
import {
  LayoutDashboard, Users, UserCheck, Briefcase, Bell, Sun, Shield, Menu, X, LogOut, Moon, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useGetOverdueReminders, useIsCallerAdmin, useIsCallerApproved, useRequestApproval } from '../hooks/useQueries';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: UserCheck },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/deals', label: 'Deals', icon: Briefcase },
  { path: '/solar-projects', label: 'Solar Projects', icon: Sun },
  { path: '/reminders', label: 'Reminders', icon: Bell },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, clear, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: overdueReminders } = useGetOverdueReminders();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: isApproved } = useIsCallerApproved();
  const requestApproval = useRequestApproval();

  const isAuthenticated = !!identity;

  // Redirect to login if not authenticated
  if (!isInitializing && !isAuthenticated) {
    navigate({ to: '/login' });
    return null;
  }

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const handleRequestApproval = async () => {
    try {
      await requestApproval.mutateAsync();
      toast.success('Approval request submitted successfully!');
    } catch {
      toast.error('Failed to submit approval request');
    }
  };

  const overdueCount = overdueReminders?.length ?? 0;

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    return (
      <button
        onClick={() => { navigate({ to: item.path }); setSidebarOpen(false); }}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        )}
      >
        <Icon size={18} className={isActive ? 'text-orange' : ''} />
        <span>{item.label}</span>
        {item.path === '/reminders' && overdueCount > 0 && (
          <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs px-1.5 py-0 h-5">
            {overdueCount}
          </Badge>
        )}
        {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          <img
            src="/assets/generated/vcrm-logo.dim_512x512.png"
            alt="VCRM Logo"
            className="h-14 w-auto object-contain"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => <NavLink key={item.path} item={item} />)}
        {isAdmin && (
          <NavLink item={{ path: '/admin', label: 'Admin Panel', icon: Shield }} />
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        {userProfile && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/30">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{userProfile.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{userProfile.email}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex-1 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            {theme === 'dark' ? <Moon size={15} className="mr-2" /> : <Moon size={15} className="mr-2" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut size={15} />
          </Button>
        </div>
      </div>
    </div>
  );

  // Not approved state
  if (isApproved === false && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center mb-2">
            <img
              src="/assets/generated/vcrm-logo.dim_512x512.png"
              alt="VCRM Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Shield size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Access Pending</h2>
            <p className="text-muted-foreground mt-2">
              Your account is awaiting admin approval. Please request access or contact your administrator.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRequestApproval}
              disabled={requestApproval.isPending}
              className="w-full"
            >
              {requestApproval.isPending ? 'Requesting...' : 'Request Approval'}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut size={15} className="mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
              <img
                src="/assets/generated/vcrm-logo.dim_512x512.png"
                alt="VCRM Logo"
                className="h-10 w-auto object-contain"
              />
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground">
                <X size={18} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <img
            src="/assets/generated/vcrm-logo.dim_512x512.png"
            alt="VCRM Logo"
            className="h-9 w-auto object-contain"
          />
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Moon size={18} />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>

      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
