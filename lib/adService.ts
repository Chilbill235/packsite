// lib/adService.ts
export class RewardedAdService {
  showAd() {
    // If you are using a site-wide Monetag script, 
    // it often triggers automatically. 
    // If you need to trigger it manually, call the specific function:
    if (typeof (window as any).show_monetag_locker === "function") {
      (window as any).show_monetag_locker();
    } else {
      console.log("Ad Service: Monetag is handling ads automatically.");
    }
  }
}