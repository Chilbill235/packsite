// lib/adService.ts
export class RewardedAdService {
  private adSlot: any = null;

  init() {
    window.googletag = window.googletag || { cmd: [] };
    window.googletag.cmd.push(() => {
      // Ensure the path below matches your GAM dashboard exactly
      this.adSlot = window.googletag.defineOutOfPageSlot(
        '/9699378693/RunEm_modal', 
        window.googletag.enums.OutOfPageFormat.REWARDED
      );

      if (this.adSlot) {
        this.adSlot.addService(window.googletag.pubads());
        
        window.googletag.pubads().addEventListener('RewardedSlotGrantedEvent', () => {
          console.log("Reward granted to user!");
          // Trigger your coin/reward state update here
        });
      }
      window.googletag.enableServices();
    });
  }

  showAd() {
    window.googletag.cmd.push(() => {
      window.googletag.display(this.adSlot);
    });
  }
}