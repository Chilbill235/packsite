"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
// Use relative path to avoid build errors with Turbopack
import { RewardedAdService } from "../lib/adService";

export default function Home() {
  const session = false;
  const adService = useRef<RewardedAdService | null>(null);

  // Initialize the ad service when the component mounts
  useEffect(() => {
    adService.current = new RewardedAdService();
    adService.current.init();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          {session ? "Welcome back" : "Open Amazing Packs"}
        </h1>
        
        <div className="mt-10 flex justify-center">
          <Link href={session ? "/shop" : "/register"} className="bg-blue-600 px-8 py-4 rounded-xl">
            {session ? "Browse Packs" : "Get Started Now"}
          </Link>
        </div>
      </div>

      {/* Ad Section - Triggering your Reward Ad Service */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div 
          className="p-4 border border-zinc-800 rounded-2xl bg-zinc-900/30 flex justify-center items-center min-h-[250px] cursor-pointer hover:bg-zinc-800 transition"
          onClick={() => adService.current?.showAd()}
        >
          <p className="text-zinc-500 font-medium">Click here to watch an ad and support us</p>
        </div>
      </section>
    </div>
  );
}