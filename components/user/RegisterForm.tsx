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
  profile_public_agreed: boolean;
  marketing_email_agreed: boolean;
  marketing_phone_agreed: boolean;
}

const initialForm: FormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  department: "",
  title: "",
  privacy_agreed: false,
  profile_public_agreed: false,
  marketing_email_agreed: false,
  marketing_phone_agreed: false,
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
    if (!form.department.trim()) newErrors.department = "부서명을 입력해주세요.";
    if (!form.title.trim()) newErrors.title = "직급을 입력해주세요.";
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
          department: form.department.trim(),
          title: form.title.trim(),
          privacy_agreed: form.privacy_agreed,
          profile_public_agreed: form.profile_public_agreed,
          marketing_email_agreed: form.marketing_email_agreed,
          marketing_phone_agreed: form.marketing_phone_agreed,
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

      {/* 부서명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          부서명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="department"
          value={form.department}
          onChange={handleChange}
          placeholder="IT팀"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department}</p>}
      </div>

      {/* 직급 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          직급 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="과장"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
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
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 leading-relaxed max-h-48 overflow-y-auto space-y-2">
              <p>
                위에 개인 데이터를 입력하고 제출을 클릭하면 개인정보 보호
                정책에 설명된 대로 SAP가 귀하의 특수 범주의 데이터를
                처리하는 것에 동의하게 됩니다.
              </p>
              <p>
                여기에 제공해주신 모든 정보는 SAP{" "}
                <a
                  href="https://www.sap.com/korea/about/legal/privacy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  개인정보보호정책
                </a>
                에 따라 사용됩니다.
              </p>
              <div className="pt-1 border-t border-gray-200">
                <p className="font-semibold mb-1">수집 및 이용 안내</p>
                <p>수집 항목: 성명, 회사명, 이메일, 휴대폰 번호, 부서명, 직급</p>
                <p>수집 목적: 행사 참가 관리, 영상 시청 서비스 제공</p>
                <p>보유 기간: 행사 종료 후 1년</p>
                <p>귀하는 개인정보 제공을 거부할 권리가 있으나, 거부 시 행사 참가가 제한될 수 있습니다.</p>
              </div>
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

        {/* 프로필 공개 동의 */}
        <div className="border-t border-gray-200 pt-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="profile_public_agreed"
              checked={form.profile_public_agreed}
              onChange={handleChange}
              className="w-4 h-4 mt-0.5 accent-blue-600"
            />
            <span className="text-sm text-gray-700">
              예, SAP가 내 이벤트 프로필을 이벤트 참석자가 공개적으로
              액세스할 수 있게 하고 SAP 이벤트 웹사이트 및 모바일
              애플리케이션에 내 프로필의 공개 속성을 표시하도록 동의합니다.{" "}
              <span className="text-gray-400 text-xs">(선택)</span>
            </span>
          </label>
        </div>

        {/* 마케팅 동의 */}
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-700 mb-2">
            저는 아래의 각 채널에 확인 표시를 하여 SAP가 저에게 SAP 제품
            및 서비스에 대한 뉴스를 전달하기 위해 저의 연락처 세부 정보를
            사용할 수 있다는 데 동의합니다.{" "}
            <span className="text-gray-400 text-xs">(선택)</span>
          </p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="marketing_email_agreed"
                checked={form.marketing_email_agreed}
                onChange={handleChange}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">전자메일</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="marketing_phone_agreed"
                checked={form.marketing_phone_agreed}
                onChange={handleChange}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">전화</span>
            </label>
          </div>
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
