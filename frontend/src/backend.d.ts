import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
    profileComplete: boolean;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_ok {
    ok = "ok"
}
export interface backendInterface {
    addDeal(title: string, value: number, customerId: bigint, stage: DealStage): Promise<Deal>;
    addLead(name: string, contact: string, status: LeadStatus, notes: string): Promise<Lead>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteDeal(id: bigint): Promise<void>;
    deleteLead(id: bigint): Promise<void>;
    generateOTP(email: string): Promise<string>;
    getAllDeals(): Promise<Array<Deal>>;
    getAllLeads(): Promise<Array<Lead>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDeal(id: bigint): Promise<Deal | null>;
    getDealsByStage(stage: DealStage): Promise<Array<Deal>>;
    getLead(id: bigint): Promise<Lead | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    moveDealStage(id: bigint, stage: DealStage): Promise<Deal>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(name: string, email: string, phone: string): Promise<Variant_ok>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    updateDeal(id: bigint, title: string, value: number, customerId: bigint, stage: DealStage): Promise<Deal>;
    updateLead(id: bigint, name: string, contact: string, status: LeadStatus, notes: string): Promise<Lead>;
    verifyOTP(email: string, otp: string): Promise<OTPVerificationResult>;
}
