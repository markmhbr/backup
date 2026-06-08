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

interface TahunPelajaran {
  id: number;
  semester: string;
  tahunPelajaran: string;
  status: "Aktif" | "Non Aktif";
}

const initialData: TahunPelajaran[] = [
  { id: 1, semester: "20251 (Ganjil)", tahunPelajaran: "2025/2026", status: "Aktif" },
  { id: 2, semester: "20252 (Genap)", tahunPelajaran: "2025/2026", status: "Non Aktif" },
  { id: 3, semester: "20241 (Ganjil)", tahunPelajaran: "2024/2025", status: "Non Aktif" },
  { id: 4, semester: "20242 (Genap)", tahunPelajaran: "2024/2025", status: "Non Aktif" },
  { id: 5, semester: "20231 (Ganjil)", tahunPelajaran: "2023/2024", status: "Non Aktif" },
];

interface TahunPelajaranTableProps {
  onSelectionChange?: (selectedIds: number[]) => void;
  searchTerm: string;
  itemsPerPage: number;
}

export default function TahunPelajaranTable({ searchTerm, itemsPerPage }: TahunPelajaranTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = initialData.filter(item => 
    item.tahunPelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.semester.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[800px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Semester</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tahun Pelajaran</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? currentData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.semester}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tahunPelajaran}</TableCell>
                <TableCell className="px-5 py-4 text-center">
                  <Badge size="sm" color={item.status === "Aktif" ? "success" : "light"}>
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={3} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data tahun pelajaran ditemukan
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
