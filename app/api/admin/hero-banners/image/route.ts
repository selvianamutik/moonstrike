import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { r2Delete, r2Upload } from "@/lib/r2";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_THUMB_BYTES = 512 * 1024;

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
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

  const now = Date.now();
  const imageKey = `cms/hero-banners/${slug}-${now}.webp`;
  const thumbnailKey = `cms/hero-banners/${slug}-${now}-thumb.webp`;

  try {
    const [imageResult] = await Promise.all([
      r2Upload({ key: imageKey, body: image, contentType: image.type || "image/webp" }),
    ]);

    let thumbnailResult: { publicUrl: string; key: string };
    try {
      thumbnailResult = await r2Upload({
        key: thumbnailKey,
        body: thumbnail,
        contentType: thumbnail.type || "image/webp",
      });
    } catch (thumbError) {
      // Clean up the already-uploaded image if thumbnail fails
      await r2Delete(imageKey).catch(() => null);
      return NextResponse.json(
        { error: thumbError instanceof Error ? thumbError.message : "Thumbnail upload failed." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      action: `Uploaded landing hero banner image for ${slug}`,
      status: "success",
      request,
      admin,
      eventType: "cms",
    });

    return NextResponse.json({
      imageUrl: imageResult.publicUrl,
      thumbnailUrl: thumbnailResult.publicUrl,
      storagePath: imageKey,
      thumbnailPath: thumbnailKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}
