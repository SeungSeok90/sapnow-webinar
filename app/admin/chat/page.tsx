"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminChatMessageView } from "@/types/api";

const POLL_INTERVAL_MS = 3000;

export default function AdminChatPage() {
  const [messages, setMessages] = useState<AdminChatMessageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const lastCreatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setIsSuperAdmin(d.role === "super_admin"));
  }, []);

  const fetchMessages = useCallback(async (after: string | null) => {
    const params = after ? `?after=${encodeURIComponent(after)}` : "";
    const res = await fetch(`/api/admin/chat${params}`);
    if (!res.ok) return;
    const { data } = (await res.json()) as { data: AdminChatMessageView[] };
    if (!data) return;

    if (after) {
      if (data.length > 0) {
        setMessages((prev) => [...prev, ...data]);
        lastCreatedAtRef.current = data[data.length - 1].createdAt;
      }
    } else {
      setMessages(data);
      if (data.length > 0) lastCreatedAtRef.current = data[data.length - 1].createdAt;
    }
  }, []);

  useEffect(() => {
    fetchMessages(null).finally(() => setLoading(false));
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(lastCreatedAtRef.current);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function handleDelete(id: string) {
    if (!confirm("이 메시지를 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/chat/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">채팅 관리</h1>
        <p className="text-sm text-gray-500 mt-0.5">총 {messages.length.toLocaleString()}건</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3 whitespace-nowrap">시간</th>
                <th className="text-left px-4 py-3">이름</th>
                <th className="text-left px-4 py-3">회사</th>
                <th className="text-left px-4 py-3">이메일</th>
                <th className="text-left px-4 py-3">메시지</th>
                {isSuperAdmin && <th className="text-left px-4 py-3">관리</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                    채팅 메시지가 없습니다.
                  </td>
                </tr>
              ) : (
                sorted.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{m.name}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{m.company}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{m.email}</td>
                    <td className="px-4 py-2.5 text-gray-700 break-words max-w-md">{m.message}</td>
                    {isSuperAdmin && (
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId === m.id}
                          className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
