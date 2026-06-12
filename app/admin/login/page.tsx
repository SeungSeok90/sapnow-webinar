import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "관리자 로그인",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
          <p className="text-sm text-gray-500 mt-1">SAP NOW 웨비나 어드민</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
