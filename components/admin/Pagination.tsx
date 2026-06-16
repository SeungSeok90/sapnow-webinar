"use client";

type Props = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const PAGE_SIZES = [20, 50, 100];

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 2;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  const pages: (number | "...")[] = [1];
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

export default function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  const base = "min-w-[32px] h-8 px-2 text-sm border rounded-lg transition flex items-center justify-center";
  const active = "bg-blue-600 text-white border-blue-600 font-medium";
  const normal = "border-gray-300 text-gray-600 hover:bg-gray-50";
  const disabled = "border-gray-200 text-gray-300 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>페이지당</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}건</option>)}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={page === 1}
          className={`${base} ${page === 1 ? disabled : normal}`}>«</button>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className={`${base} ${page === 1 ? disabled : normal}`}>‹</button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="min-w-[32px] h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p as number)}
              className={`${base} ${p === page ? active : normal}`}>{p}</button>
          )
        )}

        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className={`${base} ${page === totalPages ? disabled : normal}`}>›</button>
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
          className={`${base} ${page === totalPages ? disabled : normal}`}>»</button>
      </div>

      <span className="text-sm text-gray-500">{page} / {totalPages} 페이지</span>
    </div>
  );
}
