import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import { dapodikService } from "../../services/dapodikService";

interface Ekskul {
  rombongan_belajar_id: string;
  nm_ekskul: string;
  nama: string;
  ptk_id_str: string;
  id_ruang_str: string;
  anggotaRombel?: number;
}

interface EkskulTableProps {
  onSelectionChange?: (selectedIds: string[]) => void;
  searchTerm: string;
  itemsPerPage: number;
}

export default function EkskulTable({ onSelectionChange: _, searchTerm, itemsPerPage }: EkskulTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [ekskulData, setEkskulData] = useState<Ekskul[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Reset page to 1 on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await dapodikService.getEkstrakurikuler(searchTerm);
        if (response && response.data) {
          setEkskulData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch ekskul data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [searchTerm]);
  
  const sortedData = [...ekskulData].sort((a, b) => 
    (a.nm_ekskul || a.nama || "").localeCompare(b.nm_ekskul || b.nama || "")
  );
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEkskulClick = (id: string, name: string) => {
    const role = window.location.pathname.split("/")[1];
    navigate(`/${role}/class-data/detail/${id}`, { state: { name } });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[800px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Ekskul</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Pembina</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Prasarana</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className={`divide-y divide-gray-100 dark:divide-white/[0.05] ${isLoading && currentData.length > 0 ? "opacity-50 pointer-events-none transition-opacity duration-200" : ""}`}>
            {isLoading && currentData.length === 0 ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx} className="animate-pulse">
                  <TableCell className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28"></div></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div></TableCell>
                  <TableCell className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16"></div></TableCell>
                </TableRow>
              ))
            ) : currentData.length > 0 ? currentData.map((item, index) => (
              <TableRow key={item.rombongan_belajar_id || index}>
                <TableCell className="px-5 py-4 text-start">
                  <button 
                    onClick={() => handleEkskulClick(item.rombongan_belajar_id, item.nama)}
                    className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 whitespace-nowrap"
                  >
                    {item.nama}
                  </button>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.ptk_id_str || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.id_ruang_str || "-"}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={3} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data ekskul ditemukan untuk "{searchTerm}"
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
