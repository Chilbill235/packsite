// types/global.d.ts

export {}; // This ensures the file is treated as a module

declare global {
  interface Window {
    // If you installed @types/google-publisher-tag, use 'GoogleTag'
    // If not, just use 'any' to stop the build error immediately
    googletag: any; 
  }
}