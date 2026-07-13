import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { dapodikService } from "../../services/dapodikService";
import { getRoleSlug } from "../../services/roleUtils";
import api from "../../services/api";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchableMenu {
  name: string;
  path: string;
  id: string;
  synonyms?: string[];
}

interface SearchResult {
  id: string;
  category: "menu" | "rombel" | "mapel" | "action";
  title: string;
  subtitle?: string;
  icon?: string;
  handler: () => void;
}

const LOCAL_MENUS: SearchableMenu[] = [
  { name: "Dashboard", path: "/", id: "dashboard", synonyms: ["beranda", "home", "utama"] },
  { name: "Profil Saya", path: "/profile", id: "profile", synonyms: ["akun", "me", "biodata saya"] },
  { name: "Profil Sekolah", path: "/school-profile", id: "profil-sekolah", synonyms: ["identitas sekolah", "npsn", "sekolah"] },
  { name: "GTK - Guru", path: "/gtk-data?tab=guru", id: "gtk-guru", synonyms: ["guru", "pendidik", "pengajar"] },
  { name: "GTK - Tendik", path: "/gtk-data?tab=tendik", id: "gtk-tendik", synonyms: ["tendik", "karyawan", "staf", "tata usaha"] },
  { name: "GTK - Buku Induk", path: "/gtk-buku-induk", id: "gtk-buku-induk", synonyms: ["induk gtk", "arsip guru"] },
  { name: "GTK - Rekap", path: "/gtk-data?tab=rekap", id: "gtk-rekap", synonyms: ["rekap guru", "statistik gtk"] },
  { name: "GTK - Kartu ID", path: "/gtk-card", id: "gtk-kartu", synonyms: ["cetak kartu guru", "id card guru"] },
  { name: "GTK - Pengajuan Perbaikan", path: "/gtk-perbaikan", id: "gtk-perbaikan", synonyms: ["edit data guru", "perbaikan ptk"] },
  { name: "GTK - Non Aktif", path: "/gtk-data?tab=nonaktif", id: "gtk-nonaktif", synonyms: ["guru keluar", "ptk nonaktif"] },
  { name: "PD - Peserta Didik", path: "/student-data", id: "peserta-didik", synonyms: ["siswa", "murid", "pelajar", "data siswa"] },
  { name: "PD - Buku Induk", path: "/student-buku-induk", id: "student-buku-induk", synonyms: ["induk siswa", "arsip siswa"] },
  { name: "PD - Rekap", path: "/student-rekap", id: "student-rekap", synonyms: ["rekap siswa", "statistik siswa"] },
  { name: "PD - Kartu ID", path: "/student-card", id: "student-card", synonyms: ["cetak kartu siswa", "id card siswa"] },
  { name: "PD - Pengajuan Perbaikan", path: "/student-perbaikan", id: "student-perbaikan", synonyms: ["edit data siswa", "perbaikan pd"] },
  { name: "PD - Keluar", path: "/student-data?tab=keluar", id: "student-keluar", synonyms: ["siswa keluar", "alumni", "pindah"] },
  { name: "Rombongan Belajar", path: "/class-data?tab=reguler", id: "rombongan-belajar", synonyms: ["kelas", "rombel", "wali kelas"] },
  { name: "Tugas GTK", path: "/gtk-tugas", id: "gtk-tugas", synonyms: ["tugas tambahan guru", "wakasek", "kepala lab", "pembina"] },
  { name: "Tugas PD", path: "/student-tugas", id: "pd-tugas", synonyms: ["tugas tambahan siswa", "osis", "ketua kelas"] },
  { name: "Mata Pelajaran", path: "/subject-data", id: "mata-pelajaran", synonyms: ["mapel", "pelajaran", "kurikulum mapel"] },
  { name: "Sarpras", path: "/sarpras-data", id: "sarpras", synonyms: ["sarana prasarana", "ruang", "alat", "bangunan"] },
  { name: "Akademik - Kalender", path: "/kalender", id: "kalender", synonyms: ["kalender akademik", "agenda sekolah"] },
  { name: "Akademik - Jadwal", path: "/jadwal", id: "jadwal", synonyms: ["jadwal pelajaran", "roster"] },
  { name: "Kurikulum", path: "/kurikulum", id: "kurikulum", synonyms: ["ksp", "struktur kurikulum"] },
  { name: "Indispliner - Kasus", path: "/indispliner-kasus", id: "indispliner-kasus", synonyms: ["pelanggaran", "poin", "skor", "murid nakal"] },
  { name: "Keuangan - SPP", path: "/keuangan-spp", id: "keuangan-spp", synonyms: ["bayar", "spp", "biaya sekolah", "tagihan"] },
  { name: "Keuangan - Pengaturan SPP", path: "/keuangan-spp-setting", id: "keuangan-spp-setting", synonyms: ["setting spp", "tarif spp"] },
  { name: "Administrasi Surat", path: "/administrasi-surat", id: "administrasi-surat", synonyms: ["surat masuk", "surat keluar", "arsip surat"] },
  { name: "Pengaturan Umum", path: "/pengaturan-umum", id: "pengaturan-umum", synonyms: ["setting web", "koneksi", "identitas"] },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const rolePrefix = user ? `/${getRoleSlug(user.role)}` : "";
  const isOperator = user?.role.toLowerCase().includes("operator") || user?.role.toLowerCase().includes("admin");

  // Fetch allowed menus for restricted roles
  useEffect(() => {
    const fetchAllowedMenus = async () => {
      if (!user || isOperator) return;
      try {
        const res = await api.get("/dapodik/menu-roles/my-menus");
        if (res.data && res.data.data) {
          setAllowedMenus(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch allowed menus for command palette:", err);
      }
    };
    if (isOpen) {
      fetchAllowedMenus();
    }
  }, [isOpen, user, isOperator]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter Local Menus based on Role / allowedMenus
  const getAllowedMenus = (): SearchableMenu[] => {
    if (isOperator) return LOCAL_MENUS;
    return LOCAL_MENUS.filter(menu => {
      if (menu.id === "profile" || menu.id === "dashboard") return true;
      return allowedMenus.includes(menu.id);
    });
  };

  // Keyboard navigation & handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].handler();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Search logic with Debouncing for API requests
  useEffect(() => {
    let active = true;
    if (!isOpen) return;

    const performSearch = async () => {
      setLoading(true);
      const searchResults: SearchResult[] = [];
      const cleanQuery = query.toLowerCase().trim();

      // 1. Local Actions
      const sysActions: SearchResult[] = [
        {
          id: "action-theme",
          category: "action",
          title: "Ubah Tema Tampilan",
          subtitle: "Ganti mode Gelap / Terang secara instan",
          icon: "🌓",
          handler: () => {
            toggleTheme();
            onClose();
          }
        },
        {
          id: "action-logout",
          category: "action",
          title: "Keluar dari Sistem (Logout)",
          subtitle: "Selesaikan sesi pendaftaran / masuk Anda",
          icon: "🚪",
          handler: () => {
            logout();
            onClose();
          }
        }
      ];

      searchResults.push(
        ...sysActions.filter(act => 
          act.title.toLowerCase().includes(cleanQuery) || 
          act.subtitle?.toLowerCase().includes(cleanQuery)
        )
      );

      // 2. Local Menus (synonym search)
      const allowed = getAllowedMenus();
      const matchedMenus = allowed.filter(menu => {
        if (!cleanQuery) return true; // show all when empty
        return (
          menu.name.toLowerCase().includes(cleanQuery) ||
          menu.synonyms?.some(syn => syn.includes(cleanQuery))
        );
      }).map(menu => ({
        id: `menu-${menu.id}`,
        category: "menu" as const,
        title: menu.name,
        subtitle: `Navigasi ke halaman ${menu.name}`,
        icon: "🧭",
        handler: () => {
          const path = menu.path.startsWith("/") && menu.path !== "/" 
            ? `${rolePrefix}${menu.path}` 
            : (menu.path === "/" ? (rolePrefix || "/") : menu.path);
          navigate(path);
          onClose();
        }
      }));

      searchResults.push(...matchedMenus);

      // 3. API Requests (Only if search length >= 3)
      if (cleanQuery.length >= 3) {
        try {
          // Fetch Rombel
          const rombelRes = await dapodikService.getRombonganBelajar("reguler", 5, 1, cleanQuery);
          if (active && rombelRes?.data) {
            const rombelResults = rombelRes.data.map((r: any) => ({
              id: `rombel-${r.rombongan_belajar_id}`,
              category: "rombel" as const,
              title: r.nama,
              subtitle: `Kelas ${r.tingkat_sekolah_id} - ${r.kurikulum_nama || "Kurikulum Belum Ditentukan"}`,
              icon: "🏫",
              handler: () => {
                navigate(`${rolePrefix}/class-data?tab=reguler&search=${r.nama}`);
                onClose();
              }
            }));
            searchResults.push(...rombelResults);
          }
        } catch (e) {
          console.error("Failed to search rombel in command palette", e);
        }

        try {
          // Fetch Mapel
          const mapelRes = await dapodikService.getMataPelajaran(5, cleanQuery, 1);
          if (active && mapelRes?.data) {
            const mapelResults = mapelRes.data.map((m: any) => ({
              id: `mapel-${m.mata_pelajaran_id}`,
              category: "mapel" as const,
              title: m.nama,
              subtitle: `Kode Pelajaran: ${m.mata_pelajaran_id}`,
              icon: "📖",
              handler: () => {
                navigate(`${rolePrefix}/subject-data?search=${m.nama}`);
                onClose();
              }
            }));
            searchResults.push(...mapelResults);
          }
        } catch (e) {
          console.error("Failed to search mapel in command palette", e);
        }
      }

      if (active) {
        setResults(searchResults);
        setSelectedIndex(0);
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, query.length >= 3 ? 350 : 50);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [query, isOpen, allowedMenus]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-99999 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[12vh]">
      {/* Backdrop Close click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div 
        ref={containerRef}
        className="relative bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Search Bar Input */}
        <div className="relative border-b border-gray-100 dark:border-gray-800 flex items-center px-4 py-3.5">
          <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ketik menu, rombel, mapel, atau aksi sistem..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-gray-900 dark:text-white border-0 outline-hidden focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[15px]"
          />
          {loading && (
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {!loading && (
            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 px-1.5 py-0.5 rounded font-mono shrink-0">ESC</span>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {results.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada hasil yang cocok dengan kata kunci Anda.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ketik minimal 3 karakter untuk memicu pencarian Rombel & Mapel.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Categorize and render results */}
              {["action", "menu", "rombel", "mapel"].map((cat) => {
                const catResults = results.filter(r => r.category === cat);
                if (catResults.length === 0) return null;

                const categoryLabel = 
                  cat === "action" ? "Aksi Sistem" :
                  cat === "menu" ? "Navigasi Menu" :
                  cat === "rombel" ? "Rombongan Belajar (Kelas)" : "Mata Pelajaran";

                return (
                  <div key={cat} className="space-y-1">
                    <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {categoryLabel}
                    </div>
                    {catResults.map((result) => {
                      // Find overall index to determine selection state
                      const overallIndex = results.findIndex(r => r.id === result.id);
                      const isSelected = overallIndex === selectedIndex;

                      return (
                        <div
                          key={result.id}
                          onClick={result.handler}
                          className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-200 ${
                            isSelected 
                              ? "bg-brand-50 text-gray-900 dark:bg-brand-500/10 dark:text-white" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <span className="text-lg mr-3 shrink-0">{result.icon || "🔍"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate leading-normal">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className={`text-[11px] truncate leading-tight mt-0.5 ${
                                isSelected ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-505"
                              }`}>
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
