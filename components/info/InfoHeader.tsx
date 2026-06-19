"use client";

import { useState } from "react";

export default function InfoHeader({ title }: { title: string }) {
  const [bannerFailed, setBannerFailed] = useState(false);

  return (
    <div className="relative flex h-28 w-full items-center justify-center overflow-hidden bg-sapnow">
      {!bannerFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/info/img/banner.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBannerFailed(true)}
        />
      )}
      <h1 className="relative text-2xl font-bold text-white drop-shadow">
        {title}
      </h1>
    </div>
  );
}
