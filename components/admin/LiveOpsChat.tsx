"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminChatMessageView } from "@/types/api";
import { formatKSTTime } from "@/lib/utils/time";
import { renderMessageWithLinks } from "@/lib/utils/chatText";

const POLL_INTERVAL_MS = 3000;
const MAX_MESSAGE_LENGTH = 300;
const NEAR_BOTTOM_THRESHOLD_PX = 80;

function formatMessageTime(createdAt: string): string {
  return formatKSTTime(createdAt, { hour: "2-digit", minute: "2-digit" });
}

export default function LiveOpsChat() {
  const [messages, setMessages] = useState<AdminChatMessageView[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const lastCreatedAtRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const fetchMessages = useCallback(async (after: string | null) => {
    const params = after ? `?after=${encodeURIComponent(after)}` : "";
    const res = await fetch(`/api/admin/chat${params}`);
    if (!res.ok) return;
    const { data } = (await res.json()) as { data: AdminChatMessageView[] };
    if (!data || data.length === 0) return;

    setMessages((prev) => (after ? [...prev, ...data] : data));
    lastCreatedAtRef.current = data[data.length - 1].createdAt;
  }, []);

  useEffect(() => {
    fetchMessages(null);
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(lastCreatedAtRef.current);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom();
  }, [messages, scrollToBottom]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "메시지 전송에 실패했습니다.");
        return;
      }
      isNearBottomRef.current = true;
      setInput("");
      await fetchMessages(lastCreatedAtRef.current);
    } catch {
      setError("메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">실시간 채팅</h3>
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <p className="pt-8 text-center text-sm text-gray-400">
            아직 채팅 메시지가 없습니다.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isAdmin ? "items-end" : "items-start"}`}
            >
              <span className="mb-0.5 flex items-center gap-1 text-xs text-gray-400">
                {m.isAdmin && (
                  <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-gray-900">
                    관리자
                  </span>
                )}
                {m.name} · {formatMessageTime(m.createdAt)}
              </span>
              <div
                className={`max-w-[85%] break-words rounded-2xl px-3 py-1.5 text-sm ${
                  m.isAdmin ? "bg-amber-500 text-gray-900" : "bg-gray-100 text-gray-800"
                }`}
              >
                {renderMessageWithLinks(
                  m.message,
                  m.isAdmin
                    ? "underline text-blue-900 hover:text-blue-700 break-all"
                    : "underline text-blue-600 hover:text-blue-500 break-all"
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-200 p-3">
        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="관리자 메시지를 입력하세요"
            maxLength={MAX_MESSAGE_LENGTH}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}
