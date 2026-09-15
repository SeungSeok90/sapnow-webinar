// 서버(Vercel 서버리스, 기본 UTC)와 클라이언트(브라우저, 사용자 로컬 시간대)가
// 서로 다른 시스템 시간대에서 실행되기 때문에, timeZone을 명시하지 않은
// toLocaleString 계열 호출은 실행 환경에 따라 다른 시각을 표시하게 된다.
// 행사가 한국 단일 시간대 기준이므로 항상 KST로 고정해서 포맷한다.
const KST_TIME_ZONE = "Asia/Seoul";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatKST(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = ""
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleString("ko-KR", { timeZone: KST_TIME_ZONE, ...options });
}

export function getKSTDateStamp(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: KST_TIME_ZONE }).replace(/-/g, "");
}

export function formatKSTTime(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback = ""
): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleTimeString("ko-KR", { timeZone: KST_TIME_ZONE, ...options });
}

// 시청 페이지 입장은 영상 오픈 시각보다 15분 먼저 허용한다.
export const ENTRY_LEAD_MINUTES = 15;

export function getEntryOpenAt(videoOpenAt: string | null | undefined): Date | null {
  const openAt = toDate(videoOpenAt);
  if (!openAt) return null;
  return new Date(openAt.getTime() - ENTRY_LEAD_MINUTES * 60 * 1000);
}
