import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import DealsPage from './pages/DealsPage';
import RemindersPage from './pages/RemindersPage';
import SolarProjectsPage from './pages/SolarProjectsPage';
import SolarProjectDetailPage from './pages/SolarProjectDetailPage';
import AdminPage from './pages/AdminPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import ProfilePage from './pages/ProfilePage';

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Protected layout route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const leadsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/leads',
  component: LeadsPage,
});

const customersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/customers',
  component: CustomersPage,
});

const customerDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/customers/$id',
  component: CustomerDetailPage,
});

const dealsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/deals',
  component: DealsPage,
});

const remindersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/reminders',
  component: RemindersPage,
});

const solarProjectsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/solar-projects',
  component: SolarProjectsPage,
});

const solarProjectDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/solar-projects/$id',
  component: SolarProjectDetailPage,
});

const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/admin',
  component: AdminPage,
});

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const accessDeniedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access-denied',
  component: AccessDeniedPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  accessDeniedRoute,
  layoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    leadsRoute,
    customersRoute,
    customerDetailRoute,
    dealsRoute,
    remindersRoute,
    solarProjectsRoute,
    solarProjectDetailRoute,
    adminRoute,
    profileRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppInner() {
  const { isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading VCRM...</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppInner />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
