import { r2KeyFromPublicUrl } from '@/lib/r2'

export const CMS_MEDIA_BUCKET =
  process.env.SUPABASE_MEDIA_BUCKET || 'media'

export function getChangedStoragePaths(
  oldData: unknown,
  newData: unknown
) {
  const oldRecord =
    oldData && typeof oldData === 'object' ? oldData as Record<string, unknown> : {}
  const newRecord =
    newData && typeof newData === 'object' ? newData as Record<string, unknown> : {}

  // Collect all paths currently referenced by the new data
  const newPaths = new Set<string>()

  // Single-image fields (legacy / hero)
  for (const field of ['storagePath', 'thumbnailPath']) {
    const v = newRecord[field]
    if (typeof v === 'string' && v.length > 0) newPaths.add(v)
  }

  // images[] array (benefits_section carousel)
  if (Array.isArray(newRecord.images)) {
    for (const img of newRecord.images as Record<string, unknown>[]) {
      if (img && typeof img === 'object') {
        for (const field of ['storagePath', 'thumbnailPath']) {
          const v = img[field]
          if (typeof v === 'string' && v.length > 0) newPaths.add(v)
        }
      }
    }
  }

  // Collect all paths previously held by the old data
  const oldPaths: string[] = []

  for (const field of ['storagePath', 'thumbnailPath']) {
    const v = oldRecord[field]
    if (typeof v === 'string' && v.length > 0) oldPaths.push(v)
  }

  if (Array.isArray(oldRecord.images)) {
    for (const img of oldRecord.images as Record<string, unknown>[]) {
      if (img && typeof img === 'object') {
        for (const field of ['storagePath', 'thumbnailPath']) {
          const v = img[field]
          if (typeof v === 'string' && v.length > 0) oldPaths.push(v)
        }
      }
    }
  }

  // Return old paths that are no longer referenced in the new data
  return oldPaths.filter((path) => !newPaths.has(path))
}


/**
 * Extracts the storage key/path from a public URL.
 * Supports both R2 public URLs and legacy Supabase storage URLs.
 */
export function getStoragePathFromPublicUrl(url: string): string | null {
  // Try R2 URL first
  const r2Key = r2KeyFromPublicUrl(url)
  if (r2Key) return r2Key

  // Legacy: Supabase storage URL
  const marker = `/storage/v1/object/public/${CMS_MEDIA_BUCKET}/`
  const markerIndex = url.indexOf(marker)
  if (markerIndex !== -1) {
    return decodeURIComponent(url.slice(markerIndex + marker.length))
  }

  return null
}
