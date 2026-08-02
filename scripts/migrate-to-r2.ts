/**
 * R2 Migration Script
 * 
 * Migrates local images from /public to Cloudflare R2 and updates database references.
 * 
 * Usage:
 *   tsx scripts/migrate-to-r2.ts [--dry-run] [--category=games|services|hero-banners|custom-pages|all]
 * 
 * Examples:
 *   tsx scripts/migrate-to-r2.ts --dry-run
 *   tsx scripts/migrate-to-r2.ts --category=games
 *   tsx scripts/migrate-to-r2.ts --category=all
 */

import { readdir, readFile, stat } from 'fs/promises'
import { join, relative, sep } from 'path'
import { r2Upload, r2PublicUrl } from '../lib/r2'
import { createAdminClient } from '../lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

type MigrationCategory = 'games' | 'services' | 'hero-banners' | 'custom-pages' | 'payment-icons' | 'assets' | 'all'

type LocalImage = {
  localPath: string
  relativePath: string
  category: string
  size: number
}

type MigrationResult = {
  localPath: string
  r2Key: string
  r2Url: string
  category: string
  size: number
  dbUpdated: boolean
  error?: string
}

// ─── Configuration ────────────────────────────────────────────────────────────

const PUBLIC_DIR = join(process.cwd(), 'public')

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']

// Map local directories to R2 key prefixes
const DIRECTORY_MAPPING: Record<string, string> = {
  'cover-game': 'games',
  'payment': 'payment-icons',
  'assets': 'assets',
  'logo': 'brand',
  'no-image': 'placeholders',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  
  let category: MigrationCategory = 'all'
  const categoryArg = args.find(arg => arg.startsWith('--category='))
  if (categoryArg) {
    const value = categoryArg.split('=')[1] as MigrationCategory
    if (['games', 'services', 'hero-banners', 'custom-pages', 'payment-icons', 'assets', 'all'].includes(value)) {
      category = value
    }
  }

  return { dryRun, category }
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext))
}

function getR2Key(relativePath: string): string {
  // Normalize path separators to forward slashes
  const normalized = relativePath.split(sep).join('/')
  
  // Extract directory and filename
  const parts = normalized.split('/')
  const directory = parts[0]
  const filename = parts.slice(1).join('/')
  
  // Map directory to R2 prefix
  const r2Prefix = DIRECTORY_MAPPING[directory] || directory
  
  return `${r2Prefix}/${filename}`
}

function getCategoryFromPath(relativePath: string): string {
  const firstDir = relativePath.split(sep)[0]
  return DIRECTORY_MAPPING[firstDir] || firstDir
}

async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    
    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath)
    } else if (entry.isFile() && isImageFile(entry.name)) {
      yield fullPath
    }
  }
}

async function discoverLocalImages(): Promise<LocalImage[]> {
  const images: LocalImage[] = []
  
  for await (const fullPath of walkDirectory(PUBLIC_DIR)) {
    const relativePath = relative(PUBLIC_DIR, fullPath)
    const stats = await stat(fullPath)
    const category = getCategoryFromPath(relativePath)
    
    images.push({
      localPath: fullPath,
      relativePath,
      category,
      size: stats.size,
    })
  }
  
  return images
}

// ─── Upload ───────────────────────────────────────────────────────────────────

async function uploadImageToR2(image: LocalImage): Promise<{ r2Key: string; r2Url: string }> {
  const fileBuffer = await readFile(image.localPath)
  const r2Key = getR2Key(image.relativePath)
  
  // Determine content type
  const ext = image.localPath.toLowerCase().split('.').pop()
  const contentTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'
  
  const { publicUrl } = await r2Upload({
    key: r2Key,
    body: fileBuffer,
    contentType,
  })
  
  return { r2Key, r2Url: publicUrl }
}

// ─── Database Updates ─────────────────────────────────────────────────────────

async function updateDatabaseReferences(
  category: string,
  oldPath: string,
  newUrl: string
): Promise<boolean> {
  const supabase = createAdminClient()
  
  try {
    // Normalize old path to match database format (with leading slash)
    const dbPath = oldPath.startsWith('/') ? oldPath : `/${oldPath}`
    
    switch (category) {
      case 'games': {
        // Update games.image and games.hero_image
        const { error: imageError } = await supabase
          .from('games')
          .update({ image: newUrl, updated_at: new Date().toISOString() })
          .eq('image', dbPath)
        
        const { error: heroError } = await supabase
          .from('games')
          .update({ hero_image: newUrl, updated_at: new Date().toISOString() })
          .eq('hero_image', dbPath)
        
        if (imageError) throw imageError
        if (heroError) throw heroError
        break
      }
      
      case 'games': {
        // Update services.image
        const { error } = await supabase
          .from('services')
          .update({ image: newUrl, updated_at: new Date().toISOString() })
          .eq('image', dbPath)
        
        if (error) throw error
        break
      }
      
      case 'hero-banners': {
        // Update hero_banners.image and hero_banners.thumbnail
        const { error: imageError } = await supabase
          .from('hero_banners')
          .update({ image: newUrl, updated_at: new Date().toISOString() })
          .eq('image', dbPath)
        
        const { error: thumbError } = await supabase
          .from('hero_banners')
          .update({ thumbnail: newUrl, updated_at: new Date().toISOString() })
          .eq('thumbnail', dbPath)
        
        if (imageError) throw imageError
        if (thumbError) throw thumbError
        break
      }
      
      case 'custom-pages': {
        // Update custom_pages.image
        const { error } = await supabase
          .from('custom_pages')
          .update({ image: newUrl, updated_at: new Date().toISOString() })
          .eq('image', dbPath)
        
        if (error) throw error
        break
      }
      
      default:
        // For assets, payment icons, etc., no database update needed
        return true
    }
    
    return true
  } catch (error) {
    console.error(`Database update error for ${oldPath}:`, error)
    return false
  }
}

// ─── Migration ────────────────────────────────────────────────────────────────

async function migrateImage(
  image: LocalImage,
  dryRun: boolean
): Promise<MigrationResult> {
  const result: MigrationResult = {
    localPath: image.relativePath,
    r2Key: '',
    r2Url: '',
    category: image.category,
    size: image.size,
    dbUpdated: false,
  }
  
  try {
    if (dryRun) {
      // Dry run: just compute the target R2 key
      const r2Key = getR2Key(image.relativePath)
      result.r2Key = r2Key
      result.r2Url = r2PublicUrl(r2Key)
      result.dbUpdated = false
    } else {
      // Upload to R2
      const { r2Key, r2Url } = await uploadImageToR2(image)
      result.r2Key = r2Key
      result.r2Url = r2Url
      
      // Update database references
      const dbPath = `/${image.relativePath.split(sep).join('/')}`
      result.dbUpdated = await updateDatabaseReferences(image.category, dbPath, r2Url)
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error)
  }
  
  return result
}

async function migrateAll(category: MigrationCategory, dryRun: boolean) {
  console.log('🔍 Discovering local images...\n')
  
  const allImages = await discoverLocalImages()
  
  // Filter by category if specified
  const images = category === 'all'
    ? allImages
    : allImages.filter(img => img.category === category)
  
  if (images.length === 0) {
    console.log(`❌ No images found for category: ${category}`)
    return
  }
  
  console.log(`📁 Found ${images.length} images to migrate`)
  console.log(`🏷️  Category filter: ${category}`)
  console.log(`🧪 Dry run: ${dryRun ? 'YES' : 'NO'}\n`)
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No uploads or database changes will be made\n')
  }
  
  // Group by category for better output
  const byCategory = images.reduce((acc, img) => {
    if (!acc[img.category]) acc[img.category] = []
    acc[img.category].push(img)
    return acc
  }, {} as Record<string, LocalImage[]>)
  
  const results: MigrationResult[] = []
  let successCount = 0
  let errorCount = 0
  
  for (const [cat, imgs] of Object.entries(byCategory)) {
    console.log(`\n📦 Category: ${cat} (${imgs.length} images)`)
    console.log('─'.repeat(60))
    
    for (const img of imgs) {
      const result = await migrateImage(img, dryRun)
      results.push(result)
      
      if (result.error) {
        console.log(`❌ ${img.relativePath}`)
        console.log(`   Error: ${result.error}`)
        errorCount++
      } else {
        console.log(`✅ ${img.relativePath}`)
        console.log(`   → ${result.r2Key}`)
        if (!dryRun && result.dbUpdated) {
          console.log(`   📝 Database updated`)
        }
        successCount++
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary')
  console.log('='.repeat(60))
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors:  ${errorCount}`)
  console.log(`📦 Total:   ${images.length}`)
  
  const totalSize = images.reduce((sum, img) => sum + img.size, 0)
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)
  console.log(`💾 Total size: ${totalSizeMB} MB`)
  
  if (dryRun) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to perform the actual migration.')
  } else {
    console.log('\n✨ Migration complete!')
  }
  
  // Show errors if any
  if (errorCount > 0) {
    console.log('\n❌ Failed migrations:')
    results
      .filter(r => r.error)
      .forEach(r => {
        console.log(`   ${r.localPath}: ${r.error}`)
      })
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         Cloudflare R2 Image Migration Script              ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  
  const { dryRun, category } = parseArgs()
  
  try {
    await migrateAll(category, dryRun)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
