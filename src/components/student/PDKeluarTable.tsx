import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import Checkbox from "../form/input/Checkbox";
import { dapodikService } from "../../services/dapodikService";

interface PDKeluarTableProps {
  onSelectionChange: (selectedIds: string[]) => void;
  searchTerm: string;
  itemsPerPage: number;
}

export default function PDKeluarTable({ onSelectionChange, searchTerm, itemsPerPage }: PDKeluarTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await dapodikService.getPesertaDidik(itemsPerPage, searchTerm, currentPage, undefined, 'non-aktif');
        if (result.status === 'success') {
          setData(result.data || []);
          setTotal(result.meta?.total || 0);
        }
      } catch (error) {
        console.error("Gagal mengambil data PD keluar:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemsPerPage, searchTerm, currentPage]);

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  const handleSelectAll = (checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...new Set([...selectedRows, ...data.map((item) => item.peserta_didik_id)])];
    } else {
      const currentIds = data.map((item) => item.peserta_didik_id);
      newSelected = selectedRows.filter((id) => !currentIds.includes(id));
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = selectedRows.filter((rowId) => rowId !== id);
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const isAllSelected = data.length > 0 && data.every((item) => selectedRows.includes(item.peserta_didik_id));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        )}
        <Table className="min-w-[1500px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">
                <Checkbox
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">JK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NISN</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tanggal Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Terdaftar Sebagai</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Keluar Karena</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Alasan Keluar</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Keluar</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.peserta_didik_id} className={`${selectedRows.includes(item.peserta_didik_id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                  <TableCell className="px-5 py-4 text-start">
                    <Checkbox
                      checked={selectedRows.includes(item.peserta_didik_id)}
                      onChange={(checked) => handleSelectRow(item.peserta_didik_id, checked)}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{item.nama}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_kelamin}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nisn || "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempat_lahir || "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_pendaftaran_id_str || "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_keluar_id || "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 min-w-[200px]">{item.ket_keluar || "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.tanggal_keluar ? new Date(item.tanggal_keluar).toLocaleDateString('id-ID') : "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-600 border border-orange-500 hover:bg-orange-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Batal
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada data ditemukan untuk "{searchTerm}"
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
