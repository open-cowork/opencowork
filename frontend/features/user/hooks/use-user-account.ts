import { useState } from "react";
import type { UserProfile, UserCredits } from "@/features/user/types";

export function useUserAccount() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profile, _setProfile] = useState<UserProfile | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [credits, _setCredits] = useState<UserCredits | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, _setIsLoading] = useState(true);
  // // TODO: User API temporarily disabled
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const [profileData, creditsData] = await Promise.all([
  //         getUserProfileAction(),
  //         getUserCreditsAction(),
  //       ]);

  //       setProfile(profileData);
  //       setCredits(creditsData);
  //     } catch (error) {
  //       console.error("Failed to fetch user data", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchUserData();
  // }, []);

  return {
    profile,
    credits,
    isLoading,
  };
}
