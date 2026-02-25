import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldUserProfile = {
    email : Text;
    name : Text;
  };
  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };
  type NewUserProfile = {
    email : Text;
    name : Text;
    phone : Text;
  };
  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_p, oldProfile) {
        { oldProfile with phone = "" };
      }
    );
    { userProfiles = newUserProfiles };
  };
};
