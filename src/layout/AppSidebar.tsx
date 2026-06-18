import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BoxIcon,
  ChevronDownIcon,
  DocsIcon,
  DotIcon,
  GridIcon,
  HorizontaLDots,
  PlugInIcon,
  TableIcon,
  BoltIcon,
  GroupIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useSekolah } from "../context/SekolahContext";
import { useAuth } from "../context/AuthContext";
import { getRoleSlug } from "../services/roleUtils";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  color?: string;
  subItems?: NavItem[];
  pro?: boolean;
  new?: boolean;
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <BoxIcon />,
    name: "Data Master",
    subItems: [
      {
        name: "Profil Sekolah",
        path: "/school-profile",
        icon: <DotIcon />,
      },
      {
        name: "GTK",
        icon: <DotIcon />,
        subItems: [
          {
            name: "Guru",
            path: "/gtk-data?tab=guru",
            icon: <DotIcon />,
          },
          {
            name: "Tendik",
            path: "/gtk-data?tab=tendik",
            icon: <DotIcon />,
          },
          {
            name: "Rekap GTK",
            path: "/gtk-data?tab=rekap",
            icon: <DotIcon />,
          },
          {
            name: "Kartu ID GTK",
            path: "/gtk-card",
            icon: <DotIcon />,
          },
          {
            name: "GTK Non Aktif",
            path: "/gtk-data?tab=nonaktif",
            icon: <DotIcon />,
            color: "text-red-500 dark:text-red-400",
          },
        ],
      },
      {
        name: "Peserta Didik",
        icon: <DotIcon />,
        subItems: [
          {
            name: "Peserta Didik",
            path: "/student-data?tab=aktif",
            icon: <DotIcon />,
          },
          {
            name: "Rekap PD",
            path: "/student-data?tab=rekap",
            icon: <DotIcon />,
          },
          {
            name: "Kartu ID PD",
            path: "/student-card",
            icon: <DotIcon />,
          },
          {
            name: "PD Keluar",
            path: "/student-data?tab=keluar",
            icon: <DotIcon />,
            color: "text-red-500 dark:text-red-400",
          },
        ],
      },
      {
        name: "Rombongan Belajar",
        icon: <DotIcon />,
        subItems: [
          {
            name: "Reguler",
            path: "/class-data?tab=reguler",
            icon: <DotIcon />,
          },
          {
            name: "Praktik",
            path: "/class-data?tab=praktik",
            icon: <DotIcon />,
          },
          {
            name: "Ekskul",
            path: "/class-data?tab=ekskul",
            icon: <DotIcon />,
          },
          {
            name: "Matpel Pilihan",
            path: "/class-data?tab=pilihan",
            icon: <DotIcon />,
          },
          {
            name: "Wali",
            path: "/class-data?tab=wali",
            icon: <DotIcon />,
          },
          {
            name: "Rekap Rombel",
            path: "/class-data?tab=rekap",
            icon: <DotIcon />,
          },
        ],
      },
      {
        name: "Mata Pelajaran",
        path: "/subject-data",
        icon: <DotIcon />,
      },
      {
        name: "Sarpras",
        path: "/sarpras-data",
        icon: <DotIcon />,
      },
    ],
  },
  {
    icon: <DocsIcon />,
    name: "Akademik",
    subItems: [
      {
        name: "Tahun Pelajaran",
        path: "/academic/year",
        icon: <DotIcon />,
      },
      {
        name: "Kompetensi Keahlian",
        path: "/academic/competency",
        icon: <DotIcon />,
      },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Kurikulum",
    subItems: [
      {
        name: "Pengaturan Jam",
        path: "/kurikulum/pengaturan-jam",
        icon: <DotIcon />,
      },
      {
        name: "Jadwal Pelajaran",
        path: "/kurikulum/jadwal-pelajaran",
        icon: <DotIcon />,
      },
      {
        name: "Presensi",
        icon: <DotIcon />,
        subItems: [
          {
            name: "Scanner QR",
            path: "/kurikulum/presensi/scanner",
            icon: <DotIcon />,
          },
          {
            name: "Presensi Peserta Didik",
            path: "/kurikulum/presensi/pesertadidik",
            icon: <DotIcon />,
          },
          {
            name: "Presensi GTK",
            path: "/kurikulum/presensi/gtk",
            icon: <DotIcon />,
          },
          {
            name: "Presensi Mapel",
            path: "/kurikulum/presensi/mapel",
            icon: <DotIcon />,
          },
          {
            name: "Izin",
            path: "/kurikulum/presensi/izin",
            icon: <DotIcon />,
          },
          {
            name: "Hari Libur",
            path: "/kurikulum/presensi/hari-libur",
            icon: <DotIcon />,
          },
        ],
      },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "Indisipliner",
    subItems: [
      {
        name: "Peserta Didik",
        path: "/indisipliner?tab=peserta-didik",
        icon: <DotIcon />,
      },
      {
        name: "GTK",
        path: "/indisipliner?tab=gtk",
        icon: <DotIcon />,
      },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Keuangan",
    subItems: [
      {
        name: "Pengaturan Tagihan",
        path: "/keuangan?tab=pengaturan",
        icon: <DotIcon />,
      },
      {
        name: "Tagihan SPP",
        path: "/keuangan?tab=tagihan",
        icon: <DotIcon />,
      },
      {
        name: "Laporan & Rekap",
        path: "/keuangan?tab=laporan",
        icon: <DotIcon />,
      },
    ],
  },
  {
    icon: <DocsIcon />,
    name: "Administrasi Surat",
    subItems: [
      {
        name: "Pengaturan Nomor",
        path: "/surat?tab=pengaturan",
        icon: <DotIcon />,
      },
      {
        name: "Template Surat",
        path: "/surat?tab=template",
        icon: <DotIcon />,
      },
      {
        name: "Surat Masuk",
        path: "/surat?tab=masuk",
        icon: <DotIcon />,
      },
      {
        name: "Surat Keluar",
        path: "/surat?tab=keluar",
        icon: <DotIcon />,
      },
      {
        name: "Arsip Surat",
        path: "/surat?tab=arsip",
        icon: <DotIcon />,
      },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Layanan Mandala",
    subItems: [
      {
        name: "GTK",
        path: "/layanan?tab=gtk",
        icon: <DotIcon />,
      },
      {
        name: "Peserta Didik",
        path: "/layanan?tab=pesertadidik",
        icon: <DotIcon />,
      },
      {
        name: "Pelaporan Dokumen",
        path: "/pelaporan",
        icon: <DotIcon />,
      },
    ],
  },
  {
    name: "Pengaturan",
    icon: <PlugInIcon />,
    subItems: [
      {
        name: "Sync API",
        path: "/sync-api",
        icon: <BoltIcon />,
      },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { sekolah } = useSekolah();
  const { user } = useAuth();
  const location = useLocation();

  const rolePrefix = user ? `/${getRoleSlug(user.role)}` : "";

  // Helper to prepend role prefix to path
  const getFullPath = (path?: string) => {
    if (!path || path.startsWith("/signin") || path.startsWith("/signup")) return path;
    if (path === "/") return rolePrefix || "/";
    // Don't prepend if it already has the prefix
    if (path.startsWith(rolePrefix)) return path;
    return `${rolePrefix}${path}`;
  };

  // Jika belum sinkron, hanya tampilkan menu Dashboard dan Sync API
  const filteredNavItems = sekolah 
    ? navItems 
    : navItems.filter(item => item.name === "Dashboard" || item.name === "Pengaturan");

  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      const fullPath = getFullPath(path);
      const currentFullPath = location.pathname + location.search;
      return currentFullPath === fullPath || location.pathname === fullPath;
    },
    [location.pathname, location.search, rolePrefix]
  );

  const isSubItemActive = useCallback(
    (item: NavItem): boolean => {
      if (item.path && isActive(item.path)) return true;
      if (item.subItems) {
        return item.subItems.some((sub) => isSubItemActive(sub));
      }
      return false;
    },
    [isActive]
  );

  useEffect(() => {
    const findActiveMenus = (items: NavItem[], prefix: string): string[] => {
      for (const item of items) {
        const key = `${prefix}-${item.name}`;
        if (item.subItems) {
          if (isSubItemActive(item)) {
            return [key, ...findActiveMenus(item.subItems, key)];
          }
        }
      }
      return [];
    };

    const activeMain = findActiveMenus(navItems, "main");
    setOpenSubmenus(activeMain);
  }, [location, isSubItemActive]);

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderMenuItems = (
    items: NavItem[],
    prefix: string,
    level: number = 0
  ) => (
    <ul className={`flex flex-col gap-1 ${level > 0 ? "mt-2 ml-4" : "gap-4"}`}>
      {items.map((nav) => {
        const key = `${prefix}-${nav.name}`;
        const isOpen = openSubmenus.includes(key);
        const hasSubItems = !!nav.subItems?.length;
        const active = isSubItemActive(nav);

        return (
          <li key={nav.name}>
            {hasSubItems ? (
              <>
                <button
                  onClick={() => toggleSubmenu(key)}
                  className={`menu-item group w-full ${
                    active ? "menu-item-active" : "menu-item-inactive"
                  } cursor-pointer ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  } ${level > 0 ? "pl-4" : ""}`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      active ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    } ${nav.color || ""}`}
                  >
                    {React.cloneElement(nav.icon as React.ReactElement<any>, {
                      className: level > 0 ? "w-4 h-4" : "w-6 h-6",
                    })}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text ${nav.color || ""}`}>
                      {nav.name}
                    </span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      } ${active ? "text-brand-500" : ""}`}
                    />
                  )}
                </button>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <div
                    ref={(el) => {
                      subMenuRefs.current[key] = el;
                    }}
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-[1000px]" : "max-h-0"
                    }`}
                  >
                    {renderMenuItems(nav.subItems!, key, level + 1)}
                  </div>
                )}
              </>
            ) : (
              nav.path && (
                <Link
                  to={getFullPath(nav.path) || ""}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  } ${
                    level > 0 ? "pl-4" : ""
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    } ${nav.color || ""}`}
                  >
                    {React.cloneElement(nav.icon as React.ReactElement<any>, {
                      className: level > 0 ? "w-4 h-4" : "w-6 h-6",
                    })}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text ${nav.color || ""}`}>
                      {nav.name}
                    </span>
                  )}
                  {nav.new && (
                    <span className="ml-auto menu-dropdown-badge">new</span>
                  )}
                  {nav.pro && (
                    <span className="ml-auto menu-dropdown-badge">pro</span>
                  )}
                </Link>
              )
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex items-center ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to={rolePrefix || "/"} className="flex items-center gap-3">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              {sekolah?.logo ? (
                <img
                  src={sekolah.logo}
                  alt="Logo Sekolah"
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {sekolah?.nama?.charAt(0) || "S"}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white leading-tight">
                  {sekolah?.nama || "SIMAK"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {sekolah?.npsn || "Sistem Informasi"}
                </span>
              </div>
            </>
          ) : (
            sekolah?.logo ? (
              <img
                src={sekolah.logo}
                alt="Logo"
                width={32}
                height={32}
              />
            ) : (
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {sekolah?.nama?.charAt(0) || "S"}
              </div>
            )
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
