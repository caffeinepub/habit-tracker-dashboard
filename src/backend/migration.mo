import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type Habit = {
    id : Nat;
    name : Text;
    emoji : Text;
    color : Text;
    reminderTime : Text;
  };

  type NewActor = {
    userHabits : Map.Map<Principal, List.List<Habit>>;
    userCompletions : Map.Map<Principal, Map.Map<Nat, Set.Set<Text>>>;
    nextHabitId : Map.Map<Principal, Nat>;
    userActivity : Map.Map<Principal, { principal : Text; firstLogin : Int; lastLogin : Int; habitCount : Nat }>;
    userProfiles : Map.Map<Principal, { name : Text; mobile : Text }>;
  };

  public func run(old : NewActor) : NewActor {
    old;
  };
};
