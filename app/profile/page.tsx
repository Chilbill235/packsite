"use client";

import { useEffect, useState } from "react";
import Notification from "@/components/Notification";
import ErrorDialog from "@/components/ErrorDialog";

type ProfileUser = {
  name: string;
  email: string;
  balance: number;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);
  const [errorDialog, setErrorDialog] = useState<{
    message: string;
    onRetry?: () => void;
  } | null>(null);

  // Load profile data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setUser(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p className="text-lg text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-8">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {errorDialog && (
        <ErrorDialog
          message={errorDialog.message}
          onClose={() => setErrorDialog(null)}
          onRetry={errorDialog.onRetry}
        />
      )}

      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-white">Your Profile</h1>
        <a href="/shop" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">Back to Shop</a>
      </header>

      {user && (
        <div className="max-w-2xl mx-auto bg-zinc-900 p-6 rounded-xl flex flex-col items-center">
          <div className="text-9xl mb-4">🐱</div>
          <p className="text-xl font-semibold text-amber-400">{user.name}</p>
          <p className="text-zinc-400">{user.email}</p>
          <p className="mt-2 text-2xl text-amber-400">Balance: {user.balance} coins</p>
        </div>
      )}
    </div>
  );
}
