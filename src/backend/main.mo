import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


// Apply migration during upgrade using with syntax.

actor {
  public type HabitId = Nat;

  public type Habit = {
    id : HabitId;
    name : Text;
    emoji : Text;
    color : Text;
    reminderTime : Text;
    customReminderMsg : Text;
    category : Text;
    difficulty : Text;
    goalDescription : Text;
    goalTargetCount : Nat;
    goalDeadline : Text;
  };

  public type StreakData = {
    currentStreak : Nat;
    bestStreak : Nat;
  };

  public type Achievement = {
    id : Text;
    name : Text;
    description : Text;
    earned : Bool;
    earnedAt : Int;
  };

  public type UserProfile = {
    name : Text;
    mobile : Text;
    avatarBase64 : Text;
    streakTokens : Nat;
    points : Nat;
    habitOrder : [Nat];
    accentColor : Text;
  };

  public type UserActivity = {
    principal : Text;
    firstLogin : Int;
    lastLogin : Int;
    habitCount : Nat;
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

  public type LeaderboardEntry = {
    principal : Text;
    displayName : Text;
    points : Nat;
  };

  public type WeeklyChallenge = {
    title : Text;
    description : Text;
    targetCompletionsPerDay : Nat;
    deadline : Text;
    setBy : Text;
    createdAt : Int;
  };

  public type DetailedStats = {
    totalCompletions : Nat;
    totalDaysTracked : Nat;
    averageCompletionRate : Nat;
    bestStreakEver : Nat;
    habitsCompletedToday : Nat;
    currentStreakDays : Nat;
  };

  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  let userHabits = Map.empty<Principal, List.List<Habit>>();
  let userCompletions = Map.empty<Principal, Map.Map<HabitId, Set.Set<Text>>>();
  let nextHabitId = Map.empty<Principal, Nat>();
  let userActivity = Map.empty<Principal, UserActivity>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let habitNotes = Map.empty<Principal, Map.Map<HabitId, Map.Map<Text, Text>>>();
  let userMoods = Map.empty<Principal, Map.Map<Text, Text>>();
  let following = Map.empty<Principal, Set.Set<Principal>>();
  let challengeMembers = Set.empty<Principal>();
  let currentChallenge = List.empty<WeeklyChallenge>();
  // Habit management functions
  public shared ({ caller }) func addHabit(name : Text, emoji : Text, color : Text, category : Text, difficulty : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
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
      customReminderMsg = "";
      category;
      difficulty;
      goalDescription = "";
      goalTargetCount = 0;
      goalDeadline = "";
    };

    let habits = switch (userHabits.get(caller)) {
      case (?existing) {
        existing.add(habit);
        existing;
      };
      case (null) {
        let newHabits = List.empty<Habit>();
        newHabits.add(habit);
        newHabits;
      };
    };
    userHabits.add(caller, habits);

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

    nextHabitId.add(caller, habitId + 1);
  };

  public shared ({ caller }) func updateHabit(habitId : HabitId, name : Text, emoji : Text, color : Text, category : Text, difficulty : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update habits");
    };

    switch (userHabits.get(caller)) {
      case (?habits) {
        let updated = habits.map<Habit, Habit>(
          func(habit) {
            if (habit.id == habitId) {
              {
                habit with
                name;
                emoji;
                color;
                category;
                difficulty;
              };
            } else {
              habit;
            };
          }
        );
        userHabits.add(caller, updated);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func deleteHabit(habitId : HabitId) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete habits");
    };

    switch (userHabits.get(caller)) {
      case (?habits) {
        let filtered = habits.filter(func(h) { h.id != habitId });
        userHabits.add(caller, filtered);

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

  public shared ({ caller }) func setHabitReminderTime(habitId : HabitId, reminderTime : Text, customMsg : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set reminder time");
    };

    switch (userHabits.get(caller)) {
      case (?habits) {
        let updated = habits.map<Habit, Habit>(
          func(habit) {
            if (habit.id == habitId) {
              { habit with reminderTime; customReminderMsg = customMsg };
            } else {
              habit;
            };
          }
        );
        userHabits.add(caller, updated);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func setHabitGoal(habitId : HabitId, description : Text, targetCount : Nat, deadline : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set habit goal");
    };

    switch (userHabits.get(caller)) {
      case (?habits) {
        let updated = habits.map<Habit, Habit>(
          func(habit) {
            if (habit.id == habitId) {
              {
                habit with
                goalDescription = description;
                goalTargetCount = targetCount;
                goalDeadline = deadline;
              };
            } else {
              habit;
            };
          }
        );
        userHabits.add(caller, updated);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func reorderHabits(order : [HabitId]) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reorder habits");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (?p) { p };
      case (null) { Runtime.trap("Profile not found") };
    };

    userProfiles.add(caller, { profile with habitOrder = order });
  };

  public shared ({ caller }) func initializePredefinedHabits() : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initialize predefined habits");
    };

    switch (userHabits.get(caller)) {
      case (?habits) {
        if (habits.size() > 0) { Runtime.trap("Habits already exist") };
      };
      case (null) {};
    };

    let initialHabits : [Habit] = [
      {
        id = 1;
        name = "Drink Water";
        emoji = "💧";
        color = "#00BFFF";
        reminderTime = "";
        customReminderMsg = "";
        category = "Health";
        difficulty = "Easy";
        goalDescription = "";
        goalTargetCount = 0;
        goalDeadline = "";
      },
    ];

    userHabits.add(caller, List.fromArray<Habit>(initialHabits));
    nextHabitId.add(caller, 2);
  };

  public query ({ caller }) func getAllHabits() : async [Habit] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get habits");
    };

    switch (userHabits.get(caller)) {
      case (?habits) { habits.toArray() };
      case (null) { [] };
    };
  };

  // Habit completion tracking.
  public shared ({ caller }) func toggleCompletion(habitId : HabitId, date : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
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
        let newMap = Map.empty<HabitId, Set.Set<Text>>();
        let newSet = Set.empty<Text>();
        newSet.add(date);
        newMap.add(habitId, newSet);
        userCompletions.add(caller, newMap);
      };
    };
  };

  public query ({ caller }) func getCompletionsForRange(startDate : Text, endDate : Text) : async [(Habit, [Text])] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get range completions");
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

  public query ({ caller }) func getStreakData() : async [(Habit, StreakData)] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
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

  // Habit notes.
  public shared ({ caller }) func saveHabitNote(habitId : HabitId, date : Text, note : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save habit notes");
    };

    let userNotesMap = switch (habitNotes.get(caller)) {
      case (?notes) { notes };
      case (null) {
        let newMap = Map.empty<HabitId, Map.Map<Text, Text>>();
        habitNotes.add(caller, newMap);
        newMap;
      };
    };

    let habitNotesMap = switch (userNotesMap.get(habitId)) {
      case (?notes) { notes };
      case (null) {
        let newMap = Map.empty<Text, Text>();
        userNotesMap.add(habitId, newMap);
        newMap;
      };
    };

    habitNotesMap.add(date, note);
  };

  public query ({ caller }) func getHabitNotes(habitId : HabitId) : async [(Text, Text)] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get habit notes");
    };

    switch (habitNotes.get(caller)) {
      case (?userNotesMap) {
        switch (userNotesMap.get(habitId)) {
          case (?habitNotesMap) {
            habitNotesMap.entries().toArray();
          };
          case (null) { [] };
        };
      };
      case (null) { [] };
    };
  };

  // Mood tracking.
  public shared ({ caller }) func saveMood(date : Text, mood : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save moods");
    };

    let moodMap = switch (userMoods.get(caller)) {
      case (?moods) { moods };
      case (null) {
        let newMap = Map.empty<Text, Text>();
        userMoods.add(caller, newMap);
        newMap;
      };
    };

    moodMap.add(date, mood);
  };

  public query ({ caller }) func getMoods() : async [(Text, Text)] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get moods");
    };

    switch (userMoods.get(caller)) {
      case (?moodMap) { moodMap.entries().toArray() };
      case (null) { [] };
    };
  };

  // Detailed stats.
  public query ({ caller }) func getDetailedStats(todayDate : Text) : async DetailedStats {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get detailed stats");
    };

    var totalCompletions : Nat = 0;
    var bestStreakEver : Nat = 0;
    var habitsCompletedToday : Nat = 0;
    let distinctDays = Set.empty<Text>();

    switch (userCompletions.get(caller)) {
      case (?completionMap) {
        for ((habitId, dateSet) in completionMap.entries()) {
          let count = dateSet.size();
          totalCompletions += count;
          if (count > bestStreakEver) {
            bestStreakEver := count;
          };
          if (dateSet.contains(todayDate)) {
            habitsCompletedToday += 1;
          };
          for (date in dateSet.values()) {
            distinctDays.add(date);
          };
        };
      };
      case (null) {};
    };

    let totalDaysTracked = distinctDays.size();
    let averageCompletionRate = if (totalDaysTracked > 0) {
      (totalCompletions * 100) / totalDaysTracked;
    } else { 0 };

    {
      totalCompletions;
      totalDaysTracked;
      averageCompletionRate;
      bestStreakEver;
      habitsCompletedToday;
      currentStreakDays = totalDaysTracked;
    };
  };

  // Achievements.
  public query ({ caller }) func getAchievements() : async [Achievement] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get achievements");
    };

    let achievements = List.empty<Achievement>();
    var totalCompletions : Nat = 0;
    var habitCount : Nat = 0;
    var maxStreak : Nat = 0;
    let distinctDays = Set.empty<Text>();

    switch (userHabits.get(caller)) {
      case (?habits) { habitCount := habits.size() };
      case (null) {};
    };

    switch (userCompletions.get(caller)) {
      case (?completionMap) {
        for ((habitId, dateSet) in completionMap.entries()) {
          let count = dateSet.size();
          totalCompletions += count;
          if (count > maxStreak) {
            maxStreak := count;
          };
          for (date in dateSet.values()) {
            distinctDays.add(date);
          };
        };
      };
      case (null) {};
    };

    achievements.add({
      id = "first_habit";
      name = "First Habit";
      description = "Created your first habit";
      earned = habitCount >= 1;
      earnedAt = if (habitCount >= 1) { Time.now() } else { 0 };
    });

    achievements.add({
      id = "habit_collector";
      name = "Habit Collector";
      description = "Created 5+ habits";
      earned = habitCount >= 5;
      earnedAt = if (habitCount >= 5) { Time.now() } else { 0 };
    });

    achievements.add({
      id = "centurion";
      name = "Centurion";
      description = "100+ total completions";
      earned = totalCompletions >= 100;
      earnedAt = if (totalCompletions >= 100) { Time.now() } else { 0 };
    });

    achievements.add({
      id = "consistency_king";
      name = "Consistency King";
      description = "30+ days with completions";
      earned = distinctDays.size() >= 30;
      earnedAt = if (distinctDays.size() >= 30) { Time.now() } else { 0 };
    });

    achievements.add({
      id = "streak_7";
      name = "Week Warrior";
      description = "7+ day streak";
      earned = maxStreak >= 7;
      earnedAt = if (maxStreak >= 7) { Time.now() } else { 0 };
    });

    achievements.add({
      id = "streak_30";
      name = "Month Master";
      description = "30+ day streak";
      earned = maxStreak >= 30;
      earnedAt = if (maxStreak >= 30) { Time.now() } else { 0 };
    });

    achievements.add({
      id = "month_100";
      name = "Century Club";
      description = "100+ completions in a month";
      earned = totalCompletions >= 100;
      earnedAt = if (totalCompletions >= 100) { Time.now() } else { 0 };
    });

    achievements.toArray();
  };

  // Profile functions.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save their profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Points and leaderboard functions.
  public shared ({ caller }) func addPoints(pts : Nat) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add points");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (?p) { p };
      case (null) { Runtime.trap("Profile not found") };
    };

    let updatedProfile = {
      profile with
      points = profile.points + pts;
    };
    userProfiles.add(caller, updatedProfile);
  };

  public query func getLeaderboard() : async [LeaderboardEntry] {
    // No authorization check - accessible to all users including guests
    let entries = List.empty<LeaderboardEntry>();

    for ((principal, profile) in userProfiles.entries()) {
      let entry = {
        principal = principal.toText();
        displayName = profile.name;
        points = profile.points;
      };
      entries.add(entry);
    };

    let array = entries.toArray();

    array.sort(
      func(a, b) {
        Nat.compare(b.points, a.points);
      }
    );
  };

  // Social features.
  public shared ({ caller }) func followUser(target : Principal) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    let followSet = switch (following.get(caller)) {
      case (?set) { set };
      case (null) {
        let newSet = Set.empty<Principal>();
        following.add(caller, newSet);
        newSet;
      };
    };

    followSet.add(target);
  };

  public shared ({ caller }) func unfollowUser(target : Principal) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };

    switch (following.get(caller)) {
      case (?followSet) {
        followSet.remove(target);
      };
      case (null) {};
    };
  };

  public query ({ caller }) func getFollowing() : async [Text] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get following list");
    };

    switch (following.get(caller)) {
      case (?followSet) {
        followSet.values().map<Principal, Text>(func(p) { p.toText() }).toArray();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getFriendLeaderboard() : async [LeaderboardEntry] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get friend leaderboard");
    };

    let entries = List.empty<LeaderboardEntry>();

    // Add caller
    switch (userProfiles.get(caller)) {
      case (?profile) {
        entries.add({
          principal = caller.toText();
          displayName = profile.name;
          points = profile.points;
        });
      };
      case (null) {};
    };

    // Add followed users
    switch (following.get(caller)) {
      case (?followSet) {
        for (user in followSet.values()) {
          switch (userProfiles.get(user)) {
            case (?profile) {
              entries.add({
                principal = user.toText();
                displayName = profile.name;
                points = profile.points;
              });
            };
            case (null) {};
          };
        };
      };
      case (null) {};
    };

    let array = entries.toArray();
    array.sort(
      func(a, b) {
        Nat.compare(b.points, a.points);
      }
    );
  };

  // Weekly challenge.
  public shared ({ caller }) func setWeeklyChallenge(title : Text, description : Text, targetCompletionsPerDay : Nat, deadline : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set weekly challenge");
    };

    let challenge : WeeklyChallenge = {
      title;
      description;
      targetCompletionsPerDay;
      deadline;
      setBy = caller.toText();
      createdAt = Time.now();
    };

    currentChallenge.clear();
    currentChallenge.add(challenge);
  };

  public query ({ caller }) func getWeeklyChallenge() : async ?WeeklyChallenge {
    // No authorization check - accessible to all users including guests
    if (currentChallenge.size() == 0) {
      null;
    } else {
      let iter = currentChallenge.values();
      iter.next();
    };
  };

  public shared ({ caller }) func joinWeeklyChallenge() : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join weekly challenge");
    };

    challengeMembers.add(caller);
  };

  public query func getChallengeMembersCount() : async Nat {
    // No authorization check - accessible to all users including guests
    challengeMembers.size();
  };

  // Streak tokens.
  public shared ({ caller }) func spendStreakToken(habitId : HabitId, missedDate : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can spend streak tokens");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (?p) { p };
      case (null) { Runtime.trap("Profile not found") };
    };

    if (profile.streakTokens == 0) {
      Runtime.trap("No streak tokens available");
    };

    let updatedProfile = {
      profile with
      streakTokens = profile.streakTokens - 1;
    };
    userProfiles.add(caller, updatedProfile);

    // Add the missed date as a completion
    switch (userCompletions.get(caller)) {
      case (?completions) {
        switch (completions.get(habitId)) {
          case (?set) {
            set.add(missedDate);
          };
          case (null) {};
        };
      };
      case (null) {};
    };
  };

  // User activity tracking.
  public shared ({ caller }) func recordLogin() : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record login");
    };

    let now = Time.now();
    let habitCount = switch (userHabits.get(caller)) {
      case (?habits) { habits.size() };
      case (null) { 0 };
    };

    let activity = switch (userActivity.get(caller)) {
      case (?existing) {
        {
          existing with
          lastLogin = now;
          habitCount;
        };
      };
      case (null) {
        {
          principal = caller.toText();
          firstLogin = now;
          lastLogin = now;
          habitCount;
        };
      };
    };

    userActivity.add(caller, activity);
  };

  // Admin functions.
  public query ({ caller }) func getAdminStats() : async [UserActivity] {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access admin stats");
    };

    userActivity.values().toArray();
  };

  public query ({ caller }) func getAdminUserDetails(todayDate : Text) : async [UserAdminDetail] {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access user details");
    };

    let details = List.empty<UserAdminDetail>();

    for ((principal, activity) in userActivity.entries()) {
      let profile = switch (userProfiles.get(principal)) {
        case (?p) { p };
        case (null) {
          {
            name = "";
            mobile = "";
            avatarBase64 = "";
            streakTokens = 0;
            points = 0;
            habitOrder = [];
            accentColor = "";
          };
        };
      };

      let habits = switch (userHabits.get(principal)) {
        case (?h) { h.toArray() };
        case (null) { [] };
      };

      var completionsToday : Nat = 0;
      var weeklyCompletions : Nat = 0;

      switch (userCompletions.get(principal)) {
        case (?completionMap) {
          for ((habitId, dateSet) in completionMap.entries()) {
            if (dateSet.contains(todayDate)) {
              completionsToday += 1;
            };
            weeklyCompletions += dateSet.size();
          };
        };
        case (null) {};
      };

      let weeklyCompletionRate = if (habits.size() > 0) {
        (weeklyCompletions * 100) / (habits.size() * 7);
      } else { 0 };

      details.add({
        principal = principal.toText();
        displayName = profile.name;
        mobile = profile.mobile;
        firstLogin = activity.firstLogin;
        lastLogin = activity.lastLogin;
        habits;
        completionsToday;
        weeklyCompletionRate;
      });
    };

    details.toArray();
  };

  public shared ({ caller }) func removeUser(user : Principal) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove users");
    };

    userHabits.remove(user);
    userCompletions.remove(user);
    nextHabitId.remove(user);
    userActivity.remove(user);
    userProfiles.remove(user);
    habitNotes.remove(user);
    userMoods.remove(user);
    following.remove(user);
    challengeMembers.remove(user);
  };

  public shared ({ caller }) func setAdminPrincipal(newAdmin : Principal) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign admin role");
    };
    Authorization.assignRole(accessControlState, caller, newAdmin, #admin);
  };

  public query ({ caller }) func isAdmin() : async Bool {
    Authorization.isAdmin(accessControlState, caller);
  };
};
