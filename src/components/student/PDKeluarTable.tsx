import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import Checkbox from "../form/input/Checkbox";

interface OutgoingStudent {
  id: number;
  nama: string;
  jk: "L" | "P";
  nisn: string;
  tempatLahir: string;
  tanggalLahir: string;
  terdaftarSebagai: string;
  keluarKarena: string;
  alasanKeluar: string;
  tanggalKeluar: string;
}

const outgoingData: OutgoingStudent[] = [
  {
    id: 1,
    nama: "Fajar Ramadhan",
    jk: "L",
    nisn: "0011223344",
    tempatLahir: "Bandung",
    tanggalLahir: "10/05/2008",
    terdaftarSebagai: "Siswa",
    keluarKarena: "Mutasi",
    alasanKeluar: "Pindah Domisili Orang Tua",
    tanggalKeluar: "15/01/2024",
  },
  {
    id: 2,
    nama: "Gita Gutawa",
    jk: "P",
    nisn: "0011223345",
    tempatLahir: "Jakarta",
    tanggalLahir: "22/08/2007",
    terdaftarSebagai: "Siswa",
    keluarKarena: "Lulus",
    alasanKeluar: "Tamat Belajar",
    tanggalKeluar: "20/06/2024",
  },
];

interface PDKeluarTableProps {
  onSelectionChange: (selectedIds: number[]) => void;
  searchTerm: string;
  itemsPerPage: number;
}

export default function PDKeluarTable({ onSelectionChange, searchTerm, itemsPerPage }: PDKeluarTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const filteredData = outgoingData.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nisn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    let newSelected: number[];
    if (checked) {
      newSelected = [...new Set([...selectedRows, ...currentData.map((item) => item.id)])];
    } else {
      const currentIds = currentData.map((item) => item.id);
      newSelected = selectedRows.filter((id) => !currentIds.includes(id));
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    let newSelected: number[];
    if (checked) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = selectedRows.filter((rowId) => rowId !== id);
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const isAllSelected = currentData.length > 0 && currentData.every((item) => selectedRows.includes(item.id));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1500px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">
                <Checkbox
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">JK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NISN</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tanggal Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Terdaftar Sebagai</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Keluar Karena</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Alasan Keluar</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tgl Keluar</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <TableRow key={item.id} className={`${selectedRows.includes(item.id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                  <TableCell className="px-5 py-4 text-start">
                    <Checkbox
                      checked={selectedRows.includes(item.id)}
                      onChange={(checked) => handleSelectRow(item.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{item.nama}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jk}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nisn}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempatLahir}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tanggalLahir}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.terdaftarSebagai}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.keluarKarena}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 min-w-[200px]">{item.alasanKeluar}</TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tanggalKeluar}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
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
