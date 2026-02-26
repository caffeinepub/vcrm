import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
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
import ProfilePage from './pages/ProfilePage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient();

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});

// Protected layout route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: Layout,
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

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const accessDeniedRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/access-denied',
  component: AccessDeniedPage,
});

const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/admin',
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    leadsRoute,
    customersRoute,
    customerDetailRoute,
    dealsRoute,
    remindersRoute,
    solarProjectsRoute,
    solarProjectDetailRoute,
    profileRoute,
    accessDeniedRoute,
    adminRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
