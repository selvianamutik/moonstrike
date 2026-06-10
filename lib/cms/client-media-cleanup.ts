export async function cleanupUploadedMedia(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.map((path) => path.trim()).filter(Boolean)));

  if (uniquePaths.length === 0) return;

  await fetch("/api/admin/media", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths: uniquePaths }),
  }).catch(() => undefined);
}
