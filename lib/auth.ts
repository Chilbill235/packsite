import NextAuth from "next-auth";
import { authConfig } from "../auth.config";

// Only export the middleware utility wrapper to prevent circular imports
export const { auth } = NextAuth(authConfig);