import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  total,
  currentPage,
  pageSize,
  pageSizeOptions = [6, 12, 24],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(total, safePage * pageSize);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="设备智能体分页导航"
      className="flex flex-wrap items-center justify-center sm:justify-between gap-2.5 sm:gap-4 rounded-[14px] border border-[#E2EAFE] bg-white/85 backdrop-blur-xs px-3 sm:px-4 py-2.5 sm:py-3 shadow-[0_4px_16px_rgba(68,100,235,0.04)]"
    >
      {/* Left summary */}
      <div className="text-[12.5px] text-[#64748B] font-mono-tabular text-center sm:text-left">
        共 <span className="font-semibold text-[#1E293B]">{total}</span> 个智能体
        <span className="mx-2 text-[#CBD5E1]" aria-hidden="true">
          ·
        </span>
        当前显示第{" "}
        <span className="font-medium text-[#334155]">
          {startIdx}-{endIdx}
        </span>{" "}
        项
      </div>

      {/* Right controls */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3">
        {/* Page size selector */}
        <label className="inline-flex items-center gap-1.5 text-[12.5px] text-[#64748B]">
          <span>每页</span>
          <select
            aria-label="每页显示数量"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-[#DBE4FA] bg-white px-2.5 py-1 text-[12.5px] font-mono-tabular text-[#1E293B] focus:border-[#3D68F5] focus:outline-none cursor-pointer"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} 条
              </option>
            ))}
          </select>
        </label>

        {/* Page buttons */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="上一页"
            className="h-8 w-8 rounded-lg border border-[#DBE4FA] bg-white hover:bg-[#EEF2FF] hover:border-[#B8CCF8] disabled:opacity-45 disabled:hover:bg-white disabled:cursor-not-allowed text-[#475569] inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pages.map((page) => {
            const isActive = page === safePage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? "page" : undefined}
                className={`h-8 min-w-8 px-2.5 rounded-lg text-[12.5px] font-mono-tabular font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#3D68F5] text-white border border-[#3D68F5] shadow-[0_3px_10px_rgba(61,104,245,0.28)]"
                    : "border border-[#DBE4FA] bg-white text-[#334155] hover:bg-[#EEF2FF] hover:border-[#B8CCF8]"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="下一页"
            className="h-8 w-8 rounded-lg border border-[#DBE4FA] bg-white hover:bg-[#EEF2FF] hover:border-[#B8CCF8] disabled:opacity-45 disabled:hover:bg-white disabled:cursor-not-allowed text-[#475569] inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
