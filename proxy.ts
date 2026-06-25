import { NextResponse, type NextRequest } from "next/server";
import { getLocaleFromPathname } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-worldcup-locale", getLocaleFromPathname(request.nextUrl.pathname));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|apple-icon.png|opengraph-image|robots.txt|sitemap.xml|api).*)"],
};
