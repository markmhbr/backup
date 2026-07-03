import React, { useState, useEffect, useCallback } from "react";
import { formatDateDMY } from "../../utils/formatDate";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { useSekolah } from "../../context/SekolahContext";
import { dapodikService } from "../../services/dapodikService";
import { layananMandalaService, LayananMaster, PermohonanLayanan } from "../../services/layananMandalaService";
import { Modal } from "../../components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Pagination from "../../components/common/Pagination";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Badge from "../../components/ui/badge/Badge";
import Avatar from "../../components/ui/avatar/Avatar";
import { getFotoUrl } from "../../utils/image";
import { SearchIcon, PlusIcon, BoltIcon } from "../../icons";
import Swal from "sweetalert2";

export default function LayananMandala() {
  const { sekolah } = useSekolah();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "gtk"; // "gtk" or "pesertadidik"

  const [loading, setLoading] = useState(true);
  const [permohonanList, setPermohonanList] = useState<PermohonanLayanan[]>([]);
  const [masterLayanan, setMasterLayanan] = useState<LayananMaster[]>([]);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPermohonan, setSelectedPermohonan] = useState<PermohonanLayanan | null>(null);
  const [uploadingSyaratId, setUploadingSyaratId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false);

  // Form New Request
  const [newForm, setNewForm] = useState({
    layanan_id: "",
    ptk_id: "",
    rombongan_belajar_id: "",
    peserta_didik_id: "",
    keterangan: "",
  });

  // Data for Selects
  const [gtkList, setGtkList] = useState<any[]>([]);
  const [rombelList, setRombelList] = useState<any[]>([]);
  const [pdList, setPdList] = useState<any[]>([]);
  const [pdSearch, setPdSearch] = useState("");
  const [gtkSearch, setGtkSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!sekolah?.sekolah_id) return;
    setLoading(true);
    try {
      const kategori = tabParam === "gtk" ? 0 : 1;
      const [masterRes, permohonanRes] = await Promise.all([
        dapodikService.getMasterLayanan(kategori),
        layananMandalaService.getPermohonan({ 
          sekolah_id: sekolah.sekolah_id,
          kategori: kategori 
        }),
      ]);

      setMasterLayanan(masterRes.data || []);
      setPermohonanList(permohonanRes.data || []);
    } catch (err) {
      console.error("Gagal memuat data layanan:", err);
    } finally {
      setLoading(false);
    }
  }, [sekolah?.sekolah_id, tabParam]);

  const fetchDapodikData = useCallback(async () => {
    try {
      if (tabParam === "gtk") {
        const res = await dapodikService.getGTK(100, "", 1, undefined, "aktif");
        setGtkList(res.data || []);
      } else {
        const res = await dapodikService.getRombonganBelajar("reguler", 100);
        setRombelList(res.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat data dapodik:", err);
    }
  }, [tabParam]);

  const fetchPdByRombel = useCallback(async (rombelId: string) => {
    if (!rombelId) {
      setPdList([]);
      return;
    }
    try {
      const res = await dapodikService.getRombelAnggota(rombelId);
      setPdList(res.data || []);
    } catch (err) {
      console.error("Gagal memuat anggota rombel:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isNewModalOpen) {
      fetchDapodikData();
    }
  }, [isNewModalOpen, fetchDapodikData]);

  useEffect(() => {
    if (newForm.rombongan_belajar_id) {
      fetchPdByRombel(newForm.rombongan_belajar_id);
    }
  }, [newForm.rombongan_belajar_id, fetchPdByRombel]);

  const getFileUrl = (url: string) => {
    if (!url) return "#";
    const baseUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
      : 'http://localhost:3000';
    return `${baseUrl}${url}`;
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, syaratId: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPermohonan) return;

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      Swal.fire("Format Tidak Valid", "Gunakan PDF atau Gambar (JPG, PNG, WebP).", "error");
      return;
    }

    if (fileExt === '.pdf' && file.size > 5 * 1024 * 1024) {
      Swal.fire("Ukuran Berlebih", "Maksimum ukuran file PDF adalah 5 MB.", "error");
      return;
    } else if (file.size > 2 * 1024 * 1024 && fileExt !== '.pdf') {
      Swal.fire("Ukuran Berlebih", "Maksimum ukuran file gambar adalah 2 MB.", "error");
      return;
    }

    setUploadingSyaratId(syaratId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("layanan_syarat_id", syaratId);
    formData.append("jenis_file", "1"); // 1 = Dokumen Persyaratan

    try {
      await layananMandalaService.uploadFile(
        selectedPermohonan.permohonan_layanan_id,
        formData
      );
      Swal.fire("Berhasil", "Dokumen berhasil diunggah.", "success");
      
      // Refresh list
      const kategori = tabParam === "gtk" ? 0 : 1;
      const permohonanRes = await layananMandalaService.getPermohonan({ 
        sekolah_id: sekolah?.sekolah_id,
        kategori: kategori 
      });
      setPermohonanList(permohonanRes.data || []);
      
      // Update selectedPermohonan details
      const updatedPermohonan = (permohonanRes.data || []).find(
        (p: any) => p.permohonan_layanan_id === selectedPermohonan.permohonan_layanan_id
      );
      if (updatedPermohonan) {
        setSelectedPermohonan(updatedPermohonan);
      }
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || "Gagal mengunggah berkas.", "error");
    } finally {
      setUploadingSyaratId(null);
    }
  };

  const handleUploadCoverLetter = async (file: File) => {
    if (!selectedPermohonan) return;

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      Swal.fire("Format Tidak Valid", "Gunakan PDF atau Gambar (JPG, PNG, WebP).", "error");
      return;
    }

    if (fileExt === '.pdf' && file.size > 5 * 1024 * 1024) {
      Swal.fire("Ukuran Berlebih", "Maksimum ukuran file PDF adalah 5 MB.", "error");
      return;
    } else if (file.size > 2 * 1024 * 1024 && fileExt !== '.pdf') {
      Swal.fire("Ukuran Berlebih", "Maksimum ukuran file gambar adalah 2 MB.", "error");
      return;
    }

    setUploadingCoverLetter(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("jenis_file", "0"); // 0 = Surat Permohonan Awal
    formData.append("nama_file", "Surat Permohonan Awal");

    try {
      await layananMandalaService.uploadFile(
        selectedPermohonan.permohonan_layanan_id,
        formData
      );
      Swal.fire("Berhasil", "Surat permohonan berhasil diunggah.", "success");
      
      // Refresh list
      const kategori = tabParam === "gtk" ? 0 : 1;
      const permohonanRes = await layananMandalaService.getPermohonan({ 
        sekolah_id: sekolah?.sekolah_id,
        kategori: kategori 
      });
      setPermohonanList(permohonanRes.data || []);
      
      // Update selectedPermohonan details
      const updatedPermohonan = (permohonanRes.data || []).find(
        (p: any) => p.permohonan_layanan_id === selectedPermohonan.permohonan_layanan_id
      );
      if (updatedPermohonan) {
        setSelectedPermohonan(updatedPermohonan);
      }
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || "Gagal mengunggah berkas.", "error");
    } finally {
      setUploadingCoverLetter(false);
    }
  };

  const handleCreatePermohonan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolah?.sekolah_id || !newForm.layanan_id) return;
    if (!selectedFile) {
      Swal.fire("Berkas Wajib", "Silakan unggah Surat Permohonan Awal terlebih dahulu.", "warning");
      return;
    }

    try {
      Swal.fire({
        title: "Memproses...",
        text: "Mengajukan permohonan layanan...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await layananMandalaService.createPermohonan({
        layanan_id: newForm.layanan_id,
        sekolah_id: sekolah.sekolah_id,
        kategori: tabParam === "gtk" ? 0 : 1,
        ptk_id: tabParam === "gtk" ? newForm.ptk_id : undefined,
        peserta_didik_id: tabParam === "pesertadidik" ? newForm.peserta_didik_id : undefined,
        keterangan: newForm.keterangan,
      });

      const newPermohonanId = res.data?.permohonan_layanan_id;
      if (!newPermohonanId) {
        throw new Error("Gagal mendapatkan ID permohonan.");
      }

      // Now upload the cover letter
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("jenis_file", "0"); // 0 = Surat Permohonan Awal
      formData.append("nama_file", "Surat Permohonan Awal");

      await layananMandalaService.uploadFile(newPermohonanId, formData);

      Swal.fire("Berhasil", "Permohonan layanan berhasil diajukan beserta berkas.", "success");
      setIsNewModalOpen(false);
      setNewForm({ layanan_id: "", ptk_id: "", rombongan_belajar_id: "", peserta_didik_id: "", keterangan: "" });
      setSelectedFile(null);
      setPdSearch("");
      setGtkSearch("");
      fetchData();
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || error.message || "Terjadi kesalahan.", "error");
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return <Badge color="light">Diajukan</Badge>;
      case 2: return <Badge color="info">Diverifikasi Staff</Badge>;
      case 3: return <Badge color="warning">Menunggu Perbaikan</Badge>;
      case 4: return <Badge color="info">Menunggu Kasubag</Badge>;
      case 5: return <Badge color="success">Disetujui / Selesai</Badge>;
      case 6: return <Badge color="error">Ditolak</Badge>;
      default: return <Badge color="light">Draft</Badge>;
    }
  };

  const filteredData = permohonanList.filter((item) => {
    const nameMatch = 
      item.ptk?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.peserta_didik?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.layanan?.nama_layanan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nomor_permohonan?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const filteredPd = pdList.filter(pd => 
    pd.nama?.toLowerCase().includes(pdSearch.toLowerCase()) ||
    pd.nisn?.includes(pdSearch)
  );

  const filteredGtk = gtkList.filter(gtk => 
    gtk.nama?.toLowerCase().includes(gtkSearch.toLowerCase()) ||
    gtk.nuptk?.includes(gtkSearch) ||
    gtk.nip?.includes(gtkSearch)
  );

  if (selectedPermohonan) {
    const coverLetterFile = selectedPermohonan.permohonan_layanan_file?.find(
      (f: any) => f.jenis_file === 0
    );

    return (
      <>
        <PageMeta
          title={`Detail Permohonan Layanan | SIMAK`}
          description="Portal Layanan Terpadu Mandala"
        />

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
            <div>
              <button 
                onClick={() => setSelectedPermohonan(null)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white mb-2 transition"
              >
                ← Kembali ke Daftar
              </button>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Detail Permohonan: {selectedPermohonan.nomor_permohonan}
              </h3>
            </div>
            <div>{getStatusBadge(selectedPermohonan.status)}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <ComponentCard title="Informasi Permohonan">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Jenis Layanan</span>
                    <p className="text-sm font-bold text-gray-800 dark:text-white/90">{selectedPermohonan.layanan?.nama_layanan}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Tanggal Pengajuan</span>
                    <p className="text-sm font-medium">{formatDateDMY(selectedPermohonan.tanggal_pengajuan || selectedPermohonan.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Pemohon</span>
                    <p className="text-sm font-medium">{selectedPermohonan.ptk?.nama || selectedPermohonan.peserta_didik?.nama || "Umum"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase">ID / NISN</span>
                    <p className="text-sm font-medium">{selectedPermohonan.ptk?.nuptk || selectedPermohonan.peserta_didik?.nisn || "-"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Keterangan Pemohon</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedPermohonan.keterangan || "-"}</p>
                  </div>
                </div>
              </ComponentCard>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <ComponentCard title="Surat Permohonan Awal">
                <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      Surat Permohonan Awal <span className="text-red-500">*</span>
                    </span>
                    <div>
                      {coverLetterFile ? (
                        <Badge color={coverLetterFile.status === 1 ? "success" : coverLetterFile.status === 2 ? "error" : "light"}>
                          {coverLetterFile.status === 1 ? "Valid" : coverLetterFile.status === 2 ? "Revisi" : "Menunggu Verifikasi"}
                        </Badge>
                      ) : (
                        <Badge color="warning">Belum Upload</Badge>
                      )}
                    </div>
                  </div>

                  {coverLetterFile && (
                    <div className="flex flex-col gap-1.5 mb-4 bg-white dark:bg-white/[0.02] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 truncate max-w-[300px]">{coverLetterFile.nama_file}</span>
                        <a 
                          href={getFileUrl(coverLetterFile.file_url)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-brand-500 hover:underline font-bold"
                        >
                          Lihat Dokumen
                        </a>
                      </div>
                      {coverLetterFile.status === 2 && coverLetterFile.catatan && (
                        <div className="text-xxs text-red-500 mt-2 bg-red-50/50 dark:bg-red-500/5 p-2 rounded border border-red-100 dark:border-red-900/30">
                          <strong>Catatan Revisi:</strong> {coverLetterFile.catatan}
                        </div>
                      )}
                    </div>
                  )}

                  {(!coverLetterFile || coverLetterFile.status === 2 || coverLetterFile.status === 0) && (
                    <div className="flex justify-end">
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadCoverLetter(file);
                          }}
                          disabled={uploadingCoverLetter}
                        />
                        <span className={`inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition ${uploadingCoverLetter ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {uploadingCoverLetter ? 'Mengunggah...' : coverLetterFile ? 'Ganti File' : 'Upload File'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </ComponentCard>

              <ComponentCard title="Dokumen Syarat">
                <div className="space-y-4">
                  {selectedPermohonan.layanan?.syarat?.map((s) => {
                    const fileObj = selectedPermohonan.permohonan_layanan_file?.find(
                      (f: any) => f.layanan_syarat_id === s.layanan_syarat_id
                    );

                    return (
                      <div key={s.layanan_syarat_id} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BoltIcon className="size-4 text-brand-500" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                              {s.nama_syarat} {s.wajib && <span className="text-red-500">*</span>}
                            </span>
                          </div>
                          <div>
                            {fileObj ? (
                              <Badge color={fileObj.status === 1 ? "success" : fileObj.status === 2 ? "error" : "light"}>
                                {fileObj.status === 1 ? "Valid" : fileObj.status === 2 ? "Revisi" : "Menunggu Verifikasi"}
                              </Badge>
                            ) : (
                              <Badge color="warning">Belum Upload</Badge>
                            )}
                          </div>
                        </div>

                        {fileObj && (
                          <div className="flex flex-col gap-1.5 bg-white dark:bg-white/[0.02] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 truncate max-w-[300px]">{fileObj.nama_file}</span>
                              <a 
                                href={getFileUrl(fileObj.file_url)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-brand-500 hover:underline font-bold"
                              >
                                Lihat Dokumen
                              </a>
                            </div>
                            {fileObj.status === 2 && fileObj.catatan && (
                              <div className="text-xxs text-red-500 mt-2 bg-red-50/50 dark:bg-red-500/5 p-2.5 rounded border border-red-100 dark:border-red-900/30">
                                <strong>Catatan Revisi:</strong> {fileObj.catatan}
                              </div>
                            )}
                          </div>
                        )}

                        {(!fileObj || fileObj.status === 2 || fileObj.status === 0) && (
                          <div className="flex justify-end">
                            <label className="relative cursor-pointer">
                              <input
                                type="file"
                                className="sr-only"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={(e) => handleUploadFile(e, s.layanan_syarat_id)}
                                disabled={uploadingSyaratId === s.layanan_syarat_id}
                              />
                              <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition ${uploadingSyaratId === s.layanan_syarat_id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploadingSyaratId === s.layanan_syarat_id ? 'Mengunggah...' : fileObj ? 'Ganti File' : 'Upload File'}
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!selectedPermohonan.layanan?.syarat || selectedPermohonan.layanan.syarat.length === 0) && (
                    <p className="text-center text-xs text-gray-400 italic py-4">Tidak ada persyaratan tambahan untuk layanan ini.</p>
                  )}
                </div>
              </ComponentCard>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`Layanan Mandala ${tabParam === "gtk" ? "GTK" : "Peserta Didik"} | SIMAK`}
        description="Portal Layanan Terpadu Mandala"
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Layanan Mandala {tabParam === "gtk" ? "GTK" : "Peserta Didik"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajukan dan pantau layanan administrasi terpadu Mandala secara online.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            startIcon={<PlusIcon className="size-4 fill-current" />}
          >
            Buat Permohonan
          </Button>
        </div>

        <ComponentCard title={`Riwayat Permohonan Layanan ${tabParam === "gtk" ? "GTK" : "Peserta Didik"}`}>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
            <div className="w-20">
              <Select
                options={rowsPerPageOptions}
                defaultValue={itemsPerPage.toString()}
                onChange={(value) => setItemsPerPage(parseInt(value))}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm w-full lg:justify-end">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon className="size-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Cari permohonan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
              <p className="text-gray-400 italic text-sm">Tidak ada riwayat permohonan ditemukan</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nomor & Tanggal</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Pemohon</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Jenis Layanan</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {paginatedData.map((item) => {
                      const subject = tabParam === "gtk" ? item.ptk : item.peserta_didik;
                      return (
                        <TableRow key={item.permohonan_layanan_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                          <TableCell className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 dark:text-white/90">{item.nomor_permohonan}</span>
                              <span className="text-xs text-gray-500">{formatDateDMY(item.tanggal_pengajuan || item.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar src={getFotoUrl(subject?.foto)} size="small" />
                              <div>
                                <span className="font-semibold text-gray-800 dark:text-white/90">{subject?.nama || "Umum"}</span>
                                <p className="text-xxs text-gray-400 font-medium">
                                  {tabParam === "gtk" ? subject?.nuptk || "Pegawai" : subject?.nisn || "Peserta Didik"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/85">
                            {item.layanan?.nama_layanan}
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-center">{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => {
                                setSelectedPermohonan(item);
                              }}
                              className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition"
                            >
                              Detail
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Modal: Permohonan Baru */}
      <Modal isOpen={isNewModalOpen} onClose={() => { setIsNewModalOpen(false); setSelectedFile(null); }} className="max-w-[600px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Ajukan Permohonan Layanan</h3>
        <form onSubmit={handleCreatePermohonan} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Pilih Layanan</label>
            <select
              value={newForm.layanan_id}
              onChange={(e) => setNewForm({ ...newForm, layanan_id: e.target.value })}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              required
            >
              <option value="">-- Pilih Layanan Mandala --</option>
              {masterLayanan.map((l) => (
                <option key={l.layanan_id} value={l.layanan_id}>{l.nama_layanan}</option>
              ))}
            </select>
          </div>

          {tabParam === "gtk" ? (
            <div className="space-y-3 animate-fade-in">
              <label className="block text-sm font-semibold mb-1">Cari & Pilih GTK (Pemohon)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon className="size-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari nama, NIP, atau NUPTK..."
                  value={gtkSearch}
                  onChange={(e) => setGtkSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                />
              </div>
              <div className="max-h-[250px] overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                {filteredGtk.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400 italic">GTK tidak ditemukan</div>
                ) : (
                  filteredGtk.map((gtk) => (
                    <div
                      key={gtk.ptk_id}
                      onClick={() => setNewForm({ ...newForm, ptk_id: gtk.ptk_id })}
                      className={`flex items-center justify-between p-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/[0.02] ${newForm.ptk_id === gtk.ptk_id ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={getFotoUrl(gtk.foto)} size="small" />
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{gtk.nama}</p>
                          <p className="text-xxs text-gray-400 font-medium">
                            {gtk.nuptk ? `NUPTK: ${gtk.nuptk}` : gtk.nip ? `NIP: ${gtk.nip}` : 'NUPTK/NIP tidak tersedia'}
                          </p>
                        </div>
                      </div>
                      {newForm.ptk_id === gtk.ptk_id && (
                        <span className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px]">✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>
              {/* Hidden required field for form validation */}
              <input type="hidden" value={newForm.ptk_id} required />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Pilih Rombongan Belajar (Kelas)</label>
                <select
                  value={newForm.rombongan_belajar_id}
                  onChange={(e) => setNewForm({ ...newForm, rombongan_belajar_id: e.target.value, peserta_didik_id: "" })}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  required
                >
                  <option value="">-- Pilih Rombel --</option>
                  {rombelList.map((r) => <option key={r.rombongan_belajar_id} value={r.rombongan_belajar_id}>{r.nama}</option>)}
                </select>
              </div>

              {newForm.rombongan_belajar_id && (
                <div className="space-y-3 animate-fade-in">
                  <label className="block text-sm font-semibold mb-1">Cari & Pilih Peserta Didik</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <SearchIcon className="size-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Cari nama atau NISN..."
                      value={pdSearch}
                      onChange={(e) => setPdSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredPd.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400 italic">Peserta didik tidak ditemukan</div>
                    ) : (
                      filteredPd.map((pd) => (
                        <div
                          key={pd.peserta_didik_id}
                          onClick={() => setNewForm({ ...newForm, peserta_didik_id: pd.peserta_didik_id })}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/[0.02] ${newForm.peserta_didik_id === pd.peserta_didik_id ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar src={getFotoUrl(pd.foto)} size="small" />
                            <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-white">{pd.nama}</p>
                              <p className="text-xxs text-gray-400 font-medium">NISN: {pd.nisn}</p>
                            </div>
                          </div>
                          {newForm.peserta_didik_id === pd.peserta_didik_id && (
                            <span className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px]">✓</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {/* Hidden required field for form validation */}
                  <input type="hidden" value={newForm.peserta_didik_id} required />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Keterangan / Alasan Pengajuan</label>
            <textarea
              rows={3}
              value={newForm.keterangan}
              onChange={(e) => setNewForm({ ...newForm, keterangan: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              placeholder="Jelaskan kebutuhan layanan ini..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Upload Berkas / Surat Permohonan Awal <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
              }}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              required
            />
            <p className="text-xxs text-gray-400 mt-1">Format: PDF atau Gambar (JPG, PNG, WebP) maks. 5MB untuk PDF, 2MB untuk gambar.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" size="sm" type="button" onClick={() => { setIsNewModalOpen(false); setSelectedFile(null); }}>Batal</Button>
            <Button variant="primary" size="sm" type="submit" disabled={(tabParam === "pesertadidik" && !newForm.peserta_didik_id) || (tabParam === "gtk" && !newForm.ptk_id)}>Kirim Permohonan</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal removed (now rendered inline) */}
    </>
  );
}
