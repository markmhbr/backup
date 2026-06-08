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

interface Ekskul {
  id: number;
  nama: string;
  pembina: string;
  prasarana: string;
  anggotaRombel: number;
}

const ekskulData: Ekskul[] = [
  { id: 1, nama: "Pramuka", pembina: "Endang Suherman", prasarana: "Lapangan Utama", anggotaRombel: 150 },
  { id: 2, nama: "Paskibra", pembina: "Toto Raharjo, S.Or.", prasarana: "Lapangan Utama", anggotaRombel: 45 },
  { id: 3, nama: "PMR", pembina: "Siti Aminah, S.Pd.", prasarana: "Ruang UKS", anggotaRombel: 60 },
  { id: 4, nama: "Rohis", pembina: "Abdul Gani, S.Ag.", prasarana: "Masjid Sekolah", anggotaRombel: 120 },
  { id: 5, nama: "English Club", pembina: "Farida Utami, S.Pd.", prasarana: "Lab Bahasa", anggotaRombel: 30 },
  { id: 6, nama: "Seni Tari", pembina: "Ani Maryani, S.Pd.", prasarana: "Aula Seni", anggotaRombel: 25 },
  { id: 7, nama: "Paduan Suara", pembina: "Putri Ayu", prasarana: "Aula Seni", anggotaRombel: 40 },
  { id: 8, nama: "Basket", pembina: "Lukman Hakim", prasarana: "Lapangan Basket", anggotaRombel: 50 },
  { id: 9, nama: "Futsal", pembina: "Rizky Fauzi", prasarana: "Lapangan Futsal", anggotaRombel: 80 },
  { id: 10, nama: "Voli", pembina: "Endang Suherman", prasarana: "Lapangan Voli", anggotaRombel: 40 },
  { id: 11, nama: "KIR (Karya Ilmiah Remaja)", pembina: "Rina Widia, S.Si.", prasarana: "Lab Biologi", anggotaRombel: 20 },
  { id: 12, nama: "IT Club", pembina: "Hendra Wijaya, S.Kom.", prasarana: "Lab Komputer 4", anggotaRombel: 35 },
  { id: 13, nama: "Jurnalistik", pembina: "Yuni Kartika, S.Pd.", prasarana: "R. OSIS", anggotaRombel: 25 },
  { id: 14, nama: "Pecinta Alam", pembina: "Ginanjar Saputra", prasarana: "Gudang Alat", anggotaRombel: 30 },
  { id: 15, nama: "Bulu Tangkis", pembina: "Kevin Sanjaya", prasarana: "GOR Sekolah", anggotaRombel: 45 },
  { id: 16, nama: "Karate", pembina: "Taufik Hidayat", prasarana: "Aula Utama", anggotaRombel: 30 },
  { id: 17, nama: "Teater", pembina: "Dewi Persik", prasarana: "Aula Seni", anggotaRombel: 20 },
  { id: 18, nama: "Catur", pembina: "Abdul Gani, S.Ag.", prasarana: "Perpustakaan", anggotaRombel: 15 },
  { id: 19, nama: "Robotik", pembina: "Dadan Ramdan, M.T.", prasarana: "Lab Elektronika", anggotaRombel: 18 },
  { id: 20, nama: "Fotografi", pembina: "Hendra Wijaya, S.Kom.", prasarana: "Studio Foto", anggotaRombel: 22 },
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

interface EkskulTableProps {
  onSelectionChange?: (selectedIds: number[]) => void;
  searchTerm: string;
  itemsPerPage: number;
}

export default function EkskulTable({ searchTerm, itemsPerPage }: EkskulTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedEkskul, setSelectedEkskul] = useState("");
  
  // Modal Pagination State
  const [modalPage, setModalPage] = useState(1);
  const modalItemsPerPage = 10;
  
  const filteredData = ekskulData.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.pembina.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.nama.localeCompare(b.nama));
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEkskulClick = (nama: string) => {
    setSelectedEkskul(nama);
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
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Ekskul</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Pembina</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Prasarana</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Anggota Rombel</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? currentData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-4 text-start">
                  <button 
                    onClick={() => handleEkskulClick(item.nama)}
                    className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 whitespace-nowrap"
                  >
                    {item.nama}
                  </button>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.pembina}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.prasarana}</TableCell>
                <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-medium">{item.anggotaRombel}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data ekskul ditemukan untuk "{searchTerm}"
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

      {/* Modal Anggota Ekskul */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] p-8">
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Daftar Anggota - {selectedEkskul}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Berikut adalah daftar siswa yang mengikuti kegiatan ekskul ini.
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
