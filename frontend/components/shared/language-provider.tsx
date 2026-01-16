"use client";

import { useEffect, useState } from "react";
import i18next from "@/lib/i18n/i18next";

// 同步初始化语言，避免水合不匹配
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
  // 使用 useState 的初始化函数确保在首次渲染前同步设置语言
  const [isReady] = useState(() => {
    initLanguage(lng);
    return true;
  });

  useEffect(() => {
    // 语言变化时更新
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
