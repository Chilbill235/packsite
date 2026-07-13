"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { RewardedAdService } from '@/lib/adService';

export default function Home() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [balance, setBalance] = useState(0);
  const [totalOpened, setTotalOpened] = useState(0);
  const [rarestItem, setRarestItem] = useState({ name: "None yet" });

  const isAuthenticated = status === "authenticated" && !!user;

  // Sync state logic
  useEffect(() => {
    if (user && typeof (user as any).balance === 'number') setBalance((user as any).balance);
  }, [user]);

  // Fetch stats logic
  useEffect(() => {
    if (isAuthenticated) {
      const fetchStats = async () => {
        try {
          const [invRes, openRes] = await Promise.all([fetch("/api/inventory"), fetch("/api/openings")]);
          const invData = await invRes.json();
          const openData = await openRes.json();
          setTotalOpened(openData.openings?.length || 0);
          
          const items = invData.inventory || [];
          const rarest = items.length > 0 ? items.reduce((prev: any, curr: any) => 
            (curr.item?.rarity === 'legendary' ? curr : prev), items[0]) : null;
          setRarestItem({ name: rarest?.item?.name || "None yet" });
        } catch (err) { console.error(err); }
      };
      fetchStats();
    }
  }, [isAuthenticated]);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-amber-500/30">
      {/* Hero Section */}
      <header className="relative py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black -z-10" />
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight">
          {isAuthenticated ? `Welcome back, ${user!.name}` : "PackSite"}
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
          Collect rare items, open mystery packs, and climb the leaderboard.
        </p>
        
        {isAuthenticated ? (
          <Link href="/shop" className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-amber-400 transition-colors">
            Browse Packs →
          </Link>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="px-8 py-3 bg-amber-600 rounded-full font-bold hover:bg-amber-500">Sign In</Link>
          </div>
        )}
      </header>

      {/* Stats & Trademark Section */}
      {isAuthenticated && (
        <section className="py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                { label: "Balance", val: balance.toLocaleString(), icon: "💰", color: "text-amber-400" },
                { label: "Opened", val: totalOpened.toString(), icon: "📦", color: "text-green-400" },
                { label: "Rarest", val: rarestItem.name, icon: "🏆", color: "text-blue-400" }
              ].map((item, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl backdrop-blur text-center hover:border-gray-600 transition-all">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">{item.label}</div>
                  <div className={`text-2xl font-bold ${item.color}`}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Premium Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-900"></div></div>
              <div className="relative flex justify-center">
                <span className="bg-black px-4 text-[10px] text-gray-700 font-bold tracking-[0.3em] uppercase">PackSite™ Official Platform</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Simple Footer */}
      <footer className="py-12 text-center text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} PackSite. All rights reserved.
      </footer>
    </main>
  );
}