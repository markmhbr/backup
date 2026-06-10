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

interface Kompetensi {
  kode: string;
  nama_jurusan: string;
}

interface KompetensiTableProps {
  onSelectionChange?: (selectedIds: number[]) => void;
  searchTerm: string;
  itemsPerPage: number;
}

export default function KompetensiTable({ searchTerm, itemsPerPage }: KompetensiTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [kompetensiData, setKompetensiData] = useState<Kompetensi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchJurusan = async () => {
      setIsLoading(true);
      try {
        const response = await dapodikService.getJurusan();
        // The API returns all data without pagination, so we handle it locally
        if (response && response.data) {
          setKompetensiData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch kompetensi/jurusan", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJurusan();
  }, []);

  const filteredData = kompetensiData.filter(item => 
    item.nama_jurusan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (a.nama_jurusan || "").localeCompare(b.nama_jurusan || ""));
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[600px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kode</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Kompetensi Keahlian</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={2} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                    </TableCell>
                </TableRow>
            ) : currentData.length > 0 ? currentData.map((item, index) => (
              <TableRow key={item.kode || index}>
                <TableCell className="px-5 py-4 text-start text-gray-500 dark:text-gray-400 text-theme-sm">{item.kode || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{item.nama_jurusan || "-"}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={2} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada kompetensi keahlian ditemukan {searchTerm ? `untuk "${searchTerm}"` : ""}
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
