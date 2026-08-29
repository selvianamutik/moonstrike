/**
 * Update R2 URLs in database from pub-*.r2.dev to custom domain
 * 
 * Run: npx tsx scripts/update-r2-urls.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'

const OLD_R2_URL = 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev'
const NEW_R2_URL = 'https://media.moonstrike.pro'

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')

  console.log('🔄 R2 URL Migration')
  console.log(`   Old: ${OLD_R2_URL}`)
  console.log(`   New: ${NEW_R2_URL}`)
  console.log(`   Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE environment variables')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Update games table
  console.log('📦 Checking games table...')
  const { data: games } = await supabase
    .from('games')
    .select('id, name, image, hero_image')
    .or(`image.like.${OLD_R2_URL}%,hero_image.like.${OLD_R2_URL}%`)

  if (games && games.length > 0) {
    console.log(`   Found ${games.length} games to update`)
    for (const game of games) {
      const updates: any = {}
      if (game.image?.startsWith(OLD_R2_URL)) {
        updates.image = game.image.replace(OLD_R2_URL, NEW_R2_URL)
      }
      if (game.hero_image?.startsWith(OLD_R2_URL)) {
        updates.hero_image = game.hero_image.replace(OLD_R2_URL, NEW_R2_URL)
      }

      if (!isDryRun) {
        await supabase.from('games').update(updates).eq('id', game.id)
      }
      console.log(`   ✓ ${game.name}`)
    }
  } else {
    console.log('   No games to update')
  }

  // Update services table
  console.log('\n📦 Checking services table...')
  const { data: services } = await supabase
    .from('services')
    .select('id, title, image')
    .like('image', `${OLD_R2_URL}%`)

  if (services && services.length > 0) {
    console.log(`   Found ${services.length} services to update`)
    for (const service of services) {
      const newImage = service.image.replace(OLD_R2_URL, NEW_R2_URL)
      if (!isDryRun) {
        await supabase.from('services').update({ image: newImage }).eq('id', service.id)
      }
      console.log(`   ✓ ${service.title}`)
    }
  } else {
    console.log('   No services to update')
  }

  // Update hero_banners table
  console.log('\n📦 Checking hero_banners table...')
  const { data: heroBanners } = await supabase
    .from('hero_banners')
    .select('id, name, image, thumbnail')
    .or(`image.like.${OLD_R2_URL}%,thumbnail.like.${OLD_R2_URL}%`)

  if (heroBanners && heroBanners.length > 0) {
    console.log(`   Found ${heroBanners.length} hero banners to update`)
    for (const banner of heroBanners) {
      const updates: any = {}
      if (banner.image?.startsWith(OLD_R2_URL)) {
        updates.image = banner.image.replace(OLD_R2_URL, NEW_R2_URL)
      }
      if (banner.thumbnail?.startsWith(OLD_R2_URL)) {
        updates.thumbnail = banner.thumbnail.replace(OLD_R2_URL, NEW_R2_URL)
      }

      if (!isDryRun) {
        await supabase.from('hero_banners').update(updates).eq('id', banner.id)
      }
      console.log(`   ✓ ${banner.name}`)
    }
  } else {
    console.log('   No hero banners to update')
  }

  // Update content_blocks table
  console.log('\n📦 Checking content_blocks table...')
  const { data: contentBlocks } = await supabase
    .from('content_blocks')
    .select('id, name, data, thumbnail')
    .or(`thumbnail.like.${OLD_R2_URL}%`)

  if (contentBlocks && contentBlocks.length > 0) {
    console.log(`   Found ${contentBlocks.length} content blocks to update`)
    for (const block of contentBlocks) {
      const updates: any = {}
      
      if (block.thumbnail?.startsWith(OLD_R2_URL)) {
        updates.thumbnail = block.thumbnail.replace(OLD_R2_URL, NEW_R2_URL)
      }

      // Update URLs in JSON data field
      if (block.data && typeof block.data === 'object') {
        const dataStr = JSON.stringify(block.data)
        if (dataStr.includes(OLD_R2_URL)) {
          updates.data = JSON.parse(dataStr.replace(new RegExp(OLD_R2_URL, 'g'), NEW_R2_URL))
        }
      }

      if (Object.keys(updates).length > 0 && !isDryRun) {
        await supabase.from('content_blocks').update(updates).eq('id', block.id)
      }
      console.log(`   ✓ ${block.name}`)
    }
  } else {
    console.log('   No content blocks to update')
  }

  // Update custom_pages table
  console.log('\n📦 Checking custom_pages table...')
  const { data: customPages } = await supabase
    .from('custom_pages')
    .select('id, title, image')
    .like('image', `${OLD_R2_URL}%`)

  if (customPages && customPages.length > 0) {
    console.log(`   Found ${customPages.length} custom pages to update`)
    for (const page of customPages) {
      const newImage = page.image.replace(OLD_R2_URL, NEW_R2_URL)
      if (!isDryRun) {
        await supabase.from('custom_pages').update({ image: newImage }).eq('id', page.id)
      }
      console.log(`   ✓ ${page.title}`)
    }
  } else {
    console.log('   No custom pages to update')
  }

  console.log(`\n${isDryRun ? '✓ Dry run complete' : '✅ Migration complete'}`)
}

main().catch(console.error)
