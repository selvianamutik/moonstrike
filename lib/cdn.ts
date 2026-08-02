/**
 * CDN URL helpers for R2 image assets
 */

/**
 * Convert a local public path to R2 CDN URL
 * Falls back to local path if R2 is not configured
 */
export function cdnUrl(path: string): string {
  // Use client-side env for browser, server env for SSR
  const R2_URL = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_R2_URL 
    : process.env.R2_PUBLIC_URL

  if (!R2_URL) {
    // R2 not configured, return local path
    return path
  }

  // Already an R2 URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Remove leading slash and 'public/' prefix
  let cleanPath = path.startsWith('/') ? path.slice(1) : path
  if (cleanPath.startsWith('public/')) {
    cleanPath = cleanPath.slice(7)
  }

  // Map directories to R2 prefixes
  const mapping: Record<string, string> = {
    'cover-game': 'games',
    'payment': 'payment-icons',
    'assets': 'assets',
    'logo': 'brand',
    'no-image': 'placeholders',
  }

  // Apply directory mapping
  for (const [local, r2] of Object.entries(mapping)) {
    if (cleanPath.startsWith(`${local}/`)) {
      cleanPath = cleanPath.replace(`${local}/`, `${r2}/`)
      break
    }
  }

  const base = R2_URL.endsWith('/') ? R2_URL.slice(0, -1) : R2_URL
  return `${base}/${cleanPath}`
}

/**
 * Get optimized image URL with optional transformations
 * Useful if using Cloudflare Image Resizing
 */
export function cdnImage(
  path: string,
  options?: {
    width?: number
    height?: number
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
    format?: 'auto' | 'webp' | 'avif' | 'json'
    quality?: number
  }
): string {
  const baseUrl = cdnUrl(path)

  // If using Cloudflare Image Resizing, append transformations
  // See: https://developers.cloudflare.com/images/url-format
  if (options && Object.keys(options).length > 0) {
    const params = new URLSearchParams()
    if (options.width) params.set('width', options.width.toString())
    if (options.height) params.set('height', options.height.toString())
    if (options.fit) params.set('fit', options.fit)
    if (options.format) params.set('format', options.format)
    if (options.quality) params.set('quality', options.quality.toString())

    // This assumes you've set up Cloudflare Image Resizing
    // Remove this if you're not using it
    return `${baseUrl}?${params.toString()}`
  }

  return baseUrl
}
