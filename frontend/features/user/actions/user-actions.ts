import { userService } from "@/features/user/services/user-service";

export async function getUserProfileAction() {
  return userService.getProfile();
}

export async function getUserCreditsAction() {
  return userService.getCredits();
}
