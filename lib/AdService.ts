// D:\Users\kapon\site\packsite\lib\adService.ts

export class RewardedAdService {
  private isInitialized = false;

  constructor() {
    // This runs when the service is instantiated in your component
  }

  init() {
    if (typeof window === "undefined" || this.isInitialized) return;

    // Replace the URL below with the actual "Content Locker" script URL 
    // provided by your ad network (AdMaven/Adsterra dashboard)
    const script = document.createElement("script");
    script.src = "YOUR_AD_NETWORK_SCRIPT_URL_HERE";
    script.async = true;
    script.onload = () => {
      this.isInitialized = true;
      console.log("Ad Service: Content Locker Loaded");
    };
    document.body.appendChild(script);
  }

  showAd() {
    // This assumes the ad network exposes a global function to open the locker.
    // Check your ad network's "Integration" documentation for the specific function name.
    // Common examples are: "show_content_locker()", "adNetwork.open()", or "show_interstitial()"
    if (typeof (window as any).show_content_locker === "function") {
      (window as any).show_content_locker();
    } else {
      console.warn("Ad Service: Content locker function not found. Did the script load?");
    }
  }
}