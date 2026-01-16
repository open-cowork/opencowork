import { NextResponse } from "next/server";
import acceptLanguage from "accept-language";
import {
  fallbackLng,
  languages,
  cookieName,
  headerName,
} from "@/lib/i18n/settings";

acceptLanguage.languages(languages);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest).*)",
  ],
};

export function proxy(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.indexOf("icon") > -1 || url.pathname.indexOf("chrome") > -1)
    return NextResponse.next();

  let lng;

  if (req.headers.has("cookie")) {
    const cookies = req.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim());
    const i18nCookie = cookies?.find((c) => c.startsWith(`${cookieName}=`));
    if (i18nCookie) {
      const value = i18nCookie.split("=")[1];
      lng = acceptLanguage.get(value);
    }
  }

  if (!lng) lng = acceptLanguage.get(req.headers.get("Accept-Language"));

  if (!lng) lng = fallbackLng;

  const lngInPath = languages.find((loc) => url.pathname.startsWith(`/${loc}`));

  const headers = new Headers(req.headers);
  headers.set(headerName, lngInPath || lng);

  if (!lngInPath && !url.pathname.startsWith("/_next")) {
    return NextResponse.redirect(
      new URL(`/${lng}${url.pathname}${url.search}`, req.url),
    );
  }

  if (req.headers.has("referer")) {
    const refererUrl = new URL(req.headers.get("referer")!);
    const lngInReferer = languages.find((l) =>
      refererUrl.pathname.startsWith(`/${l}`),
    );

    const response = NextResponse.next({ headers });
    if (lngInReferer) response.cookies.set(cookieName, lngInReferer);
    return response;
  }

  return NextResponse.next({ headers });
}
