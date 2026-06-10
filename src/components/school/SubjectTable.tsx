import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import { dapodikService } from "../../services/dapodikService";

interface Subject {
  mata_pelajaran_id: string;
  nama_mata_pelajaran: string;
}

interface SubjectTableProps {
  searchTerm: string;
  itemsPerPage: number;
}

export default function SubjectTable({ searchTerm, itemsPerPage }: SubjectTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectData, setSubjectData] = useState<Subject[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const response = await dapodikService.getMataPelajaran(itemsPerPage, searchTerm, currentPage);
        if (response && response.data) {
          setSubjectData(response.data);
          if (response.meta && response.meta.total) {
            setTotalItems(response.meta.total);
          } else {
            setTotalItems(response.data.length);
          }
        }
      } catch (error) {
        console.error("Failed to fetch subjects", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search term to avoid spamming the backend
    const timeoutId = setTimeout(() => {
      fetchSubjects();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, itemsPerPage, currentPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[600px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID / Kode</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Mata Pelajaran</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className={`divide-y divide-gray-100 dark:divide-white/[0.05] ${isLoading && subjectData.length > 0 ? "opacity-50 pointer-events-none transition-opacity duration-200" : ""}`}>
            {isLoading && subjectData.length === 0 ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx} className="animate-pulse">
                  <TableCell className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28"></div></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48"></div></TableCell>
                </TableRow>
              ))
            ) : subjectData.length > 0 ? subjectData.map((item, index) => (
              <TableRow key={item.mata_pelajaran_id || index}>
                <TableCell className="px-5 py-4 text-start text-gray-500 dark:text-gray-400 text-theme-sm">{item.mata_pelajaran_id?.substring(0, 8) || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{item.nama_mata_pelajaran}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={2} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada mata pelajaran ditemukan {searchTerm ? `untuk "${searchTerm}"` : ""}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
