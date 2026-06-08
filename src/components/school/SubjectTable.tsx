import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";

interface Subject {
  id: number;
  kode: string;
  nama: string;
}

const subjectData: Subject[] = [
  { id: 1, kode: "MP001", nama: "Pendidikan Agama Islam dan Budi Pekerti" },
  { id: 2, kode: "MP002", nama: "Pendidikan Pancasila" },
  { id: 3, kode: "MP003", nama: "Bahasa Indonesia" },
  { id: 4, kode: "MP004", nama: "Matematika" },
  { id: 5, kode: "MP005", nama: "Sejarah" },
  { id: 6, kode: "MP006", nama: "Bahasa Inggris" },
  { id: 7, kode: "MP007", nama: "Pendidikan Jasmani, Olahraga, dan Kesehatan" },
  { id: 8, kode: "MP008", nama: "Seni Musik" },
  { id: 9, kode: "MP009", nama: "Seni Tari" },
  { id: 10, kode: "MP010", nama: "Seni Teater" },
  { id: 11, kode: "MP011", nama: "Seni Rupa" },
  { id: 12, kode: "MP012", nama: "Informatika" },
  { id: 13, kode: "MP013", nama: "Projek Penguatan Profil Pelajar Pancasila" },
  { id: 14, kode: "MP014", nama: "Muatan Lokal (Bahasa Sunda)" },
  { id: 15, kode: "MP015", nama: "Dasar-Dasar Pengembangan Perangkat Lunak" },
  { id: 16, kode: "MP016", nama: "Pemrograman Web dan Perangkat Bergerak" },
  { id: 17, kode: "MP017", nama: "Basis Data" },
  { id: 18, kode: "MP018", nama: "Pemrograman Berorientasi Objek" },
  { id: 19, kode: "MP019", nama: "Produk Kreatif dan Kewirausahaan" },
  { id: 20, kode: "MP020", nama: "Kebutuhan Industri (Cloud Computing)" },
];

interface SubjectTableProps {
  searchTerm: string;
  itemsPerPage: number;
}

export default function SubjectTable({ searchTerm, itemsPerPage }: SubjectTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredData = subjectData.filter(item => 
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
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Mata Pelajaran</TableCell>
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
                        Tidak ada mata pelajaran ditemukan untuk "{searchTerm}"
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
