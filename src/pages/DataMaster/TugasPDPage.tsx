import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon, PencilIcon, TrashBinIcon, CloseIcon, PlusIcon, EyeIcon } from "../../icons";
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

interface GroupedPD {
  peserta_didik_id: string;
  nama: string;
  nip_nisn: string;
  last_sync?: string | null;
  duties: TugasTambahan[];
}

export default function TugasPDPage() {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // Data States
  const [tasks, setTasks] = useState<TugasTambahan[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom Selection Lists
  const [existingCustomJabatans, setExistingCustomJabatans] = useState<string[]>([]);
  const [isNewCustomJabatan, setIsNewCustomJabatan] = useState(false);
  const [selectedCustomJabatanSelect, setSelectedCustomJabatanSelect] = useState("");

  const [existingCustomJumlahJams, setExistingCustomJumlahJams] = useState<number[]>([]);
  const [isNewCustomJumlahJam, setIsNewCustomJumlahJam] = useState(false);
  const [selectedCustomJumlahJamSelect, setSelectedCustomJumlahJamSelect] = useState("");

  // Modals States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGroupedPD, setSelectedGroupedPD] = useState<GroupedPD | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // Form Fields
  const [selectedPDId, setSelectedPDId] = useState("");
  const [customJabatan, setCustomJabatan] = useState("");
  const [jumlahJam, setJumlahJam] = useState("");
  const [nomorSk, setNomorSk] = useState("");
  const [tmtTambahan, setTmtTambahan] = useState("");
  const [tstTambahan, setTstTambahan] = useState("");

  const loadTugasTambahan = async () => {
    setLoading(true);
    try {
      // Fetch index = 1 for student duties
      const res = await dapodikService.getTugasTambahan(9999, "", 1, 1);
      if (res && res.status === "success") {
        setTasks(res.data || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal memuat data tugas tambahan PD", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomJabatans = async () => {
    try {
      const res = await dapodikService.getCustomJabatans(1);
      if (res && res.status === "success") {
        setExistingCustomJabatans(res.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat list jabatan kustom PD", err);
    }
  };

  const loadCustomJumlahJams = async () => {
    try {
      const res = await dapodikService.getCustomJumlahJam(1);
      if (res && res.status === "success") {
        setExistingCustomJumlahJams(res.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat list jumlah jam kustom PD", err);
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
    setSelectedPDId("");
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

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    loadTugasTambahan();
    loadCustomJabatans();
    loadCustomJumlahJams();
    loadClasses();
  }, []);

  // Client-side grouping & filtering for Student Duties
  // 1. Filter out expired duties where tst_tambahan is set.
  const activeTasks = tasks.filter(task => !task.tst_tambahan);

  // 2. Group by Student
  const groupedMap = new Map<string, GroupedPD>();
  activeTasks.forEach(task => {
    const key = task.peserta_didik_id || task.nama || "";
    let rawNisn = task.nip_nisn || "";
    if (rawNisn.toLowerCase().startsWith("nisn:")) {
      rawNisn = rawNisn.substring(5).trim();
    } else if (rawNisn.toLowerCase().startsWith("nisn :")) {
      rawNisn = rawNisn.substring(6).trim();
    }

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        peserta_didik_id: task.peserta_didik_id || "",
        nama: task.nama || "",
        nip_nisn: rawNisn,
        last_sync: task.last_sync,
        duties: []
      });
    }
    groupedMap.get(key)!.duties.push(task);
  });

  const groupedList = Array.from(groupedMap.values());

  // 3. Search Filter
  const searchedGroupedList = groupedList.filter(item =>
    item.nama.toLowerCase().includes(search.toLowerCase()) ||
    item.nip_nisn.toLowerCase().includes(search.toLowerCase()) ||
    item.duties.some(d => (d.role_name || d.jabatan || "").toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination Helper
  const totalItems = searchedGroupedList.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const currentGroupedData = searchedGroupedList.slice((page - 1) * limit, page * limit);

  // Open detail modal and sync its selected state dynamically
  const openDetailModal = (groupedItem: GroupedPD) => {
    setSelectedGroupedPD(groupedItem);
    setIsDetailModalOpen(true);
  };

  // Sync selected group view when tasks data updates (e.g. after edit/delete)
  useEffect(() => {
    if (isDetailModalOpen && selectedGroupedPD) {
      const updatedItem = groupedList.find(x => x.peserta_didik_id === selectedGroupedPD.peserta_didik_id || x.nama === selectedGroupedPD.nama);
      if (updatedItem) {
        setSelectedGroupedPD(updatedItem);
      } else {
        setIsDetailModalOpen(false);
        setSelectedGroupedPD(null);
      }
    }
  }, [tasks, isDetailModalOpen]);

  // Modal actions
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentTaskId(null);
    setSelectedPDId("");
    setSelectedClass("");
    setStudents([]);
    setCustomJabatan("");
    setSelectedCustomJabatanSelect("");
    setJumlahJam("");
    setSelectedCustomJumlahJamSelect("");
    setNomorSk("");
    setTmtTambahan("");
    setTstTambahan("");
    
    setIsNewCustomJabatan(existingCustomJabatans.length === 0);
    setIsNewCustomJumlahJam(existingCustomJumlahJams.length === 0);

    setIsFormModalOpen(true);
  };

  const openEditModal = async (task: TugasTambahan) => {
    setIsEditMode(true);
    setCurrentTaskId(task.ptk_tugas_tambahan_id);
    setSelectedPDId(task.peserta_didik_id || "");
    
    const jab = task.jabatan || task.role_name || "";
    setCustomJabatan(jab);
    if (existingCustomJabatans.includes(jab)) {
      setSelectedCustomJabatanSelect(jab);
      setIsNewCustomJabatan(false);
    } else {
      setSelectedCustomJabatanSelect("TULIS_BARU");
      setIsNewCustomJabatan(true);
    }

    const jam = task.jumlah_jam !== undefined && task.jumlah_jam !== null ? task.jumlah_jam.toString() : "";
    setJumlahJam(jam);
    if (jam && existingCustomJumlahJams.includes(parseFloat(jam))) {
      setSelectedCustomJumlahJamSelect(jam);
      setIsNewCustomJumlahJam(false);
    } else {
      setSelectedCustomJumlahJamSelect("TULIS_BARU");
      setIsNewCustomJumlahJam(true);
    }

    setNomorSk(task.nomor_sk || "");
    setTmtTambahan(task.tmt_tambahan ? task.tmt_tambahan.split("T")[0] : "");
    setTstTambahan(task.tst_tambahan ? task.tst_tambahan.split("T")[0] : "");
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPDId) {
      Swal.fire("Peringatan", "Pilih Peserta Didik terlebih dahulu", "warning");
      return;
    }

    const finalJabatan = isNewCustomJabatan ? customJabatan : selectedCustomJabatanSelect;
    const finalJumlahJam = isNewCustomJumlahJam ? jumlahJam : selectedCustomJumlahJamSelect;

    if (!finalJabatan.trim()) {
      Swal.fire("Peringatan", "Pilih atau masukkan nama jabatan/peran terlebih dahulu", "warning");
      return;
    }

    const payload = {
      index: 1,
      ptk_id: null,
      peserta_didik_id: selectedPDId,
      jabatan_ptk_id: null,
      jabatan: finalJabatan,
      jumlah_jam: finalJumlahJam ? parseFloat(finalJumlahJam) : null,
      nomor_sk: nomorSk || null,
      tmt_tambahan: tmtTambahan || null,
      tst_tambahan: tstTambahan || null,
    };

    try {
      if (isEditMode && currentTaskId) {
        await dapodikService.updateTugasTambahan(currentTaskId, payload);
        Swal.fire("Sukses", "Tugas tambahan PD berhasil diperbarui", "success");
      } else {
        await dapodikService.createTugasTambahan(payload);
        Swal.fire("Sukses", "Tugas tambahan PD berhasil ditambahkan", "success");
      }
      setIsFormModalOpen(false);
      loadCustomJabatans();
      loadCustomJumlahJams();
      loadTugasTambahan();
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Gagal menyimpan tugas tambahan PD", "error");
    }
  };

  const handleDelete = (task: TugasTambahan) => {
    if (task.last_sync) {
      Swal.fire("Ditolak", "Tugas tambahan dari Dapodik tidak dapat dihapus", "error");
      return;
    }

    Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Menghapus tugas tambahan "${task.role_name || task.jabatan}" untuk ${task.nama || "Siswa"}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dapodikService.deleteTugasTambahan(task.ptk_tugas_tambahan_id);
          Swal.fire("Sukses", "Tugas tambahan PD berhasil dihapus", "success");
          loadTugasTambahan();
        } catch (err: any) {
          console.error(err);
          Swal.fire("Error", err.response?.data?.message || "Gagal menghapus tugas tambahan PD", "error");
        }
      }
    });
  };

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <>
      <PageMeta
        title="Tugas PD | SIMAK Admin Panel"
        description="Pengelolaan Tugas Tambahan Peserta Didik"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Tugas PD
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola tugas tambahan (ekstrakurikuler, organisasi, dsb.) bagi Peserta Didik di sini.
            </p>
          </div>
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openAddModal}
              startIcon={<PlusIcon className="size-4 fill-current" />}
            >
              Tambah Tugas PD
            </Button>
          </div>
        </div>

        {/* Table & Filter Container */}
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
                placeholder="Cari nama, NISN, jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NISN</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tugas Tambahan</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 whitespace-nowrap">Jumlah Tugas</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 whitespace-nowrap">Sumber</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 whitespace-nowrap no-print">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <div className="size-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentGroupedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data tugas tambahan PD ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentGroupedData.map((item) => {
                    const rolesList = item.duties.map(d => d.role_name || d.jabatan).join(", ");
                    const isAnyDapodik = item.duties.some(d => d.last_sync !== null && d.last_sync !== undefined);
                    
                    return (
                      <TableRow key={item.peserta_didik_id || item.nama} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <TableCell className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                          {item.nama}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.nip_nisn || "-"}</TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-[280px] truncate">
                          <span title={rolesList}>{rolesList}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center text-gray-950 dark:text-white font-semibold">
                          {item.duties.length}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          {isAnyDapodik ? (
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
                            <button
                              onClick={() => openDetailModal(item)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                              title="Lihat Tugas"
                            >
                              <EyeIcon className="size-5 fill-current" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalItems > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(page) => setPage(page)}
            />
          )}
        </div>
      </div>

      {/* DETAIL MODAL: LIHAT TUGAS PD */}
      {isDetailModalOpen && selectedGroupedPD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800 mb-4">
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                  Daftar Tugas Tambahan
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedGroupedPD.nama} ({selectedGroupedPD.nip_nisn || "-"})
                </p>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedGroupedPD(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jabatan/Peran</TableCell>
                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Jumlah Jam</TableCell>
                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nomor SK</TableCell>
                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">TMT</TableCell>
                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Sumber</TableCell>
                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-500 text-right text-theme-xs dark:text-gray-400 no-print">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {selectedGroupedPD.duties.map((task) => (
                    <TableRow key={task.ptk_tugas_tambahan_id} className="hover:bg-gray-50/30 dark:hover:bg-white/[0.01]">
                      <TableCell className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {task.role_name || task.jabatan}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                        {task.jumlah_jam !== null && task.jumlah_jam !== undefined ? Number(task.jumlah_jam) : "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400">{task.nomor_sk || "-"}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {task.tmt_tambahan ? new Date(task.tmt_tambahan).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
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
                      <TableCell className="px-4 py-3 text-right no-print">
                        <div className="flex justify-end gap-1.5">
                          {task.last_sync === null || task.last_sync === undefined ? (
                            <button
                              onClick={() => {
                                setIsDetailModalOpen(false); // Close detail modal first
                                openEditModal(task);
                              }}
                              className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                              title="Edit"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                              title="Data Dapodik tidak dapat diubah"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                          )}
                          {task.last_sync === null || task.last_sync === undefined ? (
                            <button
                              onClick={() => handleDelete(task)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Hapus"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                              title="Data Dapodik tidak dapat dihapus"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedGroupedPD(null);
                }}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL: TAMBAH / UBAH TUGAS PD */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                {isEditMode ? "Ubah Tugas PD" : "Tambah Tugas PD"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Select Rombel (Kelas) */}
              {!isEditMode && (
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

              {/* Select Student */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Pilih Peserta Didik
                </label>
                {isEditMode ? (
                  <Input
                    type="text"
                    value={tasks.find(t => t.ptk_tugas_tambahan_id === currentTaskId)?.nama || ""}
                    disabled
                  />
                ) : (
                  <Select
                    options={[
                      { 
                        value: "", 
                        label: loadingStudents 
                          ? "Memuat data siswa..." 
                          : !selectedClass
                            ? "-- Pilih kelas terlebih dahulu --"
                            : "-- Pilih Peserta Didik --" 
                      }, 
                      ...students.map((x: any) => ({
                        value: x.peserta_didik_id,
                        label: `${x.nama} (${x.nisn || "No NISN"})`,
                      }))
                    ]}
                    defaultValue={selectedPDId}
                    onChange={(val) => setSelectedPDId(val)}
                    disabled={loadingStudents || !selectedClass}
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
                        placeholder="Ketik Jabatan Baru (Contoh: OSIS, Ketua Kelas, Pramuka)"
                        value={customJabatan}
                        onChange={(e) => setCustomJabatan(e.target.value)}
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    type="text"
                    placeholder="Contoh: OSIS, Ketua Kelas, Anggota Pramuka"
                    value={customJabatan}
                    onChange={(e) => setCustomJabatan(e.target.value)}
                  />
                )}
              </div>

              {/* Jumlah Jam */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Jumlah Jam Kerja (Opsional)
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
                <Button variant="outline" size="sm" type="button" onClick={() => setIsFormModalOpen(false)}>
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
