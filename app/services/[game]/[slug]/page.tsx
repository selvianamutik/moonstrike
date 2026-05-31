import { redirect } from "next/navigation";

export default async function LegacyServicePage({
  params,
}: {
  params: Promise<{ game: string; slug: string }>;
}) {
  const { game, slug } = await params;
  redirect(`/${game}/${slug}`);
}
