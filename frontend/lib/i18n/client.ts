"use client";

import { useTranslation, UseTranslationOptions } from "react-i18next";

export function useT(
  ns?: string | string[],
  options?: UseTranslationOptions<string>,
) {
  return useTranslation(ns, options);
}
