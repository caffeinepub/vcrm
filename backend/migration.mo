import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type LeadStatus = {
    #new_;
    #contacted;
    #qualified;
    #lost;
    #converted;
  };

  type DealStage = {
    #new_;
    #inProgress;
    #won;
    #lost;
  };

  type ProjectStatus = {
    #pending;
    #inProgress;
    #completed;
    #onHold;
  };

  type Lead = {
    id : Nat;
    name : Text;
    contact : Text;
    status : LeadStatus;
    notes : Text;
    reminderIds : [Nat];
  };

  type Deal = {
    id : Nat;
    title : Text;
    value : Float;
    customerId : Nat;
    stage : DealStage;
  };

  type Customer = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    address : Text;
    latitude : Float;
    longitude : Float;
    reminderIds : [Nat];
  };

  type Reminder = {
    id : Nat;
    dueDate : Time.Time;
    note : Text;
    isOverdue : Bool;
  };

  type SiteSurvey = {
    notes : Text;
    date : Time.Time;
    surveyorName : Text;
  };

  type SolarProject = {
    id : Nat;
    customerId : Nat;
    siteSurvey : SiteSurvey;
    systemSizeKW : Float;
    installationStatus : ProjectStatus;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
    profileComplete : Bool;
  };

  type SuperAdmin = {
    email : Text;
    principal : ?Principal;
  };

  public type State = {
    superAdmin : SuperAdmin;
    otpState : Map.Map<Text, { code : Text; expiry : Time.Time }>;
    emailPrincipalMap : Map.Map<Text, Principal>;
    principalEmailMap : Map.Map<Principal, Text>;
    otpSessions : Map.Map<Principal, Time.Time>;
    adminInitialized : Bool;
    leadMap : Map.Map<Nat, Lead>;
    nextLeadId : Nat;
    customerMap : Map.Map<Nat, Customer>;
    nextCustomerId : Nat;
    dealMap : Map.Map<Nat, Deal>;
    nextDealId : Nat;
    reminderMap : Map.Map<Nat, Reminder>;
    nextReminderId : Nat;
    solarProjectMap : Map.Map<Nat, SolarProject>;
    nextProjectId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : State) : State {
    old;
  };
};
