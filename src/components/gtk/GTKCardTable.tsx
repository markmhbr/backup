import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import Avatar from "../ui/avatar/Avatar";
import Button from "../ui/button/Button";
import { PrinterIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import PrintGTKCardPreview from "./PrintGTKCardPreview";

interface GTKCard {
  id: number;
  nama: string;
  avatar: string;
  nuptk: string;
  jabatan: string;
  jenis: "Guru" | "Tendik";
}

const gtkCardData: GTKCard[] = [
  // Guru
  { id: 1, nama: "Abdul Gani, S.Ag.", avatar: "/images/user/user-01.jpg", nuptk: "7890123456789012", jabatan: "Guru Madya", jenis: "Guru" },
  { id: 2, nama: "Ani Maryani, S.Pd.", avatar: "/images/user/user-02.jpg", nuptk: "-", jabatan: "Guru Seni", jenis: "Guru" },
  { id: 3, nama: "Bambang Herlambang, S.T.", avatar: "/images/user/user-03.jpg", nuptk: "-", jabatan: "Guru Pertama", jenis: "Guru" },
  { id: 4, nama: "Budi Cahyadi, M.Pd.", avatar: "/images/user/user-04.jpg", nuptk: "5678901234567890", jabatan: "Guru Muda", jenis: "Guru" },
  // Tendik
  { id: 101, nama: "Ahmad Suherman", avatar: "/images/user/user-10.jpg", nuptk: "-", jabatan: "Maintenance", jenis: "Tendik" },
  { id: 102, nama: "Agus Setiawan", avatar: "/images/user/user-11.jpg", nuptk: "-", jabatan: "Laboran", jenis: "Tendik" },
  { id: 103, nama: "Dewi Persik", avatar: "/images/user/user-12.jpg", nuptk: "-", jabatan: "Operator", jenis: "Tendik" },
];

interface GTKCardTableProps {
  type: "guru" | "tendik";
  searchTerm: string;
}

export default function GTKCardTable({ type, searchTerm }: GTKCardTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedPerson, setSelectedPerson] = useState<GTKCard | null>(null);

  const filteredData = gtkCardData.filter(item => {
    const matchesType = item.jenis.toLowerCase() === type.toLowerCase();
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.nuptk.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }).sort((a, b) => a.nama.localeCompare(b.nama));

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrintClick = (person: GTKCard) => {
    setSelectedPerson(person);
    openModal();
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table className="min-w-[600px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NUPTK</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {currentData.length > 0 ? currentData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-4 text-start whitespace-nowrap">
                      <div className="flex items-center gap-3">
                          <Avatar src={item.avatar} size="small" />
                          <span className="font-medium text-gray-800 dark:text-white/90">{item.nama}</span>
                      </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nuptk}</TableCell>
                  <TableCell className="px-5 py-4 text-center">
                    <div className="flex justify-center">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700 min-w-[110px]"
                            onClick={() => handlePrintClick(item)}
                        >
                            <PrinterIcon className="h-4 w-4" />
                            Cetak
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                  <TableRow>
                      <TableCell colSpan={3} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
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

      {/* Print Preview Modal */}
      <PrintGTKCardPreview 
        isOpen={isOpen}
        onClose={closeModal}
        person={selectedPerson}
      />
    </>
  );
}
