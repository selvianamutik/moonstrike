import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.moonstrike.pro'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/cart/',
          '/checkout/',
          '/login',
          '/register',
          '/auth/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: '/private/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
