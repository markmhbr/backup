import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../services/api";
import Swal from "sweetalert2";

interface Role {
  peran_id: number;
  peran_nama: string;
}

interface MenuRoleMapping {
  menu_role_id: string;
  menu_id: string;
  peran_id: number;
  peran_nama: string;
}

// Flat list of all configurable menu items from our AppSidebar definition
const menuDefinition = [
  { id: "profil-sekolah", name: "Data Master - Profil Sekolah" },
  { id: "gtk", name: "Data Master - GTK" },
  { id: "gtk-guru", name: "Data Master - GTK - Guru" },
  { id: "gtk-tendik", name: "Data Master - GTK - Tendik" },
  { id: "gtk-rekap", name: "Data Master - GTK - Rekap GTK" },
  { id: "gtk-kartu", name: "Data Master - GTK - Kartu ID" },
  { id: "gtk-perbaikan", name: "Data Master - GTK - Pengajuan Perbaikan" },
  { id: "gtk-nonaktif", name: "Data Master - GTK - GTK Non Aktif" },
  { id: "gtk-buku-induk", name: "Data Master - GTK - Buku Induk" },
  { id: "peserta-didik", name: "Data Master - Peserta Didik" },
  { id: "pd-aktif", name: "Data Master - PD - Peserta Didik" },
  { id: "pd-rekap", name: "Data Master - PD - Rekap PD" },
  { id: "pd-kartu", name: "Data Master - PD - Kartu ID PD" },
  { id: "pd-perbaikan", name: "Data Master - PD - Pengajuan Perbaikan" },
  { id: "pd-keluar", name: "Data Master - PD - PD Keluar" },
  { id: "pd-buku-induk", name: "Data Master - PD - Buku Induk" },
  { id: "rombongan-belajar", name: "Data Master - Rombongan Belajar" },
  { id: "rombel-reguler", name: "Data Master - Rombel - Reguler" },
  { id: "rombel-praktik", name: "Data Master - Rombel - Praktik" },
  { id: "rombel-ekskul", name: "Data Master - Rombel - Ekskul" },
  { id: "rombel-pilihan", name: "Data Master - Rombel - Matpel Pilihan" },
  { id: "rombel-wali", name: "Data Master - Rombel - Wali" },
  { id: "rombel-rekap", name: "Data Master - Rombel - Rekap Rombel" },
  { id: "tugas-tambahan", name: "Data Master - Rombel - Tugas Tambahan" },
  { id: "mata-pelajaran", name: "Data Master - Mata Pelajaran" },
  { id: "sarpras", name: "Data Master - Sarpras" },
  { id: "akademik", name: "Akademik (Parent Menu)" },
  { id: "akademik-tahun-pelajaran", name: "Akademik - Tahun Pelajaran" },
  { id: "akademik-kompetensi", name: "Akademik - Kompetensi Keahlian" },
  { id: "gtk-card", name: "Akademik - Kartu ID GTK" },
  { id: "student-card", name: "Akademik - Kartu ID PD" },
  { id: "kurikulum", name: "Kurikulum (Parent Menu)" },
  { id: "kurikulum-pengaturan-jam", name: "Kurikulum - Pengaturan Jam" },
  { id: "kurikulum-jadwal-pelajaran", name: "Kurikulum - Jadwal Pelajaran" },
  { id: "kurikulum-presensi", name: "Kurikulum - Presensi (Parent Menu)" },
  { id: "presensi-scanner", name: "Kurikulum - Presensi - Scanner QR" },
  { id: "presensi-pd", name: "Kurikulum - Presensi - Presensi Peserta Didik" },
  { id: "presensi-gtk", name: "Kurikulum - Presensi - Presensi GTK" },
  { id: "presensi-mapel", name: "Kurikulum - Presensi - Presensi Mapel" },
  { id: "presensi-izin", name: "Kurikulum - Presensi - Izin" },
  { id: "presensi-hari-libur", name: "Kurikulum - Presensi - Hari Libur" },
  { id: "indisipliner", name: "Indisipliner (Parent Menu)" },
  { id: "indisipliner-pd", name: "Indisipliner - Peserta Didik" },
  { id: "indisipliner-gtk", name: "Indisipliner - GTK" },
  { id: "keuangan", name: "Keuangan (Parent Menu)" },
  { id: "keuangan-pengaturan", name: "Keuangan - Pengaturan Tagihan" },
  { id: "keuangan-tagihan", name: "Keuangan - Tagihan SPP" },
  { id: "keuangan-laporan", name: "Keuangan - Laporan & Rekap" },
  { id: "administrasi-surat", name: "Administrasi Surat (Parent Menu)" },
  { id: "surat-pengaturan-nomor", name: "Administrasi Surat - Pengaturan Nomor" },
  { id: "surat-template", name: "Administrasi Surat - Template Surat" },
  { id: "surat-masuk", name: "Administrasi Surat - Surat Masuk" },
  { id: "surat-keluar", name: "Administrasi Surat - Surat Keluar" },
  { id: "surat-arsip", name: "Administrasi Surat - Arsip Surat" },
  { id: "layanan-mandala", name: "Layanan Mandala (Parent Menu)" },
  { id: "layanan-gtk", name: "Layanan Mandala - GTK" },
  { id: "layanan-pd", name: "Layanan Mandala - Peserta Didik" },
  { id: "layanan-pelaporan", name: "Layanan Mandala - Pelaporan Dokumen" },
  { id: "pengaturan", name: "Pengaturan (Parent Menu)" },
  { id: "pengaturan-menu", name: "Pengaturan - Menu" },
  { id: "pengaturan-backup", name: "Pengaturan - Backup" },
  { id: "pengaturan-umum", name: "Pengaturan - Umum" }
];

export default function MenuSettings() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedMenus, setCheckedMenus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mappings, setMappings] = useState<MenuRoleMapping[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/dapodik/roles");
        if (res.data && res.data.data) {
          // Filter out Operator Sekolah from config since it always bypasses
          const list = (res.data.data as Role[]).filter(
            (r) => r.peran_nama !== "Operator Sekolah" && r.peran_id !== 10
          );
          setRoles(list);
          if (list.length > 0) {
            setSelectedRole(list[0]);
          }
        }
      } catch (err) {
        console.error("Gagal memuat daftar peran:", err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const res = await api.get("/dapodik/menu-roles");
        if (res.data && res.data.data) {
          setMappings(res.data.data);
        }
      } catch (err) {
        console.error("Gagal memuat mapping menu roles:", err);
      }
    };
    fetchMappings();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      const activeForRole = mappings
        .filter((m) => m.peran_id === selectedRole.peran_id)
        .map((m) => m.menu_id);
      setCheckedMenus(activeForRole);
    }
  }, [selectedRole, mappings]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setCheckedMenus((prev) => [...prev, id]);
    } else {
      setCheckedMenus((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectAll = () => {
    setCheckedMenus(menuDefinition.map((m) => m.id));
  };

  const handleClearAll = () => {
    setCheckedMenus([]);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await api.post("/dapodik/menu-roles", {
        peranId: selectedRole.peran_id,
        peranNama: selectedRole.peran_nama,
        menuIds: checkedMenus,
      });

      // Refresh mapping local state
      const res = await api.get("/dapodik/menu-roles");
      if (res.data && res.data.data) {
        setMappings(res.data.data);
      }

      Swal.fire({
        title: "Berhasil!",
        text: `Hak akses menu untuk peran ${selectedRole.peran_nama} berhasil diperbarui.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal menyimpan konfigurasi hak akses menu", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.peran_nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageMeta
        title="Pengaturan Hak Akses Menu | SIMAK"
        description="Configure menu access visibility per user roles"
      />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
            Pengaturan Hak Akses Menu
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tentukan menu dan submenu yang dapat diakses oleh masing-masing peran pengguna sekolah. Peran <strong>Operator Sekolah</strong> memiliki bypass penuh untuk semua menu.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Role Selector */}
          <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-white/90">
              Pilih Peran Pengguna
            </h4>
            
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari peran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-white/[0.02] dark:text-white"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 flex-1">
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <button
                    key={role.peran_id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedRole?.peran_id === role.peran_id
                        ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {role.peran_nama}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-400">
                  Peran tidak ditemukan
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Menu Checklist */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white/90">
                  Daftar Hak Akses Menu untuk:{" "}
                  <span className="text-brand-500 font-bold">
                    {selectedRole?.peran_nama || "Loading..."}
                  </span>
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Centang item untuk mengizinkan akses menu tersebut.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 border-t border-b border-gray-100 dark:border-gray-800 py-4">
              {menuDefinition.map((menu) => (
                <label
                  key={menu.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/30 dark:bg-white/[0.01] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checkedMenus.includes(menu.id)}
                    onChange={(e) =>
                      handleCheckboxChange(menu.id, e.target.checked)
                    }
                    className="w-4.5 h-4.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {menu.name}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={loading || !selectedRole}
                className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Konfigurasi"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
