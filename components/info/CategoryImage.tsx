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
      src={src}
      alt={alt}
      className="block h-auto w-full"
      onError={() => setFailed(true)}
    />
  );
}
