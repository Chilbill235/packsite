import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PackSite',
    short_name: 'PackSite',
    description: 'The ultimate platform for opening digital packs and earning rewards.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/apple-touch-icon.png', // Ensure this file is in your /public folder
        sizes: '240x240',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Open Packs',
        short_name: 'Packs',
        url: '/shop',
      },
    ],
  }
}