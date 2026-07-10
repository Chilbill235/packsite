// middleware.ts
import { auth } from "@/lib/auth-edge"; // Import from the lightweight file

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isProtectedPage = nextUrl.pathname.startsWith("/shop") || nextUrl.pathname.startsWith("/inventory");

  if (isAuthPage && isLoggedIn) return Response.redirect(new URL("/shop", nextUrl));
  if (isProtectedPage && !isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
  
  return null;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};