// lib/adService.ts
export class RewardedAdService {
  private directLinkUrl = "https://omg10.com/4/11276026";

  showAd(userId?: string): Promise<{ completed: boolean }> {
    return new Promise((resolve) => {
      if (typeof window !== "undefined") {
        const trackingUrl = userId
          ? `${this.directLinkUrl}?userId=${userId}`
          : this.directLinkUrl;

        const popup = window.open(
          trackingUrl,
          "_blank",
          "width=500,height=600",
        );

        if (popup) {
          popup.focus();
        }

        setTimeout(() => {
          resolve({ completed: true });
        }, 15000);
      } else {
        resolve({ completed: false });
      }
    });
  }
}
