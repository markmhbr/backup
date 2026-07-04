import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon, PencilIcon, TrashBinIcon, CloseIcon } from "../../icons";
import Swal from "sweetalert2";
import { dapodikService } from "../../services/dapodikService";

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
  const [existingCustomJabatans, setExistingCustomJabatans] = useState<string[]>([]);
  const [isNewCustomJabatan, setIsNewCustomJabatan] = useState(false);
  const [selectedCustomJabatanSelect, setSelectedCustomJabatanSelect] = useState("");

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

  const loadReferences = async () => {
    try {
      const [gtkRes, studentRes] = await Promise.all([
        dapodikService.getGTK(200, "", 1, undefined, "aktif"),
        dapodikService.getPesertaDidik(500, "", 1, undefined, "aktif"),
      ]);

      if (gtkRes && gtkRes.status === "success") {
        setGtks(gtkRes.data || []);
      }
      if (studentRes && studentRes.status === "success") {
        setStudents(studentRes.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat opsi referensi", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, page, limit]);

  useEffect(() => {
    loadReferences();
    loadCustomJabatans();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const openAddModal = async () => {
    setIsEditMode(false);
    setCurrentId(null);
    setSelectedEntityId("");
    setCustomJabatan("");
    setSelectedCustomJabatanSelect("");
    try {
      const res = await dapodikService.getCustomJabatans(activeTab);
      if (res && res.status === "success") {
        const list = res.data || [];
        setExistingCustomJabatans(list);
        if (list.length > 0) {
          setIsNewCustomJabatan(false);
        } else {
          setIsNewCustomJabatan(true);
        }
      } else {
        setIsNewCustomJabatan(true);
      }
    } catch (err) {
      console.error(err);
      setIsNewCustomJabatan(true);
    }
    setJumlahJam("");
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
    try {
      const res = await dapodikService.getCustomJabatans(task.index);
      if (res && res.status === "success") {
        const list = res.data || [];
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
    } catch (err) {
      console.error(err);
      setIsNewCustomJabatan(true);
    }

    setJumlahJam(task.jumlah_jam !== undefined && task.jumlah_jam !== null ? task.jumlah_jam.toString() : "");
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
      jumlah_jam: jumlahJam ? parseFloat(jumlahJam) : null,
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
            <Button variant="primary" size="sm" onClick={openAddModal}>
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
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-sm w-full lg:justify-end">
              <div className="relative w-full">
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
              <Button type="submit" variant="outline" size="sm">
                Cari
              </Button>
            </form>
          </div>

          {/* Table */}
          <div className="relative overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-white/[0.02] dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Identitas (NIP/NISN)</th>
                  <th className="px-6 py-4">Jabatan/Peran</th>
                  <th className="px-6 py-4 text-center">Jumlah Jam</th>
                  <th className="px-6 py-4">Nomor SK</th>
                  <th className="px-6 py-4">TMT</th>
                  <th className="px-6 py-4">TST</th>
                  <th className="px-6 py-4 text-center">Sumber</th>
                  <th className="px-6 py-4 text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="size-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      Tidak ada data tugas tambahan.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.ptk_tugas_tambahan_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {task.nama}
                      </td>
                      <td className="px-6 py-4">{task.nip_nisn}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                          {task.role_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {task.jumlah_jam !== null && task.jumlah_jam !== undefined ? Number(task.jumlah_jam) : "-"}
                      </td>
                      <td className="px-6 py-4">{task.nomor_sk || "-"}</td>
                      <td className="px-6 py-4">
                        {task.tmt_tambahan ? new Date(task.tmt_tambahan).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {task.tst_tambahan ? new Date(task.tst_tambahan).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {task.last_sync ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                            Dapodik
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                            Lokal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right no-print">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            title="Edit"
                          >
                            <PencilIcon className="size-4" />
                          </button>
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > limit && (
            <div className="mt-4 flex items-center justify-between no-print">
              <span className="text-sm text-gray-500">
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, total)} dari {total} data
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
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
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Pilih {activeTab === 0 ? "GTK" : "Peserta Didik"}
                </label>
                <Select
                  options={[{ value: "", label: `-- Pilih ${activeTab === 0 ? "GTK" : "Peserta Didik"} --` }, ...entityOptions]}
                  defaultValue={selectedEntityId}
                  onChange={(val) => setSelectedEntityId(val)}
                  disabled={isEditMode}
                />
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
                <Input
                  type="number"
                  placeholder="Jumlah Jam"
                  value={jumlahJam}
                  onChange={(e) => setJumlahJam(e.target.value)}
                />
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
