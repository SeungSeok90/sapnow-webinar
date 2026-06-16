import LoginForm from "@/components/user/LoginForm";

export const metadata = {
  title: "로그인 | SAP NOW AI Tour KOREA",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SAP NOW 웨비나</h1>
          <p className="mt-2 text-gray-500">2025년 7월 14일 | 온라인 행사</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">로그인</h2>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
