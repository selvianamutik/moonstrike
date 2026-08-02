import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import { r2Upload } from '@/lib/r2'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const formData = await request.formData()
  const image = formData.get('image')
  const slug =
    typeof formData.get('slug') === 'string'
      ? safeFilePart(String(formData.get('slug')))
      : 'service'

  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Image file is required.' }, { status: 400 })
  }

  if (!image.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads are allowed.' }, { status: 400 })
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Compressed image is too large.' }, { status: 400 })
  }

  const key = `services/${slug}-${Date.now()}.webp`

  try {
    const { publicUrl } = await r2Upload({
      key,
      body: image,
      contentType: image.type || 'image/webp',
    })

    await writeAuditLog({
      action: `Uploaded service image for ${slug}`,
      status: 'success',
      request,
      admin,
    })

    return NextResponse.json({
      imageUrl: publicUrl,
      storagePath: key,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 500 }
    )
  }
}
