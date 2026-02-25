import Map "mo:core/Map";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Migration "migration";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import UserApproval "user-approval/approval";

// Use migration for data upgrade.
(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);
  var firstAdmin : ?Principal = null;

  let otpValidDuration : Int = 10 * 60 * 1_000_000_000; // 10 minutes in nanoseconds

  // ─── OTP Authentication ──────────────────────────────────────────────────────

  public type CreateUserStatus = {
    #created;
    #alreadyExists;
    #createdFirstAdmin;
  };

  public type OTPEntry = {
    code : Text;
    expiry : Time.Time;
  };

  let otpState = Map.empty<Text, OTPEntry>();
  // Maps email -> Principal (the caller principal that verified the OTP)
  let emailPrincipalMap = Map.empty<Text, Principal>();
  // Maps Principal -> email for reverse lookup
  let principalEmailMap = Map.empty<Principal, Text>();

  public type OTPVerificationResult = {
    #success : CreateUserStatus;
    #invalid;
    #expired;
  };

  // Generates a 6-digit numeric OTP, stores it with a 10-minute expiry, and
  // returns the OTP for frontend simulation. This would normally be delivered
  // via email in a real-world system.
  // No authentication required — this is the entry point for the auth flow.
  public shared ({ caller }) func generateOTP(email : Text) : async Text {
    let otp = generateOTPCode();
    let expiry = Time.now() + otpValidDuration;
    otpState.add(email, { code = otp; expiry });
    otp;
  };

  // Verifies the OTP for the given email. On success, associates the caller's
  // principal with the email and sets up their role. The caller principal
  // (from the IC identity) is used as the stable identity going forward.
  // No authentication required — this IS the authentication step.
  public shared ({ caller }) func verifyOTP(email : Text, otp : Text) : async OTPVerificationResult {
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

    // OTP is valid — remove it so it cannot be reused
    otpState.remove(email);

    // Check if this email already has an associated principal
    switch (emailPrincipalMap.get(email)) {
      case (?existingPrincipal) {
        // Email already registered; if the caller is different, update mapping
        // (e.g. user switched identity providers). We keep the existing role.
        if (existingPrincipal != caller) {
          emailPrincipalMap.add(email, caller);
          principalEmailMap.remove(existingPrincipal);
          principalEmailMap.add(caller, email);
        };
        #success(#alreadyExists);
      };
      case (null) {
        // New email — associate with caller principal
        emailPrincipalMap.add(email, caller);
        principalEmailMap.add(caller, email);

        // Determine if this should be the first admin
        switch (firstAdmin) {
          case (null) {
            firstAdmin := ?caller;
            AccessControl.assignRole(accessControlState, caller, caller, #admin);
            UserApproval.setApproval(approvalState, caller, #approved);
            #success(#createdFirstAdmin);
          };
          case (?_) {
            // Subsequent users get #user role; approval is pending by default
            AccessControl.assignRole(accessControlState, caller, caller, #user);
            #success(#created);
          };
        };
      };
    };
  };

  // ─── User Approval Functions ─────────────────────────────────────────────────

  public query ({ caller }) func isCallerApproved() : async Bool {
    if (?caller == firstAdmin) {
      true;
    } else {
      AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
    };
  };

  // Any authenticated (non-anonymous) user can request approval.
  public shared ({ caller }) func requestApproval() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot request approval");
    };
    if (?caller == firstAdmin) {
      Runtime.trap("Error: First admin does not need approval");
    };
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

  // ─── User Profile ────────────────────────────────────────────────────────────

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Any authenticated (non-anonymous) user can read their own profile.
  // New users may not yet have a role assigned when they first open the
  // profile setup modal, so we only require non-anonymous identity.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot get profiles");
    };
    userProfiles.get(caller);
  };

  // Admins can view any profile; users can only view their own.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Any authenticated (non-anonymous) user can save their own profile.
  // This is the onboarding/registration step — new users may not yet have a
  // role assigned, so we cannot gate this on #user role. After saving the
  // profile we auto-assign the #user role (unless the caller is already an
  // admin or is being bootstrapped as the first admin).
  public shared ({ caller }) func saveCallerUserProfile(name : Text, email : Text, phone : Text) : async { #ok; #error : Text } {
    if (caller.isAnonymous()) {
      return #error("Unauthorized: Anonymous users cannot save profiles");
    };

    let profile : UserProfile = {
      name;
      email;
      phone;
    };

    switch (firstAdmin) {
      case (null) {
        // Bootstrap: the very first caller becomes the first admin.
        firstAdmin := ?caller;
        AccessControl.assignRole(accessControlState, caller, caller, #admin);
        UserApproval.setApproval(approvalState, caller, #approved);
        userProfiles.add(caller, profile);
        // Also record the email mapping if not already set via OTP
        if (emailPrincipalMap.get(email) == null) {
          emailPrincipalMap.add(email, caller);
          principalEmailMap.add(caller, email);
        };
      };
      case (?_) {
        // For all subsequent callers: save the profile and ensure they have
        // at least the #user role so future authenticated calls succeed.
        userProfiles.add(caller, profile);
        // Only assign #user role if the caller does not already have a
        // higher role (admin). assignRole is safe to call multiple times.
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          AccessControl.assignRole(accessControlState, caller, caller, #user);
        };
        // Also record the email mapping if not already set via OTP
        if (emailPrincipalMap.get(email) == null) {
          emailPrincipalMap.add(email, caller);
          principalEmailMap.add(caller, email);
        };
      };
    };
    #ok;
  };

  // ─── Types ───────────────────────────────────────────────────────────────────

  public type LeadStatus = {
    #new_;
    #contacted;
    #qualified;
    #lost;
    #converted;
  };

  public type Lead = {
    id : Nat;
    name : Text;
    contact : Text;
    status : LeadStatus;
    notes : Text;
    reminderIds : [Nat];
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

  public type DealStage = {
    #new_;
    #inProgress;
    #won;
    #lost;
  };

  public type Deal = {
    id : Nat;
    title : Text;
    value : Float;
    customerId : Nat;
    stage : DealStage;
  };

  public type Reminder = {
    id : Nat;
    dueDate : Time.Time;
    note : Text;
    isOverdue : Bool;
  };

  public type ProjectStatus = {
    #pending;
    #inProgress;
    #completed;
    #onHold;
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

  // ─── State ───────────────────────────────────────────────────────────────────

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

  // ─── Leads ───────────────────────────────────────────────────────────────────

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

  // ─── Customers ───────────────────────────────────────────────────────────────

  public shared ({ caller }) func addCustomer(name : Text, email : Text, phone : Text, address : Text, latitude : Float, longitude : Float) : async Customer {
    assertCallerApproved(caller);
    let customer : Customer = {
      id = nextCustomerId;
      name;
      email;
      phone;
      address;
      latitude;
      longitude;
      reminderIds = [];
    };
    customerMap.add(nextCustomerId, customer);
    nextCustomerId += 1;
    customer;
  };

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, email : Text, phone : Text, address : Text, latitude : Float, longitude : Float) : async Customer {
    assertCallerApproved(caller);
    let existing = switch (customerMap.get(id)) {
      case (?c) { c };
      case (null) { Runtime.trap("Error: Customer not found") };
    };
    let updated : Customer = { existing with name; email; phone; address; latitude; longitude };
    customerMap.add(id, updated);
    updated;
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    assertCallerApproved(caller);
    switch (customerMap.get(id)) {
      case (?_) { customerMap.remove(id) };
      case (null) { Runtime.trap("Error: Customer not found") };
    };
  };

  public query ({ caller }) func getCustomer(id : Nat) : async ?Customer {
    assertCallerApproved(caller);
    customerMap.get(id);
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    assertCallerApproved(caller);
    customerMap.values().toArray();
  };

  // ─── Deals ───────────────────────────────────────────────────────────────────

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

  // ─── Reminders ───────────────────────────────────────────────────────────────

  public shared ({ caller }) func addReminder(dueDate : Time.Time, note : Text) : async Reminder {
    assertCallerApproved(caller);
    let reminder : Reminder = {
      id = nextReminderId;
      dueDate;
      note;
      isOverdue = false;
    };
    reminderMap.add(nextReminderId, reminder);
    nextReminderId += 1;
    reminder;
  };

  public shared ({ caller }) func updateReminder(id : Nat, dueDate : Time.Time, note : Text) : async Reminder {
    assertCallerApproved(caller);
    let existing = switch (reminderMap.get(id)) {
      case (?r) { r };
      case (null) { Runtime.trap("Error: Reminder not found") };
    };
    let updated : Reminder = { existing with dueDate; note };
    reminderMap.add(id, updated);
    updated;
  };

  public shared ({ caller }) func markReminderOverdue(id : Nat) : async () {
    assertCallerApproved(caller);
    let existing = switch (reminderMap.get(id)) {
      case (?r) { r };
      case (null) { Runtime.trap("Error: Reminder not found") };
    };
    reminderMap.add(id, { existing with isOverdue = true });
  };

  public shared ({ caller }) func deleteReminder(id : Nat) : async () {
    assertCallerApproved(caller);
    switch (reminderMap.get(id)) {
      case (?_) { reminderMap.remove(id) };
      case (null) { Runtime.trap("Error: Reminder not found") };
    };
  };

  public query ({ caller }) func getAllReminders() : async [Reminder] {
    assertCallerApproved(caller);
    reminderMap.values().toArray();
  };

  public query ({ caller }) func getFilteredReminders(isOverdue : Bool) : async [Reminder] {
    assertCallerApproved(caller);
    reminderMap.values().toArray().filter(func(r : Reminder) : Bool { r.isOverdue == isOverdue });
  };

  public query ({ caller }) func getOverdueReminders() : async [Reminder] {
    assertCallerApproved(caller);
    reminderMap.values().toArray().filter(func(r : Reminder) : Bool { r.isOverdue });
  };

  public query ({ caller }) func getUpcomingReminders(datetime : Time.Time) : async [Reminder] {
    assertCallerApproved(caller);
    reminderMap.values().toArray().filter(func(r : Reminder) : Bool { r.dueDate >= datetime });
  };

  // ─── Solar Projects ───────────────────────────────────────────────────────────

  public shared ({ caller }) func addSolarProject(customerId : Nat, systemSizeKW : Float, installationStatus : ProjectStatus, notes : Text, surveyorName : Text, date : Time.Time) : async SolarProject {
    assertCallerApproved(caller);
    switch (customerMap.get(customerId)) {
      case (?_) {};
      case (null) { Runtime.trap("Error: Customer not found") };
    };
    let siteSurvey : SiteSurvey = { notes; date; surveyorName };
    let project : SolarProject = {
      id = nextProjectId;
      customerId;
      siteSurvey;
      systemSizeKW;
      installationStatus;
    };
    solarProjectMap.add(nextProjectId, project);
    nextProjectId += 1;
    project;
  };

  public shared ({ caller }) func updateSolarProject(id : Nat, systemSizeKW : Float, installationStatus : ProjectStatus, notes : Text, surveyorName : Text, date : Time.Time) : async SolarProject {
    assertCallerApproved(caller);
    let existing = switch (solarProjectMap.get(id)) {
      case (?p) { p };
      case (null) { Runtime.trap("Error: Project not found") };
    };
    let siteSurvey : SiteSurvey = { notes; date; surveyorName };
    let updated : SolarProject = { existing with systemSizeKW; installationStatus; siteSurvey };
    solarProjectMap.add(id, updated);
    updated;
  };

  public shared ({ caller }) func updateProjectStatus(projectId : Nat, newStatus : ProjectStatus) : async SolarProject {
    assertCallerApproved(caller);
    let existing = switch (solarProjectMap.get(projectId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Error: Project not found") };
    };
    let updated : SolarProject = { existing with installationStatus = newStatus };
    solarProjectMap.add(projectId, updated);
    updated;
  };

  public shared ({ caller }) func deleteSolarProject(id : Nat) : async () {
    assertCallerApproved(caller);
    switch (solarProjectMap.get(id)) {
      case (?_) { solarProjectMap.remove(id) };
      case (null) { Runtime.trap("Error: Project not found") };
    };
  };

  public query ({ caller }) func getAllSolarProjects() : async [SolarProject] {
    assertCallerApproved(caller);
    solarProjectMap.values().toArray();
  };

  public query ({ caller }) func getCustomerProjects(customerId : Nat) : async [SolarProject] {
    assertCallerApproved(caller);
    switch (customerMap.get(customerId)) {
      case (?_) {};
      case (null) { Runtime.trap("Error: Customer not found") };
    };
    solarProjectMap.values().toArray().filter(func(p : SolarProject) : Bool { p.customerId == customerId });
  };

  public query ({ caller }) func getSolarProject(projectId : Nat) : async ?SolarProject {
    assertCallerApproved(caller);
    solarProjectMap.get(projectId);
  };

  public query ({ caller }) func getProjectCountByStatus() : async (Nat, Nat, Nat, Nat) {
    assertCallerApproved(caller);
    var pending = 0 : Nat;
    var inProgress = 0 : Nat;
    var completed = 0 : Nat;
    var onHold = 0 : Nat;
    for (project in solarProjectMap.values()) {
      switch (project.installationStatus) {
        case (#pending) { pending += 1 };
        case (#inProgress) { inProgress += 1 };
        case (#completed) { completed += 1 };
        case (#onHold) { onHold += 1 };
      };
    };
    (pending, inProgress, completed, onHold);
  };

  // ─── Dashboard Statistics ─────────────────────────────────────────────────────

  public query ({ caller }) func getDashboardStats() : async { totalLeads : Nat; totalDeals : Nat; totalRevenue : Float; totalCustomers : Nat } {
    assertCallerApproved(caller);
    var totalRevenue = 0.0 : Float;
    for (deal in dealMap.values()) {
      totalRevenue += deal.value;
    };
    {
      totalLeads = leadMap.size();
      totalDeals = dealMap.size();
      totalRevenue;
      totalCustomers = customerMap.size();
    };
  };

  // ─── Admin Panel ──────────────────────────────────────────────────────────────

  public query ({ caller }) func adminGetAllUsers() : async [Principal] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list users");
    };
    userProfiles.keys().toArray();
  };

  public shared ({ caller }) func adminAssignRole(user : Principal, role : AccessControl.UserRole) : async () {
    // AccessControl.assignRole includes its own admin-only guard
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func adminGetSystemStats() : async {
    totalLeads : Nat;
    totalCustomers : Nat;
    totalDeals : Nat;
    totalSolarProjects : Nat;
    totalReminders : Nat;
    totalUsers : Nat;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view system statistics");
    };
    {
      totalLeads = leadMap.size();
      totalCustomers = customerMap.size();
      totalDeals = dealMap.size();
      totalSolarProjects = solarProjectMap.size();
      totalReminders = reminderMap.size();
      totalUsers = userProfiles.size();
    };
  };

  // ─── Internal Helpers ────────────────────────────────────────────────────────

  func generateOTPCode() : Text {
    // Produces a deterministic 6-digit code based on current time.
    // In production this would use a secure random source.
    let t = Time.now();
    let code = (t % 900_000) + 100_000;
    // code is in range [100_000, 999_999]
    let n = if (code < 0) { ((-code) % 900_000) + 100_000 } else { code };
    Int.toText(n);
  };

  // A caller is considered approved if they are:
  //   1. The recorded first admin principal, OR
  //   2. Have the #admin role in the access control system, OR
  //   3. Have been explicitly approved in the user-approval system.
  func assertCallerApproved(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot perform this action");
    };
    if (?caller == firstAdmin) { return () };
    let isCallerAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);
    let isUserApproved = UserApproval.isApproved(approvalState, caller);
    if (not (isCallerAdmin or isUserApproved)) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
  };
};
