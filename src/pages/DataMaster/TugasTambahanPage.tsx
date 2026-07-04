import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon, PencilIcon, TrashBinIcon, CloseIcon, PlusIcon } from "../../icons";
import Swal from "sweetalert2";
import { dapodikService } from "../../services/dapodikService";
import Pagination from "../../components/common/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

interface TugasTambahan {
  ptk_tugas_tambahan_id: string;
  ptk_id?: string;
  peserta_didik_id?: string;
  sekolah_id?: string;
  jabatan_ptk_id?: number;
  jabatan?: string;
  jumlah_jam?: number;
  nomor_sk?: string;
  tmt_tambahan?: string;
  tst_tambahan?: string;
  index: number;
  last_sync?: string | null;
  role_name?: string;
  nama?: string;
  nip_nisn?: string;
}

interface Option {
  value: string;
  label: string;
}

export default function TugasTambahanPage() {
  const [activeTab, setActiveTab] = useState<0 | 1>(0); // 0 = GTK, 1 = Peserta Didik
  const [tasks, setTasks] = useState<TugasTambahan[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // References and dropdown lists
  const [gtks, setGtks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [existingCustomJabatans, setExistingCustomJabatans] = useState<string[]>([]);
  const [isNewCustomJabatan, setIsNewCustomJabatan] = useState(false);
  const [selectedCustomJabatanSelect, setSelectedCustomJabatanSelect] = useState("");

  const [existingCustomJumlahJams, setExistingCustomJumlahJams] = useState<number[]>([]);
  const [isNewCustomJumlahJam, setIsNewCustomJumlahJam] = useState(false);
  const [selectedCustomJumlahJamSelect, setSelectedCustomJumlahJamSelect] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [customJabatan, setCustomJabatan] = useState("");
  const [jumlahJam, setJumlahJam] = useState("");
  const [nomorSk, setNomorSk] = useState("");
  const [tmtTambahan, setTmtTambahan] = useState("");
  const [tstTambahan, setTstTambahan] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dapodikService.getTugasTambahan(limit, search, page, activeTab);
      if (res && res.status === "success") {
        setTasks(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal memuat data tugas tambahan", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomJabatans = async (tabIndex?: number) => {
    try {
      const res = await dapodikService.getCustomJabatans(tabIndex !== undefined ? tabIndex : activeTab);
      if (res && res.status === "success") {
        setExistingCustomJabatans(res.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat list jabatan kustom", err);
    }
  };

  const loadCustomJumlahJams = async (tabIndex?: number) => {
    try {
      const res = await dapodikService.getCustomJumlahJam(tabIndex !== undefined ? tabIndex : activeTab);
      if (res && res.status === "success") {
        setExistingCustomJumlahJams(res.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat list jumlah jam kustom", err);
    }
  };


  const loadClasses = async () => {
    try {
      const res = await dapodikService.getRombonganBelajar("reguler", 200);
      if (res?.status === "success" && res.data) {
        setClasses(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat kelas:", err);
    }
  };

  const handleClassChange = async (className: string) => {
    setSelectedClass(className);
    setSelectedEntityId("");
    if (!className) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const res = await dapodikService.getPesertaDidik(999, "", 1, className, "aktif");
      if (res?.status === "success" && res.data) {
        setStudents(res.data);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Gagal memuat siswa:", err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [gtkRes] = await Promise.all([
        dapodikService.getGTK(200, "", 1, undefined, "aktif"),
      ]);

      if (gtkRes && gtkRes.status === "success") {
        setGtks(gtkRes.data || []);
      }
      await loadClasses();
    } catch (err) {
      console.error("Gagal memuat opsi referensi", err);
    }
  };

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, page, limit, search]);

  useEffect(() => {
    loadReferences();
    loadCustomJabatans();
    loadCustomJumlahJams();
  }, []);

  const openAddModal = async () => {
    setIsEditMode(false);
    setCurrentId(null);
    setSelectedEntityId("");
    setSelectedClass("");
    setStudents([]);
    setCustomJabatan("");
    setSelectedCustomJabatanSelect("");
    setJumlahJam("");
    setSelectedCustomJumlahJamSelect("");

    try {
      const [jabRes, jamRes] = await Promise.all([
        dapodikService.getCustomJabatans(activeTab),
        dapodikService.getCustomJumlahJam(activeTab),
      ]);

      if (jabRes && jabRes.status === "success") {
        const list = jabRes.data || [];
        setExistingCustomJabatans(list);
        if (list.length > 0) {
          setIsNewCustomJabatan(false);
        } else {
          setIsNewCustomJabatan(true);
        }
      } else {
        setIsNewCustomJabatan(true);
      }

      if (jamRes && jamRes.status === "success") {
        const list = jamRes.data || [];
        setExistingCustomJumlahJams(list);
        if (list.length > 0) {
          setIsNewCustomJumlahJam(false);
        } else {
          setIsNewCustomJumlahJam(true);
        }
      } else {
        setIsNewCustomJumlahJam(true);
      }
    } catch (err) {
      console.error(err);
      setIsNewCustomJabatan(true);
      setIsNewCustomJumlahJam(true);
    }

    setNomorSk("");
    setTmtTambahan("");
    setTstTambahan("");
    setIsModalOpen(true);
  };

  const openEditModal = async (task: TugasTambahan) => {
    setIsEditMode(true);
    setCurrentId(task.ptk_tugas_tambahan_id);
    setSelectedEntityId(task.index === 1 ? task.peserta_didik_id || "" : task.ptk_id || "");
    
    const jab = task.jabatan || task.role_name || "";
    setCustomJabatan(jab);

    const jam = task.jumlah_jam !== undefined && task.jumlah_jam !== null ? task.jumlah_jam : "";
    setJumlahJam(jam.toString());

    try {
      const [jabRes, jamRes] = await Promise.all([
        dapodikService.getCustomJabatans(task.index),
        dapodikService.getCustomJumlahJam(task.index),
      ]);

      if (jabRes && jabRes.status === "success") {
        const list = jabRes.data || [];
        setExistingCustomJabatans(list);
        if (list.includes(jab)) {
          setSelectedCustomJabatanSelect(jab);
          setIsNewCustomJabatan(false);
        } else {
          setSelectedCustomJabatanSelect("TULIS_BARU");
          setIsNewCustomJabatan(true);
        }
      } else {
        setIsNewCustomJabatan(true);
      }

      if (jamRes && jamRes.status === "success") {
        const list = jamRes.data || [];
        setExistingCustomJumlahJams(list);
        const numericJam = typeof jam === "string" ? (jam === "" ? NaN : parseFloat(jam)) : jam;
        if (!isNaN(numericJam as number) && list.includes(numericJam as number)) {
          setSelectedCustomJumlahJamSelect(numericJam.toString());
          setIsNewCustomJumlahJam(false);
        } else {
          setSelectedCustomJumlahJamSelect("TULIS_BARU");
          setIsNewCustomJumlahJam(true);
        }
      } else {
        setIsNewCustomJumlahJam(true);
      }
    } catch (err) {
      console.error(err);
      setIsNewCustomJabatan(true);
      setIsNewCustomJumlahJam(true);
    }

    setNomorSk(task.nomor_sk || "");
    setTmtTambahan(task.tmt_tambahan ? task.tmt_tambahan.split("T")[0] : "");
    setTstTambahan(task.tst_tambahan ? task.tst_tambahan.split("T")[0] : "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) {
      Swal.fire("Peringatan", `Pilih ${activeTab === 0 ? "GTK" : "Peserta Didik"} terlebih dahulu`, "warning");
      return;
    }

    const finalJabatan = isNewCustomJabatan ? customJabatan : selectedCustomJabatanSelect;
    const finalJumlahJam = isNewCustomJumlahJam ? jumlahJam : selectedCustomJumlahJamSelect;

    if (!finalJabatan.trim()) {
      Swal.fire("Peringatan", "Pilih atau masukkan nama jabatan/peran terlebih dahulu", "warning");
      return;
    }

    const payload: any = {
      index: activeTab,
      ptk_id: activeTab === 0 ? selectedEntityId : null,
      peserta_didik_id: activeTab === 1 ? selectedEntityId : null,
      jabatan_ptk_id: null,
      jabatan: finalJabatan,
      jumlah_jam: finalJumlahJam ? parseFloat(finalJumlahJam) : null,
      nomor_sk: nomorSk || null,
      tmt_tambahan: tmtTambahan || null,
      tst_tambahan: tstTambahan || null,
    };

    try {
      if (isEditMode && currentId) {
        await dapodikService.updateTugasTambahan(currentId, payload);
        Swal.fire("Sukses", "Tugas tambahan berhasil diperbarui", "success");
      } else {
        await dapodikService.createTugasTambahan(payload);
        Swal.fire("Sukses", "Tugas tambahan berhasil ditambahkan", "success");
      }
      setIsModalOpen(false);
      loadCustomJabatans(activeTab);
      loadCustomJumlahJams(activeTab);
      loadData();
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Gagal menyimpan tugas tambahan", "error");
    }
  };

  const handleDelete = (task: TugasTambahan) => {
    if (task.last_sync !== null && task.last_sync !== undefined) {
      Swal.fire("Ditolak", "Tugas tambahan dari Dapodik tidak dapat dihapus", "error");
      return;
    }

    Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Menghapus tugas tambahan untuk ${task.nama}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dapodikService.deleteTugasTambahan(task.ptk_tugas_tambahan_id);
          Swal.fire("Sukses", "Tugas tambahan berhasil dihapus", "success");
          loadData();
        } catch (err: any) {
          console.error(err);
          Swal.fire("Error", err.response?.data?.message || "Gagal menghapus tugas tambahan", "error");
        }
      }
    });
  };

  const entityOptions: Option[] = (activeTab === 0 ? gtks : students).map((x: any) => ({
    value: activeTab === 0 ? x.ptk_id : x.peserta_didik_id,
    label: `${x.nama} (${activeTab === 0 ? (x.nip || x.nuptk || "No NIP/NUPTK") : (x.nisn || "No NISN")})`,
  }));



  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <>
      <PageMeta
        title="Tugas Tambahan | SIMAK Admin Panel"
        description="Tugas Tambahan management page"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Tugas Tambahan
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola tugas tambahan bagi Guru/Tendik (GTK) dan Peserta Didik di sini.
            </p>
          </div>
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openAddModal}
              startIcon={<PlusIcon className="size-4" />}
            >
              Tambah Tugas Tambahan
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 no-print">
          <button
            className={`px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
              activeTab === 0
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => {
              setActiveTab(0);
              setPage(1);
            }}
          >
            GTK
          </button>
          <button
            className={`px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
              activeTab === 1
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => {
              setActiveTab(1);
              setPage(1);
            }}
          >
            Peserta Didik
          </button>
        </div>

        {/* Filters & Tables Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 print-area">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
            <div className="w-20">
              <Select
                options={rowsPerPageOptions}
                defaultValue={limit.toString()}
                onChange={(value) => {
                  setLimit(parseInt(value));
                  setPage(1);
                }}
              />
            </div>
            <div className="relative w-full max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="size-5" />
              </span>
              <Input
                type="text"
                placeholder="Cari nama, SK, jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Identitas (NIP/NISN)</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jabatan/Peran</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 whitespace-nowrap">Jumlah Jam</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nomor SK</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">TMT</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">TST</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 whitespace-nowrap">Sumber</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 whitespace-nowrap no-print">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <div className="size-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data tugas tambahan.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.ptk_tugas_tambahan_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                      <TableCell className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                        {task.nama}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{task.nip_nisn}</TableCell>
                      <TableCell className="px-5 py-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                          {task.role_name}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center text-gray-500 dark:text-gray-400">
                        {task.jumlah_jam !== null && task.jumlah_jam !== undefined ? Number(task.jumlah_jam) : "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{task.nomor_sk || "-"}</TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {task.tmt_tambahan ? new Date(task.tmt_tambahan).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {task.tst_tambahan ? new Date(task.tst_tambahan).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        {task.last_sync ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                            Dapodik
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                            Lokal
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right no-print">
                        <div className="flex justify-end gap-2">
                          {task.last_sync === null || task.last_sync === undefined ? (
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                              title="Edit"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                              title="Data Dapodik tidak dapat diubah"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                          )}
                          {task.last_sync === null || task.last_sync === undefined ? (
                            <button
                              onClick={() => handleDelete(task)}
                              className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Hapus"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                              title="Data Dapodik tidak dapat dihapus"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={(page) => setPage(page)}
            />
          )}
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                {isEditMode ? "Ubah Tugas Tambahan" : "Tambah Tugas Tambahan"} ({activeTab === 0 ? "GTK" : "Peserta Didik"})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Select Entity */}
              {activeTab === 1 && !isEditMode && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Pilih Rombongan Belajar (Kelas)
                  </label>
                  <Select
                    options={[
                      { value: "", label: "-- Pilih Kelas --" },
                      ...classes.map((cls) => ({ value: cls.nama, label: cls.nama }))
                    ]}
                    defaultValue={selectedClass}
                    onChange={(val) => handleClassChange(val)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Pilih {activeTab === 0 ? "GTK" : "Peserta Didik"}
                </label>
                {isEditMode ? (
                  <Input
                    type="text"
                    value={tasks.find(t => t.ptk_tugas_tambahan_id === currentId)?.nama || ""}
                    disabled
                  />
                ) : (
                  <Select
                    options={[
                      { 
                        value: "", 
                        label: loadingStudents 
                          ? "Memuat data siswa..." 
                          : activeTab === 1 && !selectedClass
                            ? "-- Pilih kelas terlebih dahulu --"
                            : `-- Pilih ${activeTab === 0 ? "GTK" : "Peserta Didik"} --` 
                      }, 
                      ...entityOptions
                    ]}
                    defaultValue={selectedEntityId}
                    onChange={(val) => setSelectedEntityId(val)}
                    disabled={loadingStudents || (activeTab === 1 && !selectedClass)}
                  />
                )}
              </div>

              {/* Jabatan Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Nama Jabatan/Peran
                </label>
                {existingCustomJabatans.length > 0 ? (
                  <div className="space-y-2">
                    <Select
                      options={[
                        { value: "", label: "-- Pilih Jabatan/Peran --" },
                        ...existingCustomJabatans.map(x => ({ value: x, label: x })),
                        { value: "TULIS_BARU", label: "Tulis Jabatan Baru..." }
                      ]}
                      defaultValue={selectedCustomJabatanSelect}
                      onChange={(val) => {
                        setSelectedCustomJabatanSelect(val);
                        if (val === "TULIS_BARU") {
                          setIsNewCustomJabatan(true);
                          setCustomJabatan("");
                        } else {
                          setIsNewCustomJabatan(false);
                          setCustomJabatan(val);
                        }
                      }}
                    />
                    {isNewCustomJabatan && (
                      <Input
                        type="text"
                        placeholder="Ketik Jabatan Baru (Contoh: OSIS, Ketua Kelas, Pembina Pramuka)"
                        value={customJabatan}
                        onChange={(e) => setCustomJabatan(e.target.value)}
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    type="text"
                    placeholder="Contoh: OSIS, Ketua Kelas, Pembina Pramuka, Kepala Lab"
                    value={customJabatan}
                    onChange={(e) => setCustomJabatan(e.target.value)}
                  />
                )}
              </div>

              {/* Jumlah Jam */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Jumlah Jam Mengajar/Kerja (Opsional)
                </label>
                {existingCustomJumlahJams.length > 0 ? (
                  <div className="space-y-2">
                    <Select
                      options={[
                        { value: "", label: "-- Pilih Jumlah Jam --" },
                        ...existingCustomJumlahJams.map(x => ({ value: x.toString(), label: `${x} Jam` })),
                        { value: "TULIS_BARU", label: "Tulis Jumlah Jam Baru..." }
                      ]}
                      defaultValue={selectedCustomJumlahJamSelect}
                      onChange={(val) => {
                        setSelectedCustomJumlahJamSelect(val);
                        if (val === "TULIS_BARU") {
                          setIsNewCustomJumlahJam(true);
                          setJumlahJam("");
                        } else {
                          setIsNewCustomJumlahJam(false);
                          setJumlahJam(val);
                        }
                      }}
                    />
                    {isNewCustomJumlahJam && (
                      <Input
                        type="number"
                        placeholder="Ketik Jumlah Jam Baru"
                        value={jumlahJam}
                        onChange={(e) => setJumlahJam(e.target.value)}
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    type="number"
                    placeholder="Jumlah Jam"
                    value={jumlahJam}
                    onChange={(e) => setJumlahJam(e.target.value)}
                  />
                )}
              </div>

              {/* Nomor SK */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Nomor SK (Opsional)
                </label>
                <Input
                  type="text"
                  placeholder="Nomor Surat Keputusan"
                  value={nomorSk}
                  onChange={(e) => setNomorSk(e.target.value)}
                />
              </div>

              {/* TMT / TST Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    TMT Tambahan (Opsional)
                  </label>
                  <Input
                    type="date"
                    value={tmtTambahan}
                    onChange={(e) => setTmtTambahan(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    TST Tambahan (Opsional)
                  </label>
                  <Input
                    type="date"
                    value={tstTambahan}
                    onChange={(e) => setTstTambahan(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {isEditMode ? "Simpan Perubahan" : "Tambah"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
