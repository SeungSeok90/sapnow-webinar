"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/admin/StatCard";
import type { DashboardStats } from "@/types/api";

interface RecentRegistrant {
  id: string;
  name: string;
  company: string;
  email: string;
  created_at: string;
}

interface RecentViewer {
  registrant_id: string;
  last_access_at: string;
  total_watch_seconds: number;
  registrants: { name: string; company: string; email: string } | null;
}

interface StatsResponse extends DashboardStats {
  recentRegistrants: RecentRegistrant[];
  recentViewers: RecentViewer[];
}

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}분 ${s}초`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("통계를 불러오는 중 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-gray-500 hover:text-gray-700 transition"
        >
          새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="전체 등록자"
          value={stats?.totalRegistrants ?? 0}
          color="default"
        />
        <StatCard
          label="금일 등록자"
          value={stats?.todayRegistrants ?? 0}
          color="blue"
        />
        <StatCard
          label="로그인 수"
          value={stats?.loginCount ?? 0}
          sub="고유 사용자 기준"
          color="default"
        />
        <StatCard
          label="영상 접속자"
          value={stats?.videoAccessCount ?? 0}
          color="default"
        />
        <StatCard
          label="시청자"
          value={stats?.viewerCount ?? 0}
          sub="60초 이상"
          color="green"
        />
        <StatCard
          label="유효 시청자"
          value={stats?.validViewerCount ?? 0}
          sub="10분 이상"
          color="green"
        />
        <StatCard
          label="미접속자"
          value={stats?.nonAccessCount ?? 0}
          color="yellow"
        />
        <StatCard
          label="시청률"
          value={`${stats?.viewRate ?? 0}%`}
          sub="시청자 / 전체 등록자"
          color="blue"
        />
      </div>

      {/* 하단 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 등록자 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">최근 등록자</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-2">이름</th>
                <th className="text-left px-4 py-2">회사</th>
                <th className="text-left px-4 py-2">등록일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentRegistrants.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                    등록자가 없습니다.
                  </td>
                </tr>
              )}
              {stats?.recentRegistrants.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-gray-500">{r.company}</td>
                  <td className="px-4 py-2 text-gray-400">
                    {new Date(r.created_at).toLocaleString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 최근 시청자 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">최근 시청자</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-2">이름</th>
                <th className="text-left px-4 py-2">회사</th>
                <th className="text-left px-4 py-2">누적 시청</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentViewers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-400">
                    시청 기록이 없습니다.
                  </td>
                </tr>
              )}
              {stats?.recentViewers.map((v) => (
                <tr key={v.registrant_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    {v.registrants?.name ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {v.registrants?.company ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-400">
                    {formatSeconds(v.total_watch_seconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
