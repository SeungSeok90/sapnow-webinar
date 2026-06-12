"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  privacy_agreed: boolean;
  marketing_agreed: boolean;
}

const initialForm: FormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  department: "",
  title: "",
  privacy_agreed: false,
  marketing_agreed: false,
};

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.name.trim()) newErrors.name = "성명을 입력해주세요.";
    if (!form.company.trim()) newErrors.company = "회사명을 입력해주세요.";
    if (!form.email.trim()) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }
    if (!form.phone.trim()) {
      newErrors.phone = "휴대폰 번호를 입력해주세요.";
    }
    if (!form.privacy_agreed) {
      newErrors.privacy_agreed = "개인정보 수집 및 이용에 동의해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          department: form.department.trim() || undefined,
          title: form.title.trim() || undefined,
          privacy_agreed: form.privacy_agreed,
          marketing_agreed: form.marketing_agreed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "등록에 실패했습니다.");
        return;
      }

      router.push("/register/complete");
    } catch {
      setServerError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* 성명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          성명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="홍길동"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* 회사명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          회사명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="company"
          value={form.company}
          onChange={handleChange}
          placeholder="(주)회사명"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.company && <p className="mt-1 text-sm text-red-500">{errors.company}</p>}
      </div>

      {/* 이메일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이메일 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="example@company.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      {/* 휴대폰 번호 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          휴대폰 번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="010-0000-0000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
      </div>

      {/* 부서명 (선택) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          부서명 <span className="text-gray-400 text-xs">(선택)</span>
        </label>
        <input
          type="text"
          name="department"
          value={form.department}
          onChange={handleChange}
          placeholder="IT팀"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 직함 (선택) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          직함 <span className="text-gray-400 text-xs">(선택)</span>
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="과장"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 개인정보 동의 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div>
          <button
            type="button"
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700"
            onClick={() => setPrivacyOpen((v) => !v)}
          >
            <span>
              개인정보 수집 및 이용 동의 <span className="text-red-500">*</span>
            </span>
            <span className="text-gray-400">{privacyOpen ? "▲" : "▼"}</span>
          </button>

          {privacyOpen && (
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 leading-relaxed max-h-40 overflow-y-auto">
              <p className="font-semibold mb-1">개인정보 수집 및 이용 동의</p>
              <p>수집 항목: 성명, 회사명, 이메일, 휴대폰 번호, 부서명, 직함</p>
              <p>수집 목적: 행사 참가 관리, 영상 시청 서비스 제공</p>
              <p>보유 기간: 행사 종료 후 1년</p>
              <p>귀하는 개인정보 제공을 거부할 권리가 있으나, 거부 시 행사 참가가 제한될 수 있습니다.</p>
            </div>
          )}

          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              name="privacy_agreed"
              checked={form.privacy_agreed}
              onChange={handleChange}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">동의합니다 (필수)</span>
          </label>
          {errors.privacy_agreed && (
            <p className="mt-1 text-sm text-red-500">{errors.privacy_agreed}</p>
          )}
        </div>

        {/* 마케팅 동의 */}
        <div className="border-t border-gray-200 pt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="marketing_agreed"
              checked={form.marketing_agreed}
              onChange={handleChange}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">
              마케팅 정보 수신 동의{" "}
              <span className="text-gray-400 text-xs">(선택)</span>
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-400 ml-6">
            행사 및 관련 정보를 이메일로 받아보실 수 있습니다.
          </p>
        </div>
      </div>

      {/* 서버 에러 */}
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "등록 중..." : "등록하기"}
      </button>
    </form>
  );
}
