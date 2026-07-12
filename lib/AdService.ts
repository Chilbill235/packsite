"use client"; // Required because you are using window/document
import { useEffect, useRef } from "react";
import { RewardedAdService } from "@/lib/adService";

export default function Page() {
  const adService = useRef<RewardedAdService | null>(null);

  useEffect(() => {
    // Instantiate only on client
    adService.current = new RewardedAdService();
    adService.current.init();
  }, []);

  return <button onClick={() => adService.current?.showAd()}>Show Ad</button>;
}