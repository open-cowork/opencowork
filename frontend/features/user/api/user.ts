import { userService } from "@/features/user/services/user-service";

export async function getUserProfile() {
  return userService.getProfile();
}

export async function getUserCredits() {
  return userService.getCredits();
}
