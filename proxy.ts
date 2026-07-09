import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const proxy = NextAuth(authConfig).auth(async function proxy(req) {
  // Check session status natively on the Edge runtime
  const isLoggedIn = !!req.auth;
  
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  const isProtectedPage = req.nextUrl.pathname.startsWith("/inventory") || req.nextUrl.pathname.startsWith("/shop");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/shop", req.url));
  }

  if (isProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|packs|items).*)"],
};