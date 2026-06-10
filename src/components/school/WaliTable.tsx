import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Avatar from "../ui/avatar/Avatar";

interface Wali {
  id: number;
  namaRombel: string;
  namaWali: string;
  ruang: string;
  anggotaRombel: number;
}

const waliData: Wali[] = [
  { id: 1, namaRombel: "X RPL 1", namaWali: "H. Ahmad Subardjo, M.Pd.", ruang: "Lab Komp 1", anggotaRombel: 36 },
  { id: 2, namaRombel: "X RPL 2", namaWali: "Siti Aminah, S.Pd.", ruang: "Lab Komp 2", anggotaRombel: 34 },
  { id: 3, namaRombel: "X TKJ 1", namaWali: "Abdul Gani, S.Ag.", ruang: "Lab Cisco 1", anggotaRombel: 32 },
  { id: 4, namaRombel: "X TKJ 2", namaWali: "Rina Widia, S.Si.", ruang: "Lab Cisco 2", anggotaRombel: 30 },
  { id: 5, namaRombel: "X AK 1", namaWali: "Meli Rosdiana, S.Pd.", ruang: "R. Teori 1", anggotaRombel: 35 },
  { id: 6, namaRombel: "XI RPL 1", namaWali: "Bambang Herlambang, S.T.", ruang: "Lab Komp 3", anggotaRombel: 32 },
  { id: 7, namaRombel: "XI RPL 2", namaWali: "Toto Raharjo, S.Or.", ruang: "Lab Komp 4", anggotaRombel: 33 },
  { id: 8, namaRombel: "XI TKJ 1", namaWali: "Yuni Kartika, S.Pd.", ruang: "Lab Jaringan", anggotaRombel: 31 },
  { id: 9, namaRombel: "XI MM 1", namaWali: "Dadan Ramdan, M.T.", ruang: "Studio TV", anggotaRombel: 34 },
  { id: 10, namaRombel: "XI AK 1", namaWali: "Endang Suherman", ruang: "R. Peraga", anggotaRombel: 36 },
  { id: 11, namaRombel: "XII RPL 1", namaWali: "Dewi Sartika, S.Pd.", ruang: "Lab RPL Baru", anggotaRombel: 35 },
  { id: 12, namaRombel: "XII RPL 2", namaWali: "Farida Utami, S.Pd.", ruang: "R. Proyek", anggotaRombel: 34 },
  { id: 13, namaRombel: "XII TKJ 1", namaWali: "Ginanjar Saputra", ruang: "Lab Server", anggotaRombel: 32 },
  { id: 14, namaRombel: "XII MM 1", namaWali: "Hendra Wijaya, S.Kom.", ruang: "Studio Foto", anggotaRombel: 35 },
  { id: 15, namaRombel: "XII MM 2", namaWali: "Iis Dahlia, S.Pd.", ruang: "Lab Animasi", anggotaRombel: 33 },
  { id: 16, namaRombel: "XII AK 1", namaWali: "Jaka Tarub, M.Si.", ruang: "Bank Mini", anggotaRombel: 36 },
  { id: 17, namaRombel: "X MM 1", namaWali: "Kiki Amalia, S.Pd.", ruang: "R. Multimedia", anggotaRombel: 34 },
  { id: 18, namaRombel: "XI TKJ 2", namaWali: "Lukman Hakim", ruang: "R. Network", anggotaRombel: 30 },
  { id: 19, namaRombel: "XII TKJ 2", namaWali: "Mira Setiawati", ruang: "Lab Fiber Optic", anggotaRombel: 31 },
  { id: 20, namaRombel: "X RPL 3", namaWali: "Nadia Utami", ruang: "Lab Mobile", anggotaRombel: 35 },
];

interface Student {
  id: number;
  nama: string;
  avatar: string;
  nisn: string;
  nis: string;
  jk: "L" | "P";
}

const dummyStudents: Student[] = [
  { id: 1, nama: "Aditya Pratama", avatar: "/images/user/user-01.jpg", nisn: "0012345678", nis: "1001", jk: "L" },
  { id: 2, nama: "Bella Safira", avatar: "/images/user/user-02.jpg", nisn: "0012345679", nis: "1002", jk: "P" },
  { id: 3, nama: "Candra Wijaya", avatar: "/images/user/user-03.jpg", nisn: "0012345680", nis: "1003", jk: "L" },
  { id: 4, nama: "Dian Pelangi", avatar: "/images/user/user-04.jpg", nisn: "0012345681", nis: "1004", jk: "P" },
  { id: 5, nama: "Erlangga Putra", avatar: "/images/user/user-05.jpg", nisn: "0012345682", nis: "1005", jk: "L" },
  { id: 6, nama: "Fania Rahma", avatar: "/images/user/user-06.jpg", nisn: "0012345683", nis: "1006", jk: "P" },
  { id: 7, nama: "Gilang Dirga", avatar: "/images/user/user-07.jpg", nisn: "0012345684", nis: "1007", jk: "L" },
  { id: 8, nama: "Hana Hanifah", avatar: "/images/user/user-08.jpg", nisn: "0012345685", nis: "1008", jk: "P" },
  { id: 9, nama: "Indra Wijaya", avatar: "/images/user/user-09.jpg", nisn: "0012345686", nis: "1009", jk: "L" },
  { id: 10, nama: "Jasmine Putri", avatar: "/images/user/user-10.jpg", nisn: "0012345687", nis: "1010", jk: "P" },
  { id: 11, nama: "Kevin Sanjaya", avatar: "/images/user/user-11.jpg", nisn: "0012345688", nis: "1011", jk: "L" },
  { id: 12, nama: "Lestari Dewi", avatar: "/images/user/user-12.jpg", nisn: "0012345689", nis: "1012", jk: "P" },
  { id: 13, nama: "Muhammad Ridwan", avatar: "/images/user/user-13.jpg", nisn: "0012345690", nis: "1013", jk: "L" },
  { id: 14, nama: "Nadia Utami", avatar: "/images/user/user-14.jpg", nisn: "0012345691", nis: "1014", jk: "P" },
  { id: 15, nama: "Oki Setiawan", avatar: "/images/user/user-15.jpg", nisn: "0012345692", nis: "1015", jk: "L" },
  { id: 16, nama: "Putri Ayu", avatar: "/images/user/user-16.jpg", nisn: "0012345693", nis: "1016", jk: "P" },
  { id: 17, nama: "Rizky Fauzi", avatar: "/images/user/user-17.jpg", nisn: "0012345694", nis: "1017", jk: "L" },
  { id: 18, nama: "Sinta Maharani", avatar: "/images/user/user-18.jpg", nisn: "0012345695", nis: "1018", jk: "P" },
  { id: 19, nama: "Taufik Hidayat", avatar: "/images/user/user-19.jpg", nisn: "0012345696", nis: "1019", jk: "L" },
  { id: 20, nama: "Vina Panduwinata", avatar: "/images/user/user-20.jpg", nisn: "0012345697", nis: "1020", jk: "P" },
];

interface WaliTableProps {
  onSelectionChange?: (selectedIds: string[]) => void;
  searchTerm: string;
  itemsPerPage: number;
}

export default function WaliTable({ searchTerm, itemsPerPage }: WaliTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedRombel, setSelectedRombel] = useState("");

  // Modal Pagination State
  const [modalPage, setModalPage] = useState(1);
  const modalItemsPerPage = 10;
  
  const filteredData = waliData.filter(item => 
    item.namaRombel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.namaWali.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.namaRombel.localeCompare(b.namaRombel));
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRombelClick = (rombel: string) => {
    setSelectedRombel(rombel);
    setModalPage(1);
    openModal();
  };

  const totalModalPages = Math.ceil(dummyStudents.length / modalItemsPerPage);
  const currentModalData = dummyStudents.slice(
    (modalPage - 1) * modalItemsPerPage,
    modalPage * modalItemsPerPage
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[800px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Rombel</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Wali</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ruang</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Anggota Rombel</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? currentData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-4 text-start">
                  <button 
                    onClick={() => handleRombelClick(item.namaRombel)}
                    className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {item.namaRombel}
                  </button>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.namaWali}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.ruang}</TableCell>
                <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-medium">{item.anggotaRombel}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data wali kelas ditemukan untuk "{searchTerm}"
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

      {/* Modal Anggota Rombel */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] p-8">
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Daftar Siswa - {selectedRombel}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Berikut adalah daftar siswa yang terdaftar dalam rombel ini.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NISN</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NIPD</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">JK</TableCell>
                </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {currentModalData.map((student) => (
                    <TableRow key={student.id}>
                    <TableCell className="px-5 py-4 text-start whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <Avatar src={student.avatar} size="small" />
                            <span className="font-medium text-gray-800 dark:text-white/90">{student.nama}</span>
                        </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{student.nisn}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{student.nis}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400">{student.jk}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
          <Pagination
            currentPage={modalPage}
            totalPages={totalModalPages}
            onPageChange={(page) => setModalPage(page)}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={closeModal}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  );
}
