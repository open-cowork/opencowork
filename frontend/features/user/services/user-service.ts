import type { UserProfile, UserCredits } from "@/features/user/types";

const DEFAULT_USER_PROFILE: UserProfile = {
  id: "default-user",
  email: "user@poco.com",
  avatar: "",
  plan: "free",
  planName: "免费",
};

const DEFAULT_USER_CREDITS: UserCredits = {
  total: "无限",
  free: "无限",
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
