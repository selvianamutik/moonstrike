import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { CMS_MEDIA_BUCKET } from "@/lib/cms/storage";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_THUMB_BYTES = 512 * 1024;

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

async function ensureBucket() {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.getBucket(CMS_MEDIA_BUCKET);

  if (!error) return;

  const { error: createError } = await supabase.storage.createBucket(CMS_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_BYTES}`,
    allowedMimeTypes: ["image/webp", "image/jpeg", "image/png"],
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  const thumbnail = formData.get("thumbnail");
  const slug = typeof formData.get("slug") === "string" ? safeFilePart(String(formData.get("slug"))) : "hero-banner";

  if (!(image instanceof File) || !(thumbnail instanceof File)) {
    return NextResponse.json({ error: "Image and thumbnail files are required." }, { status: 400 });
  }

  if (!image.type.startsWith("image/") || !thumbnail.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES || thumbnail.size > MAX_THUMB_BYTES) {
    return NextResponse.json({ error: "Compressed image is too large." }, { status: 400 });
  }

  await ensureBucket();

  const supabase = createAdminClient();
  const now = Date.now();
  const imagePath = `cms/hero-banners/${slug}-${now}.webp`;
  const thumbnailPath = `cms/hero-banners/${slug}-${now}-thumb.webp`;

  const { error: imageError } = await supabase.storage.from(CMS_MEDIA_BUCKET).upload(imagePath, image, {
    contentType: image.type || "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const { error: thumbnailError } = await supabase.storage.from(CMS_MEDIA_BUCKET).upload(thumbnailPath, thumbnail, {
    contentType: thumbnail.type || "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });

  if (thumbnailError) {
    await supabase.storage.from(CMS_MEDIA_BUCKET).remove([imagePath]);
    return NextResponse.json({ error: thumbnailError.message }, { status: 500 });
  }

  const { data: imagePublic } = supabase.storage.from(CMS_MEDIA_BUCKET).getPublicUrl(imagePath);
  const { data: thumbnailPublic } = supabase.storage.from(CMS_MEDIA_BUCKET).getPublicUrl(thumbnailPath);

  await writeAuditLog({
    action: `Uploaded landing hero banner image for ${slug}`,
    status: "success",
    request,
    admin,
    eventType: "cms",
  });

  return NextResponse.json({
    imageUrl: imagePublic.publicUrl,
    thumbnailUrl: thumbnailPublic.publicUrl,
    storagePath: imagePath,
    thumbnailPath,
  });
}
