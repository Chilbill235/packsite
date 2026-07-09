"use client";

import { createContext, useContext, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type UserState = {
  name?: string | null;
  email?: string | null;
  balance: number;
} | null;

interface UserContextValue {
  user: UserState;
  setUser: Dispatch<SetStateAction<UserState>>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser: UserState }) {
  const [user, setUser] = useState<UserState>(initialUser);
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) return { user: null, setUser: () => undefined } satisfies UserContextValue;
  return context;
};
