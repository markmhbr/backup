import React, { useEffect, useState, useCallback } from "react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import { presensiService } from "../../../services/presensiService";
import { dapodikService } from "../../../services/dapodikService";
import { useSekolah } from "../../../context/SekolahContext";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../components/ui/table";
import Avatar from "../../../components/ui/avatar/Avatar";
import { getFotoUrl } from "../../../utils/image";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import Pagination from "../../../components/common/Pagination";
import Badge from "../../../components/ui/badge/Badge";
import { SearchIcon } from "../../../icons";

interface DailyItem {
  id: string;
  nama: string;
  identitas: string; // NISN or NUPTK
  rombelOrJabatan: string;
  foto: string | null;
  jamMasuk: string | null;
  jamPulang: string | null;
  status: number | null;
}

interface PeriodikItem {
  peserta_didik_id: string;
  nama: string;
  nisn: string | null;
  presensi: Array<{
    tanggal: string;
    status_masuk: number | null;
    jam_masuk: string | null;
    jam_pulang: string | null;
  }>;
  izin: Array<{
    tanggal: string;
    jenis: number;
    keterangan: string;
  }>;
}

const RekapPresensi: React.FC = () => {
  const { sekolah } = useSekolah();
  
  // Tabs: daily-pd, daily-gtk, book-presensi, no-pulang
  const [activeTab, setActiveTab] = useState<"daily-pd" | "daily-gtk" | "book-presensi" | "no-pulang">("daily-pd");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [dailyData, setDailyData] = useState<DailyItem[]>([]);
  const [periodikData, setPeriodikData] = useState<PeriodikItem[]>([]);
  const [noPulangData, setNoPulangData] = useState<DailyItem[]>([]);
  const [dbHolidays, setDbHolidays] = useState<Array<{ nama: string, tanggal_mulai: string, tanggal_selesai: string }>>([]);
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  
  // Filters & Dropdowns
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedSemester, setSelectedSemester] = useState("1"); // 1: Ganjil (Jul-Des), 2: Genap (Jan-Jun)
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  
  const [rekapMode, setRekapMode] = useState<"bulanan" | "semesteran">("bulanan");
  const [rekapTarget, setRekapTarget] = useState<"pd" | "gtk">("pd");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch unique classes for dropdown
  const fetchClassesOnly = useCallback(async () => {
    if (!sekolah?.sekolah_id) return;
    try {
      const response = await presensiService.getRekapPesertaDidik(sekolah.sekolah_id, selectedDate);
      const uniqueClasses: string[] = Array.from(
        new Set(
          response
            .map((item: any) => item.nama_rombel)
            .filter((c: any): c is string => !!c)
        )
      );
      setClasses(uniqueClasses.sort());
    } catch (e) {
      console.error(e);
    }
  }, [sekolah?.sekolah_id, selectedDate]);

  useEffect(() => {
    fetchClassesOnly();
  }, [fetchClassesOnly]);

  // Main Fetch logic
  const fetchData = useCallback(async () => {
    if (!sekolah?.sekolah_id) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "daily-pd") {
        const response = await presensiService.getRekapPesertaDidik(sekolah.sekolah_id, selectedDate);
        const mapped: DailyItem[] = response.map((item: any) => ({
          id: item.peserta_didik_id,
          nama: item.nama,
          identitas: item.nisn || "-",
          rombelOrJabatan: item.nama_rombel || "-",
          foto: item.foto,
          jamMasuk: item.presensi?.jam_masuk || null,
          jamPulang: item.presensi?.jam_pulang || null,
          status: item.presensi?.status_masuk || null,
        }));
        setDailyData(mapped);
      } else if (activeTab === "daily-gtk") {
        const response = await presensiService.getRekapGtk(sekolah.sekolah_id, selectedDate);
        const mapped: DailyItem[] = response.map((item: any) => ({
          id: item.ptk_id,
          nama: item.nama,
          identitas: item.nuptk || "-",
          rombelOrJabatan: item.jenis_ptk_id_str || item.jabatan || "Guru/Staf",
          foto: item.foto,
          jamMasuk: item.presensi?.jam_masuk || null,
          jamPulang: item.presensi?.jam_pulang || null,
          status: item.presensi?.status_masuk || null,
        }));
        setDailyData(mapped);
      } else if (activeTab === "book-presensi") {
        if (rekapTarget === "pd" && !selectedClass) {
          setPeriodikData([]);
          setLoading(false);
          return;
        }

        let start = "";
        let end = "";

        if (rekapMode === "bulanan") {
          const [year, month] = selectedMonth.split("-");
          const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
          start = `${year}-${month}-01`;
          end = `${year}-${month}-${String(daysInMonth).padStart(2, "0")}`;
        } else {
          // Semesteran
          const yr = parseInt(selectedYear);
          if (selectedSemester === "1") {
            // Ganjil: Jul - Des
            start = `${yr}-07-01`;
            end = `${yr}-12-31`;
          } else {
            // Genap: Jan - Jun
            start = `${yr}-01-01`;
            end = `${yr}-06-30`;
          }
        }

        const response = await presensiService.getRekapPeriodik(sekolah.sekolah_id, selectedClass, start, end, rekapTarget);
        setPeriodikData(response.data || []);
        setDbHolidays(response.holidays || []);
        setActiveDays(response.activeDays || [1, 2, 3, 4, 5, 6]);
      } else if (activeTab === "no-pulang") {
        const response = await presensiService.getRekapPesertaDidik(sekolah.sekolah_id, selectedDate);
        const filtered = response
          .filter((item: any) => {
            const hasMasuk = !!item.presensi?.jam_masuk;
            const noPulang = !item.presensi?.jam_pulang;
            return hasMasuk && noPulang;
          })
          .map((item: any) => ({
            id: item.peserta_didik_id,
            nama: item.nama,
            identitas: item.nisn || "-",
            rombelOrJabatan: item.nama_rombel || "-",
            foto: item.foto,
            jamMasuk: item.presensi?.jam_masuk || null,
            jamPulang: null,
            status: item.presensi?.status_masuk || null,
          }));
        setNoPulangData(filtered);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengambil data presensi.");
    } finally {
      setLoading(false);
    }
  }, [sekolah?.sekolah_id, activeTab, selectedDate, selectedClass, rekapMode, rekapTarget, selectedMonth, selectedSemester, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeTab, selectedClass, rekapMode, rekapTarget, selectedMonth, selectedSemester, selectedYear]);

  // Generate dynamic date list for Book Presensi Grid
  const getDatesInRange = () => {
    if (rekapMode === "bulanan") {
      const [year, month] = selectedMonth.split("-");
      const days = new Date(parseInt(year), parseInt(month), 0).getDate();
      return Array.from({ length: days }, (_, i) => {
        const dayStr = String(i + 1).padStart(2, "0");
        return {
          label: String(i + 1),
          dateStr: `${year}-${month}-${dayStr}`,
        };
      });
    } else {
      // Semesteran: Tampilkan nama-nama bulan saja
      const yr = parseInt(selectedYear);
      const months = selectedSemester === "1" ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];
      return months.map((m) => {
        const d = new Date(yr, m - 1, 1);
        return {
          label: d.toLocaleDateString("id-ID", { month: "long" }),
          monthNum: m,
          yearNum: yr,
        };
      });
    }
  };

  const datesInRange = getDatesInRange();

  // Filter lists based on SearchTerm
  const getFilteredDaily = () => {
    return dailyData.filter((item) => {
      const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.identitas.includes(searchTerm);
      const matchClass = (activeTab === "daily-pd" && selectedClass) ? item.rombelOrJabatan === selectedClass : true;
      return matchSearch && matchClass;
    });
  };

  const getFilteredPeriodik = () => {
    return periodikData.filter((item) => {
      return item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || (item.nisn && item.nisn.includes(searchTerm));
    });
  };

  const getFilteredNoPulang = () => {
    return noPulangData.filter((item) => {
      const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.identitas.includes(searchTerm);
      const matchClass = selectedClass ? item.rombelOrJabatan === selectedClass : true;
      return matchSearch && matchClass;
    });
  };

  const activeFilteredList = activeTab === "daily-pd" || activeTab === "daily-gtk" ? getFilteredDaily()
                           : activeTab === "book-presensi" ? getFilteredPeriodik()
                           : getFilteredNoPulang();

  const totalPages = Math.ceil(activeFilteredList.length / itemsPerPage) || 1;
  const paginatedList = activeFilteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB";
  };

  const getStatusSymbol = (student: PeriodikItem, dateStr: string) => {
    // 1. Check Izin / Sakit
    const izin = student.izin.find((i) => {
      if (!i.tanggal) return false;
      const formattedTanggal = new Date(i.tanggal).toISOString().split('T')[0];
      return formattedTanggal === dateStr;
    });

    if (izin) {
      if (izin.jenis === 5) {
        return { char: "S", style: "text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 rounded px-1.5" }; // Sakit
      }
      if (izin.jenis === 4) {
        return { char: "I", style: "text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/30 rounded px-1.5" }; // Izin
      }
      if (izin.jenis === 6) {
        return { char: "A", style: "text-red-500 font-bold bg-red-50 dark:bg-red-900/30 rounded px-1.5" }; // Alpha
      }
      // Jika jenis izin adalah 1 (Terlambat) atau 3 (Pulang Awal), mereka tetap hadir masuk kelas.
      // Maka kita abaikan di pengecekan Izin tidak masuk, agar lanjut ke status presensi di bawah.
      if (izin.jenis !== 1 && izin.jenis !== 3) {
        return { char: "I", style: "text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/30 rounded px-1.5" }; // Fallback Izin Tidak Masuk
      }
    }

    // 2. Check Presensi
    const pres = student.presensi.find((p) => {
      if (!p.tanggal) return false;
      const formattedTanggal = new Date(p.tanggal).toISOString().split('T')[0];
      return formattedTanggal === dateStr;
    });

    if (pres) {
      if (pres.status_masuk === 5) return { char: "A", style: "text-red-500 font-bold bg-red-50 dark:bg-red-900/30 rounded px-1.5" }; // Alpha
      if (pres.status_masuk === 1 || pres.status_masuk === 2) {
        return { char: "•", style: "text-green-500 text-lg font-black" }; // Hadir/Terlambat
      }
    }

    return { char: "-", style: "text-gray-300 dark:text-gray-700" };
  };

  const checkIsHoliday = (dateStr: string) => {
    // 1. Cek database holidays (dbHolidays) - Prioritas Utama
    const holidayFound = dbHolidays.find((h) => {
      const start = new Date(h.tanggal_mulai.split('T')[0]);
      const end = new Date(h.tanggal_selesai.split('T')[0]);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });

    if (holidayFound) {
      return { isHoliday: true, nama: holidayFound.nama };
    }

    const dObj = new Date(dateStr);
    const dayOfWeek = dObj.getDay() === 0 ? 7 : dObj.getDay(); // 1 = Monday, ..., 7 = Sunday
    
    // 2. Cek Libur Mingguan berdasarkan activeDays sekolah
    if (!activeDays.includes(dayOfWeek)) {
      return { isHoliday: true, nama: "Libur Mingguan" };
    }

    return { isHoliday: false, nama: "" };
  };

  // Hitung total H, S, I, A per-bulan dalam mode semesteran
  const calculateMonthlyTotals = (student: PeriodikItem, month: number, year: number) => {
    let H = 0, S = 0, I = 0, A = 0;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const symbolInfo = getStatusSymbol(student, dateStr);
      if (symbolInfo.char === "•") H++;
      else if (symbolInfo.char === "S") S++;
      else if (symbolInfo.char === "I") I++;
      else if (symbolInfo.char === "A") A++;
    }

    return { H, S, I, A };
  };

  // Hitung total H, S, I, A untuk Rekap Periodik
  const calculateTotals = (student: PeriodikItem) => {
    let H = 0, S = 0, I = 0, A = 0;
    
    if (rekapMode === "bulanan") {
      datesInRange.forEach((d: any) => {
        const symbolInfo = getStatusSymbol(student, d.dateStr);
        if (symbolInfo.char === "•") H++;
        else if (symbolInfo.char === "S") S++;
        else if (symbolInfo.char === "I") I++;
        else if (symbolInfo.char === "A") A++;
      });
    } else {
      datesInRange.forEach((d: any) => {
        const monthly = calculateMonthlyTotals(student, d.monthNum, d.yearNum);
        H += monthly.H;
        S += monthly.S;
        I += monthly.I;
        A += monthly.A;
      });
    }

    return { H, S, I, A };
  };

  const handlePrintPdf = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker aktif. Mohon izinkan popup untuk mencetak.");
      return;
    }

    const titleText = activeTab === "book-presensi" 
      ? `Rekap Presensi - ${rekapTarget === "pd" ? "Siswa" : "GTK"} - ${rekapMode === "bulanan" ? "Bulanan" : "Semesteran"}`
      : `Rekap Presensi Harian - ${activeTab === "daily-pd" ? "Siswa" : "GTK"}`;

    const isPeriodik = activeTab === "book-presensi";
    const dataList = isPeriodik 
      ? getFilteredPeriodik() 
      : (activeTab === "no-pulang" ? getFilteredDaily().filter(i => !!i.jamMasuk && !i.jamPulang) : getFilteredDaily());
      
    // Ambil data Wali Kelas secara dinamis dari rombel (dengan query search agar tidak terpotong pagination limit)
    let waliKelasMap: Record<string, string> = {};
    let waliKelasName = "-";
    try {
      const rombelRes = await dapodikService.getRombonganBelajar("reguler", 250);
      if (rombelRes.data) {
        rombelRes.data.forEach((r: any) => {
          if (r.nama) {
            waliKelasMap[r.nama] = r.ptk_id_str || r.nama_wali_kelas || r.wali_kelas_nama || "-";
          }
        });
      }
      if (selectedClass) {
        waliKelasName = waliKelasMap[selectedClass] || "-";
      }
    } catch (e) {
      console.error("Gagal mengambil daftar wali kelas", e);
    }

    const monthLabel = activeTab === "book-presensi"
      ? (rekapMode === "bulanan"
          ? monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth
          : `Semester ${selectedSemester} Tahun ${selectedYear}`)
      : new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    // Cek apakah cetak Harian Siswa per Kelas
    const isDailyPd = activeTab === "daily-pd" || activeTab === "no-pulang";

    let pagesHtml = "";
    let thumbnailsHtml = "";
    let pageNum = 0;
    let totalPagesPdf = 1;

    // Helper untuk parser tingkat kelas (X = 10, XI = 11, XII = 12)
    const getGradeWeight = (className: string): number => {
      const upper = className.toUpperCase();
      if (upper.startsWith("X ")) return 10;
      if (upper.startsWith("XI ")) return 11;
      if (upper.startsWith("XII ")) return 12;
      
      const numMatch = className.match(/\d+/);
      if (numMatch) return parseInt(numMatch[0]);
      return 99; // Fallback untuk non-tingkat
    };

    if (isDailyPd && !selectedClass) {
      // 1 KELAS 1 HALAMAN - URUT DARI TINGKAT PALING BAWAH
      // Grouping dataList harian berdasarkan Rombel
      const groupedByClass: Record<string, DailyItem[]> = {};
      (dataList as DailyItem[]).forEach((item) => {
        const cls = item.rombelOrJabatan || "Tanpa Kelas";
        if (!groupedByClass[cls]) {
          groupedByClass[cls] = [];
        }
        groupedByClass[cls].push(item);
      });

      // Urutkan kelas berdasarkan tingkat terbawah (X, XI, XII)
      const sortedClasses = Object.keys(groupedByClass).sort((a, b) => {
        const weightA = getGradeWeight(a);
        const weightB = getGradeWeight(b);
        if (weightA !== weightB) {
          return weightA - weightB;
        }
        return a.localeCompare(b);
      });

      // Hitung total halaman keseluruhan
      totalPagesPdf = 0;
      sortedClasses.forEach((cls) => {
        const classItems = groupedByClass[cls];
        totalPagesPdf += Math.max(1, Math.ceil(classItems.length / 48)); // maksimal 48 baris per halaman harian
      });

      sortedClasses.forEach((cls) => {
        const classItems = groupedByClass[cls];
        const classWali = waliKelasMap[cls] || "-";
        const itemsPerPageClass = 48;
        const totalClassPages = Math.max(1, Math.ceil(classItems.length / itemsPerPageClass));

        for (let classPageIdx = 0; classPageIdx < totalClassPages; classPageIdx++) {
          pageNum++;
          const startOffset = classPageIdx * itemsPerPageClass;
          const pageData = classItems.slice(startOffset, startOffset + itemsPerPageClass);

          const headerKopHtml = `
            <div style="font-weight: bold; font-size: 11px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 13px; font-weight: bold; margin-bottom: 4px;">Laporan Rekapitulasi Presensi Kehadiran Harian</div>
                <div style="font-size: 9px; font-weight: normal; color: #444; display: flex; gap: 15px;">
                  <span><strong>Kelas:</strong> ${cls}</span>
                  <span><strong>Wali Kelas:</strong> ${classWali}</span>
                  <span><strong>Tanggal:</strong> ${monthLabel}</span>
                </div>
              </div>
            </div>
          `;

          const headers = `
            <tr>
              <th style="width: 30px;">No.</th>
              <th style="width: 200px; text-align: left;">Nama</th>
              <th style="width: 85px; text-align: left;">NISN</th>
              <th style="width: 70px; text-align: left;">Rombel</th>
              <th style="width: 65px;">Jam Masuk</th>
              <th style="width: 65px;">Jam Pulang</th>
              <th style="width: 75px;">Status</th>
            </tr>
          `;

          const rows = pageData.map((item: any, localIdx) => {
            const globalIdx = startOffset + localIdx;
            let statusBadge = "Belum Absen";
            if (item.status === 1) statusBadge = "Hadir";
            else if (item.status === 2) statusBadge = "Terlambat";
            else if (item.status === 3) statusBadge = "Izin";
            else if (item.status === 4) statusBadge = "Sakit";
            else if (item.status === 5) statusBadge = "Alpha";

            return `
              <tr>
                <td style="text-align: center;">${globalIdx + 1}</td>
                <td style="font-weight: 500;">${item.nama}</td>
                <td>${item.identitas}</td>
                <td>${item.rombelOrJabatan}</td>
                <td style="text-align: center;">${formatTime(item.jamMasuk)}</td>
                <td style="text-align: center;">${item.jamPulang ? formatTime(item.jamPulang) : '<span style="color: #dc2626; font-weight: 600;">Belum Pulang</span>'}</td>
                <td style="text-align: center; font-weight: 600;">${statusBadge}</td>
              </tr>
            `;
          }).join("");

          const tableHtml = `
            <table class="report-table">
              <thead>
                ${headers}
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          `;

          pagesHtml += `
            <div id="page-container-${pageNum}" class="page-container">
                ${headerKopHtml}
                ${tableHtml}
                <div class="page-footer" style="position: absolute; bottom: 0.4cm; left: 1.5cm; right: 1.5cm; font-size: 8px; color: #888; display: flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 4px;">
                    <span>Dicetak melalui Sistem Informasi Sekolah pada ${new Date().toLocaleDateString("id-ID")}</span>
                    <span>Halaman ${pageNum} dari ${totalPagesPdf}</span>
                </div>
            </div>
          `;

          thumbnailsHtml += `
            <div class="thumbnail-wrapper" onclick="goToPage(${pageNum})">
                <div id="thumb-container-${pageNum}" class="thumbnail-container ${pageNum === 1 ? 'active' : ''}">
                    <div class="thumbnail-page">
                        <div class="page-container" style="padding: 1cm !important; box-shadow: none !important;">
                            ${headerKopHtml}
                            ${tableHtml}
                        </div>
                    </div>
                </div>
                <div class="thumbnail-number">${pageNum}</div>
            </div>
          `;
        }
      });

    } else {
      // Normal flow (Periodik ATAU Harian dengan kelas filter tertentu ATAU GTK)
      const itemsPerPagePdf = isPeriodik ? 32 : 50;
      totalPagesPdf = Math.max(1, Math.ceil(dataList.length / itemsPerPagePdf));

      for (let pageIdx = 0; pageIdx < totalPagesPdf; pageIdx++) {
        pageNum++;
        const startOffset = pageIdx * itemsPerPagePdf;
        const pageData = dataList.slice(startOffset, startOffset + itemsPerPagePdf);

        // Render Header Halaman dengan info Kelas, Wali Kelas, dan Bulan (tanpa halaman di header)
        const headerKopHtml = `
          <div style="font-weight: bold; font-size: 11px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div style="font-size: 13px; font-weight: bold; margin-bottom: 4px;">Laporan Rekapitulasi Presensi Kehadiran ${isPeriodik ? (rekapTarget === "pd" ? "Peserta Didik" : "GTK") : "Harian"}</div>
              ${isPeriodik && rekapTarget === "pd" ? `
                <div style="font-size: 9px; font-weight: normal; color: #444; display: flex; gap: 15px;">
                  <span><strong>Kelas:</strong> ${selectedClass || "-"}</span>
                  <span><strong>Wali Kelas:</strong> ${waliKelasName}</span>
                  <span><strong>Bulan/Periode:</strong> ${monthLabel}</span>
                </div>
              ` : (activeTab !== "daily-gtk" ? `
                <div style="font-size: 9px; font-weight: normal; color: #444; display: flex; gap: 15px;">
                  <span><strong>Kelas:</strong> ${selectedClass || "-"}</span>
                  <span><strong>Wali Kelas:</strong> ${waliKelasName}</span>
                  <span><strong>Tanggal:</strong> ${monthLabel}</span>
                </div>
              ` : `
                <div style="font-size: 9px; font-weight: normal; color: #444;"><strong>Periode:</strong> ${monthLabel}</div>
              `)}
            </div>
          </div>
        `;

        // Render Table for current page
        let tableHtml = "";
        if (isPeriodik) {
          const isBulanan = rekapMode === "bulanan";
          const headers = isBulanan
            ? `
              <tr>
                <th style="width: 25px;">No.</th>
                <th style="width: 110px; text-align: left;">Nama ${rekapTarget === "pd" ? "Siswa" : "GTK"}</th>
                ${datesInRange.map(d => `<th style="width: 18px;">${d.label}</th>`).join("")}
                <th style="width: 18px; color: #16a34a; background: #f0fdf4;">H</th>
                <th style="width: 18px; color: #2563eb; background: #eff6ff;">S</th>
                <th style="width: 18px; color: #d97706; background: #fffbeb;">I</th>
                <th style="width: 18px; color: #dc2626; background: #fef2f2;">A</th>
              </tr>`
            : `
              <tr>
                <th rowspan="2" style="width: 25px;">No.</th>
                <th rowspan="2" style="width: 110px; text-align: left;">Nama ${rekapTarget === "pd" ? "Siswa" : "GTK"}</th>
                ${datesInRange.map(d => `<th colspan="4" style="font-weight: bold;">${d.label}</th>`).join("")}
                <th rowspan="2" style="width: 22px; color: #16a34a; background: #f0fdf4;">Tot H</th>
                <th rowspan="2" style="width: 22px; color: #2563eb; background: #eff6ff;">Tot S</th>
                <th rowspan="2" style="width: 22px; color: #d97706; background: #fffbeb;">Tot I</th>
                <th rowspan="2" style="width: 22px; color: #dc2626; background: #fef2f2;">Tot A</th>
              </tr>
              <tr>
                ${datesInRange.map(() => `
                  <th style="font-size: 8px; color: #16a34a;">H</th>
                  <th style="font-size: 8px; color: #2563eb;">S</th>
                  <th style="font-size: 8px; color: #d97706;">I</th>
                  <th style="font-size: 8px; color: #dc2626;">A</th>
                `).join("")}
              </tr>`;

          const rows = pageData.map((student: any, localIdx) => {
            const globalIdx = startOffset + localIdx;
            const totals = calculateTotals(student);
            let cellsHtml = "";
            
            if (isBulanan) {
              let i = 0;
              const dates = datesInRange as Array<{ label: string; dateStr: string }>;
              while (i < dates.length) {
                const d = dates[i];
                const holiday = checkIsHoliday(d.dateStr);
                if (holiday.isHoliday) {
                  let span = 1;
                  while (i + span < dates.length) {
                    const nextHoliday = checkIsHoliday(dates[i + span].dateStr);
                    if (nextHoliday.isHoliday && nextHoliday.nama === holiday.nama) {
                      span++;
                    } else {
                      break;
                    }
                  }
                  const labelText = holiday.nama === "Libur Mingguan" ? "LIBUR" : holiday.nama.toUpperCase();
                  
                  // MENGGABUNGKAN HARI LIBUR UNTUK SELURUH SISWA DALAM SATU HALAMAN TANPA DIVIDER
                  const isStartOfRowspanGroup = localIdx === 0; 
                  const calculatedRowspan = pageData.length;

                  if (isStartOfRowspanGroup) {
                    cellsHtml += `
                      <td 
                        colspan="${span}" 
                        rowspan="${calculatedRowspan}" 
                        style="background-color: rgba(254, 226, 226, 0.7); text-align: center; vertical-align: middle; font-weight: bold; color: #dc2626; padding: 2px 0; border: 1px solid #888;"
                      >
                        <div style="writing-mode: vertical-rl; transform: rotate(180deg); margin: 0 auto; font-size: 8px; letter-spacing: 2px;">
                          ${labelText}
                        </div>
                      </td>
                    `;
                  }
                  i += span;
                } else {
                  const sym = getStatusSymbol(student, d.dateStr);
                  cellsHtml += `<td style="text-align: center; font-size: 10px;">${sym.char === "•" ? "•" : sym.char}</td>`;
                  i++;
                }
              }
            } else {
              cellsHtml = datesInRange.map((d: any) => {
                const monthly = calculateMonthlyTotals(student, d.monthNum, d.yearNum);
                return `
                  <td style="text-align: center; background: #f0fdf4; font-size: 9px; font-weight: 500;">${monthly.H || 0}</td>
                  <td style="text-align: center; background: #eff6ff; font-size: 9px; font-weight: 500;">${monthly.S || 0}</td>
                  <td style="text-align: center; background: #fffbeb; font-size: 9px; font-weight: 500;">${monthly.I || 0}</td>
                  <td style="text-align: center; background: #fef2f2; font-size: 9px; font-weight: 500;">${monthly.A || 0}</td>
                `;
              }).join("");
            }

            return `
              <tr>
                <td style="text-align: center;">${globalIdx + 1}</td>
                <td style="font-weight: 500;">${student.nama}</td>
                ${cellsHtml}
                <td style="text-align: center; font-weight: bold; background: #f0fdf4;">${totals.H}</td>
                <td style="text-align: center; font-weight: bold; background: #eff6ff;">${totals.S}</td>
                <td style="text-align: center; font-weight: bold; background: #fffbeb;">${totals.I}</td>
                <td style="text-align: center; font-weight: bold; background: #fef2f2;">${totals.A}</td>
              </tr>
            `;
          }).join("");

          tableHtml = `
            <table class="report-table">
              <thead>
                ${headers}
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          `;
        } else {
          // Harian / Belum Presensi Pulang
          const isDailyGtk = activeTab === "daily-gtk";
          const headers = `
            <tr>
              <th style="width: 30px;">No.</th>
              <th style="width: 200px; text-align: left;">Nama</th>
              <th style="width: 85px; text-align: left;">${isDailyGtk ? "NIP/NUPTK" : "NISN"}</th>
              <th style="width: 70px; text-align: left;">${isDailyGtk ? "Jenis GTK" : "Rombel"}</th>
              <th style="width: 65px;">Jam Masuk</th>
              <th style="width: 65px;">Jam Pulang</th>
              <th style="width: 75px;">Status</th>
            </tr>
          `;

          const rows = pageData.map((item: any, localIdx) => {
            const globalIdx = startOffset + localIdx;
            let statusBadge = "Belum Absen";
            if (item.status === 1) statusBadge = "Hadir";
            else if (item.status === 2) statusBadge = "Terlambat";
            else if (item.status === 3) statusBadge = "Izin";
            else if (item.status === 4) statusBadge = "Sakit";
            else if (item.status === 5) statusBadge = "Alpha";

            return `
              <tr>
                <td style="text-align: center;">${globalIdx + 1}</td>
                <td style="font-weight: 500;">${item.nama}</td>
                <td>${item.identitas}</td>
                <td>${item.rombelOrJabatan}</td>
                <td style="text-align: center;">${formatTime(item.jamMasuk)}</td>
                <td style="text-align: center;">${item.jamPulang ? formatTime(item.jamPulang) : '<span style="color: #dc2626; font-weight: 600;">Belum Pulang</span>'}</td>
                <td style="text-align: center; font-weight: 600;">${statusBadge}</td>
              </tr>
            `;
          }).join("");

          tableHtml = `
            <table class="report-table">
              <thead>
                ${headers}
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          `;
        }

        // Accumulate Pages
        pagesHtml += `
          <div id="page-container-${pageNum}" class="page-container">
              ${isPeriodik ? `
                <div class="landscape-rotated-wrapper">
                  ${headerKopHtml}
                  ${tableHtml}
                  <div class="page-footer" style="position: absolute; bottom: 0.1cm; left: 0; right: 0; font-size: 8px; color: #888; display: flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 4px;">
                      <span>Dicetak melalui Sistem Informasi Sekolah pada ${new Date().toLocaleDateString("id-ID")}</span>
                      <span>Halaman ${pageNum} dari ${totalPagesPdf}</span>
                  </div>
                </div>
              ` : `
                ${headerKopHtml}
                ${tableHtml}
                <div class="page-footer" style="position: absolute; bottom: 0.4cm; left: 1.5cm; right: 1.5cm; font-size: 8px; color: #888; display: flex; justify-content: space-between; border-top: 1px solid #eee; padding-top: 4px;">
                    <span>Dicetak melalui Sistem Informasi Sekolah pada ${new Date().toLocaleDateString("id-ID")}</span>
                    <span>Halaman ${pageNum} dari ${totalPagesPdf}</span>
                </div>
              `}
          </div>
        `;

        // Accumulate Thumbnails
        thumbnailsHtml += `
          <div class="thumbnail-wrapper" onclick="goToPage(${pageNum})">
              <div id="thumb-container-${pageNum}" class="thumbnail-container ${pageNum === 1 ? 'active' : ''}">
                  <div class="thumbnail-page">
                      <div class="page-container" style="padding: 1cm !important; box-shadow: none !important;">
                          ${isPeriodik ? `
                            <div class="landscape-rotated-wrapper">
                              ${headerKopHtml}
                              ${tableHtml}
                            </div>
                          ` : `
                            ${headerKopHtml}
                            ${tableHtml}
                          `}
                      </div>
                  </div>
              </div>
              <div class="thumbnail-number">${pageNum}</div>
          </div>
        `;
      }
    }

    // 2. Construct HTML Template
    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>${titleText}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        /* screen mode styles */
        @media screen {
            html, body {
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: #323639;
            }
            body {
                display: flex;
                flex-direction: column;
            }
            .pdf-toolbar {
                height: 56px;
                background-color: #323639;
                color: #f1f1f1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                box-sizing: border-box;
                border-bottom: 1px solid #1c1f21;
                z-index: 100;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            .pdf-title-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .pdf-title {
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
            }
            .pdf-controls {
                display: flex;
                align-items: center;
                gap: 12px;
                background-color: #202124;
                padding: 4px 16px;
                border-radius: 20px;
            }
            .pdf-control-btn {
                background: none;
                border: none;
                color: #bdc1c6;
                cursor: pointer;
                font-size: 20px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                outline: none;
                transition: background-color 0.2s, color 0.2s;
            }
            .pdf-control-btn:hover {
                background-color: rgba(255,255,255,0.1);
                color: #fff;
            }
            .pdf-page-indicator {
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #bdc1c6;
            }
            .pdf-page-input {
                width: 36px;
                background-color: #35363a;
                border: 1px solid #5f6368;
                color: white;
                text-align: center;
                font-size: 13px;
                padding: 3px 0;
                border-radius: 4px;
                outline: none;
            }
            .pdf-page-input:focus {
                border-color: #8ab4f8;
            }
            .pdf-zoom-text {
                font-size: 13px;
                min-width: 48px;
                text-align: center;
                color: #bdc1c6;
            }
            .pdf-hamburger {
                background: none;
                border: none;
                color: #f1f1f1;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px;
                border-radius: 50%;
                outline: none;
            }
            .pdf-hamburger:hover {
                background-color: rgba(255,255,255,0.1);
            }
            .pdf-content-wrapper {
                display: flex;
                flex: 1;
                overflow: hidden;
                position: relative;
            }
            .pdf-sidebar {
                width: 200px;
                background-color: #323639;
                border-right: 1px solid #1c1f21;
                overflow-y: auto;
                padding: 20px 10px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                transition: width 0.2s;
            }
            .pdf-main-pane {
                flex: 1;
                background-color: #525659;
                overflow-y: auto;
                padding: 24px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                scroll-behavior: smooth;
            }
            .page-container {
                width: 210mm;
                height: 297mm;
                margin-bottom: 24px;
                background: white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 12px 24px rgba(0,0,0,0.2);
                padding: 1cm;
                box-sizing: border-box;
                position: relative;
                border-radius: 2px;
                flex-shrink: 0;
                transform-origin: top center;
                zoom: var(--pdf-zoom, 1);
                overflow: hidden;
            }
            /* Landscape rotated wrapper for Periodik (Bulanan/Semesteran) inside Portrait Page */
            .landscape-rotated-wrapper {
                width: 277mm;
                height: 190mm;
                position: absolute;
                top: 1cm;
                left: 1cm;
                transform: rotate(90deg) translate(0, -190mm);
                transform-origin: top left;
            }
            .thumbnail-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                width: 100%;
            }
            .thumbnail-container {
                width: 105px;
                height: 148px;
                border: 3px solid transparent;
                border-radius: 4px;
                background-color: #fff;
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                position: relative;
            }
            .thumbnail-container.active {
                border-color: #8ab4f8;
            }
            .thumbnail-page {
                width: 210mm;
                height: 297mm;
                transform: scale(0.125);
                transform-origin: top left;
                pointer-events: none;
                position: absolute;
                top: 0;
                left: 0;
                background: white;
            }
            .thumbnail-number {
                color: #bdc1c6;
                font-size: 11px;
            }
        }

        /* print mode styles */
        @media print {
            html, body {
                background-color: white !important;
                overflow: visible !important;
                height: auto !important;
            }
            .pdf-toolbar, .pdf-sidebar {
                display: none !important;
            }
            .pdf-content-wrapper {
                display: block !important;
                overflow: visible !important;
            }
            .pdf-main-pane {
                display: block !important;
                overflow: visible !important;
                padding: 0 !important;
                background-color: transparent !important;
            }
            .page-container {
                width: 210mm !important;
                height: 297mm !important;
                padding: 1cm !important;
                box-sizing: border-box !important;
                position: relative !important;
                page-break-after: always !important;
                background: transparent !important;
                box-shadow: none !important;
                margin: 0 auto !important;
                transform: none !important;
                zoom: 1 !important;
                overflow: hidden !important;
            }
            .landscape-rotated-wrapper {
                width: 277mm !important;
                height: 190mm !important;
                position: absolute !important;
                top: 1cm !important;
                left: 1cm !important;
                transform: rotate(90deg) translate(0, -190mm) !important;
                transform-origin: top left !important;
            }
        }

        /* Kop Surat Resmi */
        .header-table {
            width: 100%;
            border-bottom: 3px double #000;
            margin-bottom: 20px;
            padding-bottom: 8px;
        }
        .header-logo {
            width: 70px;
            text-align: center;
        }
        .header-logo img {
            width: 60px;
            height: auto;
        }
        .header-text {
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
        }
        .header-title-1 {
            font-size: 14px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
        }
        .header-title-2 {
            font-size: 16px;
            font-weight: bold;
            margin: 2px 0 0 0;
            letter-spacing: 1.5px;
        }
        .header-address {
            font-size: 10px;
            margin: 5px 0 0 0;
            font-style: italic;
        }
        
        .doc-title {
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 15px 0 5px 0;
            text-decoration: underline;
        }
        .doc-subtitle {
            text-align: center;
            font-size: 10px;
            color: #555;
            margin-bottom: 25px;
        }

        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            table-layout: fixed;
        }
        .report-table th {
            border: 1px solid #666;
            padding: 3px 2px;
            font-size: 7px;
            font-weight: bold;
            background-color: #f3f4f6;
            text-align: center;
            word-wrap: break-word;
            overflow: hidden;
        }
        .report-table td {
            border: 1px solid #888;
            padding: 2px 3px;
            font-size: 7px;
            color: #111;
            word-wrap: break-word;
            overflow: hidden;
        }
        
        .footer-sig {
            position: absolute;
            bottom: 1.5cm;
            right: 1.5cm;
            width: 200px;
            text-align: center;
            font-size: 10px;
        }
    </style>
    <script>
        let currentZoom = 1.0;
        
        function changeZoom(delta) {
            currentZoom = Math.min(2.0, Math.max(0.5, currentZoom + delta));
            const pane = document.querySelector('.pdf-main-pane');
            if (pane) {
                pane.style.setProperty('--pdf-zoom', currentZoom);
            }
            const zoomVal = document.getElementById('zoom-val');
            if (zoomVal) {
                zoomVal.innerText = Math.round(currentZoom * 100) + '%';
            }
        }
        
        function toggleSidebar() {
            const sidebar = document.querySelector('.pdf-sidebar');
            if (sidebar) {
                if (sidebar.style.display === 'none') {
                    sidebar.style.display = 'flex';
                } else {
                    sidebar.style.display = 'none';
                }
            }
        }
        
        function goToPage(pageNum) {
            pageNum = parseInt(pageNum);
            const total = parseInt(document.getElementById('total-pages-num').innerText);
            if (pageNum >= 1 && pageNum <= total) {
                const target = document.getElementById('page-container-' + pageNum);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }

        window.addEventListener('load', () => {
            const pane = document.querySelector('.pdf-main-pane');
            const containers = document.querySelectorAll('.pdf-main-pane .page-container');
            const thumbs = document.querySelectorAll('.thumbnail-container');
            
            const updateActiveThumb = () => {
                if (!pane) return;
                let activeIndex = 0;
                let minDiff = Infinity;
                const paneTop = pane.getBoundingClientRect().top;
                
                containers.forEach((el, idx) => {
                    const rect = el.getBoundingClientRect();
                    const diff = Math.abs(rect.top - paneTop);
                    if (diff < minDiff) {
                        minDiff = diff;
                        activeIndex = idx;
                    }
                });
                
                thumbs.forEach((th, idx) => {
                    if (idx === activeIndex) {
                        th.classList.add('active');
                        th.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        th.classList.remove('active');
                    }
                });
                
                const pageNumEl = document.getElementById('current-page-num');
                if (pageNumEl) {
                    pageNumEl.value = activeIndex + 1;
                }
            };
            
            if (pane) {
                pane.addEventListener('scroll', updateActiveThumb);
                updateActiveThumb();
            }
            
            // Set up page input listener
            const pageInput = document.getElementById('current-page-num');
            if (pageInput) {
                pageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        goToPage(e.target.value);
                    }
                });
            }
        });
    </script>
</head>
<body>
    <div class="pdf-toolbar">
        <div class="pdf-title-container">
            <button class="pdf-hamburger" onclick="toggleSidebar()" title="Toggle Sidebar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            </button>
            <div class="pdf-title">${titleText}.pdf</div>
        </div>
        <div class="pdf-controls">
            <div class="pdf-page-indicator">
                <input type="text" id="current-page-num" class="pdf-page-input" value="1">
                <span>/</span>
                <span id="total-pages-num">${totalPagesPdf}</span>
            </div>
            <div style="border-left: 1px solid #555; height: 18px; margin: 0 4px;"></div>
            <button class="pdf-control-btn" onclick="changeZoom(-0.1)" title="Zoom Out">−</button>
            <span class="pdf-zoom-text" id="zoom-val">100%</span>
            <button class="pdf-control-btn" onclick="changeZoom(0.1)" title="Zoom In">+</button>
        </div>
        <div class="pdf-actions">
            <button class="pdf-btn" onclick="window.print()" title="Cetak">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
            </button>
        </div>
    </div>
    
    <div class="pdf-content-wrapper">
        <div class="pdf-sidebar">
            ${thumbnailsHtml}
        </div>
        
        <div class="pdf-main-pane">
            ${pagesHtml}
        </div>
    </div>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const classOptions = [
    { value: "", label: "Semua Rombel" },
    ...classes.map((cls) => ({ value: cls, label: cls })),
  ];

  const classRequiredOptions = [
    { value: "", label: "Pilih Rombel (Wajib)" },
    ...classes.map((cls) => ({ value: cls, label: cls })),
  ];

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(i);
    const mStr = String(i + 1).padStart(2, "0");
    const year = new Date().getFullYear();
    return {
      value: `${year}-${mStr}`,
      label: d.toLocaleDateString("id-ID", { month: "long" }) + ` ${year}`,
    };
  });

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const yr = String(new Date().getFullYear() - i);
    return { value: yr, label: yr };
  });

  return (
    <>
      <PageMeta
        title="Rekap Presensi Sekolah | SIMAK"
        description="Halaman rekap presensi harian, bulanan, semesteran peserta didik dan GTK"
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Rekap Presensi Sekolah
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pantau laporan kehadiran harian, buku presensi bulanan/semesteran, dan siswa yang belum presensi pulang.
          </p>
        </div>
        
        {/* Tombol Cetak Rekap (Print / PDF Preview) */}
        <button
          onClick={handlePrintPdf}
          disabled={loading || (activeTab === "book-presensi" && rekapTarget === "pd" && !selectedClass)}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:dark:bg-gray-800 disabled:text-gray-400 text-white font-semibold text-sm px-4 py-2.5 transition-colors no-print self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak Rekap
        </button>
      </div>

      <ComponentCard title="Laporan Presensi">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-800 -mt-2 mb-6 gap-2">
          <button
            onClick={() => setActiveTab("daily-pd")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-all duration-200 ${
              activeTab === "daily-pd"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Harian PD
          </button>
          <button
            onClick={() => setActiveTab("daily-gtk")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-all duration-200 ${
              activeTab === "daily-gtk"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Harian GTK
          </button>
          <button
            onClick={() => setActiveTab("book-presensi")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-all duration-200 ${
              activeTab === "book-presensi"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Buku Presensi (Bulanan / Semester)
          </button>
          <button
            onClick={() => setActiveTab("no-pulang")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-all duration-200 ${
              activeTab === "no-pulang"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Belum Presensi Pulang
          </button>
        </div>

        {/* Filters Panel */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
          <div className="w-20">
            <Select
              options={rowsPerPageOptions}
              defaultValue={itemsPerPage.toString()}
              onChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-4xl w-full lg:justify-end">
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="size-5" />
              </span>
              <Input
                type="text"
                placeholder={activeTab === "daily-gtk" ? "Cari Nama / NUPTK..." : "Cari Nama / NISN..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Rekap Target (PD vs GTK) */}
            {activeTab === "book-presensi" && (
              <div className="w-full sm:w-36">
                <Select
                  options={[
                    { value: "pd", label: "Peserta Didik" },
                    { value: "gtk", label: "GTK" },
                  ]}
                  defaultValue={rekapTarget}
                  onChange={(value: any) => {
                    setRekapTarget(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            {/* Rombel Dropdown */}
            {activeTab !== "daily-gtk" && !(activeTab === "book-presensi" && rekapTarget === "gtk") && (
              <div className="w-full sm:w-48">
                <Select
                  options={activeTab === "book-presensi" ? classRequiredOptions : classOptions}
                  defaultValue={selectedClass}
                  onChange={(value) => {
                    setSelectedClass(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            {/* Rekap Mode (Bulanan vs Semesteran) */}
            {activeTab === "book-presensi" && (
              <div className="w-full sm:w-36">
                <Select
                  options={[
                    { value: "bulanan", label: "Bulanan" },
                    { value: "semesteran", label: "Semesteran" },
                  ]}
                  defaultValue={rekapMode}
                  onChange={(value: any) => {
                    setRekapMode(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            {/* Dynamic Date/Month/Semester controls */}
            {activeTab === "book-presensi" ? (
              rekapMode === "bulanan" ? (
                <div className="w-full sm:w-44">
                  <Select
                    options={monthOptions}
                    defaultValue={selectedMonth}
                    onChange={(value) => {
                      setSelectedMonth(value);
                      setSelectedClass("");
                      setCurrentPage(1);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="w-full sm:w-32">
                    <Select
                      options={[
                        { value: "1", label: "Ganjil" },
                        { value: "2", label: "Genap" },
                      ]}
                      defaultValue={selectedSemester}
                      onChange={(value) => {
                        setSelectedSemester(value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <div className="w-full sm:w-28">
                    <Select
                      options={yearOptions}
                      defaultValue={selectedYear}
                      onChange={(value) => {
                        setSelectedYear(value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </>
              )
            ) : (
              <div className="w-full sm:w-48">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* CSS Khusus Media Cetak / PDF Viewer */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            /* Sembunyikan elemen dashboard & navigasi non-rekap */
            header, nav, aside, footer, .no-print, .no-print *, 
            button, select, input, .mb-6.flex, .flex-wrap.border-b {
              display: none !important;
            }
            /* Hilangkan layout padding & bayangan */
            body, html {
              background: #fff !important;
              color: #000 !important;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 10px !important;
            }
            .rounded-2xl, .border, .bg-white, .dark\\:bg-white\\/\\[0\\.03\\] {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            /* Atur orientasi cetak portrait */
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            /* Optimasi ukuran & kontras tabel saat dicetak */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th, td {
              border: 1px solid #999 !important;
              color: #000 !important;
              padding: 4px 6px !important;
              font-size: 9px !important;
              background: transparent !important;
            }
            /* Pastikan sticky column tidak mengganggu layout cetak */
            .sticky {
              position: static !important;
              background: transparent !important;
            }
            /* Kontras background merah hari libur agar tetap tercetak */
            td.bg-red-100\\/60, th.bg-red-100\\/60 {
              background-color: rgba(254, 226, 226, 0.7) !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Tampilkan header cetak kustom */
            .print-header {
              display: block !important;
              margin-bottom: 20px;
              text-align: center;
            }
          }
          .print-header {
            display: none;
          }
        `}} />

        {/* Print Header Tampilan Cetak */}
        <div className="print-header text-center border-b-2 border-double border-gray-800 pb-3">
          <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900">{sekolah?.nama || "SIMAK SEKOLAH"}</h2>
          <p className="text-xs text-gray-600 font-medium">Laporan Rekapitulasi Presensi Kehadiran ({activeTab === "book-presensi" ? (rekapTarget === "pd" ? "Peserta Didik" : "GTK") : "Harian"})</p>
          <p className="text-[10px] text-gray-500 mt-1">Dicetak pada: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB</p>
        </div>

        {/* Loader or Error */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : activeTab === "book-presensi" && rekapTarget === "pd" && !selectedClass ? (
          // Warn to select rombel first
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
             <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             </div>
             <p className="text-gray-500 font-medium">Pilih Rombongan Belajar Terlebih Dahulu</p>
             <p className="text-xs text-gray-400 mt-1">Anda wajib menyaring Rombel sebelum melihat buku rekap presensi.</p>
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
             <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             </div>
             <p className="text-gray-500 font-medium">Data presensi tidak ditemukan</p>
             <p className="text-xs text-gray-400 mt-1">Belum ada aktivitas presensi pada kriteria ini.</p>
          </div>
        ) : activeTab === "book-presensi" ? (
          // Grid table gaya buku presensi
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <table className="min-w-max w-full border-collapse">
                  <thead>
                    {rekapMode === "bulanan" ? (
                      <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
                        <th className="sticky left-0 z-10 bg-gray-50 dark:bg-[#1E293B] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-white/[0.05] w-12">No.</th>
                        <th className="sticky left-12 z-10 bg-gray-50 dark:bg-[#1E293B] px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-white/[0.05] w-64">Nama Siswa</th>
                        {datesInRange.map((d: any, i) => {
                          const holiday = checkIsHoliday(d.dateStr);
                          return (
                            <th
                              key={i}
                              title={holiday.isHoliday ? holiday.nama : ""}
                              className={`px-2 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-white/[0.05] min-w-[36px] ${
                                holiday.isHoliday ? "bg-red-100/60 dark:bg-red-950/40 text-red-600 font-extrabold" : ""
                              }`}
                            >
                              {d.label}
                            </th>
                          );
                        })}
                        <th className="px-3 py-3 text-center text-xs font-bold text-green-600 dark:text-green-400 border-r border-gray-100 dark:border-white/[0.05] min-w-[36px] bg-green-50/30 dark:bg-green-950/10">H</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-blue-600 dark:text-blue-400 border-r border-gray-100 dark:border-white/[0.05] min-w-[36px] bg-blue-50/30 dark:bg-blue-950/10">S</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-amber-600 dark:text-amber-400 border-r border-gray-100 dark:border-white/[0.05] min-w-[36px] bg-amber-50/30 dark:bg-amber-950/10">I</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-red-600 dark:text-red-400 min-w-[36px] bg-red-50/30 dark:bg-red-950/10">A</th>
                      </tr>
                    ) : (
                      // Semesteran double headers
                      <>
                        <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
                          <th rowSpan={2} className="sticky left-0 z-10 bg-gray-50 dark:bg-[#1E293B] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-white/[0.05] w-12">No.</th>
                          <th rowSpan={2} className="sticky left-12 z-10 bg-gray-50 dark:bg-[#1E293B] px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-white/[0.05] w-64">Nama Siswa</th>
                          {datesInRange.map((d: any, i) => (
                            <th key={i} colSpan={4} className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-white/[0.05]">
                              {d.label}
                            </th>
                          ))}
                          <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold text-green-600 dark:text-green-400 border-r border-gray-100 dark:border-white/[0.05] min-w-[36px] bg-green-50/30 dark:bg-green-950/10">Tot H</th>
                          <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold text-blue-600 dark:text-blue-400 border-r border-gray-100 dark:border-white/[0.05] min-w-[36px] bg-blue-50/30 dark:bg-blue-950/10">Tot S</th>
                          <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold text-amber-600 dark:text-amber-400 border-r border-gray-100 dark:border-white/[0.05] min-w-[36px] bg-amber-50/30 dark:bg-amber-950/10">Tot I</th>
                          <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold text-red-600 dark:text-red-400 min-w-[36px] bg-red-50/30 dark:bg-red-950/10">Tot A</th>
                        </tr>
                        <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
                          {datesInRange.map((_, i) => (
                            <React.Fragment key={i}>
                              <th className="px-1 py-1.5 text-center text-[10px] font-bold text-green-600 border-r border-gray-100 dark:border-white/[0.05] min-w-[20px]">H</th>
                              <th className="px-1 py-1.5 text-center text-[10px] font-bold text-blue-600 border-r border-gray-100 dark:border-white/[0.05] min-w-[20px]">S</th>
                              <th className="px-1 py-1.5 text-center text-[10px] font-bold text-amber-600 border-r border-gray-100 dark:border-white/[0.05] min-w-[20px]">I</th>
                              <th className="px-1 py-1.5 text-center text-[10px] font-bold text-red-600 border-r border-gray-100 dark:border-white/[0.05] min-w-[20px]">A</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </>
                    )}
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05] bg-white dark:bg-transparent">
                    {(paginatedList as PeriodikItem[]).map((student, idx) => {
                      const totals = calculateTotals(student);
                      return (
                        <tr key={student.peserta_didik_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                          <td className="sticky left-0 z-10 bg-white dark:bg-[#0f172a] px-4 py-2.5 text-sm text-gray-800 dark:text-white/80 border-r border-gray-100 dark:border-white/[0.05]">{idx + 1 + (currentPage - 1) * itemsPerPage}</td>
                          <td className="sticky left-12 z-10 bg-white dark:bg-[#0f172a] px-5 py-2.5 text-sm font-medium text-gray-800 dark:text-white/90 border-r border-gray-100 dark:border-white/[0.05] truncate max-w-[250px]">{student.nama}</td>
                          {rekapMode === "bulanan" ? (() => {
                            const cells: React.ReactNode[] = [];
                            let i = 0;
                            const dates = datesInRange as Array<{ label: string; dateStr: string }>;
                            
                            while (i < dates.length) {
                              const d = dates[i];
                              const holiday = checkIsHoliday(d.dateStr);

                              if (holiday.isHoliday) {
                                // Cari libur berturut-turut dengan nama libur yang sama
                                let span = 1;
                                while (
                                  i + span < dates.length &&
                                  span < 3
                                ) {
                                  const nextHoliday = checkIsHoliday(dates[i + span].dateStr);
                                  if (nextHoliday.isHoliday && nextHoliday.nama === holiday.nama) {
                                    span++;
                                  } else {
                                    break;
                                  }
                                }

                                // Tentukan label keterangan libur
                                const labelText = holiday.nama === "Libur Mingguan" ? "HARI LIBUR" : holiday.nama.toUpperCase();

                                // Gunakan logic Rowspan kelipatan 10 baris agar teks libur berulang dan tidak menyisakan ruang kosong yang terlalu panjang
                                const isStartOfRowspanGroup = idx % 10 === 0;
                                const calculatedRowspan = Math.min(10, paginatedList.length - idx);

                                if (isStartOfRowspanGroup) {
                                  // Ukuran font disamakan (text-[9px] dengan tracking-normal) agar rapi dan seragam di semua kolom
                                  const fontSizeClass = "text-[9px]";
                                  const letterSpacingStyle = "tracking-normal";
                                  
                                  // Jangan tampilkan teks jika sisa baris yang digabung kurang dari 3 baris agar tidak memperpanjang/melarkan tinggi baris siswa secara paksa
                                  const renderText = calculatedRowspan >= 3;

                                  cells.push(
                                    <td
                                      key={`holiday-${i}-${idx}`}
                                      colSpan={span}
                                      rowSpan={calculatedRowspan}
                                      title={holiday.nama}
                                      className="px-1 py-2 text-center font-extrabold text-red-600 bg-red-100/60 dark:bg-red-950/40 border-r border-gray-100 dark:border-white/[0.05] align-middle select-none overflow-hidden"
                                      style={{
                                        minWidth: `${span * 36}px`,
                                        maxWidth: `${span * 36}px`
                                      }}
                                    >
                                      <div className="flex items-center justify-center h-full w-full overflow-hidden">
                                        {renderText && (
                                          <span 
                                            className={`whitespace-nowrap uppercase font-bold block ${fontSizeClass} ${letterSpacingStyle}`}
                                            style={{
                                              writingMode: "vertical-rl",
                                              transform: "rotate(180deg)",
                                              textOrientation: "mixed",
                                              textAlign: "center"
                                            }}
                                          >
                                            {labelText}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }
                                // Untuk baris lain di dalam grup rowspan yang sama, sel di-skip
                                i += span;
                              } else {
                                const sym = getStatusSymbol(student, d.dateStr);
                                cells.push(
                                  <td
                                    key={`normal-${i}`}
                                    className="px-2 py-2.5 text-center text-sm border-r border-gray-100 dark:border-white/[0.05]"
                                  >
                                    <span className={sym.style}>{sym.char}</span>
                                  </td>
                                );
                                i++;
                              }
                            }
                            return cells;
                          })() : (
                            datesInRange.map((d: any, i) => {
                              const monthly = calculateMonthlyTotals(student, d.monthNum, d.yearNum);
                              return (
                                <React.Fragment key={i}>
                                  <td className="px-1 py-2 text-center text-xs font-semibold text-green-600 border-r border-gray-100 dark:border-white/[0.05] bg-green-50/5 dark:bg-green-950/5">{monthly.H}</td>
                                  <td className="px-1 py-2 text-center text-xs font-semibold text-blue-600 border-r border-gray-100 dark:border-white/[0.05] bg-blue-50/5 dark:bg-blue-950/5">{monthly.S}</td>
                                  <td className="px-1 py-2 text-center text-xs font-semibold text-amber-600 border-r border-gray-100 dark:border-white/[0.05] bg-amber-50/5 dark:bg-amber-950/5">{monthly.I}</td>
                                  <td className="px-1 py-2 text-center text-xs font-semibold text-red-600 border-r border-gray-100 dark:border-white/[0.05] bg-red-50/5 dark:bg-red-950/5">{monthly.A}</td>
                                </React.Fragment>
                              );
                            })
                          )}
                          <td className="px-3 py-2.5 text-center text-sm font-bold text-green-600 dark:text-green-400 border-r border-gray-100 dark:border-white/[0.05] bg-green-50/10 dark:bg-green-950/5">{totals.H}</td>
                          <td className="px-3 py-2.5 text-center text-sm font-bold text-blue-600 dark:text-blue-400 border-r border-gray-100 dark:border-white/[0.05] bg-blue-50/10 dark:bg-blue-950/5">{totals.S}</td>
                          <td className="px-3 py-2.5 text-center text-sm font-bold text-amber-600 dark:text-amber-400 border-r border-gray-100 dark:border-white/[0.05] bg-amber-50/10 dark:bg-amber-950/5">{totals.I}</td>
                          <td className="px-3 py-2.5 text-center text-sm font-bold text-red-600 dark:text-red-400 bg-red-50/10 dark:bg-red-950/5">{totals.A}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Legend Panel */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.01] flex flex-wrap gap-5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-white/80">Keterangan Simbol:</span>
              <div className="flex items-center gap-1.5"><span className="text-green-500 text-lg leading-none">•</span> Hadir / Terlambat</div>
              <div className="flex items-center gap-1.5"><span className="text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-1 rounded">S</span> Sakit</div>
              <div className="flex items-center gap-1.5"><span className="text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/30 px-1 rounded">I</span> Izin</div>
              <div className="flex items-center gap-1.5"><span className="text-red-500 font-bold bg-red-50 dark:bg-red-900/30 px-1 rounded">A</span> Alpha</div>
              <div className="flex items-center gap-1.5"><span className="text-gray-300 dark:text-gray-700">-</span> Belum Presensi / Hari Libur</div>
            </div>

            <div className="no-print">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>
        ) : (
          // Daily & No-Pulang Standard Tables
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Table className="min-w-[1000px]">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No.</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{activeTab === "daily-gtk" ? "NUPTK" : "NISN"}</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{activeTab === "daily-gtk" ? "Jabatan" : "Rombel"}</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jam Masuk</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jam Pulang</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {(paginatedList as DailyItem[]).map((item, index) => {
                      const fotoUrl = getFotoUrl(item.foto, "");
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                          <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-start whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar src={fotoUrl} size="small" />
                              <span className="font-medium text-gray-800 dark:text-white/90">{item.nama}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{item.identitas}</TableCell>
                          <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{item.rombelOrJabatan}</TableCell>
                          <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {formatTime(item.jamMasuk)}
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {item.jamPulang ? formatTime(item.jamPulang) : (
                              <span className="text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded text-xs">Belum Pulang</span>
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-3.5">
                            {activeTab === "daily-gtk" ? (
                              item.status === 1 ? <Badge color="success">Hadir</Badge> :
                              item.status === 2 ? <Badge color="warning">Terlambat</Badge> :
                              item.status === 3 ? <Badge color="warning">Izin</Badge> :
                              item.status === 4 ? <Badge color="info">Sakit</Badge> :
                              item.status === 5 ? <Badge color="error">Alpha</Badge> :
                              <Badge color="light">Belum Presensi</Badge>
                            ) : (
                              item.status === 1 ? <Badge color="success">Hadir</Badge> :
                              item.status === 2 ? <Badge color="warning">Terlambat</Badge> :
                              item.status === 3 ? <Badge color="warning">Izin</Badge> :
                              item.status === 4 ? <Badge color="info">Sakit</Badge> :
                              item.status === 5 ? <Badge color="error">Alpha</Badge> :
                              <Badge color="light">Belum Presensi</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="no-print">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </div>
          </div>
        )}
      </ComponentCard>
    </>
  );
};

export default RekapPresensi;
