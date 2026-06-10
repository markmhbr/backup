import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import Button from "../ui/button/Button";
import { PrinterIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import PrintPDCardPreview from "./PrintPDCardPreview";
import { dapodikService } from "../../services/dapodikService";

interface RombelCard {
  rombongan_belajar_id: string;
  nama: string;
  tingkat_pendidikan_id_str: string;
  jumlah_siswa: number;
}

interface PDCardTableProps {
  searchTerm: string;
}

export default function PDCardTable({ searchTerm }: PDCardTableProps) {
  const [data, setData] = useState<RombelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedRombel, setSelectedRombel] = useState({ id: "", nama: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dapodikService.getRombonganBelajar('reguler', itemsPerPage, currentPage, searchTerm);
        if (result.status === 'success') {
          setData(result.data);
          setTotalPages(result.meta.total_pages);
        }
      } catch (error) {
        console.error("Gagal memuat data rombel:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, currentPage]);

  const handlePrintClass = (id: string, nama: string) => {
    setSelectedRombel({ id, nama });
    openModal();
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table className="min-w-[600px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Rombel</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Tingkat</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Jumlah Siswa</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? data.map((item) => (
                <TableRow key={item.rombongan_belajar_id}>
                  <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.nama}</TableCell>
                  <TableCell className="px-5 py-4 text-center text-gray-500 dark:text-gray-400 text-theme-sm">{item.tingkat_pendidikan_id_str || "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-center text-gray-500 dark:text-gray-400 text-theme-sm">{item.jumlah_siswa}</TableCell>
                  <TableCell className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                          <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700 min-w-[110px]"
                              onClick={() => handlePrintClass(item.rombongan_belajar_id, item.nama)}
                          >
                              <PrinterIcon className="h-4 w-4" />
                              Cetak
                          </Button>
                      </div>
                  </TableCell>
                </TableRow>
              )) : (
                  <TableRow>
                      <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                          Tidak ada data rombel ditemukan untuk "{searchTerm}"
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

      {/* Print Preview Modal */}
      <PrintPDCardPreview 
        isOpen={isOpen}
        onClose={closeModal}
        rombelId={selectedRombel.id}
        rombelName={selectedRombel.nama}
      />
    </>
  );
}
