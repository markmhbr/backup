import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Select from "../../components/form/Select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Avatar from "../../components/ui/avatar/Avatar";
import Button from "../../components/ui/button/Button";
import { PrinterIcon } from "../../icons";
import { dapodikService } from "../../services/dapodikService";
import { getFotoUrl } from "../../utils/image";
import { printStudentProfile } from "../../utils/printStudentProfile";

export default function StudentBukuInduk() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Fetch reguler rombel classes for dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const response = await dapodikService.getRombonganBelajar("reguler", 1000, 1);
        if (response && response.data) {
          setClasses(response.data);
        }
      } catch (error) {
        console.error("Gagal memuat rombel:", error);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  const classOptions = [
    { value: "", label: "-- Pilih Rombel --" },
    ...classes.map((cls) => ({
      value: cls.rombongan_belajar_id,
      label: cls.nama,
    })),
  ];

  const handleFetchStudents = async () => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    setHasLoaded(true);
    try {
      const response = await dapodikService.getRombelAnggota(selectedClassId);
      if (response && response.data) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error("Gagal mengambil anggota rombel:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handlePrint = async (pdId: string) => {
    await printStudentProfile([pdId]);
  };

  return (
    <>
      <PageMeta
        title="Buku Induk Peserta Didik | SIMAK Admin Panel"
        description="Buku Induk data murid per rombel"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Buku Induk Peserta Didik
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cetak dan lihat rekapitulasi lembar buku induk peserta didik per kelas.
            </p>
          </div>
        </div>

        {/* Filter / Class Selector */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Pilih Kelas Rombel
              </label>
              <Select
                options={classOptions}
                value={selectedClassId}
                onChange={(val) => {
                  setSelectedClassId(val);
                  setStudents([]);
                  setHasLoaded(false);
                }}
                disabled={loadingClasses}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleFetchStudents}
              disabled={!selectedClassId || loadingStudents}
              className="sm:w-auto w-full"
            >
              Lihat Peserta Didik
            </Button>
          </div>
        </div>

        {/* Table Section */}
        {hasLoaded && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 relative">
            {loadingStudents && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Table className="min-w-[700px]">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Foto</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NISN</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Aksi</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {students.length > 0 ? students.map((item) => (
                      <TableRow key={item.peserta_didik_id}>
                        <TableCell className="px-5 py-4 text-start">
                          <Avatar src={getFotoUrl(item.foto, "/images/user/user-01.jpg")} size="medium" />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                          {item.nama}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-gray-500 dark:text-gray-400">
                          {item.nisn || "-"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          <Button
                            variant="success-outline"
                            size="sm"
                            startIcon={<PrinterIcon className="size-4" />}
                            onClick={() => handlePrint(item.peserta_didik_id)}
                          >
                            Buku Induk
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                          Tidak ada peserta didik terdaftar di kelas ini
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
