"use client";

import { useEffect, useRef, useCallback } from "react";
import { buildVimeoEmbedUrl } from "@/lib/utils/vimeo";

interface VideoPlayerProps {
  streamUrl: string;
}

export default function VideoPlayer({ streamUrl }: VideoPlayerProps) {
  const elapsedRef = useRef(0);
  const lastTickRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);

  const sendHeartbeat = useCallback(async (elapsed: number) => {
    if (elapsed <= 0) return;
    try {
      await fetch("/api/watch/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: elapsed }),
      });
    } catch {
      // 네트워크 오류는 무시 (다음 heartbeat에서 보완)
    }
  }, []);

  const sendBeacon = useCallback((elapsed: number) => {
    if (elapsed <= 0) return;
    navigator.sendBeacon(
      "/api/watch/heartbeat",
      JSON.stringify({ elapsedSeconds: elapsed })
    );
  }, []);

  const startTicker = useCallback(() => {
    lastTickRef.current = Date.now();
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (!isVisibleRef.current) return;

      const now = Date.now();
      const delta = Math.round((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      elapsedRef.current += delta;

      if (elapsedRef.current >= 30) {
        const toSend = elapsedRef.current;
        elapsedRef.current = 0;
        await sendHeartbeat(toSend);
      }
    }, 1000);
  }, [sendHeartbeat]);

  const stopTicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 최초 접속 기록
  useEffect(() => {
    fetch("/api/watch/access", { method: "POST" }).catch(console.error);
  }, []);

  // 탭 visibility 감지 + heartbeat 전송
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isVisibleRef.current = false;
        const toSend = elapsedRef.current;
        elapsedRef.current = 0;
        sendBeacon(toSend);
        stopTicker();
      } else {
        isVisibleRef.current = true;
        startTicker();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startTicker();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopTicker();
    };
  }, [sendBeacon, startTicker, stopTicker]);

  // 페이지 언로드 시 마지막 heartbeat 전송
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendBeacon(elapsedRef.current);
    };

    window.addEventListener("pagehide", handleBeforeUnload);
    return () => window.removeEventListener("pagehide", handleBeforeUnload);
  }, [sendBeacon]);

  const embedUrl = buildVimeoEmbedUrl(streamUrl);

  if (!embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-6">🎬</div>
        <h2 className="text-2xl font-bold mb-2">영상 준비 중</h2>
        <p className="text-gray-400">잠시 후 영상이 제공될 예정입니다.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full rounded-lg"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
        allowFullScreen
        title="webinar video"
      />
    </div>
  );
}
