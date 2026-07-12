export class RewardedAdService {
  private isInitialized = false;

  constructor() {}

  init() {
    if (typeof window === "undefined" || this.isInitialized) return;
    const script = document.createElement("script");
    script.src = "YOUR_AD_NETWORK_SCRIPT_URL_HERE";
    script.async = true;
    script.onload = () => {
      this.isInitialized = true;
    };
    document.body.appendChild(script);
  }

  showAd() {
    if (typeof (window as any).show_content_locker === "function") {
      (window as any).show_content_locker();
    }
  }
}