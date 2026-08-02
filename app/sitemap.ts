import { MetadataRoute } from 'next'
import { listActiveCatalogGames } from '@/lib/cms/games'
import { listActiveServices } from '@/lib/cms/services'
import { getGameServiceDetailHref } from '@/lib/cms/game-services'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonstrike.pro'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = []

  // Static pages
  const staticPages = [
    '',
    '/games',
    '/services',
    '/guide',
    '/blog',
    '/login',
    '/register',
    '/cart',
  ]

  staticPages.forEach((path) => {
    sitemap.push({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' ? 'daily' : 'weekly',
      priority: path === '' ? 1.0 : 0.8,
    })
  })

  // Dynamic game pages
  try {
    const games = await listActiveCatalogGames()
    
    games.forEach((game) => {
      sitemap.push({
        url: `${BASE_URL}/${game.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      })
    })

    // Dynamic service pages
    const services = await listActiveServices()
    
    services.forEach((service) => {
      const href = getGameServiceDetailHref({
        gameSlug: service.game_slug,
        slug: service.slug,
        serviceCategorySlug: service.service_category_slug,
      })
      
      sitemap.push({
        url: `${BASE_URL}${href}`,
        lastModified: new Date(service.updated_at),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return sitemap
}
