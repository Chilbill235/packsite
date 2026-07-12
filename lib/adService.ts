// lib/adService.ts
import createAdHandler from 'monetag-tg-sdk';

export class RewardedAdService {
  private adHandler: any;

  constructor(zoneId: string) {
    this.adHandler = createAdHandler(zoneId);
  }

  async showAd(userId: string) {
    try {
      // Trigger the ad and pass the userId as ymid for postback tracking
      await this.adHandler({ ymid: userId });
      console.log("Ad interaction initiated");
    } catch (err) {
      console.error("Ad failed to show:", err);
    }
  }
}