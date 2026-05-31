import { NextResponse } from "next/server";
import { listActiveCatalogGames } from "@/lib/cms/games";
import { listActiveServices, serviceRowToCatalogService } from "@/lib/cms/services";

export async function GET() {
  const [games, services] = await Promise.all([listActiveCatalogGames(), listActiveServices()]);

  return NextResponse.json({
    games,
    services: services.map(serviceRowToCatalogService),
  });
}
