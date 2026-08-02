/**
 * Cloudflare R2 Storage client
 *
 * R2 is S3-compatible, so we use @aws-sdk/client-s3 with a custom endpoint.
 *
 * Required environment variables:
 *   R2_ACCOUNT_ID       – Cloudflare account ID
 *   R2_ACCESS_KEY_ID    – R2 API token access key ID
 *   R2_SECRET_ACCESS_KEY – R2 API token secret access key
 *   R2_BUCKET_NAME      – R2 bucket name (e.g. "moonstrike-media")
 *   R2_PUBLIC_URL       – Public base URL for the bucket
 *                         e.g. https://pub-xxxx.r2.dev  (R2 public bucket URL)
 *                         or   https://media.yourdomain.com  (custom domain)
 */

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type ObjectIdentifier,
} from '@aws-sdk/client-s3'

// ─── Config ──────────────────────────────────────────────────────────────────

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error(
      'Missing R2 environment variables. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL'
    )
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl }
}

// ─── Client (lazy singleton) ──────────────────────────────────────────────────

let _client: S3Client | null = null

function getR2Client(): S3Client {
  if (_client) return _client

  const { accountId, accessKeyId, secretAccessKey } = getR2Config()

  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return _client
}

// ─── Public URL helper ────────────────────────────────────────────────────────

/**
 * Returns the public URL for a stored object key.
 * Strips leading slashes from the key.
 */
export function r2PublicUrl(key: string): string {
  const { publicUrl } = getR2Config()
  const base = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl
  const cleanKey = key.startsWith('/') ? key.slice(1) : key
  return `${base}/${cleanKey}`
}

/**
 * Extracts the storage key from a public R2 URL.
 * Returns null if the URL does not match the configured public URL.
 */
export function r2KeyFromPublicUrl(url: string): string | null {
  try {
    const { publicUrl } = getR2Config()
    const base = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl
    if (!url.startsWith(base + '/')) return null
    return decodeURIComponent(url.slice(base.length + 1))
  } catch {
    return null
  }
}

// ─── Upload ───────────────────────────────────────────────────────────────────

type UploadOptions = {
  /** Object key / storage path (e.g. "games/my-game-123.webp") */
  key: string
  /** File data as Buffer, Uint8Array, Blob, or File */
  body: Buffer | Uint8Array | Blob | File | ArrayBuffer
  contentType: string
  /** Cache-Control header value. Defaults to 1-year immutable. */
  cacheControl?: string
}

/**
 * Uploads a file to R2 and returns the public URL and storage key.
 */
export async function r2Upload({
  key,
  body,
  contentType,
  cacheControl = 'public, max-age=31536000, immutable',
}: UploadOptions): Promise<{ publicUrl: string; key: string }> {
  const client = getR2Client()
  const { bucketName } = getR2Config()

  // Convert Blob / File to Uint8Array for the SDK
  let uploadBody: Uint8Array | Buffer
  if (body instanceof Blob) {
    uploadBody = new Uint8Array(await body.arrayBuffer())
  } else if (body instanceof ArrayBuffer) {
    uploadBody = new Uint8Array(body)
  } else {
    uploadBody = body
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: uploadBody,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  )

  return { publicUrl: r2PublicUrl(key), key }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Deletes a single object from R2.
 * Silently ignores keys that do not exist.
 */
export async function r2Delete(key: string): Promise<void> {
  const client = getR2Client()
  const { bucketName } = getR2Config()

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  )
}

/**
 * Deletes multiple objects from R2 in a single request (max 1000 per call).
 * Keys that do not exist are silently ignored.
 * Returns the number of successfully deleted objects.
 */
export async function r2DeleteMany(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0

  const client = getR2Client()
  const { bucketName } = getR2Config()

  const chunks: string[][] = []
  for (let i = 0; i < keys.length; i += 1000) {
    chunks.push(keys.slice(i, i + 1000))
  }

  let deleted = 0
  for (const chunk of chunks) {
    const objects: ObjectIdentifier[] = chunk.map((Key) => ({ Key }))
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objects },
      })
    )
    deleted += result.Deleted?.length ?? 0
  }

  return deleted
}

// ─── List ─────────────────────────────────────────────────────────────────────

type R2ListItem = {
  key: string
  size: number
  lastModified: Date | null
}

/**
 * Lists all objects under a prefix recursively, handling pagination.
 * Returns at most `maxKeys` results (default: unlimited).
 */
export async function r2List(prefix: string, maxKeys?: number): Promise<R2ListItem[]> {
  const client = getR2Client()
  const { bucketName } = getR2Config()

  const results: R2ListItem[] = []
  let continuationToken: string | undefined

  while (true) {
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix.endsWith('/') ? prefix : `${prefix}/`,
        MaxKeys: maxKeys ? Math.min(maxKeys - results.length, 1000) : 1000,
        ContinuationToken: continuationToken,
      })
    )

    for (const obj of result.Contents ?? []) {
      if (!obj.Key) continue
      results.push({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ?? null,
      })
    }

    if (!result.IsTruncated || (maxKeys && results.length >= maxKeys)) break
    continuationToken = result.NextContinuationToken
  }

  return results
}
