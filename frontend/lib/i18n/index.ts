import i18next from "./i18next";
import { fallbackLng, headerName } from "./settings";
import { headers } from "next/headers";

export async function getT(
  ns?: string | string[],
  options?: { keyPrefix?: string },
) {
  const headerList = await headers();
  const lng = headerList.get(headerName);

  if (lng && i18next.resolvedLanguage !== lng) {
    await i18next.changeLanguage(lng);
  }

  if (ns && !i18next.hasLoadedNamespace(ns)) {
    await i18next.loadNamespaces(ns);
  }

  const fixedLng = lng ?? i18next.resolvedLanguage ?? fallbackLng;

  return {
    t: i18next.getFixedT(
      fixedLng,
      Array.isArray(ns) ? ns[0] : ns,
      options?.keyPrefix,
    ),
    i18n: i18next,
  };
}
