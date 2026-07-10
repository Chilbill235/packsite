// middleware.ts
import { auth } from "@/lib/auth-edge"; // Import from the lightweight file

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isProtectedPage = nextUrl.pathname.startsWith("/shop") || nextUrl.pathname.startsWith("/inventory");

  if (isAuthPage && isLoggedIn) {
    // If already logged in and trying to access auth pages, redirect to shop
    return Response.redirect(new URL("/shop", nextUrl));
  }
  
  if (isProtectedPage && !isLoggedIn) {
    // If trying to access a protected page without being logged in, redirect to login with callbackUrl
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }
  
  return null;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};