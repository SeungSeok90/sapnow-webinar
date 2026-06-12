"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface AdminLayoutProps {
  children: React.ReactNode;
  adminName: string;
  adminRole: "super_admin" | "manager";
}

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", roles: ["super_admin", "manager"] },
  { href: "/admin/registrants", label: "등록자 관리", roles: ["super_admin", "manager"] },
  { href: "/admin/viewers", label: "시청 현황", roles: ["super_admin", "manager"] },
  { href: "/admin/settings", label: "행사 설정", roles: ["super_admin"] },
  { href: "/admin/users", label: "관리자 계정", roles: ["super_admin"] },
];

export default function AdminLayout({
  children,
  adminName,
  adminRole,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const visibleNav = navItems.filter((item) =>
    item.roles.includes(adminRole)
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-700">
          <h1 className="font-bold text-sm text-white">SAP NOW 웨비나</h1>
          <p className="text-xs text-gray-400 mt-0.5">어드민</p>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm transition",
                pathname.startsWith(item.href)
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate">{adminName}</p>
          <p className="text-xs text-gray-500 mb-2">
            {adminRole === "super_admin" ? "슈퍼어드민" : "매니저"}
          </p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-xs text-gray-400 hover:text-white transition"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
