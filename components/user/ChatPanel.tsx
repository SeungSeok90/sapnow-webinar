"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessageView } from "@/types/api";
import { formatKSTTime } from "@/lib/utils/time";

const POLL_INTERVAL_MS = 4000;
const MAX_MESSAGE_LENGTH = 300;
const NEAR_BOTTOM_THRESHOLD_PX = 80;

function formatMessageTime(createdAt: string): string {
  return formatKSTTime(createdAt, { hour: "2-digit", minute: "2-digit" });
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function renderMessageWithLinks(message: string) {
  return message.split(URL_PATTERN).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-300 hover:text-blue-200 break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const lastCreatedAtRef = useRef<string | null>(null);
  const isNearBottomRef = useRef(true);
  const lastHiddenCheckRef = useRef<string>(new Date().toISOString());

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const fetchMessages = useCallback(async (after: string | null) => {
    const params = new URLSearchParams();
    if (after) params.set("after", after);
    params.set("hiddenSince", lastHiddenCheckRef.current);

    const res = await fetch(`/api/chat/messages?${params.toString()}`);
    if (!res.ok) return;
    const { data, hiddenIds, hiddenLatest } = (await res.json()) as {
      data: ChatMessageView[];
      hiddenIds: string[];
      hiddenLatest: string | null;
    };

    if (hiddenLatest) lastHiddenCheckRef.current = hiddenLatest;
    const hiddenSet = hiddenIds && hiddenIds.length > 0 ? new Set(hiddenIds) : null;

    if (data && data.length > 0) {
      setMessages((prev) => {
        const merged = after ? [...prev, ...data] : data;
        return hiddenSet ? merged.filter((m) => !hiddenSet.has(m.id)) : merged;
      });
      lastCreatedAtRef.current = data[data.length - 1].createdAt;
    } else if (hiddenSet) {
      setMessages((prev) => prev.filter((m) => !hiddenSet.has(m.id)));
    }
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
                {renderMessageWithLinks(m.message)}
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
