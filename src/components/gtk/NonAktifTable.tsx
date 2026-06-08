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

interface GTKNonAktif {
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
  alasan: string;
  tglKeluar: string;
}

const nonAktifData: GTKNonAktif[] = [
  { id: 1, induk: "Ya", nama: "Budi Santoso, S.Pd.", avatar: "/images/user/user-01.jpg", jk: "L", lengkapData: 100, tempatLahir: "Cimahi", tanggalLahir: "05/11/1964", ibuKandung: "Siti", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Madya", alamat: "Jl. Cimahi Indah No. 1, Cimahi", nuptk: "3333444455556666", tglSuratTugas: "01/03/1988", alasan: "Pensiun", tglKeluar: "31/12/2023" },
  { id: 2, induk: "Ya", nama: "Drs. Yusuf Mansur", avatar: "/images/user/user-02.jpg", jk: "L", lengkapData: 100, tempatLahir: "Bogor", tanggalLahir: "01/01/1960", ibuKandung: "Aminah", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Madya", alamat: "Jl. Raya Bogor No. 12, Bogor", nuptk: "1111222233334444", tglSuratTugas: "01/03/1985", alasan: "Pensiun", tglKeluar: "01/01/2024" },
  { id: 3, induk: "Ya", nama: "Euis Rohayati", avatar: "/images/user/user-03.jpg", jk: "P", lengkapData: 70, tempatLahir: "Sumedang", tanggalLahir: "18/02/1980", ibuKandung: "Enah", statusKepegawaian: "Honorer", jenisGTK: "Staf Perpus", jabatanGTK: "Librarian", alamat: "Jl. Tanjungsari No. 3, Sumedang", nuptk: "-", tglSuratTugas: "01/01/2005", alasan: "Selesai Masa Tugas", tglKeluar: "31/12/2023" },
  { id: 4, induk: "Ya", nama: "Farhan Malik", avatar: "/images/user/user-04.jpg", jk: "L", lengkapData: 100, tempatLahir: "Bandung", tanggalLahir: "22/11/1995", ibuKandung: "Uti", statusKepegawaian: "Honorer", jenisGTK: "Operator", jabatanGTK: "Staf IT", alamat: "Jl. Antapani No. 10, Bandung", nuptk: "-", tglSuratTugas: "01/07/2018", alasan: "Resign", tglKeluar: "15/06/2024" },
  { id: 5, induk: "Tidak", nama: "Hanny Handayani", avatar: "/images/user/user-05.jpg", jk: "P", lengkapData: 45, tempatLahir: "Cirebon", tanggalLahir: "12/04/1985", ibuKandung: "Dewi", statusKepegawaian: "Honorer", jenisGTK: "Guru Seni", jabatanGTK: "Guru", alamat: "Jl. Cirebon Raya No. 4, Cirebon", nuptk: "-", tglSuratTugas: "01/01/2010", alasan: "Mutasi", tglKeluar: "01/02/2024" },
  { id: 6, induk: "Ya", nama: "Herman Suherman", avatar: "/images/user/user-06.jpg", jk: "L", lengkapData: 100, tempatLahir: "Garut", tanggalLahir: "12/03/1965", ibuKandung: "Kokom", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Madya", alamat: "Jl. Garut Raya No. 5, Garut", nuptk: "2222333344445555", tglSuratTugas: "01/01/1990", alasan: "Pensiun", tglKeluar: "12/04/2024" },
  { id: 7, induk: "Ya", nama: "Irfan Hakim", avatar: "/images/user/user-07.jpg", jk: "L", lengkapData: 100, tempatLahir: "Jakarta", tanggalLahir: "01/01/1975", ibuKandung: "Rohmah", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Pembina", alamat: "Jl. Sudirman No. 2, Jakarta", nuptk: "4444555566667777", tglSuratTugas: "01/03/2000", alasan: "Mutasi", tglKeluar: "01/03/2024" },
  { id: 8, induk: "Ya", nama: "Joni Iskandar", avatar: "/images/user/user-08.jpg", jk: "L", lengkapData: 80, tempatLahir: "Bogor", tanggalLahir: "14/07/1980", ibuKandung: "Yatmi", statusKepegawaian: "Honorer", jenisGTK: "Keamanan", jabatanGTK: "Security", alamat: "Jl. Bogor Baru No. 1, Bogor", nuptk: "-", tglSuratTugas: "01/01/2012", alasan: "Resign", tglKeluar: "20/05/2024" },
  { id: 9, induk: "Ya", nama: "Kartika Sari", avatar: "/images/user/user-09.jpg", jk: "P", lengkapData: 100, tempatLahir: "Sukabumi", tanggalLahir: "15/05/1990", ibuKandung: "Sari", statusKepegawaian: "PPPK", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Pertama", alamat: "Jl. Sukabumi Indah No. 5, Sukabumi", nuptk: "5555666677778888", tglSuratTugas: "01/03/2020", alasan: "Resign", tglKeluar: "30/04/2024" },
  { id: 10, induk: "Ya", nama: "Lukman Hakim", avatar: "/images/user/user-10.jpg", jk: "L", lengkapData: 100, tempatLahir: "Cimahi", tanggalLahir: "10/10/1978", ibuKandung: "Aminah", statusKepegawaian: "PNS", jenisGTK: "Kepala TU", jabatanGTK: "Penata", alamat: "Jl. Cimahi Raya No. 11, Cimahi", nuptk: "6666777788889999", tglSuratTugas: "01/01/2005", alasan: "Pensiun", tglKeluar: "01/06/2024" },
  { id: 11, induk: "Tidak", nama: "Mira Setiawati", avatar: "/images/user/user-11.jpg", jk: "P", lengkapData: 35, tempatLahir: "Bandung", tanggalLahir: "05/06/1994", ibuKandung: "Uti", statusKepegawaian: "Honorer", jenisGTK: "Staf Kesiswaan", jabatanGTK: "Staf", alamat: "Jl. Bojong No. 22, Bandung", nuptk: "-", tglSuratTugas: "01/07/2019", alasan: "Selesai Kontrak", tglKeluar: "30/06/2024" },
  { id: 12, induk: "Ya", nama: "Nadia Utami", avatar: "/images/user/user-12.jpg", jk: "P", lengkapData: 100, tempatLahir: "Tasikmalaya", tanggalLahir: "22/11/1988", ibuKandung: "Kokom", statusKepegawaian: "Honorer", jenisGTK: "Bendahara", jabatanGTK: "Bendahara", alamat: "Jl. Tasik No. 8, Tasikmalaya", nuptk: "-", tglSuratTugas: "01/01/2014", alasan: "Resign", tglKeluar: "10/02/2024" },
  { id: 13, induk: "Ya", nama: "Oki Setiawan", avatar: "/images/user/user-13.jpg", jk: "L", lengkapData: 100, tempatLahir: "Garut", tanggalLahir: "12/03/1982", ibuKandung: "Lilis", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Madya", alamat: "Jl. Garut No. 3, Garut", nuptk: "7777888899990000", tglSuratTugas: "01/01/2007", alasan: "Pensiun", tglKeluar: "15/05/2024" },
  { id: 14, induk: "Ya", nama: "Putri Ayu", avatar: "/images/user/user-14.jpg", jk: "P", lengkapData: 90, tempatLahir: "Bandung", tanggalLahir: "01/01/1991", ibuKandung: "Rohayah", statusKepegawaian: "Honorer", jenisGTK: "Staf TU", jabatanGTK: "Administrasi", alamat: "Jl. Bandung No. 1, Bandung", nuptk: "-", tglSuratTugas: "01/01/2015", alasan: "Resign", tglKeluar: "30/03/2024" },
  { id: 15, induk: "Tidak", nama: "Ratna Sari, S.Pd.", avatar: "/images/user/user-15.jpg", jk: "P", lengkapData: 40, tempatLahir: "Cianjur", tanggalLahir: "15/05/1990", ibuKandung: "Suryati", statusKepegawaian: "Honorer", jenisGTK: "Guru Kelas", jabatanGTK: "Guru Pertama", alamat: "Jl. Cianjur Indah No. 5, Cianjur", nuptk: "-", tglSuratTugas: "10/01/2018", alasan: "Resign", tglKeluar: "15/05/2024" },
  { id: 16, induk: "Ya", nama: "Rizky Fauzi", avatar: "/images/user/user-16.jpg", jk: "L", lengkapData: 100, tempatLahir: "Sukabumi", tanggalLahir: "15/05/1993", ibuKandung: "Siti", statusKepegawaian: "PPPK", jenisGTK: "Staf Perpus", jabatanGTK: "Staf", alamat: "Jl. Sukabumi No. 9, Sukabumi", nuptk: "8888999900001111", tglSuratTugas: "01/03/2022", alasan: "Selesai Masa Tugas", tglKeluar: "30/06/2024" },
  { id: 17, induk: "Tidak", nama: "Sinta Maharani", avatar: "/images/user/user-17.jpg", jk: "P", lengkapData: 55, tempatLahir: "Cimahi", tanggalLahir: "10/10/1981", ibuKandung: "Aminah", statusKepegawaian: "PNS", jenisGTK: "Guru Mapel", jabatanGTK: "Guru Muda", alamat: "Jl. Cimahi No. 7, Cimahi", nuptk: "9999000011112222", tglSuratTugas: "01/01/2006", alasan: "Pensiun", tglKeluar: "01/01/2024" },
  { id: 18, induk: "Tidak", nama: "Siska Amelia, S.E.", avatar: "/images/user/user-18.jpg", jk: "P", lengkapData: 100, tempatLahir: "Bandung", tanggalLahir: "10/08/1992", ibuKandung: "Enah", statusKepegawaian: "Honorer", jenisGTK: "Staf Keuangan", jabatanGTK: "Bendahara", alamat: "Jl. Kopo No. 11, Bandung", nuptk: "-", tglSuratTugas: "01/07/2015", alasan: "Resign", tglKeluar: "20/03/2024" },
  { id: 19, induk: "Ya", nama: "Taufik Hidayat", avatar: "/images/user/user-19.jpg", jk: "L", lengkapData: 100, tempatLahir: "Bandung", tanggalLahir: "18/02/1985", ibuKandung: "Rohayah", statusKepegawaian: "Honorer", jenisGTK: "Laboran", jabatanGTK: "Laboran", alamat: "Jl. Bojong No. 2, Bandung", nuptk: "-", tglSuratTugas: "01/01/2012", alasan: "Resign", tglKeluar: "15/04/2024" },
  { id: 20, induk: "Ya", nama: "Ujang Komarudin", avatar: "/images/user/user-20.jpg", jk: "L", lengkapData: 95, tempatLahir: "Bandung", tanggalLahir: "20/06/1985", ibuKandung: "Rohayah", statusKepegawaian: "Honorer", jenisGTK: "Staf Administrasi", jabatanGTK: "Staf", alamat: "Jl. Bandung Baru No. 22, Bandung", nuptk: "-", tglSuratTugas: "01/07/2010", alasan: "Selesai Kontrak", tglKeluar: "30/06/2024" },
];

interface NonAktifTableProps {
  onSelectionChange: (selectedIds: number[]) => void;
  searchTerm: string;
  completenessFilter: string;
  itemsPerPage: number;
}

export default function NonAktifTable({ onSelectionChange, searchTerm, completenessFilter, itemsPerPage }: NonAktifTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const filteredData = nonAktifData.filter(item => {
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
        <Table className="min-w-[1900px]">
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
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Alasan</TableCell>
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
                  <TableCell className="px-5 py-4 text-start">
                    <Badge size="sm" color="error">
                      {item.alasan}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tglKeluar}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={16} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
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
