import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { userSessionOptions } from "@/lib/session/user";
import VideoPlayer from "@/components/user/VideoPlayer";
import LogoutButton from "@/components/user/LogoutButton";
import type { UserSessionData } from "@/types/session";
import type { EventSettings } from "@/types/database";

export default async function WatchPage() {
  const session = await getIronSession<{ user?: UserSessionData }>(
    cookies(),
    userSessionOptions
  );

  if (!session.user) {
    redirect("/login");
  }

  // 행사 설정 로드
  let settings: EventSettings | null = null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("event_settings")
      .select("*")
      .eq("id", 1)
      .single();
    settings = data;
  } catch {
    // 설정 로드 실패 시 환경변수 fallback 사용
  }

  const streamUrl =
    settings?.stream_url ||
    process.env.IVS_PLAYBACK_URL ||
    "";

  const videoOpenAt = settings?.video_open_at
    ? new Date(settings.video_open_at)
    : null;
  const videoCloseAt = settings?.video_close_at
    ? new Date(settings.video_close_at)
    : null;
  const now = new Date();
  const isBeforeOpen = videoOpenAt ? now < videoOpenAt : false;
  const isAfterClose = videoCloseAt ? now > videoCloseAt : false;

  return (
    <div className="relative min-h-screen text-white">
      <Image
        src="/login-background.png"
        alt=""
        fill
        priority
        className="object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/70 -z-10" />

      {/* 헤더 */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src="/icon.png"
              alt="SAP"
              width={28}
              height={28}
              className="shrink-0 rounded"
            />
            <h1 className="truncate text-base font-bold sm:text-lg">
              SAP NOW AI Tour KOREA
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-gray-300 sm:inline">
              {session.user.name}님
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div>
          {isBeforeOpen ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-6">⏰</div>
            <h2 className="text-2xl font-bold mb-2">영상 시청 준비 중</h2>
            <p className="text-gray-400">
              {videoOpenAt?.toLocaleString("ko-KR")}에 시작됩니다.
            </p>
          </div>
        ) : isAfterClose ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold mb-2">시청 가능 시간이 종료되었습니다</h2>
            <p className="text-gray-400">
              시청 마감: {videoCloseAt?.toLocaleString("ko-KR")}
            </p>
          </div>
        ) : streamUrl ? (
          <VideoPlayer streamUrl={streamUrl} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-6">🎬</div>
            <h2 className="text-2xl font-bold mb-2">영상 준비 중</h2>
            <p className="text-gray-400">잠시 후 영상이 제공될 예정입니다.</p>
          </div>
          )}
        </div>

        {/* 하단 안내 영역 */}
        <div className="mt-10 border-t border-gray-700 pt-8 space-y-6">
          {/* 시청 안내 */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h3 className="font-semibold mb-2 text-gray-200">시청 안내</h3>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>안정적인 시청을 위해 크롬 브라우저를 권장합니다.</li>
              <li>영상은 등록하신 본인만 시청 가능합니다.</li>
            </ul>
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-wrap gap-3">
            {settings?.survey_url && (
              <a
                href={settings.survey_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                설문 참여하기
              </a>
            )}
            {settings?.material_url && (
              <a
                href={settings.material_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                자료 다운로드
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
