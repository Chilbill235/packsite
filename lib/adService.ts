// lib/adService.ts
export class RewardedAdService {
  private directLinkUrl = "https://omg10.com/4/11276026";

  // userId is now optional (?) to satisfy the compiler
  showAd(userId?: string) {
    if (typeof window !== "undefined") {
      const trackingUrl = userId 
        ? `${this.directLinkUrl}?userId=${userId}` 
        : this.directLinkUrl;
        
      window.open(trackingUrl, "_blank");
    }
  }
}