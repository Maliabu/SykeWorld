import { requireAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ActivityLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
    return <>{children}</>;
  } catch (error) {
    redirect("/admin/dashboard/home");
  }
}



