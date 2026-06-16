import RegisterForm from "@/components/user/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SAP NOW AI Tour KOREA</h1>
          <p className="mt-2 text-gray-500">2025년 7월 14일</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">사전 등록</h2>
          <RegisterForm />
        </div>

        <p className="mt-4 text-center text-sm text-gray-400">
          이미 등록하셨나요?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            로그인하기
          </a>
        </p>
      </div>
    </main>
  );
}
