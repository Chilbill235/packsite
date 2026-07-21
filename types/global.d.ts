// Extend NextAuth Session type to include custom fields
declare module "@auth/core/jwt" {
  interface JWT {
    username?: string | null;
    image?: string | null;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
  interface User {
    username?: string | null;
  }
  interface JWT {
    username?: string | null;
  }
}

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
