"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react"; // Corrected icon imports
import Balance from "./Balance";
import { useSession } from "next-auth/react";

interface NavbarProps {
  // user prop is no longer needed
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: user, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!user;
  const balance = user?.balance ?? 0;

  const navLinks = [
    { name: "Shop", href: "/shop" },
    { name: "Inventory", href: "/inventory" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between w-full px-6">
        <div className="flex items-center space-x-3">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tighter">
            PACKSITE
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-400 md:hidden"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </button>
        </div>

        <div className="hidden md:flex md:items-center md:space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${pathname === link.href ? "bg-amber-600/20 text-amber-400" : "text-gray-300 hover:text-white hover:bg-white/5"}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <Balance amount={balance} className="text-sm" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-200 transition-colors"
              >
                <span className="sr-only">Logout</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-white/5">
                Sign In
              </Link>
              <Link href="/register" className="px-3 py-2 rounded-md text-sm font-medium bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 hover:text-amber-300 transition-all">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-3 space-y-1 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-amber-900/50 hover:bg-amber-900/70 hover:text-amber-300"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="px-4 pt-2 pb-4 space-y-1 sm:px-6 border-t border-gray-700">
            {isAuthenticated ? (
              <>
                <div className="mt-3">
                  <Balance amount={balance} className="w-full" />
                </div>
                <button
                  onClick={() => { signOut({ callbackUrl: "/login" }); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-200 hover:bg-red-900/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-white bg-amber-600/20">Sign In</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}