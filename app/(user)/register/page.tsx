import Image from "next/image";
import RegisterForm from "@/components/user/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="relative h-[150px] w-full overflow-hidden">
        <Image
          src="/login-background.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl font-bold text-white">SAP NOW AI Tour KOREA</h1>
        </div>
      </div>

      <div className="flex justify-center py-12 px-4">
        <div className="w-full max-w-lg">
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
      </div>
    </main>
  );
}
