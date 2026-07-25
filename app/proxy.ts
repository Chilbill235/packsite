// middleware.ts or proxy.ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !req.auth;
  const { nextUrl } = req;
  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isProtectedPage = nextUrl.pathname.startsWith("/shop") || nextUrl.pathname.startsWith("/inventory");

  // If already logged in and trying to access auth pages, redirect to shop
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/shop", nextUrl));
  }
  
  // If trying to access a protected page without being logged in, redirect to login
  if (isProtectedPage && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }
  
  return undefined;
});

// ✅ Exclude all files with extensions (like ServiceWorker.js)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};