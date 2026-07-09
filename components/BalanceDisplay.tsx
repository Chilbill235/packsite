"use client";

import { useEffect, useState } from "react";

export default function BalanceDisplay({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      setBalance((event as CustomEvent<number>).detail);
    };

    window.addEventListener("balanceChanged", handleBalanceChange);
    return () => window.removeEventListener("balanceChanged", handleBalanceChange);
  }, []);

  return <span className="font-bold text-amber-400">{balance.toLocaleString()} COINS</span>;
}
