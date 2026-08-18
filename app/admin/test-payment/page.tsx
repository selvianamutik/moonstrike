import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { listAdminServices } from "@/lib/cms/services";
import { TestPaymentClient } from "./TestPaymentClient";

export const dynamic = "force-dynamic";

export default async function TestPaymentPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login?next=/admin/test-payment");

  if (admin.role !== "super_admin") {
    redirect("/admin/dashboard");
  }

  const services = await listAdminServices();
  const options = services
    .map((service) => ({
      id: service.id,
      title: service.title,
      gameName: service.game_name,
    }))
    .sort((a, b) => a.gameName.localeCompare(b.gameName) || a.title.localeCompare(b.title));

  return <TestPaymentClient services={options} />;
}