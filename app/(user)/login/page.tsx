import Image from "next/image";
import LoginForm from "@/components/user/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <Image
        src="/login-background.png"
        alt=""
        fill
        priority
        className="object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/40 -z-10" />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">SAP NOW AI Tour KOREA</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">로그인</h2>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
