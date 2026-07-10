// middleware.ts
import { auth } from "@/lib/auth"; // Use your central auth helper

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isProtectedPage = nextUrl.pathname.startsWith("/shop") || nextUrl.pathname.startsWith("/inventory");

  // 1. If user is logged in and tries to go to login/register, send to shop
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/shop", nextUrl));
  }

  // 2. If user is NOT logged in and tries to go to protected pages, send to login
  if (isProtectedPage && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  return null; // Allow the request to proceed
});

// Matcher ensures this runs on the paths you care about
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};