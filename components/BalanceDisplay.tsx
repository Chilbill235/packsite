"use client";

import { useEffect, useState } from "react";

export default function BalanceDisplay({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      setBalance((event as CustomEvent<{ balance: number }>).detail.balance);
    };

    window.addEventListener("balanceUpdated", handleBalanceChange);
    return () => window.removeEventListener("balanceUpdated", handleBalanceChange);
  }, []);

  return <span className="font-bold text-amber-400">{balance.toLocaleString()} COINS</span>;
}
