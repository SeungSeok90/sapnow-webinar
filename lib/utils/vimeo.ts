/**
 * 관리자가 입력한 Vimeo URL(https://vimeo.com/ID, https://vimeo.com/ID/HASH,
 * https://player.vimeo.com/video/ID?h=HASH, https://vimeo.com/event/ID/embed
 * 등 Live Event 형식) 또는 순수 숫자 ID를 받아 Vimeo player embed URL로 변환한다.
 */
export function buildVimeoEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let id: string | null = null;
  let hash: string | null = null;
  let isEvent = false;

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const videoIdx = segments.indexOf("video");
    const eventIdx = segments.indexOf("event");

    if (eventIdx >= 0 && segments[eventIdx + 1]) {
      id = segments[eventIdx + 1];
      isEvent = true;
    } else if (videoIdx >= 0 && segments[videoIdx + 1]) {
      id = segments[videoIdx + 1];
    } else if (segments[0] && /^\d+$/.test(segments[0])) {
      id = segments[0];
      if (segments[1]) hash = segments[1];
    }

    if (url.searchParams.get("h")) hash = url.searchParams.get("h");
  } catch {
    if (/^\d+$/.test(trimmed)) id = trimmed;
  }

  if (!id) return null;

  if (isEvent) {
    const params = new URLSearchParams({ autoplay: "1" });
    return `https://vimeo.com/event/${id}/embed?${params.toString()}`;
  }

  const params = new URLSearchParams({ title: "0", byline: "0", portrait: "0", dnt: "1" });
  if (hash) params.set("h", hash);

  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}
