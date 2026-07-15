import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://packsite.vercel.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // If you have other pages (e.g. /packs, /search, etc.), you can add them below:
    // {
    //   url: `${baseUrl}/packs`,
    //   lastModified: new Date(),
    //   changeFrequency: 'daily',
    //   priority: 0.8,
    // },
  ]
}