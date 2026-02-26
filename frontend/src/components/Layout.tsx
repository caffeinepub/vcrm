import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  GitBranch,
  FileText,
  BarChart2,
  Settings2,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import ProfileSetupModal from './ProfileSetupModal';

const SUPER_ADMIN_EMAIL = 'vcrm.com@gmail.com';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/layout/dashboard' },
  { label: 'Contacts', icon: Users, path: '/layout/contacts' },
  { label: 'Pipeline', icon: GitBranch, path: '/layout/pipeline' },
  { label: 'Templates', icon: FileText, path: '/layout/templates' },
  { label: 'Reports', icon: BarChart2, path: '/layout/reports' },
  {
    label: 'Other Services',
    icon: Settings2,
    path: '/layout/other-services',
    children: [
      { label: 'Solar Projects', path: '/layout/solar-projects' },
      { label: 'Customers', path: '/layout/customers' },
    ],
  },
  { label: 'Admin', icon: Shield, path: '/layout/admin' },
];

const bottomNavItems = [
  { label: 'Settings', icon: Settings, path: '/layout/settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [otherServicesOpen, setOtherServicesOpen] = useState(false);

  const currentPath = routerState.location.pathname;

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const loggedInEmail = localStorage.getItem('vcrm_logged_in_email') || '';
  const isSuperAdminEmail = loggedInEmail === SUPER_ADMIN_EMAIL;
  const isAuthenticated = !!identity;

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    isFetched &&
    !isSuperAdminEmail &&
    (userProfile === null || (userProfile && !userProfile.name));

  const handleSignOut = async () => {
    await clear();
    queryClient.clear();
    localStorage.removeItem('vcrm_otp_authenticated');
    localStorage.removeItem('vcrm_logged_in_email');
    navigate({ to: '/login' });
  };

  const isActive = (path: string) => currentPath.startsWith(path);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
          <img src="/assets/generated/vcrm-logo.dim_512x512.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <span className="text-white font-bold text-sm tracking-wide truncate">NIRMALA SOL...</span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            const active = item.children.some(c => isActive(c.path)) || isActive(item.path);
            return (
              <div key={item.label}>
                <button
                  onClick={() => setOtherServicesOpen(!otherServicesOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 text-white" />
                  <span className="flex-1 text-left text-white">{item.label}</span>
                  {otherServicesOpen ? (
                    <ChevronDown className="w-4 h-4 text-white/70" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  )}
                </button>
                {otherServicesOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          isActive(child.path)
                            ? 'bg-white/20 text-white font-medium'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 text-white" />
              <span className="text-white">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        {bottomNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 text-white" />
              <span className="text-white">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-150"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-white" />
          <span className="text-white">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0" style={{ backgroundColor: '#4B0082' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 flex flex-col" style={{ backgroundColor: '#4B0082' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">NIRMALA SOL...</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Profile Setup Modal */}
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
