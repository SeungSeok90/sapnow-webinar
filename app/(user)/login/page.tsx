import Image from "next/image";
import LoginForm from "@/components/user/LoginForm";
import { createServerClient } from "@/lib/supabase/server";
import { getEntryOpenAt } from "@/lib/utils/time";

export default async function LoginPage() {
  let entryOpenAt: string | null = null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("event_settings")
      .select("video_open_at")
      .eq("id", 1)
      .single();
    entryOpenAt = getEntryOpenAt(data?.video_open_at ?? null)?.toISOString() ?? null;
  } catch {
    // 설정 로드 실패 시 제한 없이 진행
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <Image
        src="/main-background.png"
        alt=""
        fill
        priority
        className="object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/40 -z-10" />

      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="whitespace-nowrap text-[clamp(1.1rem,5vw,1.875rem)] font-bold text-white">
            SAP Business AI 실전가이드 웨비나
          </h1>
        </div>

        <div className="mx-auto w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">로그인</h2>
          <LoginForm entryOpenAt={entryOpenAt} />
        </div>
      </div>
    </main>
  );
}
