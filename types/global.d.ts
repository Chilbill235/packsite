// types/global.d.ts
export {}; 

declare global {
  type OneSignalPermissionChangeHandler = (isGranted: boolean) => void;

  interface PacksiteOneSignal {
    Notifications: {
      permissionNative: NotificationPermission;
      requestPermission(): Promise<boolean>;
      addEventListener(event: "permissionChange", listener: OneSignalPermissionChangeHandler): void;
      setDefaultUrl(url: string): Promise<void>;
    };
    login(externalId: string): Promise<void>;
  }

  interface Window {
    googletag: googletag.Service;
    OneSignalDeferred?: Array<(OneSignal: PacksiteOneSignal) => void | Promise<void>>;
    __packsiteOneSignalInitQueued?: boolean;
  }
}
