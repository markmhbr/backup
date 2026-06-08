import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../common/Pagination";
import Checkbox from "../form/input/Checkbox";
import Avatar from "../ui/avatar/Avatar";

interface Tendik {
  id: number;
  induk: "Ya" | "Tidak";
  nama: string;
  avatar: string;
  jk: "L" | "P";
  lengkapData: number;
  tempatLahir: string;
  tanggalLahir: string;
  ibuKandung: string;
  statusKepegawaian: string;
  jenisGTK: string;
  jabatanGTK: string;
  alamat: string;
  nuptk: string;
  tglSuratTugas: string;
}

const tendikData: Tendik[] = [
  { id: 1, induk: "Tidak", nama: "Ahmad Suherman", avatar: "/images/user/user-01.jpg", jk: "L", lengkapData: 45, tempatLahir: "Bandung", tanggalLahir: "05/06/1982", ibuKandung: "Aminah", statusKepegawaian: "Honorer", jenisGTK: "Teknisi", jabatanGTK: "Maintenance", alamat: "Jl. Antapani No. 3, Bandung", nuptk: "-", tglSuratTugas: "01/07/2015" },
  { id: 2, induk: "Tidak", nama: "Agus Setiawan", avatar: "/images/user/user-02.jpg", jk: "L", lengkapData: 35, tempatLahir: "Cimahi", tanggalLahir: "14/02/1990", ibuKandung: "Aminah", statusKepegawaian: "Honorer", jenisGTK: "Laboran", jabatanGTK: "Laboran", alamat: "Jl. Cimahi No. 44, Cimahi", nuptk: "-", tglSuratTugas: "01/01/2015" },
  { id: 3, induk: "Ya", nama: "Bambang Sugiharto", avatar: "/images/user/user-03.jpg", jk: "L", lengkapData: 60, tempatLahir: "Jakarta", tanggalLahir: "15/08/1977", ibuKandung: "Siti", statusKepegawaian: "PNS", jenisGTK: "Kepala Sekolah", jabatanGTK: "Pembina", alamat: "Jl. Jakarta No. 1, Bandung", nuptk: "1234567890987654", tglSuratTugas: "01/01/2003" },
  { id: 4, induk: "Ya", nama: "Dadang Hermawan", avatar: "/images/user/user-04.jpg", jk: "L", lengkapData: 100, tempatLahir: "Bandung", tanggalLahir: "15/03/1975", ibuKandung: "Suryati", statusKepegawaian: "Honorer", jenisGTK: "Caraka", jabatanGTK: "Kebersihan", alamat: "Jl. Bojong No. 2, Bandung", nuptk: "-", tglSuratTugas: "01/01/2012" },
  { id: 5, induk: "Ya", nama: "Dewi Persik", avatar: "/images/user/user-05.jpg", jk: "P", lengkapData: 100, tempatLahir: "Cianjur", tanggalLahir: "20/03/1992", ibuKandung: "Wati", statusKepegawaian: "Honorer", jenisGTK: "Operator", jabatanGTK: "Dapodik", alamat: "Jl. Cianjur No. 2, Cianjur", nuptk: "-", tglSuratTugas: "01/07/2018" },
  { id: 6, induk: "Ya", nama: "Eka Putra", avatar: "/images/user/user-06.jpg", jk: "L", lengkapData: 95, tempatLahir: "Tasikmalaya", tanggalLahir: "10/11/1989", ibuKandung: "Kokom", statusKepegawaian: "Honorer", jenisGTK: "Staf Sarpras", jabatanGTK: "Logistik", alamat: "Jl. Tasik No. 11, Tasikmalaya", nuptk: "-", tglSuratTugas: "01/01/2015" },
  { id: 7, induk: "Ya", nama: "Fitriani", avatar: "/images/user/user-07.jpg", jk: "P", lengkapData: 100, tempatLahir: "Garut", tanggalLahir: "05/01/1991", ibuKandung: "Enah", statusKepegawaian: "PPPK", jenisGTK: "Staf Kesiswaan", jabatanGTK: "Administrasi", alamat: "Jl. Garut No. 8, Garut", nuptk: "3456789012345678", tglSuratTugas: "01/03/2021" },
  { id: 8, induk: "Tidak", nama: "Gani Wijaya", avatar: "/images/user/user-08.jpg", jk: "L", lengkapData: 30, tempatLahir: "Bandung", tanggalLahir: "18/02/1994", ibuKandung: "Uti", statusKepegawaian: "Honorer", jenisGTK: "Driver", jabatanGTK: "Pengemudi", alamat: "Jl. Kopo No. 22, Bandung", nuptk: "-", tglSuratTugas: "01/01/2020" },
  { id: 9, induk: "Ya", nama: "Hanny Handayani", avatar: "/images/user/user-09.jpg", jk: "P", lengkapData: 100, tempatLahir: "Cirebon", tanggalLahir: "22/11/1987", ibuKandung: "Sari", statusKepegawaian: "Honorer", jenisGTK: "Staf Kurikulum", jabatanGTK: "Sekretaris", alamat: "Jl. Cirebon No. 12, Cirebon", nuptk: "-", tglSuratTugas: "01/07/2013" },
  { id: 10, induk: "Ya", nama: "Indra Lesmana", avatar: "/images/user/user-10.jpg", jk: "L", lengkapData: 85, tempatLahir: "Sukabumi", tanggalLahir: "20/11/1988", ibuKandung: "Ningsih", statusKepegawaian: "Honorer", jenisGTK: "Pustakawan", jabatanGTK: "Staf Perpustakaan", alamat: "Jl. Sukabumi No. 1, Sukabumi", nuptk: "-", tglSuratTugas: "01/07/2014" },
  { id: 11, induk: "Ya", nama: "Irfan Hakim", avatar: "/images/user/user-11.jpg", jk: "L", lengkapData: 80, tempatLahir: "Bekasi", tanggalLahir: "12/03/1983", ibuKandung: "Rohayah", statusKepegawaian: "PNS", jenisGTK: "Staf TU", jabatanGTK: "Arsiparis", alamat: "Jl. Bekasi No. 3, Bekasi", nuptk: "5678901234567890", tglSuratTugas: "01/01/2007" },
  { id: 12, induk: "Ya", nama: "Joni Iskandar", avatar: "/images/user/user-12.jpg", jk: "L", lengkapData: 100, tempatLahir: "Bandung", tanggalLahir: "01/01/1980", ibuKandung: "Maimunah", statusKepegawaian: "Honorer", jenisGTK: "Penjaga Malam", jabatanGTK: "Keamanan", alamat: "Jl. Buah Batu No. 1, Bandung", nuptk: "-", tglSuratTugas: "01/01/2010" },
  { id: 13, induk: "Ya", nama: "Kartika Sari", avatar: "/images/user/user-13.jpg", jk: "P", lengkapData: 100, tempatLahir: "Sukabumi", tanggalLahir: "15/05/1993", ibuKandung: "Siti", statusKepegawaian: "PPPK", jenisGTK: "Staf Perpustakaan", jabatanGTK: "Librarian", alamat: "Jl. Sukabumi No. 9, Sukabumi", nuptk: "6543210987654321", tglSuratTugas: "01/03/2022" },
  { id: 14, induk: "Ya", nama: "Lilis Hartini", avatar: "/images/user/user-14.jpg", jk: "P", lengkapData: 90, tempatLahir: "Sumedang", tanggalLahir: "08/04/1982", ibuKandung: "Kokom", statusKepegawaian: "Honorer", jenisGTK: "Bendahara", jabatanGTK: "Bendahara BOS", alamat: "Jl. Tanjungsari No. 5, Sumedang", nuptk: "-", tglSuratTugas: "01/01/2010" },
  { id: 15, induk: "Ya", nama: "Lukman Hakim", avatar: "/images/user/user-15.jpg", jk: "L", lengkapData: 100, tempatLahir: "Cimahi", tanggalLahir: "10/10/1981", ibuKandung: "Aminah", statusKepegawaian: "PNS", jenisGTK: "Staf Sarpras", jabatanGTK: "Inventaris", alamat: "Jl. Cimahi No. 7, Cimahi", nuptk: "7654321098765432", tglSuratTugas: "01/01/2006" },
  { id: 16, induk: "Ya", nama: "Mulyadi, S.Sos.", avatar: "/images/user/user-16.jpg", jk: "L", lengkapData: 100, tempatLahir: "Subang", tanggalLahir: "12/12/1978", ibuKandung: "Maimunah", statusKepegawaian: "PNS", jenisGTK: "Kepala TU", jabatanGTK: "Penata", alamat: "Jl. Subang Jaya No. 2, Subang", nuptk: "4567890123456789", tglSuratTugas: "01/01/2005" },
  { id: 17, induk: "Ya", nama: "Rina Marlina", avatar: "/images/user/user-17.jpg", jk: "P", lengkapData: 70, tempatLahir: "Bandung", tanggalLahir: "25/05/1985", ibuKandung: "Enah", statusKepegawaian: "Honorer", jenisGTK: "Staf Administrasi", jabatanGTK: "Staf", alamat: "Jl. Kopo No. 123, Bandung", nuptk: "-", tglSuratTugas: "10/06/2012" },
  { id: 18, induk: "Ya", nama: "Sari Dewi", avatar: "/images/user/user-18.jpg", jk: "P", lengkapData: 100, tempatLahir: "Bogor", tanggalLahir: "12/04/1990", ibuKandung: "Dewi", statusKepegawaian: "Honorer", jenisGTK: "Staf TU", jabatanGTK: "Persuratan", alamat: "Jl. Bogor No. 10, Bogor", nuptk: "-", tglSuratTugas: "01/01/2016" },
  { id: 19, induk: "Ya", nama: "Suryana", avatar: "/images/user/user-19.jpg", jk: "L", lengkapData: 100, tempatLahir: "Bandung", tanggalLahir: "30/10/1980", ibuKandung: "Rohayah", statusKepegawaian: "Honorer", jenisGTK: "Penjaga Sekolah", jabatanGTK: "Keamanan", alamat: "Jl. Sekolah No. 1, Bandung", nuptk: "-", tglSuratTugas: "01/07/2008" },
  { id: 20, induk: "Ya", nama: "Yulia Citra", avatar: "/images/user/user-20.jpg", jk: "P", lengkapData: 100, tempatLahir: "Sumedang", tanggalLahir: "30/01/1985", ibuKandung: "Rohmah", statusKepegawaian: "PNS", jenisGTK: "Staf Keuangan", jabatanGTK: "Verifikator", alamat: "Jl. Sumedang Indah No. 5, Sumedang", nuptk: "9876543210987654", tglSuratTugas: "01/01/2009" },
];

interface TendikTableProps {
  onSelectionChange: (selectedIds: number[]) => void;
  searchTerm: string;
  completenessFilter: string;
  itemsPerPage: number;
}

export default function TendikTable({ onSelectionChange, searchTerm, completenessFilter, itemsPerPage }: TendikTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const filteredData = tendikData.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.nuptk.toLowerCase().includes(searchTerm.toLowerCase());
    
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
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Induk</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">JK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Lengkap Data</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tanggal Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ibu Kandung</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status Kepegawaian</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jenis GTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jabatan GTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Alamat</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NUPTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tgl Surat Tugas</TableCell>
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
                <TableCell className="px-5 py-4 text-start">
                  <Badge size="sm" color={item.induk === "Ya" ? "success" : "light"}>
                    {item.induk}
                  </Badge>
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
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempatLahir}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tanggalLahir}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.ibuKandung}</TableCell>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.statusKepegawaian}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenisGTK}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jabatanGTK}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 min-w-[200px]">{item.alamat}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nuptk}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tglSuratTugas}</TableCell>
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
