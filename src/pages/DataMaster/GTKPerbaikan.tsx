import { useState, useEffect } from "react";
import { formatDateTimeDMY } from "../../utils/formatDate";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { dapodikService } from "../../services/dapodikService";
import Swal from "sweetalert2";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon } from "../../icons";
import Pagination from "../../components/common/Pagination";

const keyLabels: any = {
  nama: 'Nama Lengkap',
  nik: 'NIK',
  no_kk: 'No. Kartu Keluarga',
  jenis_kelamin: 'Jenis Kelamin',
  tempat_lahir: 'Tempat Lahir',
  tanggal_lahir: 'Tanggal Lahir',
  agama_id: 'Agama',
  status_perkawinan: 'Status Perkawinan',
  nama_suami_istri: 'Nama Pasangan',
  pekerjaan_suami_istri: 'Pekerjaan Pasangan',
  nama_wajib_pajak: 'Nama Wajib Pajak',
  npwp: 'NPWP',
  alamat_jalan: 'Kampung/Jalan',
  rt: 'RT',
  rw: 'RW',
  nama_dusun: 'Dusun',
  provinsi: 'Provinsi',
  kabupaten_kota: 'Kabupaten/Kota',
  kecamatan: 'Kecamatan',
  desa_kelurahan: 'Desa/Kelurahan',
  kode_pos: 'Kode Pos',
  lintang: 'Lintang',
  bujur: 'Bujur',
  id_bank: 'Nama Bank',
  nama_kcp: 'Cabang Bank',
  rekening_bank: 'No. Rekening',
  rekening_atas_nama: 'Atas Nama Rekening',
  no_telepon_rumah: 'No. Telepon Rumah',
  no_hp: 'No. Handphone',
  no_wa: 'No. WhatsApp',
  id_telegram: 'ID Telegram'
};

export default function GTKPerbaikan() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [activeTab, setActiveTab] = useState("belum");

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rowsPerPageOptions = [
    { label: "10", value: "10" },
    { label: "25", value: "25" },
    { label: "50", value: "50" },
  ];

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await dapodikService.getPengajuanPerbaikan();
      // Filter only GTK tipe
      const filtered = (res || []).filter((item: any) => item.tipe === "GTK");
      setList(filtered);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Gagal mengambil daftar pengajuan perbaikan GTK", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filteredList = list.filter((item) => {
    if (activeTab === "belum") {
      if (item.status !== "PENDING") return false;
    } else {
      if (item.status !== "APPROVED" && item.status !== "REJECTED") return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nama = (item.nama || "").toLowerCase();
      if (!nama.includes(q)) return false;
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

  const handleApprove = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Setujui Perbaikan?",
      text: "Data GTK akan diperbarui sesuai data yang diajukan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10B981"
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await dapodikService.setujuiPengajuan(id);
      Swal.fire("Berhasil", "Pengajuan berhasil disetujui and data telah diperbarui.", "success");
      setIsModalOpen(false);
      fetchList();
    } catch (e: any) {
      Swal.fire("Error", e.response?.data?.message || "Gagal menyetujui pengajuan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (id: string) => {
    if (!alasanTolak) {
      Swal.fire("Info", "Silakan masukkan alasan penolakan.", "info");
      return;
    }

    setLoading(true);
    try {
      await dapodikService.tolakPengajuan(id, alasanTolak);
      Swal.fire("Berhasil", "Pengajuan berhasil ditolak.", "success");
      setIsModalOpen(false);
      setShowRejectInput(false);
      setAlasanTolak("");
      fetchList();
    } catch (e: any) {
      Swal.fire("Error", e.response?.data?.message || "Gagal menolak pengajuan", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
            Menunggu Persetujuan
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg">
            Disetujui
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg">
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <PageMeta
        title="Pengajuan Perbaikan GTK | SIMAK Admin Panel"
        description="Daftar Pengajuan Perbaikan Data Mandiri GTK"
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pengajuan Perbaikan Data GTK
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Verifikasi dan setujui perbaikan data mandiri yang diajukan oleh Guru dan Tenaga Kependidikan.
            </p>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 pb-px">
            <button
              onClick={() => {
                setActiveTab("belum");
                setSelectedItem(null);
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
                setSelectedItem(null);
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

          {/* Filters (Search & Rows Per Page) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-32">
              <Select
                options={rowsPerPageOptions}
                defaultValue={itemsPerPage.toString()}
                onChange={(value: string) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="relative max-w-xs w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="size-5" />
              </span>
              <Input
                type="text"
                placeholder="Cari Nama GTK..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama GTK</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Kolom yang Diperbaiki</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tanggal Pengajuan</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400 text-theme-sm">
                      {activeTab === "belum"
                        ? "Tidak ada pengajuan perbaikan data GTK yang belum diverifikasi."
                        : "Tidak ada pengajuan perbaikan data GTK yang sudah diverifikasi."}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((item, index) => {
                    const fields = Object.keys(item.perubahan || {}).map(k => keyLabels[k] || k).join(", ");
                    const resolvedNo = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">{resolvedNo}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{item.nama}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400 max-w-xs truncate">
                          <span title={fields}>{fields}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">{formatDateTimeDMY(new Date(item.created_at))}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm">
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsModalOpen(true);
                            }}
                            className="text-gray-500 hover:text-brand-500 transition-colors p-1"
                            title="Detail & Verifikasi"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page: number) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail & Verifikasi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setShowRejectInput(false);
          setAlasanTolak("");
        }}
        className="max-w-[750px] p-6"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/[0.05] pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Detail Perbaikan Data GTK</h3>
            <p className="text-xs text-gray-400 mt-1">Pemohon: <span className="font-semibold text-gray-600 dark:text-gray-300">{selectedItem?.nama}</span></p>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(false);
              setShowRejectInput(false);
              setAlasanTolak("");
            }}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-3 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-2">
            <div>Nama Field</div>
            <div>Data Sebelumnya</div>
            <div>Data yang Diajukan</div>
          </div>
          {selectedItem && Object.keys(selectedItem.perubahan || {})
            .filter((key) => key !== "provinsi" && key !== "kabupaten_kota")
            .map((key) => {
              const val = selectedItem.perubahan[key];
              let label = keyLabels[key] || key;
              
              let displaySebelumnya = val.sebelumnya !== null && val.sebelumnya !== undefined ? String(val.sebelumnya) : "-";
              let displayDiajukan = val.diajukan_nama || (val.diajukan !== null && val.diajukan !== undefined ? String(val.diajukan) : "-");
              
              if (key === "status_perkawinan") {
                const mapStatus = (v: any) => {
                  const s = String(v || "");
                  if (s === "1") return "Kawin";
                  if (s === "2") return "Belum Kawin";
                  if (s === "3") return "Janda/Duda";
                  return s || "-";
                };
                displaySebelumnya = mapStatus(val.sebelumnya);
                displayDiajukan = mapStatus(val.diajukan);
              }
              
              if (key === "kecamatan") {
                const prevKab = selectedItem.perubahan["kabupaten_kota"]?.sebelumnya;
                if (prevKab && !String(val.sebelumnya).includes("Kab.")) {
                  const kecPart = String(val.sebelumnya).startsWith("Kec.") ? val.sebelumnya : `Kec. ${val.sebelumnya}`;
                  const kabPart = String(prevKab).startsWith("Kab.") ? prevKab : `Kab. ${prevKab}`;
                  displaySebelumnya = `${kecPart} - ${kabPart}`;
                } else {
                  displaySebelumnya = val.sebelumnya || "-";
                }
              }

              return (
                <div key={key} className="grid grid-cols-3 gap-4 items-center border-b border-gray-50 dark:border-white/[0.01] pb-3 text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">{label}</div>
                  <div className="p-2.5 bg-gray-50 dark:bg-white/[0.01] rounded-lg text-gray-500 break-words">{displaySebelumnya}</div>
                  <div className="p-2.5 bg-brand-50/30 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10 rounded-lg text-brand-700 dark:text-brand-400 font-semibold break-words">{displayDiajukan}</div>
                </div>
              );
            })}
        </div>

        {selectedItem && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Status Pengajuan:</span>
              {getStatusBadge(selectedItem.status)}
            </div>
            {selectedItem.status === "REJECTED" && (
              <div className="p-4 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <span className="block text-xs font-bold text-rose-700 dark:text-rose-400 uppercase mb-1">
                  Catatan Penolakan
                </span>
                <span className="text-sm text-rose-600 dark:text-rose-400">{selectedItem.alasan_tolak || "-"}</span>
              </div>
            )}
          </div>
        )}

        {/* Verification Actions */}
        <div className="mt-6 border-t border-gray-100 dark:border-white/[0.05] pt-4">
          {selectedItem?.status !== "PENDING" ? (
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setIsModalOpen(false);
                  setShowRejectInput(false);
                  setAlasanTolak("");
                }}
              >
                Tutup
              </Button>
            </div>
          ) : !showRejectInput ? (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setShowRejectInput(false);
                  setAlasanTolak("");
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Batal
              </button>
              <Button
                variant="error-outline"
                onClick={() => setShowRejectInput(true)}
                disabled={loading}
              >
                Tolak Pengajuan
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApprove(selectedItem.id)}
                disabled={loading}
              >
                Setujui & Perbarui Data
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
                  placeholder="Masukkan alasan menolak pengajuan perbaikan data..."
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
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="error"
                  onClick={() => handleRejectSubmit(selectedItem.id)}
                  disabled={loading}
                >
                  Kirim Penolakan
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
