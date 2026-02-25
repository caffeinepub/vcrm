import { useIsCallerAdmin, useListApprovals, useAdminGetAllUsers, useAdminAssignRole, useSetApproval, useAdminGetSystemStats } from '../hooks/useQueries';
import { ApprovalStatus, UserRole } from '../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, BarChart3, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import type { Principal } from '@dfinity/principal';

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: approvals, isLoading: approvalsLoading } = useListApprovals();
  const { data: systemStats, isLoading: statsLoading } = useAdminGetSystemStats();
  const setApproval = useSetApproval();
  const adminAssignRole = useAdminAssignRole();

  const handleApproval = async (principal: Principal, status: ApprovalStatus) => {
    try {
      await setApproval.mutateAsync({ user: principal, status });
      toast.success(`User ${status === ApprovalStatus.approved ? 'approved' : 'rejected'}`);
    } catch {
      toast.error('Failed to update approval status');
    }
  };

  const handleRoleChange = async (principal: Principal, role: UserRole) => {
    try {
      await adminAssignRole.mutateAsync({ user: principal, role });
      toast.success('Role updated successfully');
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (adminLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Shield size={40} className="mb-3 opacity-30" />
        <p className="font-medium text-foreground">Access Denied</p>
        <p className="text-sm mt-1">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const approvalStatusBadge = (status: ApprovalStatus) => {
    if (status === ApprovalStatus.approved) return <Badge className="bg-green-100 text-green-700 border-0">Approved</Badge>;
    if (status === ApprovalStatus.rejected) return <Badge className="bg-red-100 text-red-700 border-0">Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-0">Pending</Badge>;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">System management and user control</p>
        </div>
      </div>

      {/* System Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : systemStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Users" value={Number(systemStats.totalUsers)} icon={Users} color="bg-blue-500" />
          <StatCard title="Total Leads" value={Number(systemStats.totalLeads)} icon={BarChart3} color="bg-indigo-500" />
          <StatCard title="Total Customers" value={Number(systemStats.totalCustomers)} icon={Users} color="bg-purple-500" />
          <StatCard title="Total Deals" value={Number(systemStats.totalDeals)} icon={BarChart3} color="bg-orange-500" />
          <StatCard title="Solar Projects" value={Number(systemStats.totalSolarProjects)} icon={BarChart3} color="bg-yellow-500" />
          <StatCard title="Reminders" value={Number(systemStats.totalReminders)} icon={Clock} color="bg-teal-500" />
        </div>
      ) : null}

      {/* User Approvals */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users size={16} className="text-primary" />
            User Management
            {approvals && (
              <Badge variant="secondary" className="ml-auto">
                {approvals.length} users
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvalsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !approvals || approvals.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No users registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => {
                const principalStr = approval.principal.toString();
                const shortPrincipal = `${principalStr.slice(0, 10)}...${principalStr.slice(-6)}`;
                return (
                  <div
                    key={principalStr}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 flex-wrap"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-foreground truncate">{shortPrincipal}</p>
                      <div className="mt-1">{approvalStatusBadge(approval.status)}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        onValueChange={(role) => handleRoleChange(approval.principal, role as UserRole)}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue placeholder="Set role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.admin}>Admin</SelectItem>
                          <SelectItem value={UserRole.user}>User</SelectItem>
                          <SelectItem value={UserRole.guest}>Guest</SelectItem>
                        </SelectContent>
                      </Select>
                      {approval.status !== ApprovalStatus.approved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleApproval(approval.principal, ApprovalStatus.approved)}
                          disabled={setApproval.isPending}
                        >
                          <CheckCircle size={12} className="mr-1" /> Approve
                        </Button>
                      )}
                      {approval.status !== ApprovalStatus.rejected && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleApproval(approval.principal, ApprovalStatus.rejected)}
                          disabled={setApproval.isPending}
                        >
                          <XCircle size={12} className="mr-1" /> Reject
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
