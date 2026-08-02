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
  const oldPaths = [oldRecord.storagePath, oldRecord.thumbnailPath].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  )
  const newPaths = new Set(
    [newRecord.storagePath, newRecord.thumbnailPath].filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    )
  )

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
