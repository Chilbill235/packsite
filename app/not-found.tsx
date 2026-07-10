import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-white">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="mb-6 text-xl">Page not found</p>
      <Link href="/" className="bg-white text-black px-6 py-3 rounded-lg hover:bg-zinc-100 transition-colors">
        Return Home
      </Link>
    </main>
  );
}
