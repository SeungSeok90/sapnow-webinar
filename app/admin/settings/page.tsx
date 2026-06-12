"use client";

import { useEffect, useState } from "react";
import type { EventSettings } from "@/types/database";

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Partial<EventSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setForm(data); })
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setMessage({ type: "error", text: data.error });
      else setMessage({ type: "success", text: "설정이 저장되었습니다." });
    } catch {
      setMessage({ type: "error", text: "저장에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-400">로딩 중...</div>;
  }

  const fields: { name: keyof EventSettings; label: string; type?: string; placeholder?: string }[] = [
    { name: "event_name", label: "행사명", placeholder: "SAP NOW 웨비나" },
    { name: "event_date", label: "행사 일자", type: "date" },
    { name: "vimeo_video_id", label: "YouTube 영상 ID", placeholder: "YY12Xq6r0Ww" },
    { name: "video_open_at", label: "영상 오픈 시간", type: "datetime-local" },
    { name: "survey_url", label: "설문 URL", placeholder: "https://..." },
    { name: "material_url", label: "자료 다운로드 URL", placeholder: "https://..." },
    { name: "contact_email", label: "문의 이메일", type: "email", placeholder: "contact@example.com" },
    { name: "contact_phone", label: "문의 전화번호", placeholder: "02-0000-0000" },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">행사 설정</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input
              type={f.type || "text"}
              name={f.name}
              value={(form[f.name] as string) ?? ""}
              onChange={handleChange}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </form>
    </div>
  );
}
