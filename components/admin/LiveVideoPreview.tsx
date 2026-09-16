"use client";

import { useEffect, useState } from "react";
import { buildVimeoEmbedUrl } from "@/lib/utils/vimeo";

export default function LiveVideoPreview() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/live/stream")
      .then((r) => r.json())
      .then((d) => setStreamUrl(d.streamUrl ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-900 text-sm text-gray-400">
        불러오는 중...
      </div>
    );
  }

  const embedUrl = streamUrl ? buildVimeoEmbedUrl(streamUrl) : null;

  if (!embedUrl) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-gray-900 text-center text-gray-400">
        <div className="mb-3 text-4xl">🎬</div>
        <p className="text-sm">등록된 스트리밍 주소가 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ paddingTop: "56.25%" }}
    >
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
        allowFullScreen
        title="live preview"
      />
    </div>
  );
}
