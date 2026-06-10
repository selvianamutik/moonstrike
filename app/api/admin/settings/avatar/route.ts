import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { CMS_MEDIA_BUCKET } from "@/lib/cms/storage";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Compressed image is too large." }, { status: 400 });
  }

  await ensureBucket();

  const supabase = createAdminClient();
  const imagePath = `admins/${admin.id}/avatar-${Date.now()}.webp`;
  const { error } = await supabase.storage.from(CMS_MEDIA_BUCKET).upload(imagePath, image, {
    contentType: image.type || "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(CMS_MEDIA_BUCKET).getPublicUrl(imagePath);

  await writeAuditLog({
    action: "Uploaded admin avatar",
    status: "success",
    request,
    admin,
  });

  return NextResponse.json({
    imageUrl: data.publicUrl,
    storagePath: imagePath,
  });
}
