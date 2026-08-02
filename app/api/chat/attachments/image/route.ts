import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { getCurrentUser } from '@/lib/auth/session'
import { getStoragePathFromPublicUrl } from '@/lib/cms/storage'
import { r2Delete, r2Upload } from '@/lib/r2'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'chat'
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

  const extension = image.type === 'image/png' ? 'png' : image.type === 'image/gif' ? 'gif' : image.type === 'image/webp' ? 'webp' : 'jpg'
  const owner = safeFilePart(user?.id ?? admin?.id ?? 'chat')
  const key = `chat/${owner}-${Date.now()}.${extension}`

  try {
    const { publicUrl } = await r2Upload({
      key,
      body: image,
      contentType: image.type || 'image/jpeg',
    })

    return NextResponse.json({
      attachment: {
        type: 'image',
        url: publicUrl,
        filename: image.name || key.split('/').pop() || 'image',
        sizeBytes: image.size,
        storagePath: key,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 500 }
    )
  }
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

  try {
    await r2Delete(storagePath)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed.' },
      { status: 500 }
    )
  }
}
