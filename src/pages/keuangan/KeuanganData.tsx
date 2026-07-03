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
import { SearchIcon, PlusIcon, TableIcon, BoxIcon, DownloadIcon, TrashBinIcon, PencilIcon } from "../../icons";
import Swal from "sweetalert2";

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

  // Filters & Search
  const [searchTagihan, setSearchTagihan] = useState("");
  const [filterStatusTagihan, setFilterStatusTagihan] = useState("");

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
      showRombelNotif("success", "Hubungan kelas berhasil dihapus.");
    } catch (err: any) {
      showRombelNotif("error", err.response?.data?.message || "Gagal menghapus relasi.");
    } finally {
      setLoadingRombel(false);
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

  const handleCreateTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSpp || !transaksiForm.nominal) return;

    try {
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
      setTransaksiForm({
        jenis_transaksi: 1,
        nominal: "",
        tanggal_transaksi: new Date().toISOString().split("T")[0],
        metode_pembayaran: 1,
        keterangan: "",
      });
      setIsTransaksiModalOpen(false);
      fetchData();
    } catch (err: any) {
      Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan.", "error");
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

    return matchSearch && matchStatus;
  });

  const groupedTagihan = getGroupedTagihan(filteredTagihan);

  const totalPages = Math.ceil(groupedTagihan.length / itemsPerPage) || 1;
  const paginatedTagihan = groupedTagihan.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTagihan, filterStatusTagihan, itemsPerPage]);

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
          <div className="flex flex-wrap items-center gap-3">
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
            {activeTab === "tagihan" && (
               <Button
                  variant="success-outline"
                  size="sm"
                  className="min-w-[110px]"
                  startIcon={<DownloadIcon className="size-4" />}
                  onClick={() => {}}
                >
                  Export
                </Button>
            )}
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
                    <div className="w-full sm:w-56">
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
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Tagihan</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Total Tagihan</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Terbayar</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Sisa</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
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
                                  <TableCell className="px-5 py-3.5 text-sm text-gray-800 dark:text-white/80">{item.peserta_didik?.nama_rombel || "-"}</TableCell>
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
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleOpenTransaksiModal(item)}
                                    >
                                      Kelola Transaksi
                                    </Button>
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
              <div className="space-y-8">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 text-green-500">
                      <BoxIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Pembayaran Terkumpul</p>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(totalPembayaran)}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-500">
                      <TableIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Beasiswa Disalurkan</p>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(totalBeasiswa)}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tunggakan Per Siswa */}
                  <ComponentCard title="Daftar Peserta Didik Menunggak (Tunggakan)">
                    {tunggakanSiswa.length === 0 ? (
                      <p className="text-center py-6 text-gray-500">Tidak ada tunggakan peserta didik.</p>
                    ) : (
                      <div className="overflow-y-auto max-h-[350px]">
                        <Table className="w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                            <TableRow>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Kelas</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tagihan</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Tunggakan</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {tunggakanSiswa.slice(0, 100).map((t, idx) => (
                              <TableRow key={idx} className="hover:bg-gray-50/50">
                                <TableCell className="px-5 py-2.5 font-medium text-gray-800 dark:text-white/80 text-xs">{t.nama}</TableCell>
                                <TableCell className="px-5 py-2.5 text-xs text-gray-800 dark:text-white/80">{t.kelas}</TableCell>
                                <TableCell className="px-5 py-2.5 text-xs text-gray-800 dark:text-white/80">{t.nama_tagihan}</TableCell>
                                <TableCell className="px-5 py-2.5 text-right text-red-500 dark:text-red-400 font-semibold text-xs">
                                  {formatCurrency(t.sisa_tunggakan)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </ComponentCard>

                  {/* Tunggakan Per Kelas */}
                  <ComponentCard title="Total Tunggakan Per Kelas">
                    {tunggakanKelas.length === 0 ? (
                      <p className="text-center py-6 text-gray-500">Tidak ada tunggakan per kelas.</p>
                    ) : (
                      <div className="overflow-y-auto max-h-[350px]">
                        <Table className="w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                            <TableRow>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Nama Kelas</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Total Tunggakan</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {tunggakanKelas.map((t, idx) => (
                              <TableRow key={idx} className="hover:bg-gray-50/50">
                                <TableCell className="px-5 py-2.5 font-semibold text-gray-800 dark:text-white text-xs">{t.kelas}</TableCell>
                                <TableCell className="px-5 py-2.5 text-right text-red-500 dark:text-red-400 font-bold text-xs">
                                  {formatCurrency(t.total_tunggakan)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </ComponentCard>

                  {/* Rekap Bulanan */}
                  <ComponentCard title="Rekapitulasi Pembayaran Per Bulan">
                    {rekapBulanan.length === 0 ? (
                      <p className="text-center py-6 text-gray-500">Belum ada riwayat transaksi bulanan.</p>
                    ) : (
                      <div className="overflow-y-auto max-h-[350px]">
                        <Table className="w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                            <TableRow>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Bulan & Tahun</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Total Penerimaan</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rekapBulanan.map((r, idx) => (
                              <TableRow key={idx} className="hover:bg-gray-50/50">
                                <TableCell className="px-5 py-2.5 font-medium text-gray-800 dark:text-white text-xs">
                                  {r.bulan_tahun}
                                </TableCell>
                                <TableCell className="px-5 py-2.5 text-right text-green-600 dark:text-green-400 font-bold text-xs">
                                  {formatCurrency(r.nominal)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </ComponentCard>

                  {/* Rekap Tahun Pelajaran */}
                  <ComponentCard title="Rekapitulasi Pembayaran Per Tahun Pelajaran">
                    {rekapTahunPelajaran.length === 0 ? (
                      <p className="text-center py-6 text-gray-500">Belum ada riwayat per tahun pelajaran.</p>
                    ) : (
                      <div className="overflow-y-auto max-h-[350px]">
                        <Table className="w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                            <TableRow>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Tahun Pelajaran / Semester</TableCell>
                              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-right text-xs dark:text-gray-400 whitespace-nowrap">Total Penerimaan</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rekapTahunPelajaran.map((r, idx) => (
                              <TableRow key={idx} className="hover:bg-gray-50/50">
                                <TableCell className="px-5 py-2.5 font-medium text-gray-800 dark:text-white text-xs">
                                  {r.label}
                                </TableCell>
                                <TableCell className="px-5 py-2.5 text-right text-green-600 dark:text-green-400 font-bold text-xs">
                                  {formatCurrency(r.total_pembayaran)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </ComponentCard>
                </div>
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
      <Modal isOpen={isTransaksiModalOpen} onClose={() => setIsTransaksiModalOpen(false)} className="max-w-[700px] p-6 bg-white dark:bg-gray-900 rounded-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-850 dark:text-white mb-2">Riwayat & Pembayaran SPP</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2">
          <div>
            Peserta Didik: <span className="font-bold text-gray-800 dark:text-gray-250">{selectedTagihan?.peserta_didik?.nama}</span>
          </div>
          <div>
            NISN: <span className="font-semibold">{selectedTagihan?.peserta_didik?.nisn}</span>
          </div>
          <div>
            Kelas: <span className="font-semibold">{selectedTagihan?.peserta_didik?.nama_rombel}</span>
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
          {/* Form catat transaksi baru */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4">Catat Transaksi Baru</h4>
            <form onSubmit={handleCreateTransaksi} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Jenis Transaksi</label>
                <select
                  value={transaksiForm.jenis_transaksi}
                  onChange={(e) => setTransaksiForm({ ...transaksiForm, jenis_transaksi: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-xs text-gray-850 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                >
                  <option value={1}>Pembayaran (Uang SPP)</option>
                  <option value={2}>Beasiswa</option>
                  <option value={3}>Denda</option>
                  <option value={4}>Pengurangan Tagihan</option>
                  <option value={5}>Pengembalian Dana (Refund)</option>
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

              <div className="pt-2">
                <Button variant="primary" size="sm" type="submit" className="w-full">
                  Simpan Transaksi
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
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                {selectedSubSpp?.riwayat_transaksi?.map((t: any) => (
                  <div key={t.riwayat_transaksi_spp_id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl text-xs relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {formatDate(t.tanggal_transaksi)}
                      </span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-50 text-gray-600 dark:bg-gray-900 border`}>
                        {getJenisTxLabel(t.jenis_transaksi)}
                      </span>
                    </div>
                    <p className="font-bold text-gray-950 dark:text-white mt-1.5">
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
          <Button variant="outline" size="sm" onClick={() => setIsTransaksiModalOpen(false)}>
            Tutup
          </Button>
        </div>
      </Modal>
    </>
  );
}
