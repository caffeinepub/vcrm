import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Customer {
    id: bigint;
    latitude: number;
    name: string;
    email: string;
    longitude: number;
    address: string;
    phone: string;
    reminderIds: Array<bigint>;
}
export interface Lead {
    id: bigint;
    status: LeadStatus;
    contact: string;
    name: string;
    notes: string;
    reminderIds: Array<bigint>;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Reminder {
    id: bigint;
    note: string;
    dueDate: Time;
    isOverdue: boolean;
}
export interface SolarProject {
    id: bigint;
    siteSurvey: SiteSurvey;
    installationStatus: ProjectStatus;
    systemSizeKW: number;
    customerId: bigint;
}
export interface Deal {
    id: bigint;
    title: string;
    value: number;
    stage: DealStage;
    customerId: bigint;
}
export type OTPVerificationResult = {
    __kind__: "expired";
    expired: null;
} | {
    __kind__: "invalid";
    invalid: null;
} | {
    __kind__: "success";
    success: CreateUserStatus;
};
export interface SiteSurvey {
    date: Time;
    notes: string;
    surveyorName: string;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum CreateUserStatus {
    created = "created",
    createdFirstAdmin = "createdFirstAdmin",
    alreadyExists = "alreadyExists"
}
export enum DealStage {
    new_ = "new",
    won = "won",
    lost = "lost",
    inProgress = "inProgress"
}
export enum LeadStatus {
    new_ = "new",
    lost = "lost",
    contacted = "contacted",
    converted = "converted",
    qualified = "qualified"
}
export enum ProjectStatus {
    pending = "pending",
    completed = "completed",
    inProgress = "inProgress",
    onHold = "onHold"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_ok {
    ok = "ok"
}
export interface backendInterface {
    addCustomer(name: string, email: string, phone: string, address: string, latitude: number, longitude: number): Promise<Customer>;
    addDeal(title: string, value: number, customerId: bigint, stage: DealStage): Promise<Deal>;
    addLead(name: string, contact: string, status: LeadStatus, notes: string): Promise<Lead>;
    addReminder(dueDate: Time, note: string): Promise<Reminder>;
    addSolarProject(customerId: bigint, systemSizeKW: number, installationStatus: ProjectStatus, notes: string, surveyorName: string, date: Time): Promise<SolarProject>;
    approveUser(user: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteDeal(id: bigint): Promise<void>;
    deleteLead(id: bigint): Promise<void>;
    deleteReminder(id: bigint): Promise<void>;
    deleteSolarProject(id: bigint): Promise<void>;
    generateOTP(email: string): Promise<string>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllDeals(): Promise<Array<Deal>>;
    getAllLeads(): Promise<Array<Lead>>;
    getAllReminders(): Promise<Array<Reminder>>;
    getAllSolarProjects(): Promise<Array<SolarProject>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getCustomerProjects(customerId: bigint): Promise<Array<SolarProject>>;
    getDashboardStats(): Promise<{
        totalLeads: bigint;
        totalRevenue: number;
        totalCustomers: bigint;
        totalDeals: bigint;
    }>;
    getDeal(id: bigint): Promise<Deal | null>;
    getDealsByStage(stage: DealStage): Promise<Array<Deal>>;
    getFilteredReminders(isOverdue: boolean): Promise<Array<Reminder>>;
    getLead(id: bigint): Promise<Lead | null>;
    getOverdueReminders(): Promise<Array<Reminder>>;
    getPendingApprovals(): Promise<Array<UserApprovalInfo>>;
    getProjectCountByStatus(): Promise<[bigint, bigint, bigint, bigint]>;
    getSolarProject(projectId: bigint): Promise<SolarProject | null>;
    getSuperAdminPrincipal(): Promise<Principal | null>;
    getUpcomingReminders(datetime: Time): Promise<Array<Reminder>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    markReminderOverdue(id: bigint): Promise<void>;
    moveDealStage(id: bigint, stage: DealStage): Promise<Deal>;
    rejectUser(user: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(name: string, email: string, phone: string): Promise<Variant_ok>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    updateCustomer(id: bigint, name: string, email: string, phone: string, address: string, latitude: number, longitude: number): Promise<Customer>;
    updateDeal(id: bigint, title: string, value: number, customerId: bigint, stage: DealStage): Promise<Deal>;
    updateLead(id: bigint, name: string, contact: string, status: LeadStatus, notes: string): Promise<Lead>;
    updateProjectStatus(projectId: bigint, newStatus: ProjectStatus): Promise<SolarProject>;
    updateReminder(id: bigint, dueDate: Time, note: string): Promise<Reminder>;
    updateSolarProject(id: bigint, systemSizeKW: number, installationStatus: ProjectStatus, notes: string, surveyorName: string, date: Time): Promise<SolarProject>;
    verifyOTP(email: string, otp: string): Promise<OTPVerificationResult>;
}
