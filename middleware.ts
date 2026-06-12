import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

const USER_SESSION_OPTIONS = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "user_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24,
  },
};

const ADMIN_SESSION_OPTIONS = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8,
  },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 영상 시청 페이지 보호
  if (pathname.startsWith("/watch")) {
    const session = await getIronSession<{ user?: { registrantId: string } }>(
      request,
      response,
      USER_SESSION_OPTIONS
    );
    if (!session.user?.registrantId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 어드민 페이지 보호 (로그인 페이지 제외)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await getIronSession<{
      admin?: { adminId: string; role: string };
    }>(request, response, ADMIN_SESSION_OPTIONS);

    if (!session.admin?.adminId) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // super_admin 전용 페이지 접근 제한
    const superAdminOnlyPaths = ["/admin/settings", "/admin/users"];
    if (
      superAdminOnlyPaths.some((p) => pathname.startsWith(p)) &&
      session.admin.role !== "super_admin"
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/watch/:path*", "/admin/:path*"],
};
