import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  Lead,
  LeadStatus,
  Customer,
  Deal,
  DealStage,
  Reminder,
  SolarProject,
  ProjectStatus,
  UserApprovalInfo,
  ApprovalStatus,
} from '../backend';
import { UserRole } from '../backend';
import type { Principal } from '@dfinity/principal';

// ─── User Profile ─────────────────────────────────────────────────────────────

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

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
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

export function useAddLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; contact: string; status: LeadStatus; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLead(params.name, params.contact, params.status, params.notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; name: string; contact: string; status: LeadStatus; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLead(params.id, params.name, params.contact, params.status, params.notes);
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
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

// ─── Customers ────────────────────────────────────────────────────────────────

export function useGetAllCustomers() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomer(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Customer | null>({
    queryKey: ['customer', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getCustomer(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string; email: string; phone: string; address: string; latitude: number; longitude: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCustomer(params.name, params.email, params.phone, params.address, params.latitude, params.longitude);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint; name: string; email: string; phone: string; address: string; latitude: number; longitude: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCustomer(params.id, params.name, params.email, params.phone, params.address, params.latitude, params.longitude);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useGetCustomerProjects(customerId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SolarProject[]>({
    queryKey: ['customerProjects', customerId?.toString()],
    queryFn: async () => {
      if (!actor || customerId === null) return [];
      return actor.getCustomerProjects(customerId);
    },
    enabled: !!actor && !isFetching && customerId !== null,
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

export function useAddDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { title: string; value: number; customerId: bigint; stage: DealStage }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addDeal(params.title, params.value, params.customerId, params.stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdateDeal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; title: string; value: number; customerId: bigint; stage: DealStage }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDeal(params.id, params.title, params.value, params.customerId, params.stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useMoveDealStage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; stage: DealStage }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moveDealStage(params.id, params.stage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export function useGetAllReminders() {
  const { actor, isFetching } = useActor();

  return useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOverdueReminders() {
  const { actor, isFetching } = useActor();

  return useQuery<Reminder[]>({
    queryKey: ['overdueReminders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOverdueReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddReminder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { dueDate: bigint; note: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReminder(params.dueDate, params.note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['overdueReminders'] });
    },
  });
}

export function useUpdateReminder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; dueDate: bigint; note: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateReminder(params.id, params.dueDate, params.note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['overdueReminders'] });
    },
  });
}

export function useDeleteReminder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteReminder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['overdueReminders'] });
    },
  });
}

export function useMarkReminderOverdue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markReminderOverdue(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['overdueReminders'] });
    },
  });
}

// ─── Solar Projects ───────────────────────────────────────────────────────────

export function useGetAllSolarProjects() {
  const { actor, isFetching } = useActor();

  return useQuery<SolarProject[]>({
    queryKey: ['solarProjects'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSolarProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSolarProject(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SolarProject | null>({
    queryKey: ['solarProject', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getSolarProject(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useAddSolarProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      customerId: bigint;
      systemSizeKW: number;
      installationStatus: ProjectStatus;
      notes: string;
      surveyorName: string;
      date: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSolarProject(
        params.customerId,
        params.systemSizeKW,
        params.installationStatus,
        params.notes,
        params.surveyorName,
        params.date
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solarProjects'] });
      queryClient.invalidateQueries({ queryKey: ['customerProjects'] });
    },
  });
}

export function useUpdateSolarProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      systemSizeKW: number;
      installationStatus: ProjectStatus;
      notes: string;
      surveyorName: string;
      date: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSolarProject(
        params.id,
        params.systemSizeKW,
        params.installationStatus,
        params.notes,
        params.surveyorName,
        params.date
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solarProjects'] });
      queryClient.invalidateQueries({ queryKey: ['solarProject'] });
      queryClient.invalidateQueries({ queryKey: ['customerProjects'] });
    },
  });
}

export function useDeleteSolarProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSolarProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solarProjects'] });
      queryClient.invalidateQueries({ queryKey: ['customerProjects'] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

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
    mutationFn: async (params: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(params.user, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminAssignRole(params.user, params.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useAdminGetSystemStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['adminSystemStats'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.adminGetSystemStats();
    },
    enabled: !!actor && !isFetching,
  });
}
