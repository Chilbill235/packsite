"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// We accept user as a prop, though since this is a page, 
// you may need to use a React Context if you want it globally accessible.
export default function Home({ user }: { user?: any }) {
  const adService = useRef<RewardedAdService | null>(null);

  useEffect(() => {
    adService.current = new RewardedAdService();
    adService.current.init();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          {user ? `Welcome back, ${user.name}` : "Open Amazing Packs"}
        </h1>
        
        <div className="mt-10 flex justify-center">
          <Link href={user ? "/shop" : "/register"} className="bg-blue-600 px-8 py-4 rounded-xl font-semibold transition hover:bg-blue-700">
            {user ? "Browse Packs" : "Get Started Now"}
          </Link>
        </div>
      </div>

      {/* Ad Section */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div 
          className="p-4 border border-zinc-800 rounded-2xl bg-zinc-900/30 flex justify-center items-center min-h-[250px] cursor-pointer hover:bg-zinc-800 transition"
          onClick={() => adService.current?.showAd()}
        >
          <div className="text-center">
            <p className="text-zinc-300 font-medium text-lg">Support the developer</p>
            <p className="text-zinc-500 text-sm mt-2">Click here to watch an ad</p>
          </div>
        </div>
      </section>
    </div>
  );
}