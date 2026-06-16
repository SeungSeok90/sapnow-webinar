"use client";

import { useEffect, useState, useCallback } from "react";
import type { ViewerRow, ViewStatus } from "@/types/api";

const PAGE_SIZE = 20;

type SortDir = "asc" | "desc";

function SortTh({
  col, label, sortBy, sortDir, onSort,
}: {
  col: string; label: string; sortBy: string; sortDir: SortDir;
  onSort: (col: string) => void;
}) {
  const active = sortBy === col;
  return (
    <th
      className="text-left px-4 py-3 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
      onClick={() => onSort(col)}
    >
      {label}
      <span className="ml-1 text-gray-400">
        {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </th>
  );
}

const STATUS_LABELS: Record<ViewStatus, string> = {
  none: "미시청",
  accessed: "접속",
  viewer: "시청",
  valid_viewer: "유효시청",
};

const STATUS_COLORS: Record<ViewStatus, string> = {
  none: "bg-gray-100 text-gray-500",
  accessed: "bg-blue-100 text-blue-700",
  viewer: "bg-green-100 text-green-700",
  valid_viewer: "bg-emerald-100 text-emerald-700",
};

function formatSeconds(secs: number): string {
  if (secs === 0) return "-";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}분 ${String(s).padStart(2, "0")}초`;
}

function StatusBadge({ status }: { status: ViewStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function AdminViewersPage() {
  const [viewers, setViewers] = useState<ViewerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<ViewStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("last_access_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy,
        sortDir,
        ...(search && { search }),
        ...(status !== "all" && { status }),
      });
      const res = await fetch(`/api/admin/viewers?${params}`);
      const data = await res.json();
      setViewers(data.data ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleExport() {
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(status !== "all" && { status }),
    });
    window.location.href = `/api/admin/export/viewers?${params}`;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시청 현황</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {total.toLocaleString()}명</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
        >
          엑셀 다운로드
        </button>
      </div>

      {/* 검색/필터 */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">검색</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="이름, 회사, 이메일, 전화번호"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">시청 상태</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as ViewStatus | "all"); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="none">미시청</option>
              <option value="accessed">접속</option>
              <option value="viewer">시청</option>
              <option value="valid_viewer">유효시청</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
            검색
          </button>
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setStatus("all"); setPage(1); }}
            className="px-4 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition"
          >
            초기화
          </button>
        </div>
      </form>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <SortTh col="name"               label="이름"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="company"            label="회사"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="text-left px-4 py-3">이메일</th>
                <SortTh col="first_access_at"    label="최초접속" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="last_access_at"     label="최종접속" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="total_watch_seconds" label="누적시청" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="status"             label="상태"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">로딩 중...</td></tr>
              ) : viewers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
              ) : (
                viewers.map((v) => (
                  <tr key={v.registrant_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{v.company}</td>
                    <td className="px-4 py-2.5 text-gray-600">{v.email}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">
                      {v.first_access_at
                        ? new Date(v.first_access_at).toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                        : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">
                      {v.last_access_at
                        ? new Date(v.last_access_at).toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                        : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {formatSeconds(v.total_watch_seconds)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={v.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">이전</button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">다음</button>
        </div>
      )}
    </div>
  );
}
