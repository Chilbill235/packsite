// lib/adService.ts
export class RewardedAdService {
  showAd() {
    // If you need to trigger a Monetag locker manually:
    if (typeof (window as any).show_monetag_locker === "function") {
      (window as any).show_monetag_locker();
    } else {
      console.log("Ad Service: Monetag is handling ads automatically.");
    }
  }
}