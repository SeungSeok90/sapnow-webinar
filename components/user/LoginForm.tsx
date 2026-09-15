"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatKST } from "@/lib/utils/time";

interface LoginFormProps {
  entryOpenAt: string | null;
}

// 대기하던 사람들이 동시에 재시도하지 않도록 약간씩 흩어지도록 하는 무작위 지연
const MAX_RETRY_JITTER_SECONDS = 5;

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function LoginForm({ entryOpenAt }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitingRetry, setWaitingRetry] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const entryOpenMs = entryOpenAt ? new Date(entryOpenAt).getTime() : null;
  const isBeforeEntry = entryOpenMs !== null && nowTs < entryOpenMs;

  useEffect(() => {
    if (entryOpenMs === null) return;
    const interval = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [entryOpenMs]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const clearScheduledRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setWaitingRetry(false);
  }, []);

  const attemptLogin = useCallback(
    async (emailValue: string, isAutoRetry = false) => {
      setLoading(true);
      if (!isAutoRetry) setError("");

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailValue }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "로그인에 실패했습니다.");

          if (typeof data.remainingSeconds === "number") {
            const jitter = Math.random() * MAX_RETRY_JITTER_SECONDS;
            const delayMs = (data.remainingSeconds + jitter) * 1000;
            setWaitingRetry(true);
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            retryTimerRef.current = setTimeout(() => {
              attemptLogin(emailValue, true);
            }, delayMs);
          } else {
            setWaitingRetry(false);
          }
          return;
        }

        setWaitingRetry(false);
        router.push("/watch");
      } catch {
        if (!isAutoRetry) {
          setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    clearScheduledRetry();
    await attemptLogin(email.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {isBeforeEntry && entryOpenAt && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-700">
            입장 가능 시간: {formatKST(entryOpenAt)}부터
          </p>
          <p className="text-xs text-blue-500 mt-0.5">
            {waitingRetry
              ? "곧 자동으로 입장을 시도합니다"
              : `남은 시간 ${formatRemaining(entryOpenMs! - nowTs)}`}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
            clearScheduledRetry();
          }}
          placeholder="등록하신 이메일 주소"
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || waitingRetry}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "로그인 중..." : waitingRetry ? "자동 재시도 대기 중..." : "영상 시청 입장"}
      </button>

      <p className="text-center text-sm text-gray-500">
        아직 등록하지 않으셨나요?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          사전 등록하기
        </Link>
      </p>
    </form>
  );
}
