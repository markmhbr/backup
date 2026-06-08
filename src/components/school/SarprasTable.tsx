import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import Badge from "../ui/badge/Badge";

interface Sarpras {
  id: number;
  nama: string;
  kategori: string;
  kondisi: "Baik" | "Rusak Ringan" | "Rusak Berat";
  luas: number; // m2
  kepemilikan: string;
}

const sarprasData: Sarpras[] = [
  { id: 1, nama: "Ruang Kelas X RPL 1", kategori: "Ruang Teori", kondisi: "Baik", luas: 72, kepemilikan: "Milik Sendiri" },
  { id: 2, nama: "Ruang Kelas X RPL 2", kategori: "Ruang Teori", kondisi: "Baik", luas: 72, kepemilikan: "Milik Sendiri" },
  { id: 3, nama: "Laboratorium Komputer 1", kategori: "Laboratorium", kondisi: "Baik", luas: 96, kepemilikan: "Milik Sendiri" },
  { id: 4, nama: "Laboratorium Komputer 2", kategori: "Laboratorium", kondisi: "Rusak Ringan", luas: 96, kepemilikan: "Milik Sendiri" },
  { id: 5, nama: "Laboratorium Cisco", kategori: "Laboratorium", kondisi: "Baik", luas: 84, kepemilikan: "Milik Sendiri" },
  { id: 6, nama: "Perpustakaan Utama", kategori: "Penunjang", kondisi: "Baik", luas: 120, kepemilikan: "Milik Sendiri" },
  { id: 7, nama: "Aula Utama", kategori: "Penunjang", kondisi: "Baik", luas: 200, kepemilikan: "Milik Sendiri" },
  { id: 8, nama: "Ruang Guru", kategori: "Kantor", kondisi: "Baik", luas: 150, kepemilikan: "Milik Sendiri" },
  { id: 9, nama: "Ruang Kepala Sekolah", kategori: "Kantor", kondisi: "Baik", luas: 36, kepemilikan: "Milik Sendiri" },
  { id: 10, nama: "Masjid Sekolah", kategori: "Ibadah", kondisi: "Baik", luas: 150, kepemilikan: "Milik Sendiri" },
  { id: 11, nama: "Lapangan Basket", kategori: "Olahraga", kondisi: "Rusak Ringan", luas: 420, kepemilikan: "Milik Sendiri" },
  { id: 12, nama: "Gudang Peralatan", kategori: "Penunjang", kondisi: "Rusak Berat", luas: 48, kepemilikan: "Milik Sendiri" },
  { id: 13, nama: "Ruang UKS", kategori: "Kesehatan", kondisi: "Baik", luas: 24, kepemilikan: "Milik Sendiri" },
  { id: 14, nama: "Laboratorium Multimedia", kategori: "Laboratorium", kondisi: "Baik", luas: 96, kepemilikan: "Milik Sendiri" },
  { id: 15, nama: "Laboratorium Bahasa", kategori: "Laboratorium", kondisi: "Rusak Ringan", luas: 72, kepemilikan: "Milik Sendiri" },
  { id: 16, nama: "Ruang BK", kategori: "Kantor", kondisi: "Baik", luas: 30, kepemilikan: "Milik Sendiri" },
  { id: 17, nama: "Kantin Digital", kategori: "Penunjang", kondisi: "Baik", luas: 60, kepemilikan: "Milik Sendiri" },
  { id: 18, nama: "Pos Keamanan", kategori: "Penunjang", kondisi: "Baik", luas: 9, kepemilikan: "Milik Sendiri" },
  { id: 19, nama: "Ruang OSIS", kategori: "Organisasi", kondisi: "Baik", luas: 24, kepemilikan: "Milik Sendiri" },
  { id: 20, nama: "Toilet Siswa (Blok A)", kategori: "Sanitasi", kondisi: "Baik", luas: 32, kepemilikan: "Milik Sendiri" },
];

interface SarprasTableProps {
  searchTerm: string;
  itemsPerPage: number;
}

export default function SarprasTable({ searchTerm, itemsPerPage }: SarprasTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredData = sarprasData.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.nama.localeCompare(b.nama));
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getConditionColor = (kondisi: string) => {
    switch (kondisi) {
      case "Baik": return "success";
      case "Rusak Ringan": return "warning";
      case "Rusak Berat": return "error";
      default: return "light";
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1000px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Prasarana</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kategori</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Kondisi</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Luas (m²)</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kepemilikan</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? currentData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{item.nama}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.kategori}</TableCell>
                <TableCell className="px-5 py-4 text-center">
                  <Badge size="sm" color={getConditionColor(item.kondisi)}>
                    {item.kondisi}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-medium">{item.luas}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.kepemilikan}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data prasarana ditemukan untuk "{searchTerm}"
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
