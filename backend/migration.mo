import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Principal "mo:core/Principal";

module {
  // Types for legacy actor state
  type LeadStatus = {
    #new_;
    #contacted;
    #qualified;
    #lost;
    #converted;
  };

  type Lead = {
    id : Nat;
    name : Text;
    contact : Text;
    status : LeadStatus;
    notes : Text;
    reminderIds : [Nat];
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

  type DealStage = {
    #new_;
    #inProgress;
    #won;
    #lost;
  };

  type Deal = {
    id : Nat;
    title : Text;
    value : Float;
    customerId : Nat;
    stage : DealStage;
  };

  type Reminder = {
    id : Nat;
    dueDate : Time.Time;
    note : Text;
    isOverdue : Bool;
  };

  type ProjectStatus = {
    #pending;
    #inProgress;
    #completed;
    #onHold;
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

  type LeadActor = {
    leadMap : Map.Map<Nat, Lead>;
    customerMap : Map.Map<Nat, Customer>;
    dealMap : Map.Map<Nat, Deal>;
    reminderMap : Map.Map<Nat, Reminder>;
    solarProjectMap : Map.Map<Nat, SolarProject>;
  };

  public func run(old : LeadActor) : { firstAdmin : ?Principal } {
    { old with firstAdmin = null };
  };
};
