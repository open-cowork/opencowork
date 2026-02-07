import type { UserProfile, UserCredits } from "@/features/user/types";

const DEFAULT_USER_PROFILE: UserProfile = {
  id: "default-user",
  email: "user@poco.com",
  avatar: "",
  plan: "free",
  planName: "Free",
};

const DEFAULT_USER_CREDITS: UserCredits = {
  total: "Unlimited",
  free: "Unlimited",
  dailyRefreshCurrent: 9999,
  dailyRefreshMax: 9999,
  refreshTime: "08:00",
};

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    // TODO: Replace with real API call
    return DEFAULT_USER_PROFILE;
  },

  getCredits: async (): Promise<UserCredits> => {
    // TODO: Replace with real API call
    return DEFAULT_USER_CREDITS;
  },
};
