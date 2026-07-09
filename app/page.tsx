import Link from "next/link";

export default async function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black text-white selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          Open Amazing Packs
        </h1>
        <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-xl mx-auto font-light leading-relaxed">
          Start opening packs, test your luck, and collect ultra‑rare items today.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-blue-600/20"
          >
            Browse Packs
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>
    </div>
  );
}
