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
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Avatar from "../ui/avatar/Avatar";

interface Rombel {
  id: number;
  type: "reguler" | "praktik" | "ekskul" | "pilihan";
  nama: string;
  tingkat: string;
  waliKelas: string;
  kurikulum: string;
  ruangan: string;
  jumlahPD: number;
  movingKelas: string;
  kebutuhanKhusus: "Ya" | "Tidak";
  lengkapData: number;
}

const rombelData: Rombel[] = [
  // REGULER (20 Records)
  { id: 1, type: "reguler", nama: "X RPL 1", tingkat: "10", waliKelas: "H. Ahmad Subardjo, M.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Komp 1", jumlahPD: 36, movingKelas: "Tidak", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 2, type: "reguler", nama: "X RPL 2", tingkat: "10", waliKelas: "Siti Aminah, S.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Komp 2", jumlahPD: 34, movingKelas: "Tidak", kebutuhanKhusus: "Ya", lengkapData: 85 },
  { id: 3, type: "reguler", nama: "X TKJ 1", tingkat: "10", waliKelas: "Abdul Gani, S.Ag.", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Cisco 1", jumlahPD: 32, movingKelas: "Tidak", kebutuhanKhusus: "Tidak", lengkapData: 90 },
  { id: 4, type: "reguler", nama: "X TKJ 2", tingkat: "10", waliKelas: "Rina Widia, S.Si.", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Cisco 2", jumlahPD: 30, movingKelas: "Tidak", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 5, type: "reguler", nama: "X AK 1", tingkat: "10", waliKelas: "Meli Rosdiana, S.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "R. Teori 1", jumlahPD: 35, movingKelas: "Tidak", kebutuhanKhusus: "Tidak", lengkapData: 70 },
  { id: 6, type: "reguler", nama: "XI RPL 1", tingkat: "11", waliKelas: "Bambang Herlambang, S.T.", kurikulum: "K-13", ruangan: "Lab Komp 3", jumlahPD: 32, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 45 },
  { id: 7, type: "reguler", nama: "XI RPL 2", tingkat: "11", waliKelas: "Toto Raharjo, S.Or.", kurikulum: "K-13", ruangan: "Lab Komp 4", jumlahPD: 33, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 8, type: "reguler", nama: "XI TKJ 1", tingkat: "11", waliKelas: "Yuni Kartika, S.Pd.", kurikulum: "K-13", ruangan: "Lab Jaringan", jumlahPD: 31, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 80 },
  { id: 9, type: "reguler", nama: "XI MM 1", tingkat: "11", waliKelas: "Dadan Ramdan, M.T.", kurikulum: "K-13", ruangan: "Studio TV", jumlahPD: 34, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 95 },
  { id: 10, type: "reguler", nama: "XI AK 1", tingkat: "11", waliKelas: "Endang Suherman", kurikulum: "K-13", ruangan: "R. Peraga", jumlahPD: 36, movingKelas: "Ya", kebutuhanKhusus: "Ya", lengkapData: 100 },
  { id: 11, type: "reguler", nama: "XII RPL 1", tingkat: "12", waliKelas: "Dewi Sartika, S.Pd.", kurikulum: "K-13", ruangan: "Lab RPL Baru", jumlahPD: 35, movingKelas: "Ya", kebutuhanKhusus: "Ya", lengkapData: 100 },
  { id: 12, type: "reguler", nama: "XII RPL 2", tingkat: "12", waliKelas: "Farida Utami, S.Pd.", kurikulum: "K-13", ruangan: "R. Proyek", jumlahPD: 34, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 90 },
  { id: 13, type: "reguler", nama: "XII TKJ 1", tingkat: "12", waliKelas: "Ginanjar Saputra", kurikulum: "K-13", ruangan: "Lab Server", jumlahPD: 32, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 65 },
  { id: 14, type: "reguler", nama: "XII MM 1", tingkat: "12", waliKelas: "Hendra Wijaya, S.Kom.", kurikulum: "K-13", ruangan: "Studio Foto", jumlahPD: 35, movingKelas: "Ya", kebutuhanKhusus: "Ya", lengkapData: 100 },
  { id: 15, type: "reguler", nama: "XII MM 2", tingkat: "12", waliKelas: "Iis Dahlia, S.Pd.", kurikulum: "K-13", ruangan: "Lab Animasi", jumlahPD: 33, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 85 },
  { id: 16, type: "reguler", nama: "XII AK 1", tingkat: "12", waliKelas: "Jaka Tarub, M.Si.", kurikulum: "K-13", ruangan: "Bank Mini", jumlahPD: 36, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 17, type: "reguler", nama: "X MM 1", tingkat: "10", waliKelas: "Kiki Amalia, S.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "R. Multimedia", jumlahPD: 34, movingKelas: "Tidak", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 18, type: "reguler", nama: "XI TKJ 2", tingkat: "11", waliKelas: "Lukman Hakim", kurikulum: "K-13", ruangan: "R. Network", jumlahPD: 30, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 75 },
  { id: 19, type: "reguler", nama: "XII TKJ 2", tingkat: "12", waliKelas: "Mira Setiawati", kurikulum: "K-13", ruangan: "Lab Fiber Optic", jumlahPD: 31, movingKelas: "Ya", kebutuhanKhusus: "Ya", lengkapData: 100 },
  { id: 20, type: "reguler", nama: "X RPL 3", tingkat: "10", waliKelas: "Nadia Utami", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Mobile", jumlahPD: 35, movingKelas: "Tidak", kebutuhanKhusus: "Tidak", lengkapData: 90 },
  
  // PRAKTIK (20 Records)
  { id: 21, type: "praktik", nama: "P RPL 10 A", tingkat: "10", waliKelas: "H. Ahmad Subardjo, M.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Komp 1", jumlahPD: 18, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 22, type: "praktik", nama: "P RPL 10 B", tingkat: "10", waliKelas: "Siti Aminah, S.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Komp 2", jumlahPD: 18, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 23, type: "praktik", nama: "P TKJ 10 A", tingkat: "10", waliKelas: "Abdul Gani, S.Ag.", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Cisco 1", jumlahPD: 16, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 24, type: "praktik", nama: "P TKJ 10 B", tingkat: "10", waliKelas: "Rina Widia, S.Si.", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Cisco 2", jumlahPD: 16, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 25, type: "praktik", nama: "P AK 10 A", tingkat: "10", waliKelas: "Meli Rosdiana, S.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "Bank Mini", jumlahPD: 17, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 26, type: "praktik", nama: "P RPL 11 A", tingkat: "11", waliKelas: "Bambang Herlambang, S.T.", kurikulum: "K-13", ruangan: "Lab Komp 3", jumlahPD: 16, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 27, type: "praktik", nama: "P RPL 11 B", tingkat: "11", waliKelas: "Toto Raharjo, S.Or.", kurikulum: "K-13", ruangan: "Lab Komp 4", jumlahPD: 16, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 28, type: "praktik", nama: "P TKJ 11 A", tingkat: "11", waliKelas: "Yuni Kartika, S.Pd.", kurikulum: "K-13", ruangan: "Lab Jaringan", jumlahPD: 15, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 29, type: "praktik", nama: "P MM 11 A", tingkat: "11", waliKelas: "Dadan Ramdan, M.T.", kurikulum: "K-13", ruangan: "Studio TV", jumlahPD: 17, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 30, type: "praktik", nama: "P AK 11 A", tingkat: "11", waliKelas: "Endang Suherman", kurikulum: "K-13", ruangan: "R. Peraga", jumlahPD: 18, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 31, type: "praktik", nama: "P RPL 12 A", tingkat: "12", waliKelas: "Dewi Sartika, S.Pd.", kurikulum: "K-13", ruangan: "Lab RPL Baru", jumlahPD: 17, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 32, type: "praktik", nama: "P RPL 12 B", tingkat: "12", waliKelas: "Farida Utami, S.Pd.", kurikulum: "K-13", ruangan: "R. Proyek", jumlahPD: 17, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 33, type: "praktik", nama: "P TKJ 12 A", tingkat: "12", waliKelas: "Ginanjar Saputra", kurikulum: "K-13", ruangan: "Lab Server", jumlahPD: 16, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 34, type: "praktik", nama: "P MM 12 A", tingkat: "12", waliKelas: "Hendra Wijaya, S.Kom.", kurikulum: "K-13", ruangan: "Studio Foto", jumlahPD: 17, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 35, type: "praktik", nama: "P MM 12 B", tingkat: "12", waliKelas: "Iis Dahlia, S.Pd.", kurikulum: "K-13", ruangan: "Lab Animasi", jumlahPD: 16, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 36, type: "praktik", nama: "P AK 12 A", tingkat: "12", waliKelas: "Jaka Tarub, M.Si.", kurikulum: "K-13", ruangan: "Bank Mini", jumlahPD: 18, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 37, type: "praktik", nama: "P MM 10 A", tingkat: "10", waliKelas: "Kiki Amalia, S.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "R. Multimedia", jumlahPD: 17, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 38, type: "praktik", nama: "P TKJ 11 B", tingkat: "11", waliKelas: "Lukman Hakim", kurikulum: "K-13", ruangan: "R. Network", jumlahPD: 15, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 39, type: "praktik", nama: "P TKJ 12 B", tingkat: "12", waliKelas: "Mira Setiawati", kurikulum: "K-13", ruangan: "Lab Fiber Optic", jumlahPD: 15, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 40, type: "praktik", nama: "P RPL 10 C", tingkat: "10", waliKelas: "Nadia Utami", kurikulum: "Kurikulum Merdeka", ruangan: "Lab Mobile", jumlahPD: 18, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },

  // MATPEL PILIHAN (20 Records)
  { id: 41, type: "pilihan", nama: "Pilihan Bahasa Jepang 1", tingkat: "11", waliKelas: "Yuni Kartika, S.Pd.", kurikulum: "K-13", ruangan: "R. Bahasa", jumlahPD: 25, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 42, type: "pilihan", nama: "Pilihan Bahasa Jepang 2", tingkat: "11", waliKelas: "Yuni Kartika, S.Pd.", kurikulum: "K-13", ruangan: "R. Bahasa", jumlahPD: 25, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 43, type: "pilihan", nama: "Pilihan Pemrograman Web 1", tingkat: "11", waliKelas: "Hendra Wijaya, S.Kom.", kurikulum: "K-13", ruangan: "Lab Komp 4", jumlahPD: 30, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 44, type: "pilihan", nama: "Pilihan Pemrograman Web 2", tingkat: "11", waliKelas: "Hendra Wijaya, S.Kom.", kurikulum: "K-13", ruangan: "Lab Komp 4", jumlahPD: 30, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 45, type: "pilihan", nama: "Pilihan Animasi 3D", tingkat: "11", waliKelas: "Iis Dahlia, S.Pd.", kurikulum: "K-13", ruangan: "Lab Animasi", jumlahPD: 20, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 46, type: "pilihan", nama: "Pilihan Digital Marketing 1", tingkat: "12", waliKelas: "Meli Rosdiana, S.Pd.", kurikulum: "K-13", ruangan: "Lab Bisnis", jumlahPD: 35, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 47, type: "pilihan", nama: "Pilihan Digital Marketing 2", tingkat: "12", waliKelas: "Meli Rosdiana, S.Pd.", kurikulum: "K-13", ruangan: "Lab Bisnis", jumlahPD: 35, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 48, type: "pilihan", nama: "Pilihan Jaringan Fiber", tingkat: "12", waliKelas: "Lukman Hakim", kurikulum: "K-13", ruangan: "Lab Fiber", jumlahPD: 20, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 49, type: "pilihan", nama: "Pilihan Robotik Lanjut", tingkat: "12", waliKelas: "Dadan Ramdan, M.T.", kurikulum: "K-13", ruangan: "Lab Robotik", jumlahPD: 15, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 50, type: "pilihan", nama: "Pilihan Tata Kelola Perkantoran", tingkat: "12", waliKelas: "Endang Suherman", kurikulum: "K-13", ruangan: "R. Simulasi", jumlahPD: 30, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 51, type: "pilihan", nama: "Pilihan Desain UI UX", tingkat: "11", waliKelas: "Hendra Wijaya, S.Kom.", kurikulum: "K-13", ruangan: "Lab Desain", jumlahPD: 25, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 52, type: "pilihan", nama: "Pilihan Cloud Computing", tingkat: "12", waliKelas: "Ginanjar Saputra", kurikulum: "K-13", ruangan: "Lab Server", jumlahPD: 22, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 53, type: "pilihan", nama: "Pilihan Kewirausahaan Kreatif", tingkat: "11", waliKelas: "Siska Amelia, S.E.", kurikulum: "K-13", ruangan: "Kantin Digital", jumlahPD: 40, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 54, type: "pilihan", nama: "Pilihan Public Speaking", tingkat: "10", waliKelas: "Kiki Amalia, S.Pd.", kurikulum: "Kurikulum Merdeka", ruangan: "Aula Kecil", jumlahPD: 30, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 55, type: "pilihan", nama: "Pilihan Literasi Digital", tingkat: "10", waliKelas: "Nadia Utami", kurikulum: "Kurikulum Merdeka", ruangan: "Perpustakaan", jumlahPD: 35, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 56, type: "pilihan", nama: "Pilihan Fotografi Dasar", tingkat: "10", waliKelas: "Toto Raharjo, S.Or.", kurikulum: "Kurikulum Merdeka", ruangan: "Studio Foto", jumlahPD: 20, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 57, type: "pilihan", nama: "Pilihan Videografi Dasar", tingkat: "10", waliKelas: "Toto Raharjo, S.Or.", kurikulum: "Kurikulum Merdeka", ruangan: "Studio Foto", jumlahPD: 20, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 58, type: "pilihan", nama: "Pilihan Keamanan Jaringan", tingkat: "12", waliKelas: "Lukman Hakim", kurikulum: "K-13", ruangan: "Lab Cisco", jumlahPD: 18, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 59, type: "pilihan", nama: "Pilihan Statistik Bisnis", tingkat: "12", waliKelas: "Jaka Tarub, M.Si.", kurikulum: "K-13", ruangan: "Lab Akuntansi", jumlahPD: 28, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
  { id: 60, type: "pilihan", nama: "Pilihan Kecerdasan Buatan", tingkat: "12", waliKelas: "Dadan Ramdan, M.T.", kurikulum: "K-13", ruangan: "Lab AI", jumlahPD: 12, movingKelas: "Ya", kebutuhanKhusus: "Tidak", lengkapData: 100 },
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

interface RombelTableProps {
  type: "reguler" | "praktik" | "ekskul" | "pilihan";
  onSelectionChange: (selectedIds: number[]) => void;
  searchTerm: string;
  gradeFilter: string;
  itemsPerPage: number;
}

export default function RombelTable({ type, onSelectionChange, searchTerm, gradeFilter, itemsPerPage }: RombelTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedRombelName, setSelectedRombelName] = useState("");
  
  // Modal Pagination State
  const [modalPage, setModalPage] = useState(1);
  const modalItemsPerPage = 10;
  
  const filteredData = rombelData.filter(item => {
    const matchesType = item.type === type;
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.waliKelas.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = gradeFilter === "all" || item.tingkat === gradeFilter;
    
    return matchesType && matchesSearch && matchesGrade;
  });
  
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

  const handleRombelClick = (name: string) => {
    setSelectedRombelName(name);
    setModalPage(1);
    openModal();
  };

  const isAllSelected = currentData.length > 0 && currentData.every((item) => selectedRows.includes(item.id));

  // Check if checkboxes should be hidden for this type
  const hideCheckbox = type === "reguler" || type === "praktik" || type === "pilihan";

  const totalModalPages = Math.ceil(dummyStudents.length / modalItemsPerPage);
  const currentModalData = dummyStudents.slice(
    (modalPage - 1) * modalItemsPerPage,
    modalPage * modalItemsPerPage
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1300px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {!hideCheckbox && (
                <TableCell isHeader className="px-5 py-3 text-start">
                    <Checkbox
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    />
                </TableCell>
              )}
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama Rombel</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Wali Kelas</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tingkat</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kurikulum</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ruang</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jumlah PD</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Moving Kelas</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Kebutuhan Khusus</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? currentData.map((item) => (
              <TableRow key={item.id} className={`${selectedRows.includes(item.id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                {!hideCheckbox && (
                    <TableCell className="px-5 py-4 text-start">
                        <Checkbox
                            checked={selectedRows.includes(item.id)}
                            onChange={(checked) => handleSelectRow(item.id, checked)}
                        />
                    </TableCell>
                )}
                <TableCell className="px-5 py-4 text-start">
                    <button 
                        onClick={() => handleRombelClick(item.nama)}
                        className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 whitespace-nowrap"
                    >
                        {item.nama}
                    </button>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.waliKelas}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tingkat}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.kurikulum}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.ruangan}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 text-center font-medium">{item.jumlahPD}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.movingKelas}</TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <Badge size="sm" color={item.kebutuhanKhusus === "Ya" ? "warning" : "light"}>
                    {item.kebutuhanKhusus}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={hideCheckbox ? 8 : 9} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
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

      {/* Modal Anggota Rombel */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] p-8">
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Daftar Siswa - {selectedRombelName}
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
