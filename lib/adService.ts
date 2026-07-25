export class RewardedAdService {
  private directLinkUrl = "https://omg10.com/4/11276026";

  /**
   * Opens the rewarded ad window and returns popup handle for focus tracking.
   */
  showAd(userId?: string): { popup: Window | null; trackingUrl: string } {
    if (typeof window === "undefined") {
      return { popup: null, trackingUrl: this.directLinkUrl };
    }

    const trackingUrl = userId
      ? `${this.directLinkUrl}?userId=${encodeURIComponent(userId)}`
      : this.directLinkUrl;

    // Check if the user is on iOS / mobile Safari where window.open restrictions apply
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    let popup: Window | null = null;

    if (isIOS) {
      // iOS Safari requires a clean window.open without strict sizing or features 
      // to avoid automatic popup blocking.
      popup = window.open(trackingUrl, "_blank");
    } else {
      // Standard Desktop / Android behavior
      popup = window.open(
        trackingUrl,
        "_blank",
        "width=500,height=600,noopener,noreferrer"
      );
    }

    if (popup) {
      try {
        popup.focus();
      } catch (e) {
        // Fallback for strict browser policies
      }
    }

    return { popup, trackingUrl };
  }
}

export const adService = new RewardedAdService();