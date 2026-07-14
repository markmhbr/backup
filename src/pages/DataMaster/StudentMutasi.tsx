import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { dapodikService } from "../../services/dapodikService";
import Swal from "sweetalert2";
import { EyeIcon, SearchIcon } from "../../icons";
import { getFotoUrl } from "../../utils/image";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Pagination from "../../components/common/Pagination";

export default function StudentMutasi() {
  const [loading, setLoading] = useState(false);
  const [mutasiList, setMutasiList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"belum" | "sudah">("belum");

  // Filters & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRombel, setSelectedRombel] = useState("all");
  const [selectedJenisKeluar, setSelectedJenisKeluar] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detail Modal States
  const [selectedMutasi, setSelectedMutasi] = useState<any | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchSekolahAndList = async () => {
    setLoading(true);
    try {
      const sch = await dapodikService.getSekolah();
      if (sch?.status === "success" && sch.data?.sekolah_id) {
        const res = await dapodikService.getMutasiPd(sch.data.sekolah_id);
        if (res?.status === "success" && res.data) {
          setMutasiList(res.data);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data mutasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSekolahAndList();
  }, []);

  // Dynamically extract unique Rombel and Jenis Keluar values
  const rombelOptions = [
    { value: "all", label: "Semua Rombel" },
    ...Array.from(
      new Set(
        mutasiList
          .map((item) => item.peserta_didik?.rombongan_belajar?.nama)
          .filter(Boolean)
      )
    )
      .sort()
      .map((name) => ({ value: name, label: name }))
  ];

  const jenisKeluarOptions = [
    { value: "all", label: "Semua Jenis Keluar" },
    ...Array.from(
      new Set(
        mutasiList
          .map((item) => item.jenis_keluar?.ket_keluar)
          .filter(Boolean)
      )
    )
      .sort()
      .map((ket) => ({ value: ket, label: ket }))
  ];

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "20", label: "20" },
    { value: "50", label: "50" },
    { value: "100", label: "100" }
  ];

  const handleApprove = async (id: string, namaSiswa: string) => {
    const confirm = await Swal.fire({
      title: "Setujui Pengajuan Mutasi?",
      text: `Apakah Anda yakin ingin menyetujui pengajuan mutasi untuk ${namaSiswa}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10B981"
    });

    if (!confirm.isConfirmed) return;

    try {
      setProcessing(true);
      Swal.fire({
        title: "Memproses...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      await dapodikService.approveMutasiPd(id);
      Swal.close();
      setSelectedMutasi(null); // Close modal
      Swal.fire({
        title: "Berhasil!",
        text: "Pengajuan mutasi telah disetujui.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end"
      });
      fetchSekolahAndList();
    } catch (e: any) {
      Swal.close();
      Swal.fire("Error", e.response?.data?.message || "Gagal menyetujui pengajuan mutasi", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (id: string) => {
    if (!alasanTolak) {
      Swal.fire("Info", "Silakan masukkan alasan penolakan.", "info");
      return;
    }

    try {
      setProcessing(true);
      Swal.fire({
        title: "Memproses...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      await dapodikService.rejectMutasiPd(id, alasanTolak);
      Swal.close();
      setSelectedMutasi(null); // Close modal
      setShowRejectInput(false);
      setAlasanTolak("");
      Swal.fire({
        title: "Ditolak!",
        text: "Pengajuan mutasi berhasil ditolak.",
        icon: "warning",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end"
      });
      fetchSekolahAndList();
    } catch (e: any) {
      Swal.close();
      Swal.fire("Error", e.response?.data?.message || "Gagal menolak pengajuan mutasi", "error");
    } finally {
      setProcessing(false);
    }
  };

  const getFileUrl = (url: string) => {
    if (!url) return "#";
    const baseUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
      : (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
    return `${baseUrl}${url}`;
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
            Menunggu Persetujuan
          </span>
        );
      case 1:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg">
            Disetujui
          </span>
        );
      case 2:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg">
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  const filteredList = mutasiList.filter((item) => {
    if (activeTab === "belum") {
      if (item.status !== 0) return false;
    } else {
      if (item.status !== 1 && item.status !== 2) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nama = (item.peserta_didik?.nama || "").toLowerCase();
      const nisn = (item.peserta_didik?.nisn || "").toLowerCase();
      if (!nama.includes(q) && !nisn.includes(q)) return false;
    }

    if (selectedRombel !== "all") {
      const rombel = item.peserta_didik?.rombongan_belajar?.nama || "";
      if (rombel !== selectedRombel) return false;
    }

    if (selectedJenisKeluar !== "all") {
      const jenis = item.jenis_keluar?.ket_keluar || "";
      if (jenis !== selectedJenisKeluar) return false;
    }

    return true;
  });

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <PageMeta
        title="Pengajuan Mutasi Siswa | SIMAK Admin Panel"
        description="Verifikasi Pengajuan Mutasi dan Registrasi Keluar PD"
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pengajuan Mutasi Siswa (PD Keluar)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Verifikasi pengajuan registrasi keluar, pindah sekolah, atau kelulusan siswa.
            </p>
          </div>
        </div>

        {/* List Container */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => {
                setActiveTab("belum");
                setSelectedMutasi(null);
                setCurrentPage(1);
              }}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all mr-6 ${
                activeTab === "belum"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              Belum Diverifikasi
            </button>
            <button
              onClick={() => {
                setActiveTab("sudah");
                setSelectedMutasi(null);
                setCurrentPage(1);
              }}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "sudah"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              Sudah Diverifikasi
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl w-full lg:justify-end">
              <div className="relative max-w-xs w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon className="size-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Cari Nama atau NISN..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  options={rombelOptions}
                  defaultValue={selectedRombel}
                  onChange={(value) => {
                    setSelectedRombel(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  options={jenisKeluarOptions}
                  defaultValue={selectedJenisKeluar}
                  onChange={(value) => {
                    setSelectedJenisKeluar(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 text-center py-8">Memuat data pengajuan mutasi...</p>
          ) : currentItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Tidak ada pengajuan mutasi ditemukan.</p>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama Siswa</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Rombel</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jenis Keluar</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {currentItems.map((item, idx) => (
                      <TableRow key={item.mutasi_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm font-semibold text-gray-800 dark:text-white/90">
                          {item.peserta_didik?.nama}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {item.peserta_didik?.rombongan_belajar?.nama || "-"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {item.jenis_keluar?.ket_keluar}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm">{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="px-5 py-4 text-sm text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMutasi(item);
                              setShowRejectInput(false);
                              setAlasanTolak("");
                            }}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-brand-500 hover:border-brand-300 dark:hover:text-brand-400 transition-colors inline-flex justify-center items-center"
                          >
                            <EyeIcon className="size-4 fill-current" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!loading && totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Pengajuan Mutasi */}
      <Modal
        isOpen={!!selectedMutasi}
        onClose={() => {
          setSelectedMutasi(null);
          setShowRejectInput(false);
          setAlasanTolak("");
        }}
        className="max-w-[700px] w-full p-6 flex flex-col max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-5">
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            Detail Pengajuan Mutasi / Keluar
          </h4>
          <button
            onClick={() => {
              setSelectedMutasi(null);
              setShowRejectInput(false);
              setAlasanTolak("");
            }}
            className="text-gray-400 hover:text-gray-500 font-bold"
          >
            ✕
          </button>
        </div>

        {selectedMutasi && (
          <div className="space-y-6">
            {/* Profile Section: Photo Left, Meta Right */}
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex-shrink-0">
                <img
                  src={getFotoUrl(selectedMutasi.peserta_didik?.foto)}
                  alt={selectedMutasi.peserta_didik?.nama}
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-sm bg-gray-50 dark:bg-gray-800 ring-4 ring-gray-100 dark:ring-gray-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              </div>
              <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Nama Siswa</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{selectedMutasi.peserta_didik?.nama}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">NISN</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{selectedMutasi.peserta_didik?.nisn || "-"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Rombongan Belajar</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{selectedMutasi.peserta_didik?.rombongan_belajar?.nama || "-"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Jenis Keluar</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{selectedMutasi.jenis_keluar?.ket_keluar}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Pengirim Pengajuan</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">{selectedMutasi.ptk?.nama || "Sistem / Operator"}</span>
                </div>
              </div>
            </div>

            {/* Mutasi details */}
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Alasan Keluar</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 block bg-gray-50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  {selectedMutasi.alasan || "-"}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-400 uppercase mb-1">Status Pengajuan</span>
                <div className="mt-1">{getStatusBadge(selectedMutasi.status)}</div>
              </div>
              {selectedMutasi.status === 2 && (
                <div>
                  <span className="block text-xs font-semibold text-rose-500 uppercase mb-1.5">Catatan Penolakan</span>
                  <span className="text-sm text-rose-600 dark:text-rose-400 block bg-rose-50/50 dark:bg-rose-500/5 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    {selectedMutasi.alasan_tolak || "-"}
                  </span>
                </div>
              )}
            </div>

            {/* Dokumen Bukti Section (Clean Button, No iframe) */}
            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
              <span className="block text-xs font-semibold text-gray-400 uppercase mb-2">Dokumen Bukti</span>
              {selectedMutasi.bukti ? (
                <div>
                  <a
                    href={getFileUrl(selectedMutasi.bukti)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl transition-all border border-brand-200 dark:border-brand-800/30 hover:shadow-sm"
                  >
                    Buka / Lihat Dokumen Bukti (PDF)
                  </a>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Tidak ada dokumen bukti dilampirkan.</span>
              )}
            </div>

            {/* Verification Actions */}
            {selectedMutasi.status === 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
                {!showRejectInput ? (
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="error-outline"
                      onClick={() => setShowRejectInput(true)}
                      disabled={processing}
                    >
                      Tolak Pengajuan
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(selectedMutasi.mutasi_id, selectedMutasi.peserta_didik?.nama)}
                      disabled={processing}
                    >
                      Setujui Pengajuan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">
                        Alasan Penolakan
                      </label>
                      <textarea
                        value={alasanTolak}
                        onChange={(e) => setAlasanTolak(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[80px]"
                        placeholder="Masukkan alasan menolak pengajuan mutasi..."
                        required
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowRejectInput(false);
                          setAlasanTolak("");
                        }}
                        disabled={processing}
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        variant="error"
                        onClick={() => handleRejectSubmit(selectedMutasi.mutasi_id)}
                        disabled={processing}
                      >
                        Kirim Penolakan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
