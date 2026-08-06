"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";
import { ProgressionProvider } from "@/context/ProgressionContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
        <ProgressionProvider>
          {children}
        </ProgressionProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}