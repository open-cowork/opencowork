"use client";

import { useEffect, useState } from "react";
import { LaunchScreen } from "@/components/shared/launch-screen";
import { startStartupPreload } from "@/lib/startup-preload";

const MIN_SPLASH_DURATION_MS = 1000;

export function StartupSplashGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const minDuration = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MIN_SPLASH_DURATION_MS);
    });

    Promise.all([minDuration, startStartupPreload()]).finally(() => {
      if (active) {
        setReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return <LaunchScreen />;
  }

  return <>{children}</>;
}
