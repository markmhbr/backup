import React, { useEffect, useState, useCallback } from "react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import { presensiService } from "../../../services/presensiService";
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
import Button from "../../../components/ui/button/Button";
import { Modal } from "../../../components/ui/modal";
import Swal from "sweetalert2";

interface GtkAttendance {
  ptk_id: string;
  nama: string;
  nuptk: string | null;
  foto: string | null;
  jenis_ptk_id_str: string | null;
  presensi: {
    jam_masuk: string | null;
    jam_pulang: string | null;
    status_masuk: number | null;
    status_pulang: number | null;
  } | null;
  izin?: {
    izin_id: string;
    jenis: number;
    keterangan: string;
  } | null;
}

const PresensiGTK: React.FC = () => {
  const { sekolah } = useSekolah();
  const [data, setData] = useState<GtkAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination states
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Absence States
  const [activeTab, setActiveTab] = useState<"daftar" | "kelola">("daftar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGtk, setSelectedGtk] = useState<GtkAttendance | null>(null);
  const [absentStatus, setAbsentStatus] = useState<"4" | "5" | "6" | "7">("4");
  const [keterangan, setKeterangan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeTab]);

  const openAbsentModal = (gtk: GtkAttendance) => {
    setSelectedGtk(gtk);
    const currentStatus = gtk.presensi?.status_masuk;
    let mappedStatus: "4" | "5" | "6" | "7" = "4";
    if (currentStatus === 3) mappedStatus = "4";
    else if (currentStatus === 4) mappedStatus = "5";
    else if (currentStatus === 5) mappedStatus = "6";
    else if (currentStatus === 1 || currentStatus === 2) mappedStatus = "7";

    setAbsentStatus(mappedStatus);
    setKeterangan(gtk.izin?.keterangan || "");
    setIsModalOpen(true);
  };

  const handleSaveAbsent = async () => {
    if (!sekolah?.sekolah_id || !selectedGtk) return;
    setSubmitting(true);
    try {
      await presensiService.createIzin(sekolah.sekolah_id, {
        ptk_id: selectedGtk.ptk_id,
        jenis: parseInt(absentStatus),
        tanggal: selectedDate,
        keterangan: keterangan,
      });

      setIsModalOpen(false);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Status ketidakhadiran GTK berhasil disimpan.",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchAttendance();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menyimpan status ketidakhadiran.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAttendance = useCallback(async () => {
    if (!sekolah?.sekolah_id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await presensiService.getRekapGtk(sekolah.sekolah_id, selectedDate);
      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengambil data kehadiran GTK.");
    } finally {
      setLoading(false);
    }
  }, [sekolah?.sekolah_id, selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Filtered list
  const filteredData = data.filter((item) => {
    return (
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nuptk && item.nuptk.includes(searchTerm))
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB";
  };

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <>
      <PageMeta
        title="Presensi GTK | SIMAK"
        description="Halaman presensi GTK"
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Presensi GTK
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pantau kehadiran harian Guru dan Tenaga Kependidikan secara real-time.
          </p>
        </div>
      </div>

      <ComponentCard
        title={activeTab === "daftar" ? "Daftar Kehadiran GTK" : "Kelola Ketidakhadiran GTK"}
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 -mt-2 mb-6">
          <button
            onClick={() => setActiveTab("daftar")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-all duration-200 ${
              activeTab === "daftar"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Daftar Kehadiran
          </button>
          <button
            onClick={() => setActiveTab("kelola")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-all duration-200 ${
              activeTab === "kelola"
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Kelola Ketidakhadiran
          </button>
        </div>

        {activeTab === "daftar" ? (
          <>
            {/* Filters Layout matching student-data */}
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

              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full lg:justify-end">
                <div className="relative max-w-sm w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon className="size-5" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Cari nama atau NUPTK..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

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
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                 <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                 </div>
                 <p className="text-gray-500 font-medium">Data kehadiran GTK tidak ditemukan</p>
                 <p className="text-xs text-gray-400 mt-1">Belum ada aktivitas presensi pada kriteria ini.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto custom-scrollbar">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No.</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NUPTK</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jabatan</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jam Masuk</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jam Pulang</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {paginatedData.map((item, index) => {
                        const hasAbsen = !!item.presensi;
                        const hasMasuk = !!item.presensi?.jam_masuk;
                        const hasPulang = !!item.presensi?.jam_pulang;

                        const statusMasuk = item.presensi?.status_masuk;

                        // Status determination
                        let statusBadge = <Badge color="light">Belum Presensi</Badge>;

                        if (statusMasuk === 3) {
                          statusBadge = <Badge color="info">Izin</Badge>;
                        } else if (statusMasuk === 4) {
                          statusBadge = <Badge color="warning">Sakit</Badge>;
                        } else if (statusMasuk === 5) {
                          statusBadge = <Badge color="error">Alpha</Badge>;
                        } else if (hasAbsen) {
                          const isTerlambat = statusMasuk === 2;

                          if (hasMasuk && hasPulang) {
                            statusBadge = isTerlambat ? (
                              <Badge color="warning">Terlambat & Pulang</Badge>
                            ) : (
                              <Badge color="success">Lengkap</Badge>
                            );
                          } else if (hasMasuk) {
                            statusBadge = isTerlambat ? (
                              <Badge color="warning">Terlambat</Badge>
                            ) : (
                              <Badge color="primary">Presensi Masuk</Badge>
                            );
                          } else if (hasPulang) {
                            statusBadge = <Badge color="info">Presensi Pulang</Badge>;
                          }
                        }

                        const fotoUrl = getFotoUrl(item.foto, "");

                        return (
                          <TableRow key={item.ptk_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-start whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <Avatar src={fotoUrl} size="small" />
                                <span className="font-medium text-gray-800 dark:text-white/90">{item.nama}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{item.nuptk || "-"}</TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{item.jenis_ptk_id_str || "-"}</TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{formatTime(item.presensi?.jam_masuk || null)}</TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{formatTime(item.presensi?.jam_pulang || null)}</TableCell>
                            <TableCell className="px-5 py-3.5">{statusBadge}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination component matching student-data */}
                <div className="no-print">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Kelola Ketidakhadiran GTK */}
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

              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full lg:justify-end">
                <div className="relative max-w-sm w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon className="size-5" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Cari nama atau NUPTK..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

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
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                 <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                 </div>
                 <p className="text-gray-500 font-medium">Data GTK tidak ditemukan</p>
                 <p className="text-xs text-gray-400 mt-1">Tidak ada GTK yang sesuai kriteria.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto custom-scrollbar">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No.</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NUPTK</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Status Kehadiran</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Keterangan</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {paginatedData.map((item, index) => {
                        const statusMasuk = item.presensi?.status_masuk;

                        let statusBadge = <Badge color="light">Belum Presensi</Badge>;
                        if (statusMasuk === 1) {
                          statusBadge = <Badge color="success">Hadir</Badge>;
                        } else if (statusMasuk === 2) {
                          statusBadge = <Badge color="warning">Terlambat</Badge>;
                        } else if (statusMasuk === 3) {
                          statusBadge = <Badge color="info">Izin</Badge>;
                        } else if (statusMasuk === 4) {
                          statusBadge = <Badge color="warning">Sakit</Badge>;
                        } else if (statusMasuk === 5) {
                          statusBadge = <Badge color="error">Alpha</Badge>;
                        }

                        const fotoUrl = getFotoUrl(item.foto, "");

                        return (
                          <TableRow key={item.ptk_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-start whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <Avatar src={fotoUrl} size="small" />
                                <span className="font-medium text-gray-800 dark:text-white/90">{item.nama}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{item.nuptk || "-"}</TableCell>
                            <TableCell className="px-5 py-3.5">{statusBadge}</TableCell>
                             <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                               <div className="max-w-[200px] truncate" title={item.izin?.keterangan || "-"}>
                                 {item.izin?.keterangan || "-"}
                               </div>
                             </TableCell>
                            <TableCell className="px-5 py-3.5">
                              <Button
                                size="sm"
                                variant="primary-outline"
                                onClick={() => openAbsentModal(item)}
                              >
                                Atur Status
                              </Button>
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
            )}
          </>
        )}
      </ComponentCard>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-md p-6">
        <div className="flex flex-col gap-4">
          <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Atur Ketidakhadiran GTK
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Atur status ketidakhadiran untuk <span className="font-medium text-gray-800 dark:text-white/90">{selectedGtk?.nama}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Status Ketidakhadiran
              </label>
              <Select
                options={[
                  { value: "7", label: "Hadir" },
                  { value: "4", label: "Izin" },
                  { value: "5", label: "Sakit" },
                  { value: "6", label: "Alpha" },
                ]}
                defaultValue={absentStatus}
                onChange={(val) => setAbsentStatus(val as "4" | "5" | "6" | "7")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Keterangan (Opsional)
              </label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Masukkan alasan ketidakhadiran..."
                rows={3}
                className="w-full px-3 py-2 text-sm border rounded-xl border-gray-200 dark:border-gray-800 bg-transparent text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAbsent}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PresensiGTK;
