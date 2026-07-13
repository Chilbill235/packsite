"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { RewardedAdService } from '@/lib/adService';

export default function Home() {
  const { data: user, status } = useSession();
  const adService = useRef<RewardedAdService | null>(null);

  useEffect(() => {
    // RewardedAdService initialized (no init() method required)
    adService.current = new RewardedAdService();
  }, []);

  // While loading, we can show a loading state or just treat as not authenticated
  const isAuthenticated = status === "authenticated" && !!user;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-950 to-black text-white">
      {/* Header with CTA */}
      <header className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
          {isAuthenticated ? `Welcome back, ${user!.name}!` : "Welcome to PackSite"}
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Open mystery packs, collect rare items, and build your ultimate collection!
        </p>
        {!isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold rounded-lg transition-transform hover:scale-[1.02]">
              Sign In
            </Link>
            <Link href="/register" className="flex-1 px-6 py-3 border border-gray-600 hover:border-amber-300 hover:bg-gray-800 text-gray-200 font-medium rounded-lg transition-transform hover:scale-[1.02]">
              Create Account
            </Link>
          </div>
        ) : (
          <Link href="/shop" className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-transform hover:scale-[1.02]">
            Browse Packs →
          </Link>
        )}
      </header>

      {/* Stats Section */}
        {isAuthenticated && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-6 grid gap-8 md:grid-cols-3 text-center">
              
              {/* Balance Card */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl text-amber-400">💰</span>
                </div>
                <h3 className="font-semibold text-amber-300 mb-2">Your Balance</h3>
                <p className="text-3xl font-bold text-white" id="user-balance">
                  Loading...
                </p>
              </div>

              {/* Total Packs Card */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl text-green-400">📦</span>
                </div>
                <h3 className="font-semibold text-green-300 mb-2">Total Packs Opened</h3>
                <p className="text-3xl font-bold text-white" id="total-opened">
                  --
                </p>
              </div>

              {/* Rarest Item Card */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl text-blue-400">🏆</span>
                </div>
                <h3 className="font-semibold text-blue-300 mb-2">Rarest Item</h3>
                <p className="text-2xl font-bold text-white" id="rarest-item">
                  None yet
                </p>
              </div>

            </div>
          </section>
        )}

      {/* Featured Packs Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured Packs
          </h2>

          <div id="featured-packs" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-amber-300/50 transition-colors">
              <div className="flex items-center justify-center mb-4">
                <span className="text-3xl text-amber-400">📦</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">The Starter Pack</h3>
              <p className="text-gray-400 text-center mb-4">
                Perfect for beginners - common items with decent value
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-bold text-amber-300">50 Coins</span>
                <button
                  onClick={() => {
                    // This would normally open the pack, but for demo we'll just navigate
                    window.location.href = '/shop';
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-transform hover:scale-[1.02]"
                >
                  Open
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-amber-300/50 transition-colors">
              <div className="flex items-center justify-center mb-4">
                <span className="text-3xl text-amber-400">📦</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">The Treasure Chest</h3>
              <p className="text-gray-400 text-center mb-4">
                Rare finds await - higher chance of valuable items
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-bold text-amber-300">200 Coins</span>
                <button
                  onClick={() => {
                    window.location.href = '/shop';
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-transform hover:scale-[1.02]"
                >
                  Open
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-amber-300/50 transition-colors">
              <div className="flex items-center justify-center mb-4">
                <span className="text-3xl text-amber-400">📦</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">The Collector's Crate</h3>
              <p className="text-gray-400 text-center mb-4">
                For the serious collector - highest chance of legendary items
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-bold text-amber-300">500 Coins</span>
                <button
                  onClick={() => {
                    window.location.href = '/shop';
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-transform hover:scale-[1.02]"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-center mb-8">
            Start Your Collection Today
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Every pack holds a surprise. What rare treasures will you uncover?
          </p>
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold rounded-lg transition-transform hover:scale-[1.02]">
                Sign In
              </Link>
              <Link href="/register" className="flex-1 px-6 py-3 border border-gray-600 hover:border-amber-300 hover:bg-gray-800 text-gray-200 font-medium rounded-lg transition-transform hover:scale-[1.02]">
                Create Account
              </Link>
            </div>
          ) : (
            <Link href="/shop" className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-transform hover:scale-[1.02]">
              Browse Packs →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/50 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} PackSite. All rights reserved.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}