import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { adminSessionOptions } from "@/lib/session/admin";
import AdminLayout from "@/components/admin/AdminLayout";
import type { AdminSessionData } from "@/types/session";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<{ admin?: AdminSessionData }>(
    cookies(),
    adminSessionOptions
  );

  // 세션 없으면 그냥 children (로그인 페이지)
  if (!session.admin) {
    return <>{children}</>;
  }

  return (
    <AdminLayout adminName={session.admin.name} adminRole={session.admin.role}>
      {children}
    </AdminLayout>
  );
}
