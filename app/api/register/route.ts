import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { RegisterRequest } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const {
      name,
      company,
      email,
      phone,
      department,
      title,
      privacy_agreed,
      profile_public_agreed,
      marketing_email_agreed,
      marketing_phone_agreed,
    } = body;

    // 필수 항목 검증
    if (!name || !company || !email || !phone || !department || !title || !privacy_agreed) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "유효한 이메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const supabase = createServerClient();

    const marketingChannel =
      marketing_email_agreed && marketing_phone_agreed
        ? "Both"
        : marketing_email_agreed
        ? "Email"
        : marketing_phone_agreed
        ? "Phone"
        : "Not applicable";

    const { error } = await supabase.from("registrants").insert({
      name: name.trim(),
      company: company.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      department: department.trim(),
      title: title.trim(),
      privacy_agreed: true,
      privacy_agreed_at: now,
      profile_public_agreed: profile_public_agreed ?? false,
      profile_public_agreed_at: profile_public_agreed ? now : null,
      marketing_agreed: marketingChannel !== "Not applicable",
      marketing_agreed_at: marketingChannel !== "Not applicable" ? now : null,
      marketing_channel: marketingChannel,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "이미 등록된 이메일 주소입니다." },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
