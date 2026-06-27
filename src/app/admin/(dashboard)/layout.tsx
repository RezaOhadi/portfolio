import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-ink">
      <AdminSidebar email={user.email} />
      <div className="pt-16 md:pl-64 md:pt-0">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-12">{children}</div>
      </div>
    </div>
  );
}
