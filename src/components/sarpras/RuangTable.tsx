import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { dapodikService } from "../../services/dapodikService";
import Pagination from "../common/Pagination";

interface RuangTableProps {
  searchTerm: string;
  itemsPerPage: number;
}

export default function RuangTable({ searchTerm, itemsPerPage }: RuangTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await dapodikService.getRuang(itemsPerPage, searchTerm, currentPage);
        if (result.status === 'success') {
          setData(result.data || []);
          setTotal(result.meta?.total || 0);
        }
      } catch (error) {
        console.error("Gagal mengambil data ruang:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemsPerPage, searchTerm, currentPage]);

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
      )}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1200px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Ruang</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kode Ruang</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jenis</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Lantai</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Panjang (m)</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Lebar (m)</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Luas (m²)</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kapasitas</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.length > 0 ? data.map((item) => (
              <TableRow key={item.id_ruang}>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.nm_ruang}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.kd_ruang || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.jenis_prasarana_id_str || 'Ruang'}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.lantai || 1}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.panjang || 0}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.lebar || 0}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.luas_ruang || 0}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.kapasitas || 0}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">Tidak ada data ruang ditemukan</TableCell>
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
