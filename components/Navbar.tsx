"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Balance from "./Balance";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    balance: number;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [balanceOverride, setBalanceOverride] = useState<number | null>(null);
  const balance = balanceOverride ?? user?.balance ?? 0;

  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      setBalanceOverride((event as CustomEvent<number>).detail);
    };

    document.addEventListener("balanceChanged", handleBalanceChange);
    return () => document.removeEventListener("balanceChanged", handleBalanceChange);
  }, []);

  const navLinks = [
    { name: "Shop", href: "/shop" },
    { name: "Inventory", href: "/inventory" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-10">
        <Link href="/" className="text-2xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tighter uppercase">
          PACKSITE
        </Link>

        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-bold tracking-wide rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-900 text-amber-400 border border-zinc-800"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-2xl"
        >
          ☰
        </button>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-zinc-950 border-b border-zinc-800 md:hidden">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block w-full px-4 py-2 text-sm font-bold ${
                    isActive ? "bg-zinc-900 text-amber-400" : "text-zinc-400 hover:bg-zinc-800"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        {user ? (
          <>
            <Balance amount={balance} />
            <div className="flex items-center gap-4 pl-2 border-l border-zinc-800">
              <span className="hidden lg:inline text-sm font-semibold text-zinc-400">
                {user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs font-bold text-zinc-500 hover:text-red-400 bg-zinc-900/50 border border-zinc-900 px-3 py-2 rounded-xl transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-zinc-400 hover:text-zinc-200 px-4 py-2">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-4 py-2 rounded-xl transition-colors">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
