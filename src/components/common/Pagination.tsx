import { ChevronLeftIcon, ArrowRightIcon } from "../../icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Halaman <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span> dari <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 transition rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="size-5 text-gray-500 dark:text-gray-400" />
        </button>
        
        <div className="flex items-center gap-1">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition ${
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
        >
          <ArrowRightIcon className="size-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}
