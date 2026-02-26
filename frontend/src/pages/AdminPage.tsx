import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Shield, Check, X, Users, Clock, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useListApprovals, useSetApproval, useGetCallerUserRole, useGetUserProfile } from '../hooks/useQueries';
import { ApprovalStatus, UserRole } from '../backend';
import { Principal } from '@dfinity/principal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const SUPER_ADMIN_EMAIL = 'vcrm.com@gmail.com';

function isSuperAdminEmail(): boolean {
  const email = localStorage.getItem('vcrm_logged_in_email');
  return email === SUPER_ADMIN_EMAIL;
}

interface UserRowProps {
  principal: Principal;
  status: ApprovalStatus;
  onApprove: (principal: Principal) => void;
  onReject: (principal: Principal) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function UserRow({ principal, status, onApprove, onReject, isApproving, isRejecting }: UserRowProps) {
  const { data: profile, isLoading: profileLoading } = useGetUserProfile(principal);
  const principalStr = principal.toString();
  const shortPrincipal = principalStr.length > 20 ? `${principalStr.slice(0, 10)}...${principalStr.slice(-6)}` : principalStr;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          {profileLoading ? (
            <Skeleton className="h-4 w-32 mb-1" />
          ) : (
            <div className="font-medium text-foreground truncate">{profile?.name || 'Unknown User'}</div>
          )}
          {profileLoading ? (
            <Skeleton className="h-3 w-48" />
          ) : (
            <div className="text-sm text-muted-foreground truncate">{profile?.email || shortPrincipal}</div>
          )}
          {profile?.phone && <div className="text-xs text-muted-foreground">{profile.phone}</div>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {status === ApprovalStatus.pending && (
          <>
            <Button size="sm" variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => onApprove(principal)} disabled={isApproving || isRejecting}>
              {isApproving ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
              Approve
            </Button>
            <Button size="sm" variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onReject(principal)} disabled={isApproving || isRejecting}>
              {isRejecting ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
              Reject
            </Button>
          </>
        )}
        {status === ApprovalStatus.approved && (
          <>
            <Badge variant="outline" className="border-green-500 text-green-600">
              <UserCheck className="w-3 h-3 mr-1" /> Approved
            </Badge>
            <Button size="sm" variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onReject(principal)} disabled={isRejecting}>
              {isRejecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            </Button>
          </>
        )}
        {status === ApprovalStatus.rejected && (
          <>
            <Badge variant="outline" className="border-red-500 text-red-600">
              <UserX className="w-3 h-3 mr-1" /> Rejected
            </Badge>
            <Button size="sm" variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => onApprove(principal)} disabled={isApproving}>
              {isApproving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { data: callerRole, isLoading: roleLoading } = useGetCallerUserRole();
  const { data: approvals, isLoading: approvalsLoading, refetch } = useListApprovals();
  const { mutate: setApproval } = useSetApproval();
  const [pendingActions, setPendingActions] = useState<Record<string, 'approving' | 'rejecting'>>({});

  const isSuperAdmin = isSuperAdminEmail();
  const isAdmin = isSuperAdmin || callerRole === UserRole.admin;

  if (!roleLoading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <Shield className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-center">You don't have permission to access the Admin Panel.</p>
        <Button onClick={() => navigate({ to: '/dashboard' })}>Go to Dashboard</Button>
      </div>
    );
  }

  const pendingUsers = approvals?.filter((a) => a.status === ApprovalStatus.pending) ?? [];
  const approvedUsers = approvals?.filter((a) => a.status === ApprovalStatus.approved) ?? [];
  const rejectedUsers = approvals?.filter((a) => a.status === ApprovalStatus.rejected) ?? [];

  const handleApprove = (principal: Principal) => {
    const key = principal.toString();
    setPendingActions((prev) => ({ ...prev, [key]: 'approving' }));
    setApproval({ user: principal, status: ApprovalStatus.approved }, {
      onSuccess: () => {
        toast.success('User approved successfully!');
        setPendingActions((prev) => { const next = { ...prev }; delete next[key]; return next; });
      },
      onError: (err) => {
        toast.error(`Failed to approve user: ${err.message}`);
        setPendingActions((prev) => { const next = { ...prev }; delete next[key]; return next; });
      },
    });
  };

  const handleReject = (principal: Principal) => {
    const key = principal.toString();
    setPendingActions((prev) => ({ ...prev, [key]: 'rejecting' }));
    setApproval({ user: principal, status: ApprovalStatus.rejected }, {
      onSuccess: () => {
        toast.success('User rejected.');
        setPendingActions((prev) => { const next = { ...prev }; delete next[key]; return next; });
      },
      onError: (err) => {
        toast.error(`Failed to reject user: ${err.message}`);
        setPendingActions((prev) => { const next = { ...prev }; delete next[key]; return next; });
      },
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage user access and approvals</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={approvalsLoading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${approvalsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{pendingUsers.length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{approvedUsers.length}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{rejectedUsers.length}</div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending
            {pendingUsers.length > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{pendingUsers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <UserCheck className="w-4 h-4" /> Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <UserX className="w-4 h-4" /> Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader><CardTitle className="text-base">Pending Approval Requests</CardTitle></CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No pending approval requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <UserRow key={user.principal.toString()} principal={user.principal} status={user.status}
                      onApprove={handleApprove} onReject={handleReject}
                      isApproving={pendingActions[user.principal.toString()] === 'approving'}
                      isRejecting={pendingActions[user.principal.toString()] === 'rejecting'} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader><CardTitle className="text-base">Approved Users</CardTitle></CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : approvedUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No approved users yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedUsers.map((user) => (
                    <UserRow key={user.principal.toString()} principal={user.principal} status={user.status}
                      onApprove={handleApprove} onReject={handleReject}
                      isApproving={pendingActions[user.principal.toString()] === 'approving'}
                      isRejecting={pendingActions[user.principal.toString()] === 'rejecting'} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader><CardTitle className="text-base">Rejected Users</CardTitle></CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="space-y-3">{[1].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : rejectedUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <UserX className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No rejected users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectedUsers.map((user) => (
                    <UserRow key={user.principal.toString()} principal={user.principal} status={user.status}
                      onApprove={handleApprove} onReject={handleReject}
                      isApproving={pendingActions[user.principal.toString()] === 'approving'}
                      isRejecting={pendingActions[user.principal.toString()] === 'rejecting'} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
