"use client";

import { useEffect, useRef, useCallback } from "react";

interface VideoPlayerProps {
  videoId: string;
}

const HEARTBEAT_INTERVAL_MS = 30_000;

export default function VideoPlayer({ videoId }: VideoPlayerProps) {
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

  return (
    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 w-full h-full rounded-lg"
        title="SAP Innovation Day"
      />
    </div>
  );
}
