"use client";

import { useState } from "react";

export default function CategoryImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  // 외부 호스트(keystonellc.kr)에서 같은 파일명으로 이미지를 교체해도
  // 브라우저 캐시 없이 매번 최신 파일을 받아오도록 캐시 버스팅 적용
  const [cacheBustedSrc] = useState(
    () => `${src}${src.includes("?") ? "&" : "?"}t=${Date.now()}`
  );

  if (failed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center text-white/70">
        콘텐츠 준비중입니다
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cacheBustedSrc}
      alt={alt}
      className="block h-auto w-full"
      onError={() => setFailed(true)}
    />
  );
}
