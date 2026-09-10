"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessageView } from "@/types/api";

const POLL_INTERVAL_MS = 2500;
const MAX_MESSAGE_LENGTH = 300;
const NEAR_BOTTOM_THRESHOLD_PX = 80;

function formatMessageTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
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
    const res = await fetch(`/api/chat/messages${params}`);
    if (!res.ok) return;
    const { data } = (await res.json()) as { data: ChatMessageView[] };
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
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "메시지 전송에 실패했습니다.");
        return;
      }
      const sent = body.data as ChatMessageView;
      setMessages((prev) => [...prev, sent]);
      lastCreatedAtRef.current = sent.createdAt;
      isNearBottomRef.current = true;
      setInput("");
    } catch {
      setError("메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[420px] flex-col rounded-xl bg-gray-800 lg:h-[600px]">
      <div className="border-b border-gray-700 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-200">실시간 채팅</h3>
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <p className="pt-8 text-center text-sm text-gray-500">
            아직 채팅 메시지가 없습니다.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isMine ? "items-end" : "items-start"}`}
            >
              <span className="mb-0.5 text-xs text-gray-500">
                {m.alias} · {formatMessageTime(m.createdAt)}
              </span>
              <div
                className={`max-w-[85%] break-words rounded-2xl px-3 py-1.5 text-sm ${
                  m.isMine
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                {m.message}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-700 p-3">
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="메시지를 입력하세요"
            maxLength={MAX_MESSAGE_LENGTH}
            className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
