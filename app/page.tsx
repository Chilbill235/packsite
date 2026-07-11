"use client"; // Required to use useEffect
import { useEffect } from "react";
import Link from "next/link";
// Note: You cannot use the 'auth()' function here since this is a Client Component.
// Pass the session data via props or use a client-side hook if needed.

export default function Home() {
  // Simple check for simulation (Replace with your actual session handling)
  const session = false; 

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

      {/* Ad Section */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="p-4 border border-zinc-800 rounded-2xl bg-zinc-900/30 flex justify-center overflow-hidden min-h-[250px]">
          <AdUnit />
        </div>
      </section>
    </div>
  );
}

function AdUnit() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", width: "100%" }}
      data-ad-format="fluid"
      data-ad-layout-key="-ef+6k-36-a8+uh"
      data-ad-client="ca-pub-1167000799645777"
      data-ad-slot="9501413049"
    ></ins>
  );
}