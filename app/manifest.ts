// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PackSite',
    short_name: 'PackSite',
    description: 'Pick and open your packs!',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000', // This is the color shown during launch
    theme_color: '#000000',       // This colors the status bar
    icons: [
      {
        src: '/apple-touch-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}