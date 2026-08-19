import React, { useState, useEffect, useCallback } from "react";
import { formatDateDMY } from "../../utils/formatDate";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { useSekolah } from "../../context/SekolahContext";
import { sppService } from "../../services/sppService";
import { dapodikService } from "../../services/dapodikService";
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
import { SearchIcon, PlusIcon, TableIcon, BoxIcon, DownloadIcon, PrinterIcon, TrashBinIcon, PencilIcon } from "../../icons";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

export default function KeuanganData() {
  const { sekolah } = useSekolah();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pengaturan";

  const [loading, setLoading] = useState(true);
  const [loadingRombel, setLoadingRombel] = useState(false);

  // Data states
  const [pengaturanList, setPengaturanList] = useState<any[]>([]);
  const [rombelList, setRombelList] = useState<any[]>([]);
  const [tagihanList, setTagihanList] = useState<any[]>([]);

  // Laporan states
  const [totalPembayaran, setTotalPembayaran] = useState("0");
  const [totalBeasiswa, setTotalBeasiswa] = useState("0");
  const [tunggakanSiswa, setTunggakanSiswa] = useState<any[]>([]);
  const [tunggakanKelas, setTunggakanKelas] = useState<any[]>([]);
  const [rekapBulanan, setRekapBulanan] = useState<any[]>([]);
  const [rekapTahunPelajaran, setRekapTahunPelajaran] = useState<any[]>([]);

  // Laporan sub-tabs & filter states
  const [rekapSubTab, setRekapSubTab] = useState<"tahun-ajaran" | "tunggakan-siswa" | "tunggakan-kelas" | "bulanan">("tahun-ajaran");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("all");
  const [searchTunggakanSiswa, setSearchTunggakanSiswa] = useState("");
  const [filterTunggakanKelas, setFilterTunggakanKelas] = useState("");
  const [filterTunggakanSiswaSemester, setFilterTunggakanSiswaSemester] = useState<string>("all");
  const [tunggakanSiswaPage, setTunggakanSiswaPage] = useState(1);
  const [tunggakanSiswaPerPage, setTunggakanSiswaPerPage] = useState(10);

  const [searchTunggakanKelas, setSearchTunggakanKelas] = useState("");
  const [filterTunggakanKelasSemester, setFilterTunggakanKelasSemester] = useState<string>("all");

  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportBerdasarkan, setExportBerdasarkan] = useState<"tahun-ajaran" | "kelas" | "semua">("tahun-ajaran");
  const [exportTahunAjaran, setExportTahunAjaran] = useState<string>("all");
  const [exportSelectedRombel, setExportSelectedRombel] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("excel");
  const [isExporting, setIsExporting] = useState(false);

  // Filters & Search
  const [searchTagihan, setSearchTagihan] = useState("");
  const [filterStatusTagihan, setFilterStatusTagihan] = useState("");
  const [filterTahunAjaranTagihan, setFilterTahunAjaranTagihan] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  // Modals visibility
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isRombelModalOpen, setIsRombelModalOpen] = useState(false);
  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    nama_tagihan: "",
    nominal: "",
    tipe: 1,
    aktif: true,
  });

  // Selected entities for modals
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null);
  const [selectedTagihan, setSelectedTagihan] = useState<any | null>(null);
  const [selectedSubSpp, setSelectedSubSpp] = useState<any | null>(null);

  // Forms
  const [configForm, setConfigForm] = useState({
    nama_tagihan: "",
    nominal: "",
    tipe: 1, // 1 = Bulanan, 2 = Tahunan, 3 = Sekali Bayar
    aktif: true,
  });

  // Multi-select rombel
  const [selectedRombelIds, setSelectedRombelIds] = useState<string[]>([]);
  const [searchRombel, setSearchRombel] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rombelNotif, setRombelNotif] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [transaksiForm, setTransaksiForm] = useState({
    jenis_transaksi: 1, // 1 = Pembayaran, 2 = Beasiswa, 3 = Denda, 4 = Pengurangan, 5 = Pengembalian Dana
    nominal: "",
    tanggal_transaksi: new Date().toISOString().split("T")[0],
    metode_pembayaran: 1, // 1 = Tunai, 2 = Transfer, 3 = QRIS, 4 = VA
    keterangan: "",
  });

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    if (!sekolah?.sekolah_id) return;
    setLoading(true);
    try {
      if (activeTab === "pengaturan") {
        const [configRes, rombelRes] = await Promise.all([
          sppService.getPengaturanTagihan(sekolah.sekolah_id),
          dapodikService.getRombonganBelajar("reguler", 150),
        ]);
        setPengaturanList(configRes.data || []);
        setRombelList(rombelRes.data || []);
      } else if (activeTab === "tagihan") {
        const tagihanRes = await sppService.getTagihanSpp(sekolah.sekolah_id);
        setTagihanList(tagihanRes.data || []);
      } else if (activeTab === "laporan") {
        const [payRes, schRes, tunggakanSiswaRes, tunggakanKelasRes, monthlyRes, semRes] = await Promise.all([
          sppService.getTotalPembayaran(sekolah.sekolah_id),
          sppService.getTotalBeasiswa(sekolah.sekolah_id),
          sppService.getTunggakanPerSiswa(sekolah.sekolah_id),
          sppService.getTunggakanPerKelas(sekolah.sekolah_id),
          sppService.getRekapBulanan(sekolah.sekolah_id),
          sppService.getRekapTahunPelajaran(sekolah.sekolah_id),
        ]);
        setTotalPembayaran(payRes.data?.total_pembayaran || "0");
        setTotalBeasiswa(schRes.data?.total_beasiswa || "0");
        setTunggakanSiswa(tunggakanSiswaRes.data || []);
        setTunggakanKelas(tunggakanKelasRes.data || []);
        setRekapBulanan(monthlyRes.data || []);
        setRekapTahunPelajaran(semRes.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat data keuangan:", err);
    } finally {
      setLoading(false);
    }
  }, [sekolah?.sekolah_id, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolah?.sekolah_id || !configForm.nama_tagihan.trim() || !configForm.nominal) return;

    try {
      await sppService.createPengaturanTagihan({
        sekolah_id: sekolah.sekolah_id,
        nama_tagihan: configForm.nama_tagihan,
        nominal: Number(configForm.nominal),
        tipe: Number(configForm.tipe),
        aktif: configForm.aktif,
      });

      Swal.fire("Berhasil", "Master pengaturan tagihan berhasil dibuat.", "success");
      setConfigForm({ nama_tagihan: "", nominal: "", tipe: 1, aktif: true });
      setIsConfigModalOpen(false);
      fetchData();
    } catch (err: any) {
      Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleOpenEditModal = (config: any) => {
    setEditingConfig(config);
    setEditForm({
      nama_tagihan: config.nama_tagihan,
      nominal: config.nominal.toString(),
      tipe: config.tipe,
      aktif: config.aktif,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig || !editForm.nama_tagihan.trim() || !editForm.nominal) return;

    try {
      await sppService.updatePengaturanTagihan(editingConfig.pengaturan_tagihan_id, {
        nama_tagihan: editForm.nama_tagihan,
        nominal: Number(editForm.nominal),
        tipe: Number(editForm.tipe),
        aktif: editForm.aktif,
      });

      Swal.fire("Berhasil", "Master pengaturan tagihan berhasil diperbarui.", "success");
      setIsEditModalOpen(false);
      setEditingConfig(null);
      fetchData();
    } catch (err: any) {
      Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleDeleteConfig = async (id: string) => {
    const result = await Swal.fire({
      title: "Hapus Pengaturan Tagihan?",
      text: "Data master pengaturan ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await sppService.deletePengaturanTagihan(id);
        Swal.fire("Berhasil", "Master pengaturan tagihan berhasil dihapus.", "success");
        fetchData();
      } catch (err: any) {
        Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan.", "error");
      }
    }
  };

  // Helper: show toast inside modal then auto-hide
  const showRombelNotif = (type: "success" | "error", message: string) => {
    setRombelNotif({ type, message });
    setTimeout(() => setRombelNotif(null), 3000);
  };

  // Helper: refresh selectedConfig after link/unlink
  const refreshSelectedConfig = async () => {
    const refreshedConfigs = await sppService.getPengaturanTagihan(sekolah!.sekolah_id);
    setPengaturanList(refreshedConfigs.data || []);
    const newSelected = refreshedConfigs.data.find(
      (c: any) => c.pengaturan_tagihan_id === selectedConfig?.pengaturan_tagihan_id
    );
    setSelectedConfig(newSelected);
  };

  const handleLinkRombel = async () => {
    if (!selectedConfig || selectedRombelIds.length === 0) return;

    setLoadingRombel(true);
    let successCount = 0;
    let failCount = 0;

    for (const rombelId of selectedRombelIds) {
      try {
        await sppService.createPengaturanTagihanRombel({
          pengaturan_tagihan_id: selectedConfig.pengaturan_tagihan_id,
          rombongan_belajar_id: rombelId,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSelectedRombelIds([]);
    await refreshSelectedConfig();
    setLoadingRombel(false);

    if (failCount === 0) {
      showRombelNotif("success", `${successCount} kelas berhasil dihubungkan.`);
    } else {
      showRombelNotif("error", `${successCount} berhasil, ${failCount} gagal dihubungkan.`);
    }
  };

  const handleUnlinkRombel = async (id: string) => {
    try {
      setLoadingRombel(true);
      await sppService.deletePengaturanTagihanRombel(id);
      await refreshSelectedConfig();
      setConfirmDeleteId(null);
      showRombelNotif("success", "Hubungan kelas berhasil dihapus & tagihan yang belum dibayar otomatis dibersihkan.");
      fetchData();
    } catch (err: any) {
      showRombelNotif("error", err.response?.data?.message || "Gagal menghapus relasi.");
    } finally {
      setLoadingRombel(false);
    }
  };

  const handleDeleteStudentTagihan = async (item: any) => {
    if (BigInt(item.nominal_terbayar) > BigInt(0)) {
      Swal.fire("Peringatan", "Tagihan yang sudah memiliki riwayat pembayaran tidak dapat dihapus.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Hapus Tagihan Siswa?",
      text: `Hapus tagihan SPP untuk ${item.peserta_didik?.nama || "siswa ini"}? Tagihan yang belum terbayar akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        for (const spp of item.spps) {
          if (BigInt(spp.nominal_terbayar) === BigInt(0)) {
            await sppService.deleteSppTagihan(spp.spp_id);
          }
        }
        Swal.fire("Berhasil", "Tagihan SPP siswa berhasil dihapus.", "success");
        fetchData();
      } catch (err: any) {
        Swal.fire("Gagal", err.response?.data?.message || "Gagal menghapus tagihan.", "error");
      }
    }
  };

  const handleGenerateTagihan = async (config: any) => {
    if (config.pengaturan_rombel.length === 0) {
      Swal.fire("Peringatan", "Harap hubungkan minimal satu kelas sebelum men-generate tagihan.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Generate Tagihan?",
      text: `Memicu pembuatan tagihan SPP untuk seluruh siswa aktif di ${config.pengaturan_rombel.length} kelas terhubung.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Generate!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        const response = await sppService.generateSppTagihan({
          sekolah_id: sekolah!.sekolah_id,
          pengaturan_tagihan_id: config.pengaturan_tagihan_id,
        });
        Swal.fire("Sukses", response.message, "success");
        fetchData();
      } catch (err: any) {
        Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan.", "error");
      }
    }
  };

  const refreshActiveTagihanModal = async (sppIdToSelect?: string) => {
    if (!sekolah?.sekolah_id || !selectedTagihan) return;
    const tagihanRes = await sppService.getTagihanSpp(sekolah.sekolah_id);
    const updatedList = tagihanRes.data || [];
    setTagihanList(updatedList);

    const grouped = getGroupedTagihan(updatedList);
    const updatedStudent = grouped.find((s: any) => s.peserta_didik_id === selectedTagihan.peserta_didik_id);
    if (updatedStudent) {
      setSelectedTagihan(updatedStudent);
      const targetSppId = sppIdToSelect || selectedSubSpp?.spp_id;
      const foundSub = updatedStudent.spps.find((s: any) => s.spp_id === targetSppId) || updatedStudent.spps[0];
      setSelectedSubSpp(foundSub || null);
    }
  };

  const handleSaveTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSpp || !transaksiForm.nominal) return;

    try {
      if (editingTxId) {
        // Edit mode
        await sppService.updateTransaksiSpp(editingTxId, {
          jenis_transaksi: Number(transaksiForm.jenis_transaksi),
          nominal: Number(transaksiForm.nominal),
          tanggal_transaksi: new Date(transaksiForm.tanggal_transaksi).toISOString(),
          metode_pembayaran: [1, 3].includes(Number(transaksiForm.jenis_transaksi))
            ? Number(transaksiForm.metode_pembayaran)
            : undefined,
          keterangan: transaksiForm.keterangan,
        });

        Swal.fire("Berhasil", "Data transaksi SPP berhasil diperbarui.", "success");
        setEditingTxId(null);
      } else {
        // Create mode
        await sppService.createTransaksiSpp({
          spp_id: selectedSubSpp.spp_id,
          sekolah_id: sekolah!.sekolah_id,
          peserta_didik_id: selectedTagihan.peserta_didik_id,
          jenis_transaksi: Number(transaksiForm.jenis_transaksi),
          nominal: Number(transaksiForm.nominal),
          tanggal_transaksi: new Date(transaksiForm.tanggal_transaksi).toISOString(),
          metode_pembayaran: [1, 3].includes(Number(transaksiForm.jenis_transaksi))
            ? Number(transaksiForm.metode_pembayaran)
            : undefined,
          keterangan: transaksiForm.keterangan,
        });

        Swal.fire("Berhasil", "Transaksi baru berhasil dicatat.", "success");
      }

      setTransaksiForm({
        jenis_transaksi: 1,
        nominal: "",
        tanggal_transaksi: new Date().toISOString().split("T")[0],
        metode_pembayaran: 1,
        keterangan: "",
      });

      await refreshActiveTagihanModal();
      fetchData();
    } catch (err: any) {
      Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleStartEditTransaksi = (t: any) => {
    setEditingTxId(t.riwayat_transaksi_spp_id);
    setTransaksiForm({
      jenis_transaksi: t.jenis_transaksi,
      nominal: t.nominal ? t.nominal.toString() : "",
      tanggal_transaksi: t.tanggal_transaksi ? new Date(t.tanggal_transaksi).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      metode_pembayaran: t.metode_pembayaran || 1,
      keterangan: t.keterangan || "",
    });
  };

  const handleCancelEditTransaksi = () => {
    setEditingTxId(null);
    setTransaksiForm({
      jenis_transaksi: 1,
      nominal: "",
      tanggal_transaksi: new Date().toISOString().split("T")[0],
      metode_pembayaran: 1,
      keterangan: "",
    });
  };

  const handleDeleteTransaksi = async (txId: string, nominal: string | number) => {
    const result = await Swal.fire({
      title: "Hapus Transaksi?",
      text: `Hapus riwayat transaksi sebesar ${formatCurrency(nominal.toString())}? Saldo tagihan akan dihitung ulang secara otomatis.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await sppService.deleteTransaksiSpp(txId);
        Swal.fire("Berhasil", "Transaksi SPP berhasil dihapus.", "success");
        if (editingTxId === txId) {
          handleCancelEditTransaksi();
        }
        await refreshActiveTagihanModal();
        fetchData();
      } catch (err: any) {
        Swal.fire("Gagal", err.response?.data?.message || "Gagal menghapus transaksi.", "error");
      }
    }
  };

  // Export Excel Function with Year & Class selection
  const handlePerformExport = (customTa?: string, _customReportType?: string, customRombel?: string) => {
    try {
      setIsExporting(true);
      const selectedTa = customTa !== undefined ? customTa : exportTahunAjaran;
      const targetRombel = customRombel !== undefined ? customRombel : (exportBerdasarkan === "kelas" ? exportSelectedRombel : "");

      const wb = XLSX.utils.book_new();
      const schoolName = (sekolah as any)?.nama || (sekolah as any)?.nama_sekolah || "Sekolah";
      const exportDate = new Date().toISOString().split("T")[0];
      const selectedSemesterObj = rekapTahunPelajaran.find((r) => r.semester_id === selectedTa);
      const taLabel = selectedTa === "all" ? "Semua_Tahun_Ajaran" : (selectedSemesterObj?.label || selectedTa);

      let sheetCount = 0;

      // 1. Sheet Rekap Per Tahun Ajaran
      const rowsRekap: any[] = [];
      const targetRekap =
        selectedTa === "all"
          ? rekapTahunPelajaran
          : rekapTahunPelajaran.filter((r) => r.semester_id === selectedTa);

      targetRekap.forEach((r, idx) => {
        const rombelItems = targetRombel
          ? (r.rombel_breakdown || []).filter((rb: any) => rb.rombel_nama === targetRombel)
          : (r.rombel_breakdown || []);

        if (!targetRombel || rombelItems.length > 0) {
          rowsRekap.push({
            "No": idx + 1,
            "Tahun Ajaran / Semester": r.label,
            "Jumlah Siswa": r.jumlah_siswa,
            "Target Tagihan (Rp)": Number(r.total_target),
            "Total Terbayar (Rp)": Number(r.total_pembayaran),
            "Sisa Tunggakan (Rp)": Number(r.total_tunggakan),
            "Ketercapaian (%)": `${r.persentase}%`,
          });

          rombelItems.forEach((rb: any) => {
            rowsRekap.push({
              "No": "",
              "Tahun Ajaran / Semester": `  └─ ${rb.rombel_nama}`,
              "Jumlah Siswa": rb.jumlah_siswa,
              "Target Tagihan (Rp)": Number(rb.target_tagihan),
              "Total Terbayar (Rp)": Number(rb.total_terbayar),
              "Sisa Tunggakan (Rp)": Number(rb.sisa_tunggakan),
              "Ketercapaian (%)": `${rb.persentase}%`,
            });
          });
        }
      });

      const wsRekap = XLSX.utils.json_to_sheet(rowsRekap.length > 0 ? rowsRekap : [{ Info: "Tidak ada data rekap" }]);
      XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Tahun Ajaran");
      sheetCount++;

      // 2. Sheet Tunggakan Siswa
      const targetSiswa = tunggakanSiswa.filter((s) => {
        const matchTa = selectedTa === "all" || s.tahun_ajaran_id === selectedTa || s.semester_id === selectedTa;
        const matchRombel = !targetRombel || s.kelas === targetRombel;
        return matchTa && matchRombel;
      });

      const rowsSiswa = targetSiswa.map((s, idx) => ({
        "No": idx + 1,
        "NISN": s.nisn || "-",
        "Nama Peserta Didik": s.nama,
        "Kelas": s.kelas || "-",
        "Tahun Ajaran": s.tahun_ajaran || "-",
        "Nama Tagihan": s.nama_tagihan || "-",
        "Nominal Tagihan (Rp)": Number(s.nominal_tagihan),
        "Nominal Terbayar (Rp)": Number(s.nominal_terbayar),
        "Sisa Tunggakan (Rp)": Number(s.sisa_tunggakan),
      }));

      const wsSiswa = XLSX.utils.json_to_sheet(rowsSiswa.length > 0 ? rowsSiswa : [{ Info: "Tidak ada data tunggakan siswa" }]);
      XLSX.utils.book_append_sheet(wb, wsSiswa, "Tunggakan Siswa");
      sheetCount++;

      // 3. Sheet Tunggakan Per Kelas
      const targetKelas = tunggakanKelas.filter((k) => {
        const matchTa = selectedTa === "all" || k.tahun_ajaran_id === selectedTa || k.semester_id === selectedTa;
        const matchRombel = !targetRombel || k.kelas === targetRombel;
        return matchTa && matchRombel;
      });

      const rowsKelas = targetKelas.map((k, idx) => ({
        "No": idx + 1,
        "Nama Kelas": k.kelas,
        "Tahun Ajaran": k.tahun_ajaran || "-",
        "Jumlah Siswa Menunggak": k.jumlah_siswa,
        "Total Tunggakan (Rp)": Number(k.total_tunggakan),
      }));

      const wsKelas = XLSX.utils.json_to_sheet(rowsKelas.length > 0 ? rowsKelas : [{ Info: "Tidak ada data tunggakan kelas" }]);
      XLSX.utils.book_append_sheet(wb, wsKelas, "Tunggakan Per Kelas");
      sheetCount++;

      // 4. Sheet Rekap Bulanan
      const rowsBulanan = rekapBulanan.map((b, idx) => ({
        "No": idx + 1,
        "Bulan & Tahun": b.bulan_tahun,
        "Total Penerimaan Kas (Rp)": Number(b.nominal),
      }));

      const wsBulanan = XLSX.utils.json_to_sheet(rowsBulanan.length > 0 ? rowsBulanan : [{ Info: "Tidak ada data penerimaan bulanan" }]);
      XLSX.utils.book_append_sheet(wb, wsBulanan, "Rekap Kas Bulanan");
      sheetCount++;

      const safeSchool = schoolName.replace(/[^a-zA-Z0-9]/g, "_");
      const safeTa = taLabel.replace(/[^a-zA-Z0-9]/g, "_");
      const safeFilter = targetRombel ? `_Kelas_${targetRombel.replace(/[^a-zA-Z0-9]/g, "_")}` : `_${safeTa}`;
      const fileName = `Laporan_Keuangan_SPP_${safeSchool}${safeFilter}_${exportDate}.xlsx`;

      XLSX.writeFile(wb, fileName);
      setIsExportModalOpen(false);
      setIsExporting(false);
      Swal.fire("Berhasil", `Laporan Excel ${fileName} berhasil diexport.`, "success");
    } catch (err: any) {
      setIsExporting(false);
      Swal.fire("Gagal", "Terjadi kesalahan saat mengekspor data ke Excel.", "error");
    }
  };

  // Print Report Function
  const handlePrintReport = (targetTa?: string, targetRombel?: string) => {
    const selectedTa = targetTa || (exportBerdasarkan === "tahun-ajaran" ? exportTahunAjaran : "all");
    const filterRombel = targetRombel !== undefined ? targetRombel : (exportBerdasarkan === "kelas" ? exportSelectedRombel : "");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      Swal.fire("Gagal", "Popup blocker aktif. Mohon izinkan popup untuk mencetak.", "error");
      return;
    }

    const schoolName = (sekolah as any)?.nama || (sekolah as any)?.nama_sekolah || "SMK SIMAK";
    const npsn = (sekolah as any)?.npsn || "-";
    const alamat = (sekolah as any)?.alamat_jalan || (sekolah as any)?.alamat || "";
    const todayFormatted = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const selectedSemesterObj = rekapTahunPelajaran.find((r) => r.semester_id === selectedTa);
    const taLabel = selectedTa === "all" ? "Semua Periode / Tahun Ajaran" : (selectedSemesterObj?.label || selectedTa);
    const subtitleFilter = filterRombel ? `Kelas: ${filterRombel}` : `Periode: ${taLabel}`;

    const targetRekap = selectedTa === "all" ? rekapTahunPelajaran : rekapTahunPelajaran.filter((r) => r.semester_id === selectedTa);
    const targetSiswa = tunggakanSiswa.filter((s) => {
      const matchTa = selectedTa === "all" || s.tahun_ajaran_id === selectedTa || s.semester_id === selectedTa;
      const matchRombel = !filterRombel || s.kelas === filterRombel;
      return matchTa && matchRombel;
    });
    const targetKelas = tunggakanKelas.filter((k) => {
      const matchTa = selectedTa === "all" || k.tahun_ajaran_id === selectedTa || k.semester_id === selectedTa;
      const matchRombel = !filterRombel || k.kelas === filterRombel;
      return matchTa && matchRombel;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Keuangan & SPP - ${schoolName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; margin: 20px; color: #1e293b; }
          .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
          .kop h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
          .kop h3 { margin: 2px 0; font-size: 14px; font-weight: normal; }
          .kop p { margin: 2px 0; font-size: 10px; color: #64748b; }
          .title { text-align: center; margin-bottom: 20px; }
          .title h3 { margin: 0; font-size: 14px; text-transform: uppercase; font-weight: bold; }
          .title p { margin: 3px 0 0 0; font-size: 11px; color: #475569; }
          .section-title { font-size: 12px; font-weight: bold; background-color: #f1f5f9; padding: 6px 10px; margin: 20px 0 8px 0; border-left: 4px solid #3b82f6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 5px 8px; }
          th { background-color: #f8fafc; font-weight: bold; text-align: left; }
          .text-center { text-align: center; }
          .text-end { text-align: right; }
          .text-red { color: #dc2626; font-weight: bold; }
          .text-green { color: #16a34a; font-weight: bold; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; }
          .ttd { text-align: center; width: 200px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="kop">
          <h2>${schoolName}</h2>
          <h3>NPSN: ${npsn}</h3>
          <p>${alamat}</p>
        </div>

        <div class="title">
          <h3>LAPORAN KEUANGAN & REKAPITULASI SPP</h3>
          <p>${subtitleFilter} | Dicetak pada: ${todayFormatted}</p>
        </div>

        <div class="section-title">I. REKAPITULASI PEMBAYARAN PER TAHUN AJARAN & KELAS</div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 30px;">No</th>
              <th>Tahun Ajaran / Rombel</th>
              <th class="text-center">Jumlah Siswa</th>
              <th class="text-end">Target Tagihan</th>
              <th class="text-end">Total Terbayar</th>
              <th class="text-end">Sisa Tunggakan</th>
              <th class="text-center">Ketercapaian</th>
            </tr>
          </thead>
          <tbody>
            ${targetRekap.length === 0 ? '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>' : targetRekap.map((r, idx) => `
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td class="text-center">${idx + 1}</td>
                <td>${r.label}</td>
                <td class="text-center">${r.jumlah_siswa} Siswa</td>
                <td class="text-end">${formatCurrency(r.total_target)}</td>
                <td class="text-end text-green">${formatCurrency(r.total_pembayaran)}</td>
                <td class="text-end text-red">${formatCurrency(r.total_tunggakan)}</td>
                <td class="text-center">${r.persentase}%</td>
              </tr>
              ${(r.rombel_breakdown || []).filter((rb: any) => !filterRombel || rb.rombel_nama === filterRombel).map((rb: any) => `
                <tr>
                  <td></td>
                  <td style="padding-left: 20px;">└─ ${rb.rombel_nama}</td>
                  <td class="text-center">${rb.jumlah_siswa} Siswa</td>
                  <td class="text-end">${formatCurrency(rb.target_tagihan)}</td>
                  <td class="text-end">${formatCurrency(rb.total_terbayar)}</td>
                  <td class="text-end text-red">${formatCurrency(rb.sisa_tunggakan)}</td>
                  <td class="text-center">${rb.persentase}%</td>
                </tr>
              `).join('')}
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">II. REKAPITULASI TUNGGAKAN PER KELAS</div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 30px;">No</th>
              <th>Nama Kelas</th>
              <th>Tahun Ajaran</th>
              <th class="text-center">Jumlah Siswa Menunggak</th>
              <th class="text-end">Total Tunggakan</th>
            </tr>
          </thead>
          <tbody>
            ${targetKelas.length === 0 ? '<tr><td colspan="5" class="text-center">Tidak ada tunggakan kelas</td></tr>' : targetKelas.map((k, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${k.kelas}</td>
                <td>${k.tahun_ajaran || '-'}</td>
                <td class="text-center">${k.jumlah_siswa} Siswa</td>
                <td class="text-end text-red">${formatCurrency(k.total_tunggakan)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${targetSiswa.length > 0 ? `
        <div class="section-title">III. DAFTAR TUNGGAKAN SISWA</div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 30px;">No</th>
              <th>NISN</th>
              <th>Nama Peserta Didik</th>
              <th>Kelas</th>
              <th>Tagihan</th>
              <th class="text-end">Total Tagihan</th>
              <th class="text-end">Terbayar</th>
              <th class="text-end">Sisa Tunggakan</th>
            </tr>
          </thead>
          <tbody>
            ${targetSiswa.slice(0, 100).map((s, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${s.nisn || '-'}</td>
                <td>${s.nama}</td>
                <td>${s.kelas || '-'}</td>
                <td>${s.nama_tagihan || '-'}</td>
                <td class="text-end">${formatCurrency(s.nominal_tagihan)}</td>
                <td class="text-end text-green">${formatCurrency(s.nominal_terbayar)}</td>
                <td class="text-end text-red">${formatCurrency(s.sisa_tunggakan)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">
          <div class="ttd">
            <p>Mengetahui,<br>Kepala Sekolah</p>
            <br><br><br>
            <p><strong>( ..................................... )</strong></p>
          </div>
          <div class="ttd">
            <p>Bendahara Sekolah / Petugas</p>
            <br><br><br>
            <p><strong>( ..................................... )</strong></p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setIsExportModalOpen(false);
  };

  const handleExecuteExport = () => {
    if (exportFormat === "pdf") {
      handlePrintReport(
        exportBerdasarkan === "tahun-ajaran" ? exportTahunAjaran : undefined,
        exportBerdasarkan === "kelas" ? exportSelectedRombel : undefined
      );
    } else {
      handlePerformExport(
        exportBerdasarkan === "tahun-ajaran" ? exportTahunAjaran : undefined,
        "all",
        exportBerdasarkan === "kelas" ? exportSelectedRombel : undefined
      );
    }
  };

  // Helper formatting currency
  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(val));
  };

  // Helper date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return formatDateDMY(dateString);
  };

  // Helper tipe tagihan
  const getTipeLabel = (tipe: number) => {
    if (tipe === 1) return "Bulanan";
    if (tipe === 2) return "Tahunan";
    if (tipe === 3) return "Sekali Bayar";
    return "Lainnya";
  };



  // Helper jenis transaksi
  const getJenisTxLabel = (t: number) => {
    const list = {
      1: "Pembayaran",
      2: "Beasiswa",
      3: "Denda",
      4: "Pengurangan",
      5: "Pengembalian Dana"
    };
    return (list as any)[t] || "Lainnya";
  };

  // Helper status badge
  const getStatusBadge = (s: number) => {
    if (s === 3) return <Badge color="success">Lunas</Badge>;
    if (s === 2) return <Badge color="warning">Sebagian</Badge>;
    return <Badge color="error">Belum Bayar</Badge>;
  };

  // Helper to group bills by student
  const getGroupedTagihan = (list: any[]) => {
    const groupedMap: Record<string, any> = {};

    list.forEach((item) => {
      const studentId = item.peserta_didik_id;
      if (!groupedMap[studentId]) {
        groupedMap[studentId] = {
          peserta_didik_id: studentId,
          peserta_didik: item.peserta_didik,
          tahun_ajaran: item.tahun_ajaran,
          tahun_ajaran_id: item.tahun_ajaran_id,
          nominal_tagihan: BigInt(0),
          nominal_terbayar: BigInt(0),
          spps: [],
        };
      }

      groupedMap[studentId].nominal_tagihan += BigInt(item.nominal_tagihan);
      groupedMap[studentId].nominal_terbayar += BigInt(item.nominal_terbayar);
      groupedMap[studentId].spps.push(item);
    });

    return Object.values(groupedMap).map((student) => {
      const totalTagihan = student.nominal_tagihan;
      const totalTerbayar = student.nominal_terbayar;
      const sisa = totalTagihan - totalTerbayar;

      let status = 1; // Belum Bayar
      const allLunas = student.spps.every((s: any) => s.status === 3);
      const allBelum = student.spps.every((s: any) => s.status === 1);
      if (allLunas) {
        status = 3;
      } else if (allBelum) {
        status = 1;
      } else {
        status = 2; // Sebagian
      }

      const billNames = student.spps
        .map((s: any) => s.pengaturan_tagihan?.nama_tagihan)
        .filter(Boolean)
        .join(", ");

      return {
        ...student,
        nominal_tagihan: totalTagihan.toString(),
        nominal_terbayar: totalTerbayar.toString(),
        sisa: sisa.toString(),
        status,
        nama_tagihan: billNames,
      };
    });
  };

  // Filter student bills
  const filteredTagihan = tagihanList.filter((item) => {
    const matchSearch =
      item.peserta_didik?.nama?.toLowerCase().includes(searchTagihan.toLowerCase()) ||
      item.peserta_didik?.nisn?.toLowerCase().includes(searchTagihan.toLowerCase()) ||
      item.pengaturan_tagihan?.nama_tagihan?.toLowerCase().includes(searchTagihan.toLowerCase());

    const matchStatus = filterStatusTagihan === "" || item.status === Number(filterStatusTagihan);

    const matchTahunAjaran =
      filterTahunAjaranTagihan === "all" ||
      !filterTahunAjaranTagihan ||
      item.tahun_ajaran_id === filterTahunAjaranTagihan ||
      item.semester_id === filterTahunAjaranTagihan;

    return matchSearch && matchStatus && matchTahunAjaran;
  });

  const groupedTagihan = getGroupedTagihan(filteredTagihan);

  const totalPages = Math.ceil(groupedTagihan.length / itemsPerPage) || 1;
  const paginatedTagihan = groupedTagihan.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTagihan, filterStatusTagihan, filterTahunAjaranTagihan, itemsPerPage]);

  // Laporan filtered data & computations
  const filteredTunggakanSiswa = tunggakanSiswa.filter((s) => {
    const matchSearch =
      s.nama?.toLowerCase().includes(searchTunggakanSiswa.toLowerCase()) ||
      s.nisn?.toLowerCase().includes(searchTunggakanSiswa.toLowerCase()) ||
      s.nama_tagihan?.toLowerCase().includes(searchTunggakanSiswa.toLowerCase());
    const matchKelas = !filterTunggakanKelas || s.kelas === filterTunggakanKelas;
    const matchSemester =
      filterTunggakanSiswaSemester === "all" ||
      !filterTunggakanSiswaSemester ||
      s.semester_id === filterTunggakanSiswaSemester;
    return matchSearch && matchKelas && matchSemester;
  });

  const totalTunggakanSiswaPages = Math.ceil(filteredTunggakanSiswa.length / tunggakanSiswaPerPage) || 1;
  const paginatedTunggakanSiswa = filteredTunggakanSiswa.slice(
    (tunggakanSiswaPage - 1) * tunggakanSiswaPerPage,
    tunggakanSiswaPage * tunggakanSiswaPerPage
  );

  const uniqueTunggakanKelas = Array.from(new Set(tunggakanSiswa.map((t) => t.kelas).filter(Boolean)));
  const allAvailableKelas = Array.from(
    new Set([
      ...rombelList.map((r: any) => r.nama),
      ...tunggakanKelas.map((k: any) => k.kelas),
      ...tunggakanSiswa.map((s: any) => s.kelas),
    ].filter(Boolean))
  );

  const filteredTunggakanKelas = tunggakanKelas.filter((k) => {
    const matchSemester =
      filterTunggakanKelasSemester === "all" ||
      !filterTunggakanKelasSemester ||
      k.semester_id === filterTunggakanKelasSemester;
    const matchSearch =
      !searchTunggakanKelas ||
      k.kelas?.toLowerCase().includes(searchTunggakanKelas.toLowerCase()) ||
      k.tahun_ajaran?.toLowerCase().includes(searchTunggakanKelas.toLowerCase());
    return matchSemester && matchSearch;
  });

  const totalTargetSekolah = rekapTahunPelajaran.reduce(
    (acc, r) => acc + BigInt(r.total_target || "0"),
    BigInt(0)
  ).toString();

  const totalTunggakanSekolah = rekapTahunPelajaran.reduce(
    (acc, r) => acc + BigInt(r.total_tunggakan || "0"),
    BigInt(0)
  ).toString();

  const activeSemesterRekap =
    selectedSemesterId === "all"
      ? null
      : rekapTahunPelajaran.find((r) => r.semester_id === selectedSemesterId);

  const handleOpenRombelModal = (config: any) => {
    setSelectedConfig(config);
    setIsRombelModalOpen(true);
  };

  const handleOpenTransaksiModal = (tagihan: any) => {
    setSelectedTagihan(tagihan);
    setSelectedSubSpp(tagihan.spps?.[0] || null);
    setIsTransaksiModalOpen(true);
  };

  // Tab title mapping
  const tabTitles: Record<string, string> = {
    pengaturan: "Pengaturan Tagihan",
    tagihan: "Tagihan SPP",
    laporan: "Laporan & Rekap",
  };

  return (
    <>
      <PageMeta title="Manajemen Keuangan & SPP" description="Dashboard pengelolaan tagihan SPP dan riwayat pembayaran peserta didik." />
      <div className="space-y-6">
        {/* Header Section matching standard GTK/Student template */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {tabTitles[activeTab] || "Keuangan & SPP"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sekolah: <span className="font-semibold text-gray-700 dark:text-gray-200">{sekolah?.nama || "SIMAK"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "pengaturan" && (
              <Button
                variant="outline"
                size="sm"
                startIcon={<PlusIcon className="size-4 fill-current" />}
                onClick={() => setIsConfigModalOpen(true)}
              >
                Tambah Pengaturan
              </Button>
            )}
            <Button
              variant="success-outline"
              size="sm"
              className="min-w-[110px]"
              startIcon={<DownloadIcon className="size-4" />}
              onClick={() => {
                if (activeTab === "laporan") {
                  if (rekapSubTab === "tahun-ajaran" && selectedSemesterId !== "all") {
                    setExportTahunAjaran(selectedSemesterId);
                  } else if (rekapSubTab === "tunggakan-siswa" && filterTunggakanSiswaSemester !== "all") {
                    setExportTahunAjaran(filterTunggakanSiswaSemester);
                  } else if (rekapSubTab === "tunggakan-kelas" && filterTunggakanKelasSemester !== "all") {
                    setExportTahunAjaran(filterTunggakanKelasSemester);
                  } else {
                    setExportTahunAjaran("all");
                  }
                } else if (activeTab === "tagihan") {
                  if (filterTahunAjaranTagihan !== "all") {
                    setExportTahunAjaran(filterTahunAjaranTagihan);
                  } else {
                    setExportTahunAjaran("all");
                  }
                }
                setIsExportModalOpen(true);
              }}
            >
              Export
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 print-area">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* =================================== */}
            {/* TAB 1: PENGATURAN TAGIHAN */}
            {/* =================================== */}
            {activeTab === "pengaturan" && (
              <ComponentCard title="Daftar Master Pengaturan Tagihan">
                {pengaturanList.length === 0 ? (
                  <p className="text-center py-6 text-gray-500">Belum ada pengaturan tagihan yang dikonfigurasi.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Tagihan</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nominal</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tipe</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Rombel Terhubung</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {pengaturanList.map((item) => (
                          <TableRow key={item.pengaturan_tagihan_id} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                            <TableCell className="px-5 py-3.5 font-medium text-gray-800 dark:text-white/80 text-sm">
                              {item.nama_tagihan}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                              {formatCurrency(item.nominal)}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{getTipeLabel(item.tipe)}</TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                              {item.aktif ? (
                                <Badge color="success">Aktif</Badge>
                              ) : (
                                <Badge color="error">Tidak Aktif</Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">
                              <div className="flex flex-wrap gap-1">
                                {item.pengaturan_rombel.length === 0 ? (
                                  <span className="text-xs italic text-gray-400">Belum ada kelas</span>
                                ) : (
                                  item.pengaturan_rombel.map((r: any) => (
                                    <span key={r.pengaturan_tagihan_rombel_id} className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-400">
                                      {r.rombongan_belajar?.nama}
                                    </span>
                                  ))
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRombelModal(item)}
                              >
                                Kelola Kelas
                              </Button>
                              {item.aktif && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleGenerateTagihan(item)}
                                >
                                  Generate Tagihan
                                </Button>
                              )}
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 p-1.5 inline-flex items-center justify-center rounded-lg transition-colors border border-gray-200 dark:border-gray-850 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                                title="Edit Pengaturan"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteConfig(item.pengaturan_tagihan_id)}
                                className="text-gray-500 hover:text-red-500 p-1.5 inline-flex items-center justify-center rounded-lg transition-colors border border-gray-200 dark:border-gray-850 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                                title="Hapus Pengaturan"
                              >
                                <TrashBinIcon className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </ComponentCard>
            )}

            {/* =================================== */}
            {/* TAB 2: TAGIHAN SPP SISWA */}
            {/* =================================== */}
            {activeTab === "tagihan" && (
              <div className="space-y-6">
                {/* Search & Filter bar matching standard template */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
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
                        placeholder="Cari peserta didik, NISN, atau nama tagihan..."
                        value={searchTagihan}
                        onChange={(e) => setSearchTagihan(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="w-full sm:w-44">
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-2.5 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                        value={filterStatusTagihan}
                        onChange={(e) => setFilterStatusTagihan(e.target.value)}
                      >
                        <option value="">Semua Status</option>
                        <option value="1">Belum Bayar</option>
                        <option value="2">Sebagian</option>
                        <option value="3">Lunas</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-52">
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-2.5 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                        value={filterTahunAjaranTagihan}
                        onChange={(e) => setFilterTahunAjaranTagihan(e.target.value)}
                      >
                        <option value="all">Semua Tahun Ajaran</option>
                        {rekapTahunPelajaran.map((r) => (
                          <option key={r.semester_id} value={r.semester_id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <ComponentCard title="Daftar Tagihan SPP Peserta Didik">
                  {filteredTagihan.length === 0 ? (
                    <p className="text-center py-6 text-gray-500">Tidak ada data tagihan SPP ditemukan.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table className="w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                            <TableRow>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Peserta Didik</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">NISN</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Kelas</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tahun Ajaran</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Tagihan</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Total Tagihan</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Terbayar</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Sisa</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-right text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {paginatedTagihan.map((item) => {
                              const sisa = BigInt(item.nominal_tagihan) - BigInt(item.nominal_terbayar);
                              return (
                                <TableRow key={item.peserta_didik_id} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                                  <TableCell className="px-5 py-3.5 font-medium text-gray-800 dark:text-white/85 text-sm">
                                    {item.peserta_didik?.nama}
                                  </TableCell>
                                  <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{item.peserta_didik?.nisn || "-"}</TableCell>
                                  <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{item.peserta_didik?.rombongan_belajar?.nama || "-"}</TableCell>
                                  <TableCell className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                                      {item.tahun_ajaran || "-"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-5 py-3.5 text-sm text-gray-850 dark:text-white/80">{item.nama_tagihan}</TableCell>
                                  <TableCell className="px-5 py-3.5 font-medium text-gray-800 dark:text-white/80 text-sm">
                                    {formatCurrency(item.nominal_tagihan)}
                                  </TableCell>
                                  <TableCell className="px-5 py-3.5 font-medium text-green-600 dark:text-green-400 text-sm">
                                    {formatCurrency(item.nominal_terbayar)}
                                  </TableCell>
                                  <TableCell className="px-5 py-3.5 font-medium text-red-500 dark:text-red-400 text-sm">
                                    {formatCurrency(sisa.toString())}
                                  </TableCell>
                                  <TableCell className="px-5 py-3.5 text-center">{getStatusBadge(item.status)}</TableCell>
                                  <TableCell className="px-5 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleOpenTransaksiModal(item)}
                                      >
                                        Kelola Transaksi
                                      </Button>
                                      {BigInt(item.nominal_terbayar) === BigInt(0) && (
                                        <button
                                          onClick={() => handleDeleteStudentTagihan(item)}
                                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-2 inline-flex items-center justify-center rounded-lg transition-colors border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                                          title="Hapus Tagihan (Belum Bayar)"
                                        >
                                          <TrashBinIcon className="w-4 h-4" />
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
              </div>
            )}

            {/* =================================== */}
            {/* TAB 3: LAPORAN & REKAPITULASI */}
            {/* =================================== */}
            {activeTab === "laporan" && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3.5 shadow-sm">
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-500">
                      <BoxIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Pembayaran Terkumpul</p>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                        {formatCurrency(totalPembayaran)}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3.5 shadow-sm">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500">
                      <TableIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Target Tagihan</p>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                        {formatCurrency(totalTargetSekolah)}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3.5 shadow-sm">
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500">
                      <BoxIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Sisa Tunggakan</p>
                      <h4 className="text-lg font-bold text-red-600 dark:text-red-400 mt-0.5">
                        {formatCurrency(totalTunggakanSekolah)}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3.5 shadow-sm">
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500">
                      <TableIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Beasiswa Disalurkan</p>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                        {formatCurrency(totalBeasiswa)}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Sub-tab Navigation Pill */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 no-print">
                  <button
                    type="button"
                    onClick={() => setRekapSubTab("tahun-ajaran")}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 ${
                      rekapSubTab === "tahun-ajaran"
                        ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    🎓 Per Tahun Ajaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setRekapSubTab("tunggakan-siswa")}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 ${
                      rekapSubTab === "tunggakan-siswa"
                        ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    👤 Tunggakan Siswa ({tunggakanSiswa.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRekapSubTab("tunggakan-kelas")}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 ${
                      rekapSubTab === "tunggakan-kelas"
                        ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    🏫 Tunggakan Per Kelas ({tunggakanKelas.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRekapSubTab("bulanan")}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 ${
                      rekapSubTab === "bulanan"
                        ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    📅 Rekap Bulanan ({rekapBulanan.length})
                  </button>
                </div>

                {/* SUB-TAB 1: PER TAHUN AJARAN */}
                {rekapSubTab === "tahun-ajaran" && (
                  <div className="space-y-6">
                    {/* Filter Bar Per Tahun Ajaran */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-white">Pilih Periode Tahun Pelajaran</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pilih semester / tahun ajaran untuk melihat rincian keuangan dan ketercapaian per rombel.</p>
                      </div>
                      <div className="w-full sm:w-80">
                        <select
                          value={selectedSemesterId}
                          onChange={(e) => setSelectedSemesterId(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="all">Semua Tahun Pelajaran</option>
                          {rekapTahunPelajaran.map((r) => (
                            <option key={r.semester_id} value={r.semester_id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Jika melihat Semua Tahun Ajaran */}
                    {selectedSemesterId === "all" ? (
                      <ComponentCard title="Rekapitulasi Keuangan Per Tahun Pelajaran">
                        {rekapTahunPelajaran.length === 0 ? (
                          <p className="text-center py-6 text-gray-500">Belum ada riwayat per tahun pelajaran.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table className="w-full">
                              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                                <TableRow>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tahun Pelajaran / Semester</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Jumlah Siswa</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Target Tagihan</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Total Terbayar</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Sisa Tunggakan</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Ketercapaian</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rekapTahunPelajaran.map((r) => (
                                  <TableRow key={r.semester_id} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                                    <TableCell className="px-5 py-3.5 font-semibold text-gray-800 dark:text-white text-sm">
                                      {r.label}
                                    </TableCell>
                                    <TableCell className="px-5 py-3.5 text-center text-sm text-gray-600 dark:text-gray-300">
                                      {r.jumlah_siswa || 0} Siswa
                                    </TableCell>
                                    <TableCell className="px-5 py-3.5 text-end text-sm font-medium text-gray-800 dark:text-white">
                                      {formatCurrency(r.total_target || "0")}
                                    </TableCell>
                                    <TableCell className="px-5 py-3.5 text-end text-sm font-semibold text-green-600 dark:text-green-400">
                                      {formatCurrency(r.total_pembayaran || "0")}
                                    </TableCell>
                                    <TableCell className="px-5 py-3.5 text-end text-sm font-semibold text-red-500 dark:text-red-400">
                                      {formatCurrency(r.total_tunggakan || "0")}
                                    </TableCell>
                                    <TableCell className="px-5 py-3.5 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-20 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                          <div
                                            className="bg-brand-500 h-full rounded-full transition-all"
                                            style={{ width: `${Math.min(r.persentase || 0, 100)}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{r.persentase || 0}%</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-5 py-3.5 text-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedSemesterId(r.semester_id)}
                                      >
                                        Lihat Rincian Rombel
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </ComponentCard>
                    ) : (
                      /* Rincian Rombel untuk Semester Terpilih */
                      activeSemesterRekap && (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                Rincian Keuangan: {activeSemesterRekap.label}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Ketercapaian pelunasan dan tunggakan tagihan per rombongan belajar pada semester ini.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSemesterId("all")}
                            >
                              ← Semua Tahun Pelajaran
                            </Button>
                          </div>

                          <ComponentCard title={`Breakdown Kelas (${activeSemesterRekap.rombel_breakdown?.length || 0} Kelas)`}>
                            {(!activeSemesterRekap.rombel_breakdown || activeSemesterRekap.rombel_breakdown.length === 0) ? (
                              <p className="text-center py-6 text-gray-500">Tidak ada rincian kelas untuk tahun pelajaran ini.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table className="w-full">
                                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                                    <TableRow>
                                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Kelas</TableCell>
                                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Jumlah Siswa</TableCell>
                                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Target Tagihan</TableCell>
                                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Total Terbayar</TableCell>
                                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Sisa Tunggakan</TableCell>
                                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Persentase Lunas</TableCell>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {activeSemesterRekap.rombel_breakdown.map((rb: any) => (
                                      <TableRow key={rb.rombel_id} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                                        <TableCell className="px-5 py-3.5 font-semibold text-gray-800 dark:text-white text-sm">
                                          {rb.rombel_nama}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-center text-sm text-gray-600 dark:text-gray-300">
                                          {rb.jumlah_siswa} Siswa
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-end text-sm font-medium text-gray-800 dark:text-white">
                                          {formatCurrency(rb.target_tagihan)}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-end text-sm font-semibold text-green-600 dark:text-green-400">
                                          {formatCurrency(rb.total_terbayar)}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-end text-sm font-semibold text-red-500 dark:text-red-400">
                                          {formatCurrency(rb.sisa_tunggakan)}
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-center">
                                          <div className="flex items-center justify-center gap-2">
                                            <div className="w-20 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                              <div
                                                className="bg-brand-500 h-full rounded-full transition-all"
                                                style={{ width: `${Math.min(rb.persentase || 0, 100)}%` }}
                                              />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{rb.persentase || 0}%</span>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </ComponentCard>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* SUB-TAB 2: TUNGGAKAN SISWA */}
                {rekapSubTab === "tunggakan-siswa" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                      <div className="w-20">
                        <Select
                          options={rowsPerPageOptions}
                          defaultValue={tunggakanSiswaPerPage.toString()}
                          onChange={(value) => setTunggakanSiswaPerPage(parseInt(value))}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full sm:justify-end">
                        <div className="relative max-w-xs w-full">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon className="size-4" />
                          </span>
                          <Input
                            type="text"
                            placeholder="Cari siswa / NISN..."
                            value={searchTunggakanSiswa}
                            onChange={(e) => {
                              setSearchTunggakanSiswa(e.target.value);
                              setTunggakanSiswaPage(1);
                            }}
                            className="pl-9"
                          />
                        </div>
                        <div className="w-full sm:w-48">
                          <select
                            value={filterTunggakanKelas}
                            onChange={(e) => {
                              setFilterTunggakanKelas(e.target.value);
                              setTunggakanSiswaPage(1);
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-transparent py-2.5 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                          >
                            <option value="">Semua Kelas</option>
                            {uniqueTunggakanKelas.map((cls) => (
                              <option key={cls} value={cls}>
                                {cls}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full sm:w-56">
                          <select
                            value={filterTunggakanSiswaSemester}
                            onChange={(e) => {
                              setFilterTunggakanSiswaSemester(e.target.value);
                              setTunggakanSiswaPage(1);
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-transparent py-2.5 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                          >
                            <option value="all">Semua Tahun Pelajaran</option>
                            {rekapTahunPelajaran.map((r) => (
                              <option key={r.semester_id} value={r.semester_id}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <ComponentCard title={`Daftar Peserta Didik Menunggak (${filteredTunggakanSiswa.length} Siswa)`}>
                      {filteredTunggakanSiswa.length === 0 ? (
                        <p className="text-center py-6 text-gray-500">Tidak ada tunggakan peserta didik yang sesuai filter.</p>
                      ) : (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <Table className="w-full">
                              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                                <TableRow>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Siswa</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">NISN</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Kelas</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tahun Pelajaran</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Tagihan</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Tagihan</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Terbayar</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Sisa Tunggakan</TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedTunggakanSiswa.map((t, idx) => (
                                  <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                                    <TableCell className="px-5 py-3.5 font-medium text-gray-800 dark:text-white/85 text-sm">{t.nama}</TableCell>
                                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{t.nisn || "-"}</TableCell>
                                    <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-semibold">{t.kelas || "-"}</TableCell>
                                    <TableCell className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                        {t.tahun_ajaran || "-"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{t.nama_tagihan}</TableCell>
                                    <TableCell className="px-5 py-3.5 text-end text-sm text-gray-800 dark:text-white/80">{formatCurrency(t.nominal_tagihan)}</TableCell>
                                    <TableCell className="px-5 py-3.5 text-end text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(t.nominal_terbayar)}</TableCell>
                                    <TableCell className="px-5 py-3.5 text-end text-sm font-bold text-red-500 dark:text-red-400">{formatCurrency(t.sisa_tunggakan)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <Pagination
                            currentPage={tunggakanSiswaPage}
                            totalPages={totalTunggakanSiswaPages}
                            onPageChange={(p) => setTunggakanSiswaPage(p)}
                          />
                        </div>
                      )}
                    </ComponentCard>
                  </div>
                )}

                {/* SUB-TAB 3: TUNGGAKAN KELAS */}
                {rekapSubTab === "tunggakan-kelas" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                      <div className="relative max-w-xs w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <SearchIcon className="size-4" />
                        </span>
                        <Input
                          type="text"
                          placeholder="Cari nama kelas..."
                          value={searchTunggakanKelas}
                          onChange={(e) => setSearchTunggakanKelas(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="w-full sm:w-80">
                        <select
                          value={filterTunggakanKelasSemester}
                          onChange={(e) => setFilterTunggakanKelasSemester(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-transparent py-2.5 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                        >
                          <option value="all">Semua Tahun Pelajaran</option>
                          {rekapTahunPelajaran.map((r) => (
                            <option key={r.semester_id} value={r.semester_id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <ComponentCard title={`Total Tunggakan Per Kelas (${filteredTunggakanKelas.length} Kelas)`}>
                      {filteredTunggakanKelas.length === 0 ? (
                        <p className="text-center py-6 text-gray-500">Tidak ada data tunggakan per kelas yang sesuai filter.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table className="w-full">
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                              <TableRow>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Kelas</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tahun Pelajaran / Semester</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Jumlah Siswa Menunggak</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Total Tunggakan</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {filteredTunggakanKelas.map((t, idx) => (
                                <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                                  <TableCell className="px-5 py-3.5 font-bold text-gray-800 dark:text-white text-sm">{t.kelas}</TableCell>
                                  <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    <span className="inline-block px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                      {t.tahun_ajaran || "Tanpa Semester"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-5 py-3.5 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t.jumlah_siswa || 0} Siswa
                                  </TableCell>
                                  <TableCell className="px-5 py-3.5 text-end text-red-500 dark:text-red-400 font-bold text-sm">
                                    {formatCurrency(t.total_tunggakan)}
                                  </TableCell>
                                  <TableCell className="px-5 py-3.5 text-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setFilterTunggakanKelas(t.kelas);
                                        if (t.semester_id && t.semester_id !== "unassigned") {
                                          setFilterTunggakanSiswaSemester(t.semester_id);
                                        } else {
                                          setFilterTunggakanSiswaSemester("all");
                                        }
                                        setRekapSubTab("tunggakan-siswa");
                                      }}
                                    >
                                      Lihat Siswa
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </ComponentCard>
                  </div>
                )}

                {/* SUB-TAB 4: BULANAN */}
                {rekapSubTab === "bulanan" && (
                  <ComponentCard title="Rekapitulasi Pembayaran Per Bulan">
                    {rekapBulanan.length === 0 ? (
                      <p className="text-center py-6 text-gray-500">Belum ada riwayat transaksi bulanan.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table className="w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                            <TableRow>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Bulan & Tahun</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-end text-xs dark:text-gray-400 whitespace-nowrap">Total Penerimaan</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rekapBulanan.map((r, idx) => (
                              <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                                <TableCell className="px-5 py-3.5 font-semibold text-gray-800 dark:text-white text-sm">
                                  {r.bulan_tahun}
                                </TableCell>
                                <TableCell className="px-5 py-3.5 text-end text-green-600 dark:text-green-400 font-bold text-sm">
                                  {formatCurrency(r.nominal)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </ComponentCard>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* =================================== */}
      {/* MODAL 1: TAMBAH MASTER TAGIHAN */}
      {/* =================================== */}
      <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} className="max-w-[500px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Tambah Master Pengaturan Tagihan</h3>
        <form onSubmit={handleCreateConfig} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nama Tagihan</label>
            <Input
              type="text"
              placeholder="Contoh: SPP Reguler Kelas X"
              value={configForm.nama_tagihan}
              onChange={(e) => setConfigForm({ ...configForm, nama_tagihan: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Nominal Tagihan (Rupiah)</label>
            <Input
              type="number"
              placeholder="Contoh: 150000"
              value={configForm.nominal}
              onChange={(e) => setConfigForm({ ...configForm, nominal: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Tipe Tagihan</label>
            <select
              value={configForm.tipe}
              onChange={(e) => setConfigForm({ ...configForm, tipe: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
            >
              <option value={1}>Bulanan</option>
              <option value={2}>Tahunan</option>
              <option value={3}>Sekali Bayar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Status Aktif</label>
            <select
              value={configForm.aktif ? "true" : "false"}
              onChange={(e) => setConfigForm({ ...configForm, aktif: e.target.value === "true" })}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
            >
              <option value="true">Aktif</option>
              <option value="false">Tidak Aktif</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsConfigModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================== */}
      {/* MODAL 1.5: EDIT MASTER TAGIHAN */}
      {/* =================================== */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingConfig(null); }} className="max-w-[500px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Edit Master Pengaturan Tagihan</h3>
        <form onSubmit={handleUpdateConfig} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nama Tagihan</label>
            <Input
              type="text"
              placeholder="Contoh: SPP Reguler Kelas X"
              value={editForm.nama_tagihan}
              onChange={(e) => setEditForm({ ...editForm, nama_tagihan: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Nominal Tagihan (Rupiah)</label>
            <Input
              type="number"
              placeholder="Contoh: 150000"
              value={editForm.nominal}
              onChange={(e) => setEditForm({ ...editForm, nominal: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Tipe Tagihan</label>
            <select
              value={editForm.tipe}
              onChange={(e) => setEditForm({ ...editForm, tipe: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
            >
              <option value={1}>Bulanan</option>
              <option value={2}>Tahunan</option>
              <option value={3}>Sekali Bayar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Status Aktif</label>
            <select
              value={editForm.aktif ? "true" : "false"}
              onChange={(e) => setEditForm({ ...editForm, aktif: e.target.value === "true" })}
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
            >
              <option value="true">Aktif</option>
              <option value="false">Tidak Aktif</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" size="sm" type="button" onClick={() => { setIsEditModalOpen(false); setEditingConfig(null); }}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================== */}
      {/* MODAL 2: KELOLA KELAS TERHUBUNG */}
      {/* =================================== */}
      <Modal isOpen={isRombelModalOpen} onClose={() => { setIsRombelModalOpen(false); setConfirmDeleteId(null); setSelectedRombelIds([]); setSearchRombel(""); setRombelNotif(null); }} className="max-w-[600px] p-6 bg-white dark:bg-gray-900 rounded-3xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Kelola Kelas Terhubung</h3>
        <p className="text-xs text-gray-500 mb-4">Tagihan: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedConfig?.nama_tagihan}</span></p>

        {/* Toast notification inside modal */}
        {rombelNotif && (
          <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            rombelNotif.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
          }`}>
            <span>{rombelNotif.type === "success" ? "✓" : "✕"}</span>
            <span>{rombelNotif.message}</span>
          </div>
        )}

        {/* Daftar Kelas Terhubung */}
        <div className="mb-5">
          <label className="block text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Kelas yang Sudah Terhubung</label>
          {selectedConfig?.pengaturan_rombel?.length === 0 ? (
            <p className="text-xs italic text-gray-400 py-3 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">Belum ada kelas terhubung.</p>
          ) : (
            <div className="max-h-[180px] overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
              {selectedConfig?.pengaturan_rombel?.map((r: any) => (
                <div key={r.pengaturan_tagihan_rombel_id} className="flex items-center justify-between px-3 py-2.5 text-xs">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {r.rombongan_belajar?.nama}
                  </span>
                  {confirmDeleteId === r.pengaturan_tagihan_rombel_id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Yakin hapus?</span>
                      <button
                        type="button"
                        onClick={() => handleUnlinkRombel(r.pengaturan_tagihan_rombel_id)}
                        disabled={loadingRombel}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-gray-500 hover:text-gray-700 font-semibold"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(r.pengaturan_tagihan_rombel_id)}
                      className="text-red-500 hover:text-red-700 font-semibold transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mb-4">
          <label className="block text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Hubungkan Kelas Baru</label>
          {/* Search rombel */}
          <div className="relative mb-3">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama kelas..."
              className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-3 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              value={searchRombel}
              onChange={(e) => setSearchRombel(e.target.value)}
            />
          </div>

          {/* Multi-select checkbox list */}
          {(() => {
            const linkedIds = new Set(selectedConfig?.pengaturan_rombel?.map((r: any) => r.rombongan_belajar_id) || []);
            const availableRombel = rombelList
              .filter((r) => !linkedIds.has(r.rombongan_belajar_id))
              .filter((r) => searchRombel === "" || r.nama?.toLowerCase().includes(searchRombel.toLowerCase()));

            if (availableRombel.length === 0) {
              return <p className="text-xs italic text-gray-400 py-3 text-center">Semua kelas sudah terhubung atau tidak ditemukan.</p>;
            }

            return (
              <div className="max-h-[200px] overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-50 dark:divide-gray-800">
                {availableRombel.map((r) => {
                  const isChecked = selectedRombelIds.includes(r.rombongan_belajar_id);
                  return (
                    <label
                      key={r.rombongan_belajar_id}
                      className={`flex items-center gap-3 px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-brand-50 dark:bg-brand-950/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedRombelIds((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== r.rombongan_belajar_id)
                              : [...prev, r.rombongan_belajar_id]
                          );
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="font-medium text-gray-800 dark:text-gray-200">{r.nama}</span>
                      <span className="text-gray-400 text-[10px]">({r.jurusan_id_str || "Reguler"})</span>
                    </label>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            {selectedRombelIds.length > 0 && (
              <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
                {selectedRombelIds.length} kelas dipilih
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsRombelModalOpen(false); setConfirmDeleteId(null); setSelectedRombelIds([]); setSearchRombel(""); setRombelNotif(null); }}>
              Tutup
            </Button>
            {selectedRombelIds.length > 0 && (
              <Button variant="primary" size="sm" onClick={handleLinkRombel} disabled={loadingRombel}>
                {loadingRombel ? "Menghubungkan..." : `Hubungkan ${selectedRombelIds.length} Kelas`}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* =================================== */}
      {/* MODAL 3: KELOLA TRANSAKSI SPP */}
      {/* =================================== */}
      <Modal isOpen={isTransaksiModalOpen} onClose={() => { setIsTransaksiModalOpen(false); handleCancelEditTransaksi(); }} className="max-w-[700px] p-6 bg-white dark:bg-gray-900 rounded-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-850 dark:text-white mb-2">Riwayat & Pembayaran SPP</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2">
          <div>
            Peserta Didik: <span className="font-bold text-gray-800 dark:text-gray-250">{selectedTagihan?.peserta_didik?.nama}</span>
          </div>
          <div>
            NISN: <span className="font-semibold">{selectedTagihan?.peserta_didik?.nisn}</span>
          </div>
          <div>
            Kelas: <span className="font-semibold">{selectedTagihan?.peserta_didik?.rombongan_belajar?.nama || "-"}</span>
          </div>
          <div>
            Tagihan: <span className="font-semibold">{selectedSubSpp?.pengaturan_tagihan?.nama_tagihan || "-"}</span>
          </div>
          {selectedTagihan?.spps && selectedTagihan.spps.length > 1 && (
            <div className="col-span-2 mt-2">
              <label className="block text-[11px] font-semibold mb-1 text-gray-500 dark:text-gray-400">Pilih Tagihan</label>
              <select
                value={selectedSubSpp?.spp_id || ""}
                onChange={(e) => {
                  const sppId = e.target.value;
                  const found = selectedTagihan.spps.find((s: any) => s.spp_id === sppId);
                  setSelectedSubSpp(found || null);
                  handleCancelEditTransaksi();
                }}
                className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-xs text-gray-850 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              >
                {selectedTagihan.spps.map((s: any) => (
                  <option key={s.spp_id} value={s.spp_id}>
                    {s.pengaturan_tagihan?.nama_tagihan} ({formatCurrency(s.nominal_tagihan)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tagihan Summary Card */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-6 text-xs text-center">
          <div>
            <p className="text-gray-400">Total Tagihan</p>
            <p className="font-bold text-gray-800 dark:text-white mt-1">
              {selectedSubSpp && formatCurrency(selectedSubSpp.nominal_tagihan)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Total Terbayar</p>
            <p className="font-bold text-green-600 dark:text-green-450 mt-1">
              {selectedSubSpp && formatCurrency(selectedSubSpp.nominal_terbayar)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Sisa Tagihan</p>
            <p className="font-bold text-red-500 mt-1">
              {selectedSubSpp && formatCurrency(Number(selectedSubSpp.nominal_tagihan) - Number(selectedSubSpp.nominal_terbayar))}
            </p>
          </div>
        </div>

        {/* Left-Right split: Form and History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form catat/edit transaksi */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                {editingTxId ? "Edit Transaksi SPP" : "Catat Transaksi Baru"}
              </h4>
              {editingTxId && (
                <button
                  type="button"
                  onClick={handleCancelEditTransaksi}
                  className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                >
                  + Catat Baru
                </button>
              )}
            </div>

            {editingTxId && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>Sedang mengubah nominal / data transaksi</span>
                <button type="button" onClick={handleCancelEditTransaksi} className="font-bold hover:underline">Batal</button>
              </div>
            )}

            <form onSubmit={handleSaveTransaksi} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Jenis Transaksi</label>
                <select
                  value={transaksiForm.jenis_transaksi}
                  onChange={(e) => setTransaksiForm({ ...transaksiForm, jenis_transaksi: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-xs text-gray-850 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                >
                  <option value={1}>Pembayaran (Uang SPP)</option>
                  <option value={2}>Beasiswa</option>
                  <option value={4}>Pengurangan</option>
                  <option value={5}>Pengembalian Dana</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nominal Transaksi (Rupiah)</label>
                <Input
                  type="number"
                  placeholder="Contoh: 50000"
                  value={transaksiForm.nominal}
                  onChange={(e) => setTransaksiForm({ ...transaksiForm, nominal: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={transaksiForm.tanggal_transaksi}
                    onChange={(e) => setTransaksiForm({ ...transaksiForm, tanggal_transaksi: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                    required
                  />
                </div>

                {[1, 3].includes(transaksiForm.jenis_transaksi) && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Metode</label>
                    <select
                      value={transaksiForm.metode_pembayaran}
                      onChange={(e) => setTransaksiForm({ ...transaksiForm, metode_pembayaran: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-xs text-gray-850 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                    >
                      <option value={1}>Tunai</option>
                      <option value={2}>Transfer</option>
                      <option value={3}>QRIS</option>
                      <option value={4}>Virtual Account</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Keterangan</label>
                <textarea
                  placeholder="Keterangan transaksi (opsional)..."
                  value={transaksiForm.keterangan}
                  onChange={(e) => setTransaksiForm({ ...transaksiForm, keterangan: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90 h-16 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                {editingTxId && (
                  <Button variant="outline" size="sm" type="button" onClick={handleCancelEditTransaksi} className="flex-1">
                    Batal
                  </Button>
                )}
                <Button variant="primary" size="sm" type="submit" className={editingTxId ? "flex-1" : "w-full"}>
                  {editingTxId ? "Simpan Perubahan" : "Simpan Transaksi"}
                </Button>
              </div>
            </form>
          </div>

          {/* History list */}
          <div className="border-l border-gray-100 dark:border-gray-800 pl-0 md:pl-6">
            <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4">Riwayat Transaksi</h4>
            {selectedSubSpp?.riwayat_transaksi?.length === 0 ? (
              <p className="text-xs italic text-gray-400 py-6 text-center">Belum ada riwayat transaksi SPP.</p>
            ) : (
              <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                {selectedSubSpp?.riwayat_transaksi?.map((t: any) => (
                  <div
                    key={t.riwayat_transaksi_spp_id}
                    className={`p-3 border rounded-xl text-xs relative transition-all ${
                      editingTxId === t.riwayat_transaksi_spp_id
                        ? "border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 dark:border-brand-500 ring-1 ring-brand-500"
                        : "border-gray-100 dark:border-gray-800 bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {formatDate(t.tanggal_transaksi)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-50 text-gray-600 dark:bg-gray-900 border`}>
                          {getJenisTxLabel(t.jenis_transaksi)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEditTransaksi(t)}
                          className="text-gray-400 hover:text-brand-500 p-1 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Edit Transaksi"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaksi(t.riwayat_transaksi_spp_id, t.nominal)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Hapus Transaksi"
                        >
                          <TrashBinIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="font-bold text-gray-950 dark:text-white mt-1.5 text-sm">
                      {formatCurrency(t.nominal)}
                    </p>
                    {t.metode_pembayaran && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        Metode: {t.metode_pembayaran === 1 ? "Tunai" : t.metode_pembayaran === 2 ? "Transfer" : t.metode_pembayaran === 3 ? "QRIS" : "Virtual Account"}
                      </p>
                    )}
                    {t.keterangan && <p className="text-[10px] italic text-gray-500 mt-1">"{t.keterangan}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-6 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={() => { setIsTransaksiModalOpen(false); handleCancelEditTransaksi(); }}>
            Tutup
          </Button>
        </div>
      </Modal>

      {/* =================================== */}
      {/* MODAL 4: EXPORT LAPORAN KEUANGAN */}
      {/* =================================== */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-3xl"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Export Laporan Keuangan
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Pilih kriteria export laporan keuangan di bawah ini.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">BERDASARKAN</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "kelas", label: "Kelas" },
                  { value: "tahun-ajaran", label: "Tahun Ajaran" },
                  { value: "semua", label: "Semua" }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setExportBerdasarkan(type.value as any)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      exportBerdasarkan === type.value
                        ? "bg-brand-500 text-white border-brand-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {exportBerdasarkan === "kelas" && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">PILIH KELAS</label>
                <select
                  value={exportSelectedRombel}
                  onChange={(e) => setExportSelectedRombel(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 px-3 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Semua Kelas...</option>
                  {allAvailableKelas.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {exportBerdasarkan === "tahun-ajaran" && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">PILIH TAHUN AJARAN</label>
                <select
                  value={exportTahunAjaran}
                  onChange={(e) => setExportTahunAjaran(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 px-3 text-xs text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">Semua Tahun Ajaran</option>
                  {rekapTahunPelajaran.map((r) => (
                    <option key={r.semester_id} value={r.semester_id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">FORMAT OUTPUT</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "pdf", label: "PDF / Cetak", icon: PrinterIcon },
                  { value: "excel", label: "Excel (.xlsx)", icon: DownloadIcon }
                ].map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => setExportFormat(format.value as any)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        exportFormat === format.value
                          ? "bg-brand-500 text-white border-brand-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {format.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              Batal
            </button>
            <Button
              variant="primary"
              onClick={handleExecuteExport}
              disabled={isExporting}
              className="flex items-center gap-2 min-w-[100px] justify-center animate-none"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Export</span>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
