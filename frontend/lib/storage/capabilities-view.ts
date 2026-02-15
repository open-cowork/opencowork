import { getItem, removeItem, setItem } from "@/lib/storage/core";
import {
  CAPABILITIES_LAST_VIEW_KEY,
  CAPABILITIES_PENDING_VIEW_KEY,
} from "@/lib/storage/keys";

export function setLastCapabilityView(viewId: string): void {
  setItem("local", CAPABILITIES_LAST_VIEW_KEY, viewId);
}

export function getLastCapabilityView(): string | null {
  return getItem("local", CAPABILITIES_LAST_VIEW_KEY);
}

export function setPendingCapabilityView(viewId: string): void {
  setItem("session", CAPABILITIES_PENDING_VIEW_KEY, viewId);
}

export function consumePendingCapabilityView(): string | null {
  const value = getItem("session", CAPABILITIES_PENDING_VIEW_KEY);
  if (value) {
    removeItem("session", CAPABILITIES_PENDING_VIEW_KEY);
  }
  return value;
}
