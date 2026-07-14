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

// Tree-structured menu definition mirroring AppSidebar
interface MenuNode {
  id: string;
  name: string;
  children?: MenuNode[];
}

const menuTree: MenuNode[] = [
  {
    id: "data-master",
    name: "Data Master",
    children: [
      { id: "profil-sekolah", name: "Profil Sekolah" },
      {
        id: "gtk",
        name: "GTK",
        children: [
          { id: "gtk-guru", name: "Guru" },
          { id: "gtk-tendik", name: "Tendik" },
          { id: "gtk-tugas", name: "Tugas GTK" },
          { id: "gtk-buku-induk", name: "Buku Induk" },
          { id: "gtk-rekap", name: "Rekap GTK" },
          { id: "gtk-kartu", name: "Kartu ID" },
          { id: "gtk-perbaikan", name: "Pengajuan Perbaikan" },
          { id: "gtk-nonaktif", name: "GTK Non Aktif" },
        ],
      },
      {
        id: "peserta-didik",
        name: "Peserta Didik",
        children: [
          { id: "pd-aktif", name: "Peserta Didik" },
          { id: "pd-tugas", name: "Tugas PD" },
          { id: "pd-buku-induk", name: "Buku Induk" },
          { id: "pd-rekap", name: "Rekap PD" },
          { id: "pd-kartu", name: "Kartu ID PD" },
          { id: "pd-perbaikan", name: "Pengajuan Perbaikan" },
          { id: "pd-mutasi", name: "Pengajuan Mutasi" },
          { id: "pd-keluar", name: "PD Keluar" },
        ],
      },
      {
        id: "rombongan-belajar",
        name: "Rombongan Belajar",
        children: [
          { id: "rombel-reguler", name: "Reguler" },
          { id: "rombel-praktik", name: "Praktik" },
          { id: "rombel-ekskul", name: "Ekskul" },
          { id: "rombel-pilihan", name: "Matpel Pilihan" },
          { id: "rombel-wali", name: "Wali" },
          { id: "rombel-rekap", name: "Rekap Rombel" },
        ],
      },
      { id: "mata-pelajaran", name: "Mata Pelajaran" },
      { id: "sarpras", name: "Sarpras" },
    ],
  },
  {
    id: "wali-kelas",
    name: "Wali Kelas",
    children: [
      { id: "wali-kelas-data", name: "Data Kelas" },
      { id: "wali-kelas-rapor", name: "Rapor Kelas" },
    ],
  },
  {
    id: "akademik",
    name: "Akademik",
    children: [
      { id: "akademik-tahun-pelajaran", name: "Tahun Pelajaran" },
      { id: "akademik-kompetensi", name: "Kompetensi Keahlian" },
      { id: "gtk-card", name: "Kartu ID GTK" },
      { id: "student-card", name: "Kartu ID PD" },
    ],
  },
  {
    id: "kurikulum",
    name: "Kurikulum",
    children: [
      { id: "kurikulum-pengaturan-jam", name: "Pengaturan Jam" },
      { id: "kurikulum-jadwal-pelajaran", name: "Jadwal Pelajaran" },
      {
        id: "kurikulum-presensi",
        name: "Presensi",
        children: [
          { id: "presensi-scanner", name: "Scanner QR" },
          { id: "presensi-pd", name: "Presensi Peserta Didik" },
          { id: "presensi-gtk", name: "Presensi GTK" },
          { id: "presensi-mapel", name: "Presensi Mapel" },
          { id: "presensi-izin", name: "Izin" },
          { id: "presensi-hari-libur", name: "Hari Libur" },
        ],
      },
    ],
  },
  {
    id: "indisipliner",
    name: "Indisipliner",
    children: [
      { id: "indisipliner-pd", name: "Peserta Didik" },
      { id: "indisipliner-gtk", name: "GTK" },
    ],
  },
  {
    id: "keuangan",
    name: "Keuangan",
    children: [
      { id: "keuangan-pengaturan", name: "Pengaturan Tagihan" },
      { id: "keuangan-tagihan", name: "Tagihan SPP" },
      { id: "keuangan-laporan", name: "Laporan & Rekap" },
    ],
  },
  {
    id: "administrasi-surat",
    name: "Administrasi Surat",
    children: [
      { id: "surat-pengaturan-nomor", name: "Pengaturan Nomor" },
      { id: "surat-template", name: "Template Surat" },
      { id: "surat-masuk", name: "Surat Masuk" },
      { id: "surat-keluar", name: "Surat Keluar" },
      { id: "surat-arsip", name: "Arsip Surat" },
    ],
  },
  {
    id: "layanan-mandala",
    name: "Layanan Mandala",
    children: [
      { id: "layanan-gtk", name: "GTK" },
      { id: "layanan-pd", name: "Peserta Didik" },
      { id: "layanan-pelaporan", name: "Pelaporan Dokumen" },
    ],
  },
  {
    id: "pengaturan",
    name: "Pengaturan",
    children: [
      { id: "pengaturan-menu", name: "Menu" },
      { id: "pengaturan-backup", name: "Backup" },
      { id: "pengaturan-umum", name: "Umum" },
    ],
  },
];

// Flatten tree to get all leaf + parent IDs for save operations
function getAllIds(nodes: MenuNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children) {
      ids.push(...getAllIds(node.children));
    }
  }
  return ids;
}

// Get all child IDs (including nested) of a node
function getDescendantIds(node: MenuNode): string[] {
  const ids: string[] = [];
  if (node.children) {
    for (const child of node.children) {
      ids.push(child.id);
      ids.push(...getDescendantIds(child));
    }
  }
  return ids;
}

const allMenuIds = getAllIds(menuTree);

// Chevron icon component
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);



export default function MenuSettings() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedMenus, setCheckedMenus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mappings, setMappings] = useState<MenuRoleMapping[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/dapodik/roles");
        if (res.data && res.data.data) {
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

  // Expand all parent nodes by default
  useEffect(() => {
    const allParentIds = new Set<string>();
    const collectParents = (nodes: MenuNode[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          allParentIds.add(node.id);
          collectParents(node.children);
        }
      }
    };
    collectParents(menuTree);
    setExpandedNodes(allParentIds);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCheckboxChange = (node: MenuNode, checked: boolean) => {
    setCheckedMenus((prev) => {
      const next = new Set(prev);
      // Toggle self
      if (checked) {
        next.add(node.id);
      } else {
        next.delete(node.id);
      }
      // Toggle all descendants
      const descendants = getDescendantIds(node);
      for (const d of descendants) {
        if (checked) {
          next.add(d);
        } else {
          next.delete(d);
        }
      }
      return Array.from(next);
    });
  };

  const handleSelectAll = () => {
    setCheckedMenus([...allMenuIds]);
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

  // Check states for parent nodes
  const getCheckState = (node: MenuNode): "checked" | "indeterminate" | "unchecked" => {
    if (!node.children || node.children.length === 0) {
      return checkedMenus.includes(node.id) ? "checked" : "unchecked";
    }
    const descendants = getDescendantIds(node);
    const checkedCount = descendants.filter((d) => checkedMenus.includes(d)).length;
    if (checkedCount === 0 && !checkedMenus.includes(node.id)) return "unchecked";
    if (checkedCount === descendants.length) return "checked";
    return "indeterminate";
  };

  // Render a menu tree node recursively
  const renderNode = (node: MenuNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const checkState = getCheckState(node);
    const isChecked = checkState === "checked";
    const isIndeterminate = checkState === "indeterminate";

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors group ${
            hasChildren
              ? "hover:bg-gray-100 dark:hover:bg-white/[0.04]"
              : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {/* Expand/Collapse toggle for parents */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              <ChevronIcon open={isExpanded} />
            </button>
          ) : (
            <span className="w-5 flex-shrink-0" />
          )}

          {/* Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isChecked}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={(e) => handleCheckboxChange(node, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 flex-shrink-0"
            />

            {/* Label */}
            <span
              className={`text-sm truncate ${
                hasChildren
                  ? "font-semibold text-gray-800 dark:text-white/90"
                  : "font-medium text-gray-600 dark:text-gray-300"
              }`}
            >
              {node.name}
            </span>
            {/* Child count badge */}
            {hasChildren && (
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400 flex-shrink-0">
                {node.children!.length}
              </span>
            )}
          </label>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l border-gray-100 dark:border-gray-800" style={{ marginLeft: `${depth * 20 + 24}px` }}>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Calculate stats
  const totalMenus = allMenuIds.length;
  const activeMenus = checkedMenus.length;

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
            
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari peran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-white/[0.02] dark:text-white"
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
                        ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 shadow-sm"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        selectedRole?.peran_id === role.peran_id ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                      }`} />
                      {role.peran_nama}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-400">
                  Peran tidak ditemukan
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Menu Tree */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white/90">
                  Daftar Hak Akses Menu untuk:{" "}
                  <span className="text-brand-500 font-bold">
                    {selectedRole?.peran_nama || "Loading..."}
                  </span>
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Centang item untuk mengizinkan akses. Parent checkbox mencentang semua anak otomatis.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.05] px-2.5 py-1 rounded-lg">
                  {activeMenus}/{totalMenus}
                </span>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 dark:bg-white/[0.05] rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${totalMenus > 0 ? (activeMenus / totalMenus) * 100 : 0}%` }}
              />
            </div>

            {/* Tree */}
            <div className="max-h-[520px] overflow-y-auto pr-1 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-0.5">
              {menuTree.map((node) => renderNode(node, 0))}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
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
                  <>
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Konfigurasi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
