"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ProgressionProvider } from "@/context/ProgressionContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ProgressionProvider>
        {children}
      </ProgressionProvider>
    </SessionProvider>
  );
}