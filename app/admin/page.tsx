import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminIndexPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  redirect("/admin/reviews");
}
