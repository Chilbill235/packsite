// lib/adService.ts
export class RewardedAdService {
  private directLinkUrl = "https://omg10.com/4/11276026";

  showAd() {
    if (typeof window !== "undefined") {
      // Open the Direct Link in a new tab
      window.open(this.directLinkUrl, "_blank");
    }
  }
}