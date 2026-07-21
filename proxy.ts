import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Initialize NextAuth with the lightweight, edge-compatible config
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
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
  
  return null;
});

// Configure the matcher to exclude API routes and static files[cite: 1]
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};