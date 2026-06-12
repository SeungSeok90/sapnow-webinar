import Link from "next/link";

export default function RegisterCompletePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white rounded-xl shadow text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">등록이 완료되었습니다</h1>
        <p className="text-gray-500 mb-6">
          행사 당일 로그인 후 영상을 시청하실 수 있습니다.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          로그인하러 가기
        </Link>
      </div>
    </main>
  );
}
