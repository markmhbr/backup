import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { dapodikService } from "../../services/dapodikService";
import { presensiService } from "../../services/presensiService";
import { indisiplinerService } from "../../services/indisiplinerService";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import { SearchIcon } from "../../icons";
import Pagination from "../../components/common/Pagination";
import Button from "../../components/ui/button/Button";
import { printRapor } from "../../utils/printRapor";

export default function WaliClassRapor() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isWali, setIsWali] = useState<boolean | null>(null);
  const [rombelInfo, setRombelInfo] = useState<any | null>(null);

  // Table States
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [violationsData, setViolationsData] = useState<any[]>([]);

  useEffect(() => {
    if (user?.ptk_id) {
      checkWaliStatus();
    } else {
      setIsWali(false);
    }
  }, [user]);

  const checkWaliStatus = async () => {
    setLoading(true);
    try {
      const res = await dapodikService.getRombonganBelajar("reguler", 100);
      if (res?.status === "success" && res.data) {
        const myClass = res.data.find((rombel: any) => rombel.ptk_id === user?.ptk_id);
        if (myClass) {
          setIsWali(true);
          setRombelInfo(myClass);
        } else {
          setIsWali(false);
        }
      } else {
        setIsWali(false);
      }
    } catch (e) {
      console.error("Gagal memeriksa status wali kelas:", e);
      setIsWali(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWali && rombelInfo) {
      fetchClassStudents();
    }
  }, [isWali, rombelInfo, currentPage, itemsPerPage, searchQuery]);

  const fetchClassStudents = async () => {
    try {
      const result = await dapodikService.getPesertaDidik(
        itemsPerPage,
        searchQuery,
        currentPage,
        rombelInfo.nama,
        "aktif"
      );
      if (result.status === "success") {
        const studentList = result.data || [];
        setStudents(studentList);
        setTotal(result.meta?.total || 0);

        // Fetch attendance and violations for the whole class
        if (studentList.length > 0) {
          try {
            const sekolahRes = await dapodikService.getSekolah();
            const sekolah = sekolahRes.data || {};
            const start = rombelInfo.tanggal_mulai 
              ? rombelInfo.tanggal_mulai.substring(0, 10) 
              : `${new Date().getFullYear()}-07-01`;
            const end = rombelInfo.tanggal_selesai 
              ? rombelInfo.tanggal_selesai.substring(0, 10) 
              : `${new Date().getFullYear()}-12-31`;

            // 1. Fetch Attendance
            const attRes = await presensiService.getRekapPeriodik(
              sekolah.sekolah_id,
              rombelInfo.nama,
              start,
              end,
              "pd"
            );
            setAttendanceData(attRes.data || []);

            // 2. Fetch Violations
            const violRes = await indisiplinerService.getPelanggaran(sekolah.sekolah_id);
            setViolationsData(Array.isArray(violRes) ? violRes : (violRes?.data || []));

          } catch (err) {
            console.error("Gagal memuat rekap absensi/pelanggaran kelas:", err);
          }
        }
      }
    } catch (e) {
      console.error("Gagal mengambil data siswa kelas:", e);
    }
  };

  const getStudentAttendance = (studentId: string) => {
    const myAtt = attendanceData.find((item: any) => item.peserta_didik_id === studentId);
    if (!myAtt) return { sakit: 0, izin: 0, alfa: 0 };

    const rekapAbsensi = { sakit: 0, izin: 0, alfa: 0 };
    const countedDates = new Set<string>();

    if (Array.isArray(myAtt.presensi)) {
      myAtt.presensi.forEach((p: any) => {
        if (!p.tanggal) return;
        const dateStr = new Date(p.tanggal).toISOString().split('T')[0];
        if (p.status_masuk === 4) {
          rekapAbsensi.sakit++;
          countedDates.add(dateStr);
        } else if (p.status_masuk === 3) {
          rekapAbsensi.izin++;
          countedDates.add(dateStr);
        } else if (p.status_masuk === 5) {
          rekapAbsensi.alfa++;
          countedDates.add(dateStr);
        }
      });
    }

    if (Array.isArray(myAtt.izin)) {
      myAtt.izin.forEach((i: any) => {
        if (!i.tanggal) return;
        const dateStr = new Date(i.tanggal).toISOString().split('T')[0];
        if (countedDates.has(dateStr)) return;

        if (i.jenis === 5) {
          rekapAbsensi.sakit++;
          countedDates.add(dateStr);
        } else if (i.jenis === 4) {
          rekapAbsensi.izin++;
          countedDates.add(dateStr);
        } else if (i.jenis === 6) {
          rekapAbsensi.alfa++;
          countedDates.add(dateStr);
        }
      });
    }

    return rekapAbsensi;
  };

  const getStudentViolationPoints = (studentId: string) => {
    const studentViols = violationsData.filter((v: any) => v.peserta_didik_id === studentId);
    return studentViols.reduce((acc, curr) => acc + (curr.poin || curr.jenis_pelanggaran?.poin || 0), 0);
  };

  const handlePrintRapor = async (studentId: string) => {
    await printRapor(studentId, rombelInfo);
  };

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <p className="text-gray-500 font-medium">Memuat Informasi Rapor...</p>
      </div>
    );
  }

  if (isWali === false) {
    return (
      <>
        <PageMeta title="Rapor Kelas | SIMAK" description="Rapor rombel wali kelas" />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
            ⚠
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Akses Terbatas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
            Halaman ini hanya dapat diakses oleh GTK yang terdaftar sebagai Wali Kelas aktif (Rombel Reguler).
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Rapor Kelas ${rombelInfo?.nama || ""} | SIMAK`} description="Kelola Nilai Rapor Kelas Anda" />
      <div className="space-y-6">
        {/* Header Widget */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400 rounded-full">
              Wali Kelas
            </span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mt-1">
              Evaluasi & Rapor Kelas: {rombelInfo?.nama}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Pantau status pengisian nilai, absensi, dan catatan wali kelas untuk rapor semester ini.
            </p>
          </div>
        </div>

        {/* Table & Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-20">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="relative max-w-xs w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="size-5" />
              </span>
              <Input
                type="text"
                placeholder="Cari siswa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">No</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama Siswa</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NISN</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Sakit</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Izin</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Alfa</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Poin Pelanggaran</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data siswa ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((item, idx) => {
                    const att = getStudentAttendance(item.peserta_didik_id);
                    const points = getStudentViolationPoints(item.peserta_didik_id);
                    return (
                      <TableRow key={item.peserta_didik_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                          {item.nama}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {item.nisn || "-"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                          {att.sakit} hari
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                          {att.izin} hari
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                          {att.alfa} hari
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-center font-bold text-gray-800 dark:text-white/90">
                          {points}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintRapor(item.peserta_didik_id)}
                          >
                            Cetak Rapor
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && total > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      </div>
    </>
  );
}
