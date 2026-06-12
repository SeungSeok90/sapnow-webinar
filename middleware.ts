import { NextRequest, NextResponse } from "next/server";

// Edge Runtime 호환: 쿠키 존재 여부만 확인
// 실제 세션 유효성 검증은 각 페이지의 서버 컴포넌트에서 iron-session으로 수행
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 영상 시청 페이지 보호
  if (pathname.startsWith("/watch")) {
    if (!request.cookies.has("user_session")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 어드민 페이지 보호 (로그인 페이지 제외)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!request.cookies.has("admin_session")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/watch/:path*", "/admin/:path*"],
};
