// lib/adService.ts
export class RewardedAdService {
  private directLinkUrl = "https://omg10.com/4/11276026";

  /**
   * Opens the Monetag Direct Link.
   * @param userId - The ID of the current user to track for the reward.
   */
  showAd(userId: string) {
    if (typeof window !== "undefined") {
      // Append the userId to the URL so Monetag can pass it back via Postback
      // Ensure the 'userId' parameter name matches what you configure in your Monetag S2S settings
      const trackingUrl = `${this.directLinkUrl}?userId=${userId}`;
      
      window.open(trackingUrl, "_blank");
      
      console.log("Ad opened with tracking ID:", userId);
    }
  }
}