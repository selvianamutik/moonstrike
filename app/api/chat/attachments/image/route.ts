import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { getCurrentUser } from '@/lib/auth/session'
import { CMS_MEDIA_BUCKET, getStoragePathFromPublicUrl } from '@/lib/cms/storage'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'chat'
}

async function ensureBucket() {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.getBucket(CMS_MEDIA_BUCKET)

  if (!error) return

  const { error: createError } = await supabase.storage.createBucket(CMS_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_BYTES}`,
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/gif'],
  })

  if (createError && !createError.message.toLowerCase().includes('already')) {
    throw createError
  }
}

export async function POST(request: NextRequest) {
  const [user, admin] = await Promise.all([getCurrentUser(), getAdminSession()])
  if (!user && !admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const formData = await request.formData()
  const image = formData.get('image')

  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Image file is required.' }, { status: 400 })
  }

  if (!image.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads are allowed.' }, { status: 400 })
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image must be 5MB or smaller.' }, { status: 400 })
  }

  await ensureBucket()

  const supabase = createAdminClient()
  const extension = image.type === 'image/png' ? 'png' : image.type === 'image/gif' ? 'gif' : image.type === 'image/webp' ? 'webp' : 'jpg'
  const owner = safeFilePart(user?.id ?? admin?.id ?? 'chat')
  const imagePath = `chat/${owner}-${Date.now()}.${extension}`

  const { error } = await supabase.storage.from(CMS_MEDIA_BUCKET).upload(imagePath, image, {
    contentType: image.type || 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from(CMS_MEDIA_BUCKET).getPublicUrl(imagePath)

  return NextResponse.json({
    attachment: {
      type: 'image',
      url: data.publicUrl,
      filename: image.name,
      sizeBytes: image.size,
      storagePath: imagePath,
    },
  })
}

export async function DELETE(request: NextRequest) {
  const [user, admin] = await Promise.all([getCurrentUser(), getAdminSession()])
  if (!user && !admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const storagePath =
    typeof body?.storagePath === 'string'
      ? body.storagePath
      : typeof body?.url === 'string'
        ? getStoragePathFromPublicUrl(body.url)
        : null

  if (!storagePath || !storagePath.startsWith('chat/')) {
    return NextResponse.json({ error: 'Invalid chat attachment path.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(CMS_MEDIA_BUCKET).remove([storagePath])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
