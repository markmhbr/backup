import { ChevronLeftIcon, AngleRightIcon } from "../../icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // Logic to show limited page numbers with ellipsis if needed
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 sm:flex-row dark:border-white/[0.05]">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Menampilkan halaman{" "}
        <span className="font-bold text-gray-900 dark:text-white">
          {currentPage}
        </span>{" "}
        dari{" "}
        <span className="font-bold text-gray-900 dark:text-white">
          {totalPages}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 transition rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Halaman Sebelumnya"
        >
          <ChevronLeftIcon className="size-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-bold transition ${
                currentPage === page
                  ? "bg-brand-500 text-white shadow-theme-sm"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 transition rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Halaman Berikutnya"
        >
          <AngleRightIcon className="size-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}
