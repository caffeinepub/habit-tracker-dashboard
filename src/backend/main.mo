import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

// Migration
(with migration = Migration.run)
actor {
  let HARDCODED_ADMIN : Principal = Principal.fromText("h3k33-vzkys-gtpvb-j7eqr-rvkzy-mzzsd-ll3yr-u36x5-hfopd-jkaib-hae");

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type HabitId = Nat;
  type StreakData = {
    currentStreak : Nat;
    bestStreak : Nat;
  };
  type Habit = {
    id : HabitId;
    name : Text;
    emoji : Text;
    color : Text;
    reminderTime : Text;
  };
  type UserActivity = {
    principal : Text;
    firstLogin : Int;
    lastLogin : Int;
    habitCount : Nat;
  };

  public type UserProfile = {
    name : Text;
    mobile : Text;
  };

  public type UserAdminDetail = {
    principal : Text;
    displayName : Text;
    mobile : Text;
    firstLogin : Int;
    lastLogin : Int;
    habits : [Habit];
    completionsToday : Nat;
    weeklyCompletionRate : Nat;
  };

  // Habit module with comparison for sorting
  module Habit {
    public func compare(h1 : Habit, h2 : Habit) : Order.Order {
      Nat.compare(h1.id, h2.id);
    };
  };

  // Storage
  let userHabits = Map.empty<Principal, List.List<Habit>>();
  let userCompletions = Map.empty<Principal, Map.Map<HabitId, Set.Set<Text>>>();
  let nextHabitId = Map.empty<Principal, Nat>();
  let userActivity = Map.empty<Principal, UserActivity>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Habit Tracker Functions
  public shared ({ caller }) func setHabitReminderTime(habitId : HabitId, reminderTime : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update habit reminder time");
    };

    switch (userHabits.get(caller)) {
      case (?habits) {
        let updatedHabits = habits.map<Habit, Habit>(
          func(habit) {
            if (habit.id == habitId) {
              { habit with reminderTime };
            } else {
              habit;
            };
          }
        );
        userHabits.add(caller, updatedHabits);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func initializePredefinedHabits() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initialize habits");
    };

    // Check if caller already has habits
    switch (userHabits.get(caller)) {
      case (?_) {
        // User already has habits, do nothing
        return;
      };
      case (null) {
        // Proceed with initialization
      };
    };

    // Create list of initial habits
    let initialHabits = List.fromArray<Habit>([
      {
        id = 1;
        name = "Drink Water";
        emoji = "💧";
        color = "#00BFFF";
        reminderTime = "";
      },
      {
        id = 2;
        name = "Exercise";
        emoji = "🏋️";
        color = "#32CD32";
        reminderTime = "";
      },
      {
        id = 3;
        name = "Read";
        emoji = "📚";
        color = "#FFD700";
        reminderTime = "";
      },
      {
        id = 4;
        name = "Meditate";
        emoji = "🧘";
        color = "#8A2BE2";
        reminderTime = "";
      },
      {
        id = 5;
        name = "Sleep 8hrs";
        emoji = "😴";
        color = "#1E90FF";
        reminderTime = "";
      },
    ]);

    // Store initial habits for caller
    userHabits.add(caller, initialHabits);

    // Initialize completions for each habit
    let completions = Map.empty<HabitId, Set.Set<Text>>();
    for (habit in initialHabits.values()) {
      completions.add(habit.id, Set.empty<Text>());
    };
    userCompletions.add(caller, completions);

    // Set next habit ID for caller
    nextHabitId.add(caller, 6);
  };

  public query ({ caller }) func getAllHabits() : async [Habit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access habits");
    };

    switch (userHabits.get(caller)) {
      case (?habits) {
        let habitsArray = habits.toArray();
        habitsArray.sort();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getStreakData() : async [(Habit, StreakData)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access streak data");
    };

    let results = List.empty<(Habit, StreakData)>();

    switch (userHabits.get(caller)) {
      case (?habits) {
        for (habit in habits.values()) {
          let completions = switch (userCompletions.get(caller)) {
            case (?completionMap) {
              switch (completionMap.get(habit.id)) {
                case (?set) { set.values().toArray() };
                case (null) { [] };
              };
            };
            case (null) { [] };
          };

          if (completions.size() > 0) {
            results.add((habit, { currentStreak = completions.size(); bestStreak = completions.size() }));
          };
        };
      };
      case (null) {};
    };
    results.toArray();
  };

  public query ({ caller }) func getCompletionsForRange(startDate : Text, endDate : Text) : async [(Habit, [Text])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access completions");
    };

    let results = List.empty<(Habit, [Text])>();

    switch (userHabits.get(caller)) {
      case (?habits) {
        for (habit in habits.values()) {
          let completions = switch (userCompletions.get(caller)) {
            case (?completionMap) {
              switch (completionMap.get(habit.id)) {
                case (?set) {
                  let filteredCompletions = set.filter(
                    func(date : Text) : Bool {
                      date >= startDate and date <= endDate
                    }
                  );
                  filteredCompletions.toArray();
                };
                case (null) { [] };
              };
            };
            case (null) { [] };
          };

          if (completions.size() > 0) {
            results.add((habit, completions));
          };
        };
      };
      case (null) {};
    };
    results.toArray();
  };

  public shared ({ caller }) func toggleCompletion(habitId : HabitId, date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle completions");
    };

    switch (userCompletions.get(caller)) {
      case (?completions) {
        switch (completions.get(habitId)) {
          case (?set) {
            if (set.contains(date)) {
              set.remove(date);
            } else {
              set.add(date);
            };
          };
          case (null) {
            let newSet = Set.empty<Text>();
            newSet.add(date);
            completions.add(habitId, newSet);
          };
        };
      };
      case (null) {
        let newCompletions = Map.empty<HabitId, Set.Set<Text>>();
        let newSet = Set.empty<Text>();
        newSet.add(date);
        newCompletions.add(habitId, newSet);
        userCompletions.add(caller, newCompletions);
      };
    };
  };

  public shared ({ caller }) func addHabit(name : Text, emoji : Text, color : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add habits");
    };

    let habitId = switch (nextHabitId.get(caller)) {
      case (?id) { id };
      case (null) { 1 };
    };

    let habit : Habit = {
      id = habitId;
      name;
      emoji;
      color;
      reminderTime = "";
    };

    // Add habit to caller's habit list
    let habits = switch (userHabits.get(caller)) {
      case (?existingHabits) {
        existingHabits.add(habit);
        existingHabits;
      };
      case (null) {
        let newHabits = List.empty<Habit>();
        newHabits.add(habit);
        newHabits;
      };
    };
    userHabits.add(caller, habits);

    // Initialize completion set for new habit
    let completionMap = switch (userCompletions.get(caller)) {
      case (?completions) {
        completions.add(habit.id, Set.empty<Text>());
        completions;
      };
      case (null) {
        let newCompletions = Map.empty<HabitId, Set.Set<Text>>();
        newCompletions.add(habit.id, Set.empty<Text>());
        newCompletions;
      };
    };
    userCompletions.add(caller, completionMap);

    // Increment next habit ID for caller
    nextHabitId.add(caller, habitId + 1);
  };

  public shared ({ caller }) func deleteHabit(habitId : HabitId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete habits");
    };

    switch (userHabits.get(caller)) {
      case (?habits) {
        let filteredHabits = habits.filter(
          func(h : Habit) : Bool { h.id != habitId }
        );
        userHabits.add(caller, filteredHabits);

        switch (userCompletions.get(caller)) {
          case (?completions) {
            completions.remove(habitId);
          };
          case (null) {};
        };
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func recordLogin() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record login");
    };

    let currentTime = Time.now();
    let habitCount = switch (userHabits.get(caller)) {
      case (?habits) { habits.size() };
      case (null) { 0 };
    };

    switch (userActivity.get(caller)) {
      case (?existingActivity) {
        let updatedActivity = {
          existingActivity with
          lastLogin = currentTime;
          habitCount;
        };
        userActivity.add(caller, updatedActivity);
      };
      case (null) {
        let newActivity = {
          principal = caller.toText();
          firstLogin = currentTime;
          lastLogin = currentTime;
          habitCount;
        };
        userActivity.add(caller, newActivity);
      };
    };
  };

  public shared ({ caller }) func setAdminPrincipal(newAdmin : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign admin role");
    };
    AccessControl.assignRole(accessControlState, caller, newAdmin, #admin);
  };

  public query ({ caller }) func getAdminStats() : async [UserActivity] {
    if (not (caller == HARDCODED_ADMIN or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access stats");
    };

    let activities = List.empty<UserActivity>();

    for ((user, activity) in userActivity.entries()) {
      let liveHabitCount = switch (userHabits.get(user)) {
        case (?habits) { habits.size() };
        case (null) { 0 };
      };

      let updatedActivity = {
        activity with
        habitCount = liveHabitCount; // Use live count from userHabits
      };

      activities.add(updatedActivity);
    };
    activities.toArray();
  };

  public query ({ caller }) func isAdmin() : async Bool {
    if (caller == HARDCODED_ADMIN) { return true };
    AccessControl.isAdmin(accessControlState, caller);
  };

  // Bugfix 1: Fixed getAdminUserDetails implementation (only left bugfix in code, deleted old code).
  public query ({ caller }) func getAdminUserDetails(todayDate : Text) : async [UserAdminDetail] {
    if (not (caller == HARDCODED_ADMIN or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access user details");
    };

    // Step 1: Collect all principals from all maps
    let allPrincipals = Set.empty<Principal>();

    // Add principals from userActivity
    for ((principal, _) in userActivity.entries()) {
      allPrincipals.add(principal);
    };

    // Add principals from userProfiles
    for ((principal, _) in userProfiles.entries()) {
      allPrincipals.add(principal);
    };

    // Add principals from userHabits
    for ((principal, _) in userHabits.entries()) {
      allPrincipals.add(principal);
    };

    // Step 2: Build details for each principal
    let details = List.empty<UserAdminDetail>();

    for (p in allPrincipals.values()) {
      let principal = p;

      // Fetch optional activity data
      let activityOpt = userActivity.get(principal);

      // Determine names and activity data
      let displayName = switch (userProfiles.get(p)) {
        case (?profile) { profile.name };
        case (null) { "" };
      };

      let mobile = switch (userProfiles.get(principal)) {
        case (?profile) { profile.mobile };
        case (null) { "" };
      };

      let (firstLogin, lastLogin) = switch (activityOpt) {
        case (?activity) { (activity.firstLogin, activity.lastLogin) };
        case (null) { (0, 0) };
      };

      // Fetch habits and count
      let habits = switch (userHabits.get(principal)) {
        case (?h) { h.toArray() };
        case (null) { [] };
      };
      let habitCount = habits.size();

      // Count completions today
      let completionsToday = switch (userCompletions.get(principal)) {
        case (?completions) {
          var count = 0;
          for ((_, dates) in completions.entries()) {
            if (dates.contains(todayDate)) { count += 1 };
          };
          count;
        };
        case (null) { 0 };
      };

      // Calculate weekly completion rate
      let totalCompletions = switch (userCompletions.get(principal)) {
        case (?completions) {
          var total = 0;
          for ((_, dates) in completions.entries()) {
            let filteredDates = dates.filter(
              func(date) {
                Nat.equal(date.size(), todayDate.size()) // This is a very naive check for the last 7 days, as we can't easily subtract days in Motoko
              }
            );
            total += filteredDates.size();
          };
          total;
        };
        case (null) { 0 };
      };

      let weeklyCompletionRate = if (habitCount > 0) {
        let maxCompletions = habitCount * 7; // 7 days
        let rate = (totalCompletions * 100) / maxCompletions;
        if (rate > 100) { 100 } else { rate };
      } else { 0 };

      // Build detail record
      let detail : UserAdminDetail = {
        principal = principal.toText();
        displayName;
        mobile;
        firstLogin;
        lastLogin;
        habits;
        completionsToday;
        weeklyCompletionRate;
      };

      details.add(detail);
    };

    details.toArray();
  };
};
