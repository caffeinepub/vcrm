import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { LeadStatus, DealStage, ApprovalStatus, UserRole } from '../backend';
import type { Lead, Deal, UserProfile, UserApprovalInfo } from '../backend';
import type { Principal } from '@dfinity/principal';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(user: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email, phone }: { name: string; email: string; phone: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(name, email, phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Alias for backward compatibility
export const useUpdateCallerUserProfile = useSaveCallerUserProfile;

// ─── OTP / Auth ───────────────────────────────────────────────────────────────

export function useGenerateOTP() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateOTP(email);
    },
  });
}

export function useVerifyOTP() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyOTP(email, otp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
  });
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export function useGetAllLeads() {
  const { actor, isFetching } = useActor();

  return useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLeads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLead(id: bigint | undefined | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Lead | null>({
    queryKey: ['lead', id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined || id === null) return null;
      return actor.getLead(id);
    },
    enabled: !!actor && !isFetching && id !== undefined && id !== null,
  });
}

export function useAddLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      contact,
      status,
      notes,
    }: {
      name: string;
      contact: string;
      status: LeadStatus;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLead(name, contact, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      contact,
      status,
      notes,
    }: {
      id: bigint;
      name: string;
      contact: string;
      status: LeadStatus;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLead(id, name, contact, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteLead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export function useGetAllDeals() {
  const { actor, isFetching } = useActor();

  return useQuery<Deal[]>({
    queryKey: ['deals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDeals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDeal(id: bigint | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Deal | null>({
    queryKey: ['deal', id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getDeal(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useAddDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      value,
      customerId,
      stage,
    }: {
      title: string;
      value: number;
      customerId: bigint;
      stage: DealStage;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addDeal(title, value, customerId, stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      value,
      customerId,
      stage,
    }: {
      id: bigint;
      title: string;
      value: number;
      customerId: bigint;
      stage: DealStage;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDeal(id, title, value, customerId, stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useDeleteDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteDeal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useMoveDealStage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: bigint; stage: DealStage }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moveDealStage(id, stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

// ─── Admin / Approvals ────────────────────────────────────────────────────────

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useGetCallerRole = useGetCallerUserRole;

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
    },
  });
}

// Alias
export const useRequestRoleAssignment = useAssignCallerUserRole;

// ─── Stub hooks for removed features (kept for backward compat) ───────────────

// These features were removed from the backend but pages still import them.
// Return empty data so pages compile and render gracefully.

export function useGetAllCustomers() {
  return useQuery<[]>({
    queryKey: ['customers-stub'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetCustomer(id: bigint | undefined | null) {
  return useGetLead(id ?? undefined);
}

export function useAddCustomer() {
  return useMutation({
    mutationFn: async (_args: unknown) => {
      throw new Error('Customer management not available in this version');
    },
  });
}

export function useUpdateCustomer() {
  return useMutation({
    mutationFn: async (_args: unknown) => {
      throw new Error('Customer management not available in this version');
    },
  });
}

export function useDeleteCustomer() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error('Customer management not available in this version');
    },
  });
}

export function useGetAllReminders() {
  return useQuery<[]>({
    queryKey: ['reminders-stub'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetOverdueReminders() {
  return useQuery<[]>({
    queryKey: ['overdueReminders-stub'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useAddReminder() {
  return useMutation({
    mutationFn: async (_args: unknown) => {
      throw new Error('Reminders not available in this version');
    },
  });
}

export function useUpdateReminder() {
  return useMutation({
    mutationFn: async (_args: unknown) => {
      throw new Error('Reminders not available in this version');
    },
  });
}

export function useDeleteReminder() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error('Reminders not available in this version');
    },
  });
}

export function useMarkReminderOverdue() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error('Reminders not available in this version');
    },
  });
}

export function useGetAllSolarProjects() {
  return useQuery<[]>({
    queryKey: ['solarProjects-stub'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetSolarProject(_id: bigint) {
  return useQuery<null>({
    queryKey: ['solarProject-stub', _id.toString()],
    queryFn: async () => null,
    enabled: false,
  });
}

export function useGetCustomerProjects(_customerId: bigint) {
  return useQuery<[]>({
    queryKey: ['customerProjects-stub', _customerId.toString()],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useAddSolarProject() {
  return useMutation({
    mutationFn: async (_args: unknown) => {
      throw new Error('Solar projects not available in this version');
    },
  });
}

export function useUpdateSolarProject() {
  return useMutation({
    mutationFn: async (_args: unknown) => {
      throw new Error('Solar projects not available in this version');
    },
  });
}

export function useDeleteSolarProject() {
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error('Solar projects not available in this version');
    },
  });
}

export function useGetSampleCampaigns() {
  return useQuery<string[]>({
    queryKey: ['sampleCampaigns'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetSamplePipelineStats() {
  return useQuery<null>({
    queryKey: ['samplePipelineStats'],
    queryFn: async () => null,
    enabled: false,
  });
}

export function useGetSampleLeads() {
  return useGetAllLeads();
}

export function useGetSampleFollowups() {
  return useQuery<[]>({
    queryKey: ['sampleFollowups'],
    queryFn: async () => [],
    enabled: false,
  });
}
