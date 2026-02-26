import Map "mo:core/Map";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Migration "migration";

import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
  // --- Components ---
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  let approvalState = UserApproval.initState(accessControlState);

  // --- Type Definitions ---
  public type LeadStatus = {
    #new_;
    #contacted;
    #qualified;
    #lost;
    #converted;
  };

  public type DealStage = {
    #new_;
    #inProgress;
    #won;
    #lost;
  };

  public type ProjectStatus = {
    #pending;
    #inProgress;
    #completed;
    #onHold;
  };

  public type Lead = {
    id : Nat;
    name : Text;
    contact : Text;
    status : LeadStatus;
    notes : Text;
    reminderIds : [Nat];
  };

  public type Deal = {
    id : Nat;
    title : Text;
    value : Float;
    customerId : Nat;
    stage : DealStage;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    address : Text;
    latitude : Float;
    longitude : Float;
    reminderIds : [Nat];
  };

  public type Reminder = {
    id : Nat;
    dueDate : Time.Time;
    note : Text;
    isOverdue : Bool;
  };

  public type SiteSurvey = {
    notes : Text;
    date : Time.Time;
    surveyorName : Text;
  };

  public type SolarProject = {
    id : Nat;
    customerId : Nat;
    siteSurvey : SiteSurvey;
    systemSizeKW : Float;
    installationStatus : ProjectStatus;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
    profileComplete : Bool;
  };

  public type SuperAdmin = {
    email : Text;
    principal : ?Principal;
  };

  public type CreateUserStatus = {
    #created;
    #alreadyExists;
    #createdFirstAdmin;
  };

  public type OTPEntry = {
    code : Text;
    expiry : Time.Time;
  };

  public type OTPVerificationResult = {
    #success : CreateUserStatus;
    #invalid;
    #expired;
  };

  // VCRM sample data types
  public type VcrmLead = {
    id : Nat;
    name : Text;
    phoneNumber : Text;
    email : Text;
    campaign : Text;
    createdDate : Time.Time;
    updatedDate : Time.Time;
    leadStage : Text;
    tag : Text;
  };

  public type FollowupEntry = {
    id : Nat;
    status : Text;
    followupDateTime : Time.Time;
    assignedTo : Text;
    remarks : Text;
  };

  public type PipelineStats = {
    callOverview : [CallOverviewEntry];
    agentActivity : [AgentActivityEntry];
    leadsByStage : [LeadsByStageEntry];
  };

  public type CallOverviewEntry = {
    total : Nat;
    statusType : Text;
  };

  public type AgentActivityEntry = {
    name : Text;
    totalCalls : Nat;
    totalConverted : Nat;
    avgCallTime : Float;
    totalFollowups : Nat;
    totalPending : Nat;
    totalCompleted : Nat;
    remark : Nat;
  };

  public type LeadsByStageEntry = {
    stageId : Int;
    stageName : Text;
    count : Nat;
  };

  // --- Actor State ---
  var superAdmin : SuperAdmin = {
    email = "vcrm.com@gmail.com";
    principal = null;
  };

  let otpState = Map.empty<Text, OTPEntry>();
  let emailPrincipalMap = Map.empty<Text, Principal>();
  let principalEmailMap = Map.empty<Principal, Text>();
  let otpSessions = Map.empty<Principal, Time.Time>();
  var adminInitialized = false;

  let leadMap = Map.empty<Nat, Lead>();
  var nextLeadId = 0;

  let customerMap = Map.empty<Nat, Customer>();
  var nextCustomerId = 0;

  let dealMap = Map.empty<Nat, Deal>();
  var nextDealId = 0;

  let reminderMap = Map.empty<Nat, Reminder>();
  var nextReminderId = 0;

  let solarProjectMap = Map.empty<Nat, SolarProject>();
  var nextProjectId = 0;

  let userProfiles = Map.empty<Principal, UserProfile>();

  // --- Authentication & User Management ---
  public shared ({ caller }) func generateOTP(email : Text) : async Text {
    let otp = generateOTPCode();
    let expiry = Time.now() + 10 * 60 * 1_000_000_000;
    otpState.add(email, { code = otp; expiry });
    otp;
  };

  public shared ({ caller }) func verifyOTP(email : Text, otp : Text) : async OTPVerificationResult {
    if (email == "vcrm.com@gmail.com") {
      superAdmin := { email = "vcrm.com@gmail.com"; principal = ?caller };
    };
    let storedOTP = switch (otpState.get(email)) {
      case (?entry) { entry };
      case (null) { return #invalid };
    };

    if (Time.now() > storedOTP.expiry) {
      otpState.remove(email);
      return #expired;
    };

    if (storedOTP.code != otp) {
      return #invalid;
    };

    otpState.remove(email);
    otpSessions.add(caller, Time.now());

    switch (emailPrincipalMap.get(email)) {
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          emailPrincipalMap.add(email, caller);
          principalEmailMap.remove(existingPrincipal);
          principalEmailMap.add(caller, email);
        };
        #success(#alreadyExists);
      };
      case (null) {
        emailPrincipalMap.add(email, caller);
        principalEmailMap.add(caller, email);

        if (not adminInitialized) {
          adminInitialized := true;
          AccessControl.initialize(accessControlState, caller, "admin", "admin");
          #success(#createdFirstAdmin);
        } else {
          #success(#created);
        };
      };
    };
  };

  // --- User Approval ---
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // --- Authorization ---
  func isSuperAdmin(caller : Principal) : Bool {
    switch (superAdmin.principal) {
      case (null) { false };
      case (?adminPrincipal) { caller == adminPrincipal };
    };
  };

  func assertCallerApproved(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot perform this action");
    };
    if (not (isSuperAdmin(caller) or AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller))) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
  };

  // --- User Profile ---
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.hasPermission(accessControlState, caller, #admin) or isSuperAdmin(caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(name : Text, email : Text, phone : Text) : async { #ok } {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };

    let profile : UserProfile = {
      name;
      email;
      phone;
      profileComplete = true;
    };

    userProfiles.add(caller, profile);
    if (emailPrincipalMap.get(email) == null) {
      emailPrincipalMap.add(email, caller);
      principalEmailMap.add(caller, email);
    };
    #ok;
  };

  // --- Leads/Contacts ---
  public shared ({ caller }) func addLead(name : Text, contact : Text, status : LeadStatus, notes : Text) : async Lead {
    assertCallerApproved(caller);
    let lead : Lead = {
      id = nextLeadId;
      name;
      contact;
      status;
      notes;
      reminderIds = [];
    };
    leadMap.add(nextLeadId, lead);
    nextLeadId += 1;
    lead;
  };

  public shared ({ caller }) func updateLead(id : Nat, name : Text, contact : Text, status : LeadStatus, notes : Text) : async Lead {
    assertCallerApproved(caller);
    let existing = switch (leadMap.get(id)) {
      case (?l) { l };
      case (null) { Runtime.trap("Error: Lead not found") };
    };
    let updated : Lead = { existing with name; contact; status; notes };
    leadMap.add(id, updated);
    updated;
  };

  public shared ({ caller }) func deleteLead(id : Nat) : async () {
    assertCallerApproved(caller);
    switch (leadMap.get(id)) {
      case (?_) { leadMap.remove(id) };
      case (null) { Runtime.trap("Error: Lead not found") };
    };
  };

  public query ({ caller }) func getLead(id : Nat) : async ?Lead {
    assertCallerApproved(caller);
    leadMap.get(id);
  };

  public query ({ caller }) func getAllLeads() : async [Lead] {
    assertCallerApproved(caller);
    leadMap.values().toArray();
  };

  // --- Deals ---
  public shared ({ caller }) func addDeal(title : Text, value : Float, customerId : Nat, stage : DealStage) : async Deal {
    assertCallerApproved(caller);
    switch (customerMap.get(customerId)) {
      case (?_) {};
      case (null) { Runtime.trap("Error: Customer not found") };
    };
    let deal : Deal = {
      id = nextDealId;
      title;
      value;
      customerId;
      stage;
    };
    dealMap.add(nextDealId, deal);
    nextDealId += 1;
    deal;
  };

  public shared ({ caller }) func updateDeal(id : Nat, title : Text, value : Float, customerId : Nat, stage : DealStage) : async Deal {
    assertCallerApproved(caller);
    let existing = switch (dealMap.get(id)) {
      case (?d) { d };
      case (null) { Runtime.trap("Error: Deal not found") };
    };
    switch (customerMap.get(customerId)) {
      case (?_) {};
      case (null) { Runtime.trap("Error: Customer not found") };
    };
    let updated : Deal = { existing with title; value; customerId; stage };
    dealMap.add(id, updated);
    updated;
  };

  public shared ({ caller }) func moveDealStage(id : Nat, stage : DealStage) : async Deal {
    assertCallerApproved(caller);
    let existing = switch (dealMap.get(id)) {
      case (?d) { d };
      case (null) { Runtime.trap("Error: Deal not found") };
    };
    let updated : Deal = { existing with stage };
    dealMap.add(id, updated);
    updated;
  };

  public shared ({ caller }) func deleteDeal(id : Nat) : async () {
    assertCallerApproved(caller);
    switch (dealMap.get(id)) {
      case (?_) { dealMap.remove(id) };
      case (null) { Runtime.trap("Error: Deal not found") };
    };
  };

  public query ({ caller }) func getDeal(id : Nat) : async ?Deal {
    assertCallerApproved(caller);
    dealMap.get(id);
  };

  public query ({ caller }) func getAllDeals() : async [Deal] {
    assertCallerApproved(caller);
    dealMap.values().toArray();
  };

  public query ({ caller }) func getDealsByStage(stage : DealStage) : async [Deal] {
    assertCallerApproved(caller);
    dealMap.values().toArray().filter(func(d : Deal) : Bool { d.stage == stage });
  };

  // --- Helper Functions ---
  func generateOTPCode() : Text {
    let t = Time.now();
    let code = (t % 900_000) + 100_000;
    let n = if (code < 0) { ((-code) % 900_000) + 100_000 } else { code };
    n.toText();
  };
};
