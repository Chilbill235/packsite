import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black text-white selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          {session ? `Welcome back, ${session.user?.name || "Player"}` : "Open Amazing Packs"}
        </h1>
        
        <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-xl mx-auto font-light leading-relaxed">
          {session 
            ? "Your inventory is waiting. Continue your collection and test your luck." 
            : "Start opening packs, test your luck, and collect ultra‑rare items today."}
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            href={session ? "/shop" : "/register"}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20"
          >
            {session ? "Browse Packs" : "Get Started Now"}
          </Link>
        </div>
      </div>

      {/* Feature Showcase: Added this to fill the "rest of divider code" area */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Rare Drops", desc: "Find thousands of unique items." },
            { title: "Fair Odds", desc: "Transparent chances for every pack." },
            { title: "Instant Trade", desc: "Swap your items with other players." }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800">
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-zinc-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}