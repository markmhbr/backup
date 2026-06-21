import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { useSekolah } from "../../context/SekolahContext";
import { indisiplinerService } from "../../services/indisiplinerService";
import { dapodikService } from "../../services/dapodikService";
import { presensiService } from "../../services/presensiService";
import QrScanner from "../Kurikulum/Presensi/components/QrScanner";
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
import { SearchIcon, PlusIcon } from "../../icons";
import Swal from "sweetalert2";
import { getFotoUrl } from "../../utils/image";

interface SchoolSummary {
  stats: {
    total_pelanggaran: number;
    total_pelanggaran_gtk: number;
    total_pelanggaran_siswa: number;
    master_jenis_pelanggaran: number;
    master_jenis_tindak_lanjut: number;
  };
  top_siswa: Array<{
    peserta_didik_id: string;
    nama: string;
    nisn: string;
    rombongan_belajar: string;
    foto: string | null;
    total_poin: number;
    total_pelanggaran: number;
  }>;
  top_gtk?: Array<{
    ptk_id: string;
    nama: string;
    nuptk: string;
    jabatan: string;
    foto: string | null;
    total_poin: number;
    total_pelanggaran: number;
  }>;
  top_pelanggaran_jenis: Array<{
    nama: string;
    target: number;
    count: number;
  }>;
}

export default function IndisiplinerData() {
  const { sekolah } = useSekolah();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "peserta-didik" | "gtk";

  const defaultTarget = tabParam === "peserta-didik" ? "pd" : tabParam === "gtk" ? "gtk" : "";

  const [activeTab, setActiveTab] = useState<"pelanggaran" | "konfigurasi" | "statistik">("pelanggaran");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SchoolSummary | null>(null);

  // Data lists
  const [pelanggaranList, setPelanggaranList] = useState<any[]>([]);
  const [jenisPelanggaranList, setJenisPelanggaranList] = useState<any[]>([]);
  const [jenisTindakLanjutList, setJenisTindakLanjutList] = useState<any[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTarget, setFilterTarget] = useState(defaultTarget); // "pd" = Peserta Didik, "gtk" = GTK
  const [filterStatus, setFilterStatus] = useState(""); // empty = all, 1 = Draft, etc.

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  // Modals visibility
  const [isJpModalOpen, setIsJpModalOpen] = useState(false);
  const [isJtlModalOpen, setIsJtlModalOpen] = useState(false);
  const [isPelanggaranModalOpen, setIsPelanggaranModalOpen] = useState(false);
  const [isTindakLanjutModalOpen, setIsTindakLanjutModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Selected entities for actions
  const [selectedPelanggaran, setSelectedPelanggaran] = useState<any | null>(null);

  // Form states
  const [jpForm, setJpForm] = useState({ nama: "", target: 1, poin: 10 });
  const [jtlForm, setJtlForm] = useState({ nama: "", target: 1 });
  
  // Create infraction form states
  const [barcode, setBarcode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  
  const [pelanggaranForm, setPelanggaranForm] = useState({
    jenis_pelanggaran_id: "",
    tanggal: new Date().toISOString().split("T")[0],
    waktu: new Date().toISOString().slice(0, 16),
    keterangan: "",
    status: 1,
    pelapor_ptk_id: "",
  });

  // Create follow-up form states
  const [tindakLanjutForm, setTindakLanjutForm] = useState({
    jenis_tindak_lanjut_id: "",
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "",
    petugas_ptk_id: "",
  });

  // Dynamic GTK list for Pelapor/Petugas
  const [gtkList, setGtkList] = useState<any[]>([]);

  // Subject Search/Select states for Indisipliner Modal
  const [rombels, setRombels] = useState<any[]>([]);
  const [selectedRombel, setSelectedRombel] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scannedSubjects, setScannedSubjects] = useState<Record<string, any>>({});
  const [studentSearchText, setStudentSearchText] = useState("");
  const [gtkSearchText, setGtkSearchText] = useState("");

  const fetchData = useCallback(async () => {
    if (!sekolah?.sekolah_id) return;
    setLoading(true);
    try {
      const [summaryRes, jpRes, jtlRes, pelanggaranRes, gtkRes] = await Promise.all([
        indisiplinerService.getSchoolSummary(sekolah.sekolah_id),
        indisiplinerService.getJenisPelanggaran(sekolah.sekolah_id),
        indisiplinerService.getJenisTindakLanjut(sekolah.sekolah_id),
        indisiplinerService.getPelanggaran(sekolah.sekolah_id),
        dapodikService.getGTK(100, "", 1, undefined, "aktif"),
      ]);

      setSummary(summaryRes.data);
      setJenisPelanggaranList(jpRes.data);
      setJenisTindakLanjutList(jtlRes.data);
      setPelanggaranList(pelanggaranRes.data);
      if (gtkRes && gtkRes.data) {
        setGtkList(gtkRes.data);
      }
    } catch (err) {
      console.error("Gagal memuat data indisipliner:", err);
    } finally {
      setLoading(false);
    }
  }, [sekolah?.sekolah_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setFilterTarget(defaultTarget);
  }, [defaultTarget]);

  // Fetch rombel list when modal opens and target is student (pd)
  useEffect(() => {
    const loadInitialModalData = async () => {
      if (!isPelanggaranModalOpen || !sekolah?.sekolah_id) return;
      if (defaultTarget === "pd" && rombels.length === 0) {
        try {
          const rombelRes = await dapodikService.getRombonganBelajar('reguler', 100);
          setRombels(rombelRes.data || []);
        } catch (err) {
          console.error("Failed to load rombel data:", err);
        }
      }
    };
    loadInitialModalData();
  }, [isPelanggaranModalOpen, sekolah?.sekolah_id, defaultTarget]);

  // Fetch students checklist when selected rombel changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedRombel || !isPelanggaranModalOpen) {
        setStudents([]);
        return;
      }
      try {
        const studentRes = await dapodikService.getPesertaDidik(100, '', 1, selectedRombel);
        setStudents(studentRes.data || []);
      } catch (err) {
        console.error("Failed to load students:", err);
      }
    };
    loadStudents();
    setSelectedIds([]); // Clear checked selection when class changes
  }, [selectedRombel, isPelanggaranModalOpen]);

  // Barcode / Qr Token lookup for offenders in violation modal
  const handleBarcodeLookup = async (tokenToLookup: string) => {
    if (!tokenToLookup.trim()) return;
    setLookupLoading(true);
    setLookupError(null);

    try {
      const response = await presensiService.lookupUser(tokenToLookup);
      if (response && response.data) {
        if (defaultTarget && response.type !== defaultTarget) {
          setLookupError(
            defaultTarget === "pd"
              ? "Pelaku harus merupakan Peserta Didik pada halaman ini."
              : "Pelaku harus merupakan GTK pada halaman ini."
          );
          return;
        }

        const id = response.type === 'pd' ? response.data.peserta_didik_id : response.data.ptk_id;
        const name = response.data.nama;

        // Add to scanned subjects lookup map to render name later
        setScannedSubjects(prev => ({ ...prev, [id]: response.data }));
        
        // Add to selected IDs
        setSelectedIds(prev => prev.includes(id) ? prev : [...prev, id]);

        Swal.fire({
          title: 'Terdeteksi!',
          text: `${response.type === 'pd' ? 'Peserta Didik' : 'GTK'}: ${name} berhasil ditambahkan ke daftar pelaku.`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        setBarcode("");
        setShowScanner(false);
      } else {
        setLookupError("Data pelaku dengan QR Token tersebut tidak ditemukan.");
      }
    } catch (err: any) {
      setLookupError(err.response?.data?.message || "Data QR Token tidak ditemukan");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreateJp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolah?.sekolah_id || !jpForm.nama.trim()) return;

    try {
      await indisiplinerService.createJenisPelanggaran({
        sekolah_id: sekolah.sekolah_id,
        nama: jpForm.nama,
        target: jpForm.target,
        poin: jpForm.poin,
      });
      Swal.fire("Berhasil", "Jenis pelanggaran berhasil ditambahkan.", "success");
      setJpForm({ nama: "", target: 1, poin: 10 });
      setIsJpModalOpen(false);
      fetchData();
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleCreateJtl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolah?.sekolah_id || !jtlForm.nama.trim()) return;

    try {
      await indisiplinerService.createJenisTindakLanjut({
        sekolah_id: sekolah.sekolah_id,
        nama: jtlForm.nama,
        target: jtlForm.target,
      });
      Swal.fire("Berhasil", "Jenis tindak lanjut berhasil ditambahkan.", "success");
      setJtlForm({ nama: "", target: 1 });
      setIsJtlModalOpen(false);
      fetchData();
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleCreatePelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTarget = defaultTarget || "pd";
    if (!sekolah?.sekolah_id || selectedIds.length === 0 || !pelanggaranForm.jenis_pelanggaran_id) {
      Swal.fire("Peringatan", "Harap tentukan pelaku dan jenis pelanggaran.", "warning");
      return;
    }

    try {
      const promises = selectedIds.map((id) => {
        const payload: any = {
          sekolah_id: sekolah.sekolah_id,
          jenis_pelanggaran_id: pelanggaranForm.jenis_pelanggaran_id,
          tanggal: pelanggaranForm.tanggal,
          waktu: new Date(pelanggaranForm.waktu).toISOString(),
          keterangan: pelanggaranForm.keterangan,
          status: Number(pelanggaranForm.status),
          pelapor_ptk_id: pelanggaranForm.pelapor_ptk_id || undefined,
        };

        if (effectiveTarget === "pd") {
          payload.peserta_didik_id = id;
        } else if (effectiveTarget === "gtk") {
          payload.ptk_id = id;
        }

        return indisiplinerService.createPelanggaran(payload);
      });

      await Promise.all(promises);
      Swal.fire("Berhasil", `Pelanggaran disiplin berhasil dicatat untuk ${selectedIds.length} pelaku.`, "success");
      
      // Reset form
      setPelanggaranForm({
        jenis_pelanggaran_id: "",
        tanggal: new Date().toISOString().split("T")[0],
        waktu: new Date().toISOString().slice(0, 16),
        keterangan: "",
        status: 1,
        pelapor_ptk_id: "",
      });
      setSelectedIds([]);
      setScannedSubjects({});
      setBarcode("");
      setShowScanner(false);
      setLookupError(null);
      setSelectedRombel("");
      setStudentSearchText("");
      setGtkSearchText("");
      setIsPelanggaranModalOpen(false);
      fetchData();
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: number) => {
    const statusText = 
      nextStatus === 2 ? "Proses" : 
      nextStatus === 3 ? "Selesaikan" : 
      nextStatus === 4 ? "Batalkan" : "";

    const confirmResult = await Swal.fire({
      title: `Apakah Anda yakin?`,
      text: `Status pelanggaran ini akan diubah ke '${statusText}'.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Ubah!",
      cancelButtonText: "Batal",
      background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await indisiplinerService.updatePelanggaranStatus(id, nextStatus);
      Swal.fire("Berhasil", "Status pelanggaran telah diperbarui.", "success");
      fetchData();
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleCreateTindakLanjut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPelanggaran || !tindakLanjutForm.jenis_tindak_lanjut_id) return;

    try {
      await indisiplinerService.createTindakLanjut({
        pelanggaran_id: selectedPelanggaran.pelanggaran_id,
        jenis_tindak_lanjut_id: tindakLanjutForm.jenis_tindak_lanjut_id,
        tanggal: tindakLanjutForm.tanggal,
        keterangan: tindakLanjutForm.keterangan,
        petugas_ptk_id: tindakLanjutForm.petugas_ptk_id || undefined,
      });

      Swal.fire("Berhasil", "Riwayat pembinaan/tindak lanjut berhasil dicatat.", "success");
      setTindakLanjutForm({
        jenis_tindak_lanjut_id: "",
        tanggal: new Date().toISOString().split("T")[0],
        keterangan: "",
        petugas_ptk_id: "",
      });
      setIsTindakLanjutModalOpen(false);
      fetchData();
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  // Helper to format ISO Date/Time into friendly Indonesian
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";
  };


  // Filters logic
  const filteredPelanggaran = pelanggaranList.filter((item) => {
    // 1. Search term match name or identifier
    const offender = item.peserta_didik || item.gtk;
    const nameMatch = offender?.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = (offender?.nisn && offender.nisn.includes(searchTerm)) || 
                    (offender?.nuptk && offender.nuptk.includes(searchTerm));
    const matchSearch = searchTerm ? (nameMatch || idMatch) : true;

    // 2. Target match
    let matchTarget = true;
    if (filterTarget === "pd") {
      matchTarget = !!item.peserta_didik_id;
    } else if (filterTarget === "gtk") {
      matchTarget = !!item.ptk_id;
    }

    // 3. Status match
    const matchStatus = filterStatus ? item.status === Number(filterStatus) : true;

    return matchSearch && matchTarget && matchStatus;
  });

  const totalPages = Math.ceil(filteredPelanggaran.length / itemsPerPage) || 1;
  const paginatedPelanggaran = filteredPelanggaran.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTarget, filterStatus, itemsPerPage]);

  return (
    <>
      <PageMeta
        title={defaultTarget === "pd" 
          ? "Indisipliner Peserta Didik | SIMAK" 
          : defaultTarget === "gtk" 
          ? "Indisipliner GTK | SIMAK" 
          : "Disiplin & Indisipliner | SIMAK"}
        description={defaultTarget === "pd"
          ? "Pengelolaan poin pelanggaran peserta didik"
          : defaultTarget === "gtk"
          ? "Pengelolaan poin pelanggaran dan pembinaan GTK"
          : "Pengelolaan poin pelanggaran peserta didik dan pembinaan GTK"}
      />

      <div className="space-y-6">
        {/* Header section matching other templates */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {defaultTarget === "pd" 
              ? "Indisipliner Peserta Didik" 
              : defaultTarget === "gtk" 
              ? "Indisipliner GTK" 
              : "Kedisiplinan & Indisipliner"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {defaultTarget === "pd"
              ? "Pantau statistik pelanggaran, poin perilaku peserta didik, serta riwayat pembinaan di sekolah."
              : defaultTarget === "gtk"
              ? "Pantau statistik pelanggaran dan riwayat pembinaan GTK di sekolah."
              : "Pantau statistik pelanggaran, poin perilaku peserta didik, serta riwayat pembinaan di sekolah."}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsPelanggaranModalOpen(true)}
            startIcon={<PlusIcon className="size-4 fill-current" />}
          >
            Catat Pelanggaran
          </Button>
        </div>
      </div>

      {/* Stats Cards Section */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pelanggaran</p>
                <h4 className="text-2xl font-bold mt-1.5">{summary.stats.total_pelanggaran}</h4>
              </div>
              <div className="h-11 w-11 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 text-xl font-bold">⚠️</div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pelanggaran Peserta Didik</p>
                <h4 className="text-2xl font-bold mt-1.5">{summary.stats.total_pelanggaran_siswa}</h4>
              </div>
              <div className="h-11 w-11 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-xl font-bold">🎓</div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pelanggaran GTK</p>
                <h4 className="text-2xl font-bold mt-1.5">{summary.stats.total_pelanggaran_gtk}</h4>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl font-bold">💼</div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jenis Pelanggaran Master</p>
                <h4 className="text-2xl font-bold mt-1.5">{summary.stats.master_jenis_pelanggaran}</h4>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-xl font-bold">📋</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("pelanggaran")}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition-all ${
            activeTab === "pelanggaran"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"
          }`}
        >
          Daftar Pelanggaran
        </button>
        <button
          onClick={() => setActiveTab("konfigurasi")}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition-all ${
            activeTab === "konfigurasi"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"
          }`}
        >
          Konfigurasi Master
        </button>
        <button
          onClick={() => setActiveTab("statistik")}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition-all ${
            activeTab === "statistik"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"
          }`}
        >
          Statistik & Laporan Poin
        </button>
      </div>

      {/* Tab: Pelanggaran */}
      {activeTab === "pelanggaran" && (
        <ComponentCard title="Riwayat Pelanggaran Disiplin">
          {/* Filters layout matching standard template */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
            <div className="w-20">
              <Select
                options={rowsPerPageOptions}
                defaultValue={itemsPerPage.toString()}
                onChange={(value) => setItemsPerPage(parseInt(value))}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full lg:justify-end">
              <div className="relative max-w-sm w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon className="size-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Cari Nama pelaku, NISN, atau NUPTK..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                {!defaultTarget && (
                  <div className="w-full sm:w-40">
                    <select
                      value={filterTarget}
                      onChange={(e) => setFilterTarget(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent py-2.5 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                    >
                      <option value="">Semua Target</option>
                      <option value="pd">Peserta Didik</option>
                      <option value="gtk">GTK</option>
                    </select>
                  </div>
                )}
                <div className="w-full sm:w-40">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-transparent py-2.5 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  >
                    <option value="">Semua Status</option>
                    <option value="1">Draft</option>
                    <option value="2">Diproses</option>
                    <option value="3">Selesai</option>
                    <option value="4">Dibatalkan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : filteredPelanggaran.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
              <p className="text-gray-400 italic text-sm">Tidak ada data pelanggaran ditemukan</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Table className="min-w-[1000px]">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tanggal & Waktu</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Pelaku</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Pelanggaran</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Poin</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Tindakan</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {paginatedPelanggaran.map((item) => {
                      const offender = item.peserta_didik || item.gtk;
                      const isPD = !!item.peserta_didik_id;
                      
                      const fotoUrl = getFotoUrl(offender?.foto, '');

                      let statusBadge = <Badge color="light">Draft</Badge>;
                      if (item.status === 2) statusBadge = <Badge color="primary">Diproses</Badge>;
                      if (item.status === 3) statusBadge = <Badge color="success">Selesai</Badge>;
                      if (item.status === 4) statusBadge = <Badge color="error">Batal</Badge>;

                      return (
                        <TableRow key={item.pelanggaran_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                          <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                            {formatDateTime(item.waktu)}
                          </TableCell>
                          <TableCell className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar src={fotoUrl} size="small" />
                              <div>
                                <span className="font-semibold text-gray-800 dark:text-white/90">{offender?.nama}</span>
                                <p className="text-xxs text-gray-400 font-medium">
                                  {isPD ? `Peserta Didik • ${offender?.nama_rombel || 'Tanpa Kelas'}` : `GTK • ${offender?.jenis_ptk_id_str || 'Staff'}`}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/85 max-w-[200px] truncate">
                            <span title={item.jenis_pelanggaran?.nama}>
                              {item.jenis_pelanggaran?.nama}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-sm font-bold text-center text-red-500">
                            {item.poin}
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-center">{statusBadge}</TableCell>
                          <TableCell className="px-5 py-3.5 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedPelanggaran(item);
                                  setIsDetailModalOpen(true);
                                }}
                                className="px-2 py-1 text-xs font-bold rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-white/[0.03] dark:text-gray-400 transition"
                              >
                                Detail
                              </button>
                              {item.status === 1 && (
                                <button
                                  onClick={() => handleUpdateStatus(item.pelanggaran_id, 2)}
                                  className="px-2 py-1 text-xs rounded bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 font-bold transition-all"
                                >
                                  Proses
                                </button>
                              )}
                              {item.status === 2 && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedPelanggaran(item);
                                      setIsTindakLanjutModalOpen(true);
                                    }}
                                    className="px-2 py-1 text-xs rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-bold transition-all"
                                  >
                                    + Tindak Lanjut
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(item.pelanggaran_id, 3)}
                                    className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 font-bold transition-all"
                                  >
                                    Selesai
                                  </button>
                                </>
                              )}
                              {item.status < 3 && (
                                <button
                                  onClick={() => handleUpdateStatus(item.pelanggaran_id, 4)}
                                  className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-bold transition-all"
                                >
                                  Batal
                                </button>
                              )}
                            </div>
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
      )}

      {/* Tab: Konfigurasi Master */}
      {activeTab === "konfigurasi" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Master Pelanggaran */}
          <ComponentCard 
            title="Daftar Master Jenis Pelanggaran"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">Master data jenis pelanggaran aktif</span>
              <button 
                type="button"
                onClick={() => setIsJpModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg flex items-center gap-1 transition-all"
              >
                + Tambah Jenis
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-2 text-start font-semibold text-gray-500 text-xs dark:text-gray-400">Nama Pelanggaran</TableCell>
                    <TableCell isHeader className="px-4 py-2 text-center font-semibold text-gray-500 text-xs dark:text-gray-400">Target</TableCell>
                    <TableCell isHeader className="px-4 py-2 text-center font-semibold text-gray-500 text-xs dark:text-gray-400">Poin</TableCell>
                    <TableCell isHeader className="px-4 py-2 text-center font-semibold text-gray-500 text-xs dark:text-gray-400">Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {jenisPelanggaranList
                    .filter(jp => !defaultTarget || (defaultTarget === "pd" ? jp.target !== 0 : jp.target !== 1))
                    .map((jp) => (
                      <TableRow key={jp.jenis_pelanggaran_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <TableCell className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-sm">{jp.nama}</TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Badge color={jp.target === 0 ? "warning" : jp.target === 1 ? "info" : "success"}>
                            {jp.target === 0 ? "GTK" : jp.target === 1 ? "Peserta Didik" : "Keduanya"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-red-500 font-bold text-sm">{jp.poin}</TableCell>
                        <TableCell className="px-4 py-3 text-center text-sm">
                          {jp.aktif ? <span className="text-green-500 font-bold">🟢 Aktif</span> : <span className="text-gray-400">🔴 Nonaktif</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </ComponentCard>

          {/* Master Tindak Lanjut */}
          <ComponentCard 
            title="Daftar Master Jenis Tindak Lanjut"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">Master data tindakan pembinaan aktif</span>
              <button 
                type="button"
                onClick={() => setIsJtlModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg flex items-center gap-1 transition-all"
              >
                + Tambah Tindakan
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-2 text-start font-semibold text-gray-500 text-xs dark:text-gray-400">Tindakan Pembinaan</TableCell>
                    <TableCell isHeader className="px-4 py-2 text-center font-semibold text-gray-500 text-xs dark:text-gray-400">Target</TableCell>
                    <TableCell isHeader className="px-4 py-2 text-center font-semibold text-gray-500 text-xs dark:text-gray-400">Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {jenisTindakLanjutList
                    .filter(jtl => !defaultTarget || (defaultTarget === "pd" ? jtl.target !== 0 : jtl.target !== 1))
                    .map((jtl) => (
                      <TableRow key={jtl.jenis_tindak_lanjut_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <TableCell className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-sm">{jtl.nama}</TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Badge color={jtl.target === 0 ? "warning" : jtl.target === 1 ? "info" : "success"}>
                            {jtl.target === 0 ? "GTK" : jtl.target === 1 ? "Peserta Didik" : "Keduanya"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-sm">
                          {jtl.aktif ? <span className="text-green-500 font-bold">🟢 Aktif</span> : <span className="text-gray-400">🔴 Nonaktif</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* Tab: Statistik & Laporan */}
      {activeTab === "statistik" && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Top Pelanggar */}
          {defaultTarget === "gtk" ? (
            <ComponentCard title="Top 5 GTK dengan Poin Pelanggaran Tertinggi">
              <div className="space-y-4">
                {!summary.top_gtk || summary.top_gtk.length === 0 ? (
                  <p className="text-gray-400 italic text-sm text-center py-10">Belum ada GTK terdeteksi melanggar</p>
                ) : (
                  summary.top_gtk.map((gtk, idx) => {
                    const fotoUrl = getFotoUrl(gtk.foto, '');
                    
                    return (
                      <div 
                        key={gtk.ptk_id} 
                        className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/40 bg-gray-50/30 dark:bg-white/[0.01] hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center font-bold text-xs h-6 w-6 rounded-full bg-brand-500/10 text-brand-600">
                            {idx + 1}
                          </div>
                          <Avatar src={fotoUrl} size="medium" />
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-white/90 text-sm">{gtk.nama}</h4>
                            <p className="text-xxs text-gray-500 font-medium">NUPTK: {gtk.nuptk} • Jabatan: {gtk.jabatan}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-red-500 leading-none">{gtk.total_poin}</span>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Poin ({gtk.total_pelanggaran} Kasus)</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ComponentCard>
          ) : (
            <ComponentCard title="Top 5 Peserta Didik dengan Poin Pelanggaran Tertinggi">
              <div className="space-y-4">
                {summary.top_siswa.length === 0 ? (
                  <p className="text-gray-400 italic text-sm text-center py-10">Belum ada peserta didik terdeteksi melanggar</p>
                ) : (
                  summary.top_siswa.map((pd, idx) => {
                    const fotoUrl = getFotoUrl(pd.foto, '');
                    
                    return (
                      <div 
                        key={pd.peserta_didik_id} 
                        className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/40 bg-gray-50/30 dark:bg-white/[0.01] hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center font-bold text-xs h-6 w-6 rounded-full bg-brand-500/10 text-brand-600">
                            {idx + 1}
                          </div>
                          <Avatar src={fotoUrl} size="medium" />
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-white/90 text-sm">{pd.nama}</h4>
                            <p className="text-xxs text-gray-500 font-medium">NISN: {pd.nisn} • Kelas: {pd.rombongan_belajar || "Tanpa Kelas"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-red-500 leading-none">{pd.total_poin}</span>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Poin ({pd.total_pelanggaran} Kasus)</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ComponentCard>
          )}

          {/* Top Infractions by Type */}
          <ComponentCard title="Kasus Pelanggaran Terbanyak Berdasarkan Jenis">
            <div className="space-y-4">
              {summary.top_pelanggaran_jenis.length === 0 ? (
                <p className="text-gray-400 italic text-sm text-center py-10">Belum ada aktivitas pelanggaran</p>
              ) : (
                summary.top_pelanggaran_jenis
                  .filter(item => !defaultTarget || (defaultTarget === "pd" ? item.target !== 0 : item.target !== 1))
                  .map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800/40 bg-gray-50/30 dark:bg-white/[0.01]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center font-bold text-xs h-6 w-6 rounded-full bg-blue-500/10 text-blue-600">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-white/90 text-sm">{item.nama}</h4>
                          <p className="text-xxs text-gray-400 font-semibold uppercase mt-0.5">
                            Target: {item.target === 0 ? "GTK" : item.target === 1 ? "Peserta Didik" : "Keduanya"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-gray-800 dark:text-white">{item.count}</span>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Frekuensi</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ComponentCard>
        </div>
      )}
      </div>

      {/* ===================== */}
      {/* MODAL: JENIS PELANGGARAN */}
      {/* ===================== */}
      <Modal isOpen={isJpModalOpen} onClose={() => setIsJpModalOpen(false)} className="max-w-[500px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Tambah Master Jenis Pelanggaran</h3>
        <form onSubmit={handleCreateJp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nama Pelanggaran</label>
            <Input 
              type="text" 
              placeholder="Contoh: Merokok di sekolah"
              value={jpForm.nama} 
              onChange={(e) => setJpForm({ ...jpForm, nama: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Target Pelanggar</label>
              <select 
                value={jpForm.target}
                onChange={(e) => setJpForm({ ...jpForm, target: Number(e.target.value) })}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              >
                {(!defaultTarget || defaultTarget === "pd") && <option value={1}>Peserta Didik</option>}
                {(!defaultTarget || defaultTarget === "gtk") && <option value={0}>GTK</option>}
                {!defaultTarget && <option value={2}>Keduanya</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Poin Pelanggaran</label>
              <Input 
                type="number" 
                value={jpForm.poin} 
                onChange={(e) => setJpForm({ ...jpForm, poin: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsJpModalOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* ===================== */}
      {/* MODAL: JENIS TINDAK LANJUT */}
      {/* ===================== */}
      <Modal isOpen={isJtlModalOpen} onClose={() => setIsJtlModalOpen(false)} className="max-w-[500px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Tambah Master Jenis Tindak Lanjut</h3>
        <form onSubmit={handleCreateJtl} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nama Tindakan Pembinaan</label>
            <Input 
              type="text" 
              placeholder="Contoh: Skorsing 3 hari"
              value={jtlForm.nama} 
              onChange={(e) => setJtlForm({ ...jtlForm, nama: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Target Penerima</label>
            <select 
              value={jtlForm.target}
              onChange={(e) => setJtlForm({ ...jtlForm, target: Number(e.target.value) })}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
            >
              {(!defaultTarget || defaultTarget === "pd") && <option value={1}>Peserta Didik</option>}
              {(!defaultTarget || defaultTarget === "gtk") && <option value={0}>GTK</option>}
              {!defaultTarget && <option value={2}>Keduanya</option>}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsJtlModalOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* ===================== */}
      {/* MODAL: CATAT PELANGGARAN */}
      {/* ===================== */}
      <Modal isOpen={isPelanggaranModalOpen} onClose={() => {
        setIsPelanggaranModalOpen(false);
        setSelectedIds([]);
        setScannedSubjects({});
        setBarcode("");
        setShowScanner(false);
        setLookupError(null);
        setSelectedRombel("");
        setStudentSearchText("");
        setGtkSearchText("");
      }} className="max-w-[700px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Catat Pelanggaran Disiplin Baru</h3>
        
        {/* Step 1: Scan / Cari Pelaku */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Scan Barcode / Token Kartu</label>
          
          {showScanner ? (
            <div className="max-w-[400px] mx-auto space-y-3">
              <QrScanner onScanSuccess={handleBarcodeLookup} />
              <button 
                type="button"
                onClick={() => setShowScanner(false)}
                className="w-full rounded-lg border border-gray-300 py-2 text-xs font-bold text-gray-700 dark:border-gray-700 dark:text-gray-300 transition-colors"
              >
                Batalkan Scan
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Masukkan QR Token / Barcode pelaku..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeLookup(barcode);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                />
                <button 
                  type="button"
                  onClick={() => handleBarcodeLookup(barcode)}
                  disabled={lookupLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-500 disabled:opacity-50"
                >
                  {lookupLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                  ) : (
                    <SearchIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <button 
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-500/10 px-4 py-3 text-xs font-bold text-brand-500 hover:bg-brand-500/20 transition-colors border border-brand-500/20"
              >
                📷 Buka Kamera
              </button>
            </div>
          )}
          
          {lookupError && (
            <p className="text-xs text-red-500 mt-2 italic font-semibold">{lookupError}</p>
          )}
        </div>

        {/* Checklists for offender selection */}
        <div className="space-y-4 mb-4">
          {(defaultTarget || "pd") === "pd" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Pilih Rombongan Belajar
                </label>
                <div className="relative">
                  <select
                    value={selectedRombel}
                    onChange={(e) => setSelectedRombel(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {rombels.map((r) => (
                      <option key={r.rombongan_belajar_id} value={r.nama}>
                        {r.nama}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
              </div>

              {selectedRombel && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pilih Peserta Didik ({selectedIds.length} Terpilih)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedIds.length === students.length) {
                          setSelectedIds([]);
                        } else {
                          setSelectedIds(students.map(s => s.peserta_didik_id));
                        }
                      }}
                      className="text-xs text-brand-500 hover:text-brand-600 font-medium cursor-pointer"
                    >
                      {selectedIds.length === students.length ? "Hapus Semua" : "Pilih Semua"}
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Cari nama peserta didik..."
                      value={studentSearchText}
                      onChange={(e) => setStudentSearchText(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-850 rounded-lg p-2.5 space-y-1.5 custom-scrollbar">
                    {students.filter(s => s.nama.toLowerCase().includes(studentSearchText.toLowerCase())).length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Peserta Didik tidak ditemukan</p>
                    ) : (
                      students
                        .filter(s => s.nama.toLowerCase().includes(studentSearchText.toLowerCase()))
                        .map((s) => {
                          const isChecked = selectedIds.includes(s.peserta_didik_id);
                          return (
                            <label key={s.peserta_didik_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedIds(selectedIds.filter(id => id !== s.peserta_didik_id));
                                  } else {
                                    setSelectedIds([...selectedIds, s.peserta_didik_id]);
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                              />
                              <div className="text-sm">
                                <p className="font-medium text-gray-800 dark:text-white/90">{s.nama}</p>
                                <p className="text-xs text-gray-500">{s.nisn || "-"}</p>
                              </div>
                            </label>
                          );
                        })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pilih GTK ({selectedIds.length} Terpilih)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIds.length === gtkList.length) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(gtkList.map(g => g.ptk_id));
                    }
                  }}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium cursor-pointer"
                >
                  {selectedIds.length === gtkList.length ? "Hapus Semua" : "Pilih Semua"}
                </button>
              </div>

              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Cari nama GTK..."
                  value={gtkSearchText}
                  onChange={(e) => setGtkSearchText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-850 rounded-lg p-2.5 space-y-1.5 custom-scrollbar">
                {gtkList.filter(g => g.nama.toLowerCase().includes(gtkSearchText.toLowerCase())).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">GTK tidak ditemukan</p>
                ) : (
                  gtkList
                    .filter(g => g.nama.toLowerCase().includes(gtkSearchText.toLowerCase()))
                    .map((g) => {
                      const isChecked = selectedIds.includes(g.ptk_id);
                      return (
                        <label key={g.ptk_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedIds(selectedIds.filter(id => id !== g.ptk_id));
                              } else {
                                setSelectedIds([...selectedIds, g.ptk_id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                          <div className="text-sm">
                            <p className="font-medium text-gray-800 dark:text-white/90">{g.nama}</p>
                            <p className="text-xs text-gray-500">{g.nuptk || "-"}</p>
                          </div>
                        </label>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* Selected Badges / Tag lists */}
          {selectedIds.length > 0 && (
            <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10">
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 block mb-2">Pelaku Terpilih ({selectedIds.length}):</span>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                {selectedIds.map(id => {
                  const name = (defaultTarget || "pd") === 'pd' 
                    ? students.find(s => s.peserta_didik_id === id)?.nama || scannedSubjects[id]?.nama || "Peserta Didik tidak dikenal"
                    : gtkList.find(g => g.ptk_id === id)?.nama || scannedSubjects[id]?.nama || "GTK tidak dikenal";
                  return (
                    <span key={id} className="flex items-center gap-1.5 text-xs bg-brand-500/15 text-brand-600 dark:text-brand-400 font-medium px-2.5 py-1 rounded-full">
                      {name}
                      <button
                        type="button"
                        onClick={() => setSelectedIds(selectedIds.filter(x => x !== id))}
                        className="hover:text-red-500 text-xxs font-bold focus:outline-none"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Form Detail Pelanggaran, only shown if offenders are selected */}
        {selectedIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-gray-100 dark:border-gray-800 rounded-2xl opacity-50">
            <p className="text-xs text-gray-400 italic">Harap scan barcode atau checklist pelaku terlebih dahulu.</p>
          </div>
        ) : (
          <form onSubmit={handleCreatePelanggaran} className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Jenis Pelanggaran</label>
                <select 
                  value={pelanggaranForm.jenis_pelanggaran_id}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, jenis_pelanggaran_id: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  required
                >
                  <option value="">Pilih Pelanggaran...</option>
                  {jenisPelanggaranList
                    .filter(jp => jp.aktif && (jp.target === 2 || ((defaultTarget || "pd") === "pd" ? jp.target === 1 : jp.target === 0)))
                    .map(jp => (
                      <option key={jp.jenis_pelanggaran_id} value={jp.jenis_pelanggaran_id}>
                        {jp.nama} ({jp.poin} Poin)
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Status Awal</label>
                <select 
                  value={pelanggaranForm.status}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, status: Number(e.target.value) })}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                >
                  <option value={1}>Draft</option>
                  <option value={2}>Diproses</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Tanggal</label>
                <Input 
                  type="date" 
                  value={pelanggaranForm.tanggal}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, tanggal: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Waktu Kejadian</label>
                <Input 
                  type="datetime-local" 
                  value={pelanggaranForm.waktu}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, waktu: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Petugas Pelapor</label>
                <select 
                  value={pelanggaranForm.pelapor_ptk_id}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, pelapor_ptk_id: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                >
                  <option value="">Pilih Pelapor (Opsional)...</option>
                  {gtkList.map((gtk) => (
                    <option key={gtk.ptk_id} value={gtk.ptk_id}>{gtk.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Keterangan Tambahan</label>
                <textarea 
                  rows={2}
                  value={pelanggaranForm.keterangan}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, keterangan: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  placeholder="Deskripsi detail kronologi..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-850">
              <Button variant="outline" size="sm" type="button" onClick={() => {
                setIsPelanggaranModalOpen(false);
                setSelectedIds([]);
                setScannedSubjects({});
                setBarcode("");
                setShowScanner(false);
                setLookupError(null);
                setSelectedRombel("");
                setStudentSearchText("");
                setGtkSearchText("");
              }}>Batal</Button>
              <Button variant="primary" size="sm" type="submit">Simpan Pelanggaran</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ===================== */}
      {/* MODAL: INPUT TINDAK LANJUT */}
      {/* ===================== */}
      <Modal isOpen={isTindakLanjutModalOpen} onClose={() => setIsTindakLanjutModalOpen(false)} className="max-w-[500px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Catat Tindak Lanjut Pembinaan</h3>
        {selectedPelanggaran && (
          <p className="text-xs text-gray-500 mb-6">
            Kasus: <strong>{selectedPelanggaran.jenis_pelanggaran?.nama}</strong> | Pelaku: <strong>{selectedPelanggaran.peserta_didik?.nama || selectedPelanggaran.gtk?.nama}</strong>
          </p>
        )}
        <form onSubmit={handleCreateTindakLanjut} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Pilih Tindakan Pembinaan</label>
            <select 
              value={tindakLanjutForm.jenis_tindak_lanjut_id}
              onChange={(e) => setTindakLanjutForm({ ...tindakLanjutForm, jenis_tindak_lanjut_id: e.target.value })}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              required
            >
              <option value="">Pilih Tindakan...</option>
              {jenisTindakLanjutList
                .filter(jtl => jtl.aktif && (jtl.target === 2 || (selectedPelanggaran?.peserta_didik_id ? jtl.target === 1 : jtl.target === 0)))
                .map(jtl => (
                  <option key={jtl.jenis_tindak_lanjut_id} value={jtl.jenis_tindak_lanjut_id}>
                    {jtl.nama}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Tanggal Tindakan</label>
              <Input 
                type="date" 
                value={tindakLanjutForm.tanggal}
                onChange={(e) => setTindakLanjutForm({ ...tindakLanjutForm, tanggal: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Petugas Pembina</label>
              <select 
                value={tindakLanjutForm.petugas_ptk_id}
                onChange={(e) => setTindakLanjutForm({ ...tindakLanjutForm, petugas_ptk_id: e.target.value })}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              >
                <option value="">Pilih Petugas...</option>
                {gtkList.map((gtk) => (
                  <option key={gtk.ptk_id} value={gtk.ptk_id}>{gtk.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Keterangan / Hasil Pembinaan</label>
            <textarea 
              rows={3}
              value={tindakLanjutForm.keterangan}
              onChange={(e) => setTindakLanjutForm({ ...tindakLanjutForm, keterangan: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              placeholder="Contoh: Peserta Didik berjanji tidak mengulangi dan diberi pembinaan..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsTindakLanjutModalOpen(false)}>Batal</Button>
            <Button variant="primary" size="sm" type="submit">Simpan Tindakan</Button>
          </div>
        </form>
      </Modal>

      {/* ===================== */}
      {/* MODAL: DETAIL KASUS PELANGGARAN & TIMELINE */}
      {/* ===================== */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} className="max-w-[650px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Detail Kasus Pelanggaran Disiplin</h3>
        {selectedPelanggaran && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            
            {/* Subject Profile Info */}
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Avatar 
                src={getFotoUrl(selectedPelanggaran.peserta_didik?.foto || selectedPelanggaran.gtk?.foto, "")} 
                size="large" 
              />
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-base">
                  {selectedPelanggaran.peserta_didik?.nama || selectedPelanggaran.gtk?.nama}
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  {selectedPelanggaran.peserta_didik_id 
                    ? `Peserta Didik • NISN: ${selectedPelanggaran.peserta_didik?.nisn} • Kelas: ${selectedPelanggaran.peserta_didik?.nama_rombel || 'Tanpa Kelas'}` 
                    : `GTK • NUPTK: ${selectedPelanggaran.gtk?.nuptk || '-'} • Jabatan: ${selectedPelanggaran.gtk?.jenis_ptk_id_str || 'Staff'}`
                  }
                </p>
              </div>
            </div>

            {/* Infraction Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Kasus Pelanggaran</span>
                <p className="font-bold text-gray-800 dark:text-white mt-0.5">{selectedPelanggaran.jenis_pelanggaran?.nama}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-semibold uppercase">Poin Penalti</span>
                <p className="font-black text-red-500 mt-0.5 text-base">{selectedPelanggaran.poin} Poin</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Waktu Kejadian</span>
                <p className="font-medium text-gray-700 dark:text-gray-300 mt-0.5">{formatDateTime(selectedPelanggaran.waktu)}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-semibold uppercase">Pelapor</span>
                <p className="font-medium text-gray-700 dark:text-gray-300 mt-0.5">{selectedPelanggaran.pelapor?.nama || "-"}</p>
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase">Deskripsi / Kronologi</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 bg-gray-50/40 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800/30 whitespace-pre-wrap leading-relaxed">
                {selectedPelanggaran.keterangan || "(Tidak ada deskripsi)"}
              </p>
            </div>

            {/* Timeline of Follow-up actions */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                Riwayat Pembinaan & Tindak Lanjut ({selectedPelanggaran.tindak_lanjut?.length || 0})
              </h4>
              
              {selectedPelanggaran.tindak_lanjut?.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4">Belum ada riwayat tindak lanjut pembinaan untuk kasus ini.</p>
              ) : (
                <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3.5 pl-6 space-y-6">
                  {selectedPelanggaran.tindak_lanjut.map((tanjut: any) => (
                    <div key={tanjut.tindak_lanjut_id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-9 top-1.5 h-6 w-6 rounded-full bg-brand-500/10 border-2 border-brand-500 flex items-center justify-center text-[10px] text-brand-500 font-black">
                        ✓
                      </span>
                      <div>
                        <span className="text-xs text-gray-400 font-semibold">
                          {new Date(tanjut.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <h5 className="font-bold text-sm text-gray-800 dark:text-white mt-0.5">
                          {tanjut.jenis_tindak_lanjut?.nama}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed whitespace-pre-wrap">
                          {tanjut.keterangan}
                        </p>
                        {tanjut.petugas && (
                          <p className="text-[10px] text-gray-400 font-semibold mt-1.5 uppercase">
                            Pembina: {tanjut.petugas.nama}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800/80">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
