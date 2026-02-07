"use client";

import { useEffect, useState } from "react";
import i18next from "@/lib/i18n/i18next";

// Initialize language synchronously to avoid hydration mismatch
function initLanguage(lng: string) {
  if (i18next.resolvedLanguage !== lng) {
    i18next.changeLanguage(lng);
  }
}

export function LanguageProvider({
  lng,
  children,
}: {
  lng: string;
  children: React.ReactNode;
}) {
  // Use useState initializer to set language before first render
  const [isReady] = useState(() => {
    initLanguage(lng);
    return true;
  });

  useEffect(() => {
    // Update on language change
    if (i18next.resolvedLanguage !== lng) {
      i18next.changeLanguage(lng);
    }
  }, [lng]);

  useEffect(() => {
    document.documentElement.lang = lng;
  }, [lng]);

  if (!isReady) return null;

  return <>{children}</>;
}
