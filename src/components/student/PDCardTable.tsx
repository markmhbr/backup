import { useState } from "react";
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

interface RombelCard {
  id: number;
  namaRombel: string;
  tingkat: string;
  jumlahPD: number;
}

const rombelCardData: RombelCard[] = [
  { id: 1, namaRombel: "X RPL 1", tingkat: "10", jumlahPD: 36 },
  { id: 2, namaRombel: "X RPL 2", tingkat: "10", jumlahPD: 34 },
  { id: 3, namaRombel: "X TKJ 1", tingkat: "10", jumlahPD: 32 },
  { id: 4, namaRombel: "X TKJ 2", tingkat: "10", jumlahPD: 30 },
  { id: 5, namaRombel: "X AK 1", tingkat: "10", jumlahPD: 35 },
  { id: 6, namaRombel: "XI RPL 1", tingkat: "11", jumlahPD: 32 },
  { id: 7, namaRombel: "XI RPL 2", tingkat: "11", jumlahPD: 33 },
  { id: 8, namaRombel: "XI TKJ 1", tingkat: "11", jumlahPD: 31 },
  { id: 9, namaRombel: "XI MM 1", tingkat: "11", jumlahPD: 34 },
  { id: 10, namaRombel: "XI AK 1", tingkat: "11", jumlahPD: 36 },
];

interface PDCardTableProps {
  searchTerm: string;
}

export default function PDCardTable({ searchTerm }: PDCardTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedRombel, setSelectedRombel] = useState("");

  const filteredData = rombelCardData.filter(item => 
    item.namaRombel.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.namaRombel.localeCompare(b.namaRombel));

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrintClass = (rombel: string) => {
    setSelectedRombel(rombel);
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
              {currentData.length > 0 ? currentData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.namaRombel}</TableCell>
                  <TableCell className="px-5 py-4 text-center text-gray-500 dark:text-gray-400 text-theme-sm">{item.tingkat}</TableCell>
                  <TableCell className="px-5 py-4 text-center text-gray-500 dark:text-gray-400 text-theme-sm">{item.jumlahPD}</TableCell>
                  <TableCell className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                          <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700 min-w-[110px]"
                              onClick={() => handlePrintClass(item.namaRombel)}
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
        rombelName={selectedRombel}
      />
    </>
  );
}
