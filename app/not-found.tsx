"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-6">404 - Page Not Found</h1>
      <p className="text-zinc-400 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="space-x-4">
        <Link
          href="/"
          className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-100 transition-colors"
        >
          Go Home
        </Link>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
