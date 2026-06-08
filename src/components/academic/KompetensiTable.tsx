import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";

interface Kompetensi {
  id: number;
  kode: string;
  nama: string;
}

const kompetensiData: Kompetensi[] = [
  { id: 1, kode: "RPL", nama: "Pengembangan Perangkat Lunak dan Gim" },
  { id: 2, kode: "TKJ", nama: "Teknik Komputer dan Jaringan" },
  { id: 3, kode: "MM", nama: "Multimedia" },
  { id: 4, kode: "AK", nama: "Akuntansi dan Keuangan Lembaga" },
  { id: 5, kode: "OTKP", nama: "Otomatisasi dan Tata Kelola Perkantoran" },
  { id: 6, kode: "BDP", nama: "Bisnis Daring dan Pemasaran" },
  { id: 7, kode: "TKRO", nama: "Teknik Kendaraan Ringan Otomotif" },
  { id: 8, kode: "TBSM", nama: "Teknik dan Bisnis Sepeda Motor" },
  { id: 9, kode: "TITL", nama: "Teknik Instalasi Tenaga Listrik" },
  { id: 10, kode: "TPM", nama: "Teknik Pemesinan" },
  { id: 11, kode: "TGB", nama: "Teknik Gambar Bangunan" },
  { id: 12, kode: "PH", nama: "Perhotelan" },
  { id: 13, kode: "TBL", nama: "Tata Boga" },
  { id: 14, kode: "Tbus", nama: "Tata Busana" },
  { id: 15, kode: "Kec", nama: "Tata Kecantikan" },
  { id: 16, kode: "Farm", nama: "Farmasi Klinis dan Komunitas" },
  { id: 17, kode: "Kep", nama: "Keperawatan" },
  { id: 18, kode: "Ankim", nama: "Analis Kimia" },
  { id: 19, kode: "AP", nama: "Administrasi Perkantoran" },
  { id: 20, kode: "DKV", nama: "Desain Komunikasi Visual" },
];

interface KompetensiTableProps {
  onSelectionChange?: (selectedIds: number[]) => void;
  searchTerm: string;
  itemsPerPage: number;
}

export default function KompetensiTable({ searchTerm, itemsPerPage }: KompetensiTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredData = kompetensiData.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.nama.localeCompare(b.nama));
  
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
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Kompetensi</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? currentData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-4 text-start text-gray-500 dark:text-gray-400 text-theme-sm">{item.kode}</TableCell>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{item.nama}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={2} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada kompetensi keahlian ditemukan untuk "{searchTerm}"
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
