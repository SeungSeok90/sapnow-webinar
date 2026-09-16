import LiveVideoPreview from "@/components/admin/LiveVideoPreview";
import LiveOpsChat from "@/components/admin/LiveOpsChat";

export default function AdminLivePage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">라이브 운영</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          영상 오픈 전에도 스트리밍 화면을 확인하고, 참가자에게 채팅으로 공지할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <LiveVideoPreview />
        </div>
        <div className="lg:col-span-1">
          <LiveOpsChat />
        </div>
      </div>
    </div>
  );
}
