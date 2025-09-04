import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://chartz.ai'
  
  // Define your static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/app`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    // Add more routes as your app grows
    // {
    //   url: `${baseUrl}/pricing`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly' as const,
    //   priority: 0.8,
    // },
    // {
    //   url: `${baseUrl}/features`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly' as const,
    //   priority: 0.7,
    // },
  ]

  // TODO: Add dynamic routes here when you have them
  // For example, if you add a blog or user profiles:
  // const dynamicRoutes = await fetchDynamicRoutes()
  
  return staticRoutes
}