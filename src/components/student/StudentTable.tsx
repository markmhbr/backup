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
import Avatar from "../ui/avatar/Avatar";

interface Student {
  id: number;
  nama: string;
  avatar: string;
  jk: "L" | "P";
  lengkapData: number; // Percentage
  nisn: string;
  nis: string;
  nik: string;
  noKK: string;
  tingkat: string;
  rombel: string;
  tglMasuk: string;
  terdaftarSebagai: string;
  tempatLahir: string;
  tanggalLahir: string;
}

const studentData: Student[] = [
  { id: 1, nama: "Aditya Pratama", avatar: "/images/user/user-01.jpg", jk: "L", lengkapData: 100, nisn: "0012345678", nis: "1001", nik: "3201010101010001", noKK: "3201010101010000", tingkat: "10", rombel: "X RPL 1", tglMasuk: "15/07/2023", terdaftarSebagai: "Siswa Baru", tempatLahir: "Bandung", tanggalLahir: "10/05/2008" },
  { id: 2, nama: "Bella Safira", avatar: "/images/user/user-02.jpg", jk: "P", lengkapData: 85, nisn: "0012345679", nis: "1002", nik: "3201014101010002", noKK: "3201010101010000", tingkat: "10", rombel: "X RPL 1", tglMasuk: "15/07/2023", terdaftarSebagai: "Siswa Baru", tempatLahir: "Sumedang", tanggalLahir: "12/05/2008" },
  { id: 3, nama: "Candra Wijaya", avatar: "/images/user/user-03.jpg", jk: "L", lengkapData: 45, nisn: "0012345680", nis: "1003", nik: "3201010101010003", noKK: "3201010101010000", tingkat: "11", rombel: "XI TKJ 2", tglMasuk: "15/07/2022", terdaftarSebagai: "Siswa Baru", tempatLahir: "Cimahi", tanggalLahir: "20/08/2007" },
  { id: 4, nama: "Dian Pelangi", avatar: "/images/user/user-04.jpg", jk: "P", lengkapData: 100, nisn: "0012345681", nis: "1004", nik: "3201014101010004", noKK: "3201010101010000", tingkat: "12", rombel: "XII MM 1", tglMasuk: "15/07/2021", terdaftarSebagai: "Siswa Baru", tempatLahir: "Garut", tanggalLahir: "15/03/2006" },
  { id: 5, nama: "Erlangga Putra", avatar: "/images/user/user-05.jpg", jk: "L", lengkapData: 60, nisn: "0012345682", nis: "1005", nik: "3201010101010005", noKK: "3201010101010000", tingkat: "10", rombel: "X RPL 2", tglMasuk: "15/07/2023", terdaftarSebagai: "Siswa Baru", tempatLahir: "Tasikmalaya", tanggalLahir: "10/11/2008" },
  { id: 6, nama: "Fania Rahma", avatar: "/images/user/user-06.jpg", jk: "P", lengkapData: 100, nisn: "0012345683", nis: "1006", nik: "3201014101010006", noKK: "3201010101010000", tingkat: "11", rombel: "XI TKJ 1", tglMasuk: "15/07/2022", terdaftarSebagai: "Siswa Baru", tempatLahir: "Bogor", tanggalLahir: "05/06/2007" },
  { id: 7, nama: "Gilang Dirga", avatar: "/images/user/user-07.jpg", jk: "L", lengkapData: 30, nisn: "0012345684", nis: "1007", nik: "3201010101010007", noKK: "3201010101010000", tingkat: "12", rombel: "XII RPL 1", tglMasuk: "15/07/2021", terdaftarSebagai: "Siswa Baru", tempatLahir: "Bandung", tanggalLahir: "12/04/2006" },
  { id: 8, nama: "Hana Hanifah", avatar: "/images/user/user-08.jpg", jk: "P", lengkapData: 95, nisn: "0012345685", nis: "1008", nik: "3201014101010008", noKK: "3201010101010000", tingkat: "10", rombel: "X AK 1", tglMasuk: "15/07/2023", terdaftarSebagai: "Siswa Baru", tempatLahir: "Cianjur", tanggalLahir: "01/01/2008" },
  { id: 9, nama: "Indra Wijaya", avatar: "/images/user/user-09.jpg", jk: "L", lengkapData: 100, nisn: "0012345686", nis: "1009", nik: "3201010101010009", noKK: "3201010101010000", tingkat: "11", rombel: "XI RPL 1", tglMasuk: "15/07/2022", terdaftarSebagai: "Siswa Baru", tempatLahir: "Subang", tanggalLahir: "15/09/2007" },
  { id: 10, nama: "Jasmine Putri", avatar: "/images/user/user-10.jpg", jk: "P", lengkapData: 80, nisn: "0012345687", nis: "1010", nik: "3201014101010010", noKK: "3201010101010000", tingkat: "12", rombel: "XII TKJ 2", tglMasuk: "15/07/2021", terdaftarSebagai: "Siswa Baru", tempatLahir: "Purwakarta", tanggalLahir: "10/10/2006" },
  { id: 11, nama: "Kevin Sanjaya", avatar: "/images/user/user-11.jpg", jk: "L", lengkapData: 100, nisn: "0012345688", nis: "1011", nik: "3201010101010011", noKK: "3201010101010000", tingkat: "10", rombel: "X RPL 1", tglMasuk: "15/07/2023", terdaftarSebagai: "Siswa Baru", tempatLahir: "Sukabumi", tanggalLahir: "05/02/2008" },
  { id: 12, nama: "Lestari Dewi", avatar: "/images/user/user-12.jpg", jk: "P", lengkapData: 40, nisn: "0012345689", nis: "1012", nik: "3201014101010012", noKK: "3201010101010000", tingkat: "11", rombel: "XI AK 1", tglMasuk: "15/07/2022", terdaftarSebagai: "Siswa Baru", tempatLahir: "Bandung", tanggalLahir: "20/03/2007" },
  { id: 13, nama: "Muhammad Ridwan", avatar: "/images/user/user-13.jpg", jk: "L", lengkapData: 100, nisn: "0012345690", nis: "1013", nik: "3201010101010013", noKK: "3201010101010000", tingkat: "12", rombel: "XII RPL 2", tglMasuk: "15/07/2021", terdaftarSebagai: "Siswa Baru", tempatLahir: "Bekasi", tanggalLahir: "12/04/2006" },
  { id: 14, nama: "Nadia Utami", avatar: "/images/user/user-14.jpg", jk: "P", lengkapData: 75, nisn: "0012345691", nis: "1014", nik: "3201014101010014", noKK: "3201010101010000", tingkat: "10", rombel: "X TKJ 1", tglMasuk: "15/07/2023", terdaftarSebagai: "Siswa Baru", tempatLahir: "Depok", tanggalLahir: "31/12/2008" },
  { id: 15, nama: "Oki Setiawan", avatar: "/images/user/user-15.jpg", jk: "L", lengkapData: 100, nisn: "0012345692", nis: "1015", nik: "3201010101010015", noKK: "3201010101010000", tingkat: "11", rombel: "XI MM 1", tglMasuk: "15/07/2022", terdaftarSebagai: "Siswa Baru", tempatLahir: "Karawang", tanggalLahir: "14/07/2007" },
  { id: 16, nama: "Putri Ayu", avatar: "/images/user/user-16.jpg", jk: "P", lengkapData: 90, nisn: "0012345693", nis: "1016", nik: "3201014101010016", noKK: "3201010101010000", tingkat: "12", rombel: "XII AK 1", tglMasuk: "15/07/2021", terdaftarSebagai: "Siswa Baru", tempatLahir: "Cirebon", tanggalLahir: "25/01/2006" },
  { id: 17, nama: "Rizky Fauzi", avatar: "/images/user/user-17.jpg", jk: "L", lengkapData: 100, nisn: "0012345694", nis: "1017", nik: "3201010101010017", noKK: "3201010101010000", tingkat: "10", rombel: "X RPL 1", tglMasuk: "15/07/2023", terdaftarSebagai: "Siswa Baru", tempatLahir: "Indramayu", tanggalLahir: "18/06/2008" },
  { id: 18, nama: "Sinta Maharani", avatar: "/images/user/user-18.jpg", jk: "P", lengkapData: 55, nisn: "0012345695", nis: "1018", nik: "3201014101010018", noKK: "3201010101010000", tingkat: "11", rombel: "XI TKJ 2", tglMasuk: "15/07/2022", terdaftarSebagai: "Siswa Baru", tempatLahir: "Majalengka", tanggalLahir: "09/09/2007" },
  { id: 19, nama: "Taufik Hidayat", avatar: "/images/user/user-19.jpg", jk: "L", lengkapData: 100, nisn: "0012345696", nis: "1019", nik: "3201010101010019", noKK: "3201010101010000", tingkat: "12", rombel: "XII MM 2", tglMasuk: "15/07/2021", terdaftarSebagai: "Siswa Baru", tempatLahir: "Kuningan", tanggalLahir: "21/11/2006" },
  { id: 20, nama: "Vina Panduwinata", avatar: "/images/user/user-20.jpg", jk: "P", lengkapData: 100, nisn: "0012345697", nis: "1020", nik: "3201014101010020", noKK: "3201010101010000", tingkat: "10", rombel: "X AK 1", tglMasuk: "15/07/2023", terdaftarSebagai: "Siswa Baru", tempatLahir: "Garut", tanggalLahir: "14/02/2008" },
];

interface StudentTableProps {
  type?: "aktif" | "alumni";
  onSelectionChange: (selectedIds: number[]) => void;
  searchTerm: string;
  completenessFilter: string;
  itemsPerPage: number;
}

export default function StudentTable({ onSelectionChange, searchTerm, completenessFilter, itemsPerPage }: StudentTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  
  const filteredData = studentData.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.nisn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.nis.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCompleteness = true;
    if (completenessFilter === "100") {
      matchesCompleteness = item.lengkapData === 100;
    } else if (completenessFilter === "99") {
      matchesCompleteness = item.lengkapData < 100;
    } else if (completenessFilter === "50") {
      matchesCompleteness = item.lengkapData < 50;
    }
    
    return matchesSearch && matchesCompleteness;
  }).sort((a, b) => a.nama.localeCompare(b.nama));
  
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
        <Table className="min-w-[1700px]">
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
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Lengkap Data</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NISN</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NIPD</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NIK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">No. KK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tingkat</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Rombel</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tgl Masuk</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Terdaftar Sebagai</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tgl Lahir</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? currentData.map((item) => (
              <TableRow key={item.id} className={`${selectedRows.includes(item.id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                <TableCell className="px-5 py-4 text-start">
                  <Checkbox
                    checked={selectedRows.includes(item.id)}
                    onChange={(checked) => handleSelectRow(item.id, checked)}
                  />
                </TableCell>
                <TableCell className="px-5 py-4 text-start whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <Avatar src={item.avatar} size="small" />
                        <span className="font-medium text-gray-800 dark:text-white/90">{item.nama}</span>
                    </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jk}</TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <div className="flex items-center gap-1.5">
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 max-w-[60px]">
                          <div 
                            className={`h-1.5 rounded-full ${item.lengkapData === 100 ? 'bg-success-500' : item.lengkapData < 50 ? 'bg-error-500' : 'bg-warning-500'}`} 
                            style={{ width: `${item.lengkapData}%` }}
                          ></div>
                      </div>
                      <span className={`text-theme-xs font-medium ${item.lengkapData === 100 ? 'text-success-500' : item.lengkapData < 50 ? 'text-error-500' : 'text-warning-500'}`}>
                          {item.lengkapData}%
                      </span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nisn}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nis}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nik}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.noKK}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 text-center">{item.tingkat}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.rombel}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tglMasuk}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.terdaftarSebagai}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempatLahir}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tanggalLahir}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={14} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
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
