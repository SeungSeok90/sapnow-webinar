"use client";

import { useEffect, useState, useCallback } from "react";
import type { Registrant } from "@/types/database";
import Pagination from "@/components/admin/Pagination";

type SortDir = "asc" | "desc";

function SortTh({
  col, label, sortBy, sortDir, onSort, className,
}: {
  col: string; label: string; sortBy: string; sortDir: SortDir;
  onSort: (col: string) => void; className?: string;
}) {
  const active = sortBy === col;
  return (
    <th
      className={`text-left px-4 py-3 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap ${className ?? ""}`}
      onClick={() => onSort(col)}
    >
      {label}
      <span className="ml-1 text-gray-400">
        {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </th>
  );
}

function StatusBadge({ agreed }: { agreed: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        agreed
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {agreed ? "동의" : "미동의"}
    </span>
  );
}

const MARKETING_CHANNEL_LABEL: Record<string, string> = {
  Both: "이메일+전화",
  Email: "이메일",
  Phone: "전화",
  "Not applicable": "해당없음",
};

function MarketingChannelBadge({ channel }: { channel: string }) {
  const active = channel !== "Not applicable";
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {MARKETING_CHANNEL_LABEL[channel] ?? channel}
    </span>
  );
}

export default function AdminRegistrantsPage() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminRole, setAdminRole] = useState<string>("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState(20);

  // 관리자 역할 확인 (레이아웃에서 받을 수 없으므로 API 호출로 확인)
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(() => {
        // 성공하면 어드민임. role 확인을 위해 별도 엔드포인트 없이 쿠키에서 판단
        // 실제로는 서버 컴포넌트로 전환하거나 별도 /api/admin/me 엔드포인트 추가 권장
      });
    // 임시: super_admin 기능 버튼은 API에서 403 반환 시 숨기는 방식으로 처리
    setAdminRole("unknown");
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sortBy,
        sortDir,
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await fetch(`/api/admin/registrants?${params}`);
      const data = await res.json();
      setRegistrants(data.data ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, dateFrom, dateTo, sortBy, sortDir, pageSize]);

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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}"을 정말 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/registrants/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
    else alert("삭제에 실패했습니다.");
  }

  function handleExport() {
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });
    window.location.href = `/api/admin/export/registrants?${params}`;
  }

  const totalPages = Math.ceil(total / pageSize);

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">등록자 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">전체 {total.toLocaleString()}명</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
          >
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 검색 필터 */}
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
            <label className="block text-xs text-gray-500 mb-1">등록일 시작</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">등록일 종료</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setDateFrom(""); setDateTo(""); setPage(1); }}
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
                <SortTh col="name"       label="이름"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="company"    label="회사"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="email"      label="이메일" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="text-left px-4 py-3">휴대폰</th>
                <th className="text-left px-4 py-3">부서/직함</th>
                <th className="text-left px-4 py-3">개인정보</th>
                <th className="text-left px-4 py-3">프로필공개</th>
                <th className="text-left px-4 py-3">마케팅</th>
                <SortTh col="created_at" label="등록일시" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : registrants.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    등록자가 없습니다.
                  </td>
                </tr>
              ) : (
                registrants.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.company}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.email}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.phone}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {[r.department, r.title].filter(Boolean).join(" / ") || "-"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge agreed={r.privacy_agreed} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge agreed={r.profile_public_agreed} />
                    </td>
                    <td className="px-4 py-2.5">
                      <MarketingChannelBadge channel={r.marketing_channel} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">
                      {new Date(r.created_at).toLocaleString("ko-KR", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(r.id, r.name)}
                        className="text-xs text-red-400 hover:text-red-600 transition"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
