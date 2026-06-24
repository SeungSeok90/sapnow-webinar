"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Registrant } from "@/types/database";
import Pagination from "@/components/admin/Pagination";

type ImportResult = {
  inserted: number;
  skipped: number;
  parseErrors: string[];
};

function ImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("파일을 선택해주세요."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/import/registrants", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "업로드에 실패했습니다.");
        if (data.parseErrors?.length) setResult({ inserted: 0, skipped: 0, parseErrors: data.parseErrors });
        return;
      }

      setResult(data);
      if (data.inserted > 0) onSuccess();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">등록자 일괄 업로드</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 space-y-1">
          <p className="font-medium">필수 컬럼: 성명(또는 이름), 회사명, 이메일, 휴대폰</p>
          <p className="text-blue-500">선택 컬럼: 부서명(또는 부서), 직급(또는 직함)</p>
          <p className="text-blue-500">이미 등록된 이메일은 자동으로 건너뜁니다.</p>
        </div>

        <div className="flex gap-2">
          <a
            href="/api/admin/import/registrants"
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            템플릿 다운로드
          </a>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">파일 선택</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-sm file:cursor-pointer hover:file:bg-gray-200"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {result && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-1">
            <p className="font-medium text-gray-800">
              ✓ {result.inserted}명 등록 완료
              {result.skipped > 0 && (
                <span className="font-normal text-gray-500 ml-2">({result.skipped}명 중복 건너뜀)</span>
              )}
            </p>
            {result.parseErrors.length > 0 && (
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-orange-600 font-medium">형식 오류 ({result.parseErrors.length}건):</p>
                <ul className="text-xs text-orange-500 list-disc list-inside max-h-24 overflow-y-auto">
                  {result.parseErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            닫기
          </button>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "업로드 중..." : "업로드"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState(20);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setIsSuperAdmin(d.role === "super_admin"))
      .catch(() => {});
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
    if (res.ok) { setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; }); fetchData(); }
    else alert("삭제에 실패했습니다.");
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}명을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/registrants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) { setSelected(new Set()); fetchData(); }
      else alert("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  function toggleAll() {
    if (selected.size === registrants.length && registrants.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(registrants.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onSuccess={() => { fetchData(); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">등록자 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">전체 {total.toLocaleString()}명</p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {deleting ? "삭제 중..." : `선택 삭제 (${selected.size}명)`}
            </button>
          )}
          <button
            onClick={() => setImportOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            일괄 업로드
          </button>
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
                {isSuperAdmin && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-red-500 cursor-pointer"
                      checked={registrants.length > 0 && selected.size === registrants.length}
                      onChange={toggleAll}
                    />
                  </th>
                )}
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
                  <td colSpan={isSuperAdmin ? 11 : 10} className="px-4 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : registrants.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 11 : 10} className="px-4 py-8 text-center text-gray-400">
                    등록자가 없습니다.
                  </td>
                </tr>
              ) : (
                registrants.map((r) => (
                  <tr key={r.id} className={`hover:bg-gray-50 ${selected.has(r.id) ? "bg-red-50" : ""}`}>
                    {isSuperAdmin && (
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-red-500 cursor-pointer"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                        />
                      </td>
                    )}
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
