import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BoxCubeIcon,
  BoxIcon,
  CalenderIcon,
  ChevronDownIcon,
  DocsIcon,
  DotIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

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
    icon: <CalenderIcon />,
    name: "Kalender",
    path: "/calendar",
  },
  {
    icon: <UserCircleIcon />,
    name: "Profil Pengguna",
    path: "/profile",
  },
  {
    name: "Formulir",
    icon: <ListIcon />,
    subItems: [
      {
        name: "Elemen Formulir",
        path: "/form-elements",
        icon: <DotIcon />,
      },
    ],
  },
  {
    name: "Tabel",
    icon: <TableIcon />,
    subItems: [
      {
        name: "Tabel Dasar",
        path: "/basic-tables",
        icon: <DotIcon />,
      },
    ],
  },
  {
    name: "Halaman",
    icon: <PageIcon />,
    subItems: [
      {
        name: "Halaman Kosong",
        path: "/blank",
        icon: <DotIcon />,
      },
      {
        name: "Error 404",
        path: "/error-404",
        icon: <DotIcon />,
      },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Grafik",
    subItems: [
      {
        name: "Grafik Garis",
        path: "/line-chart",
        icon: <DotIcon />,
      },
      {
        name: "Grafik Batang",
        path: "/bar-chart",
        icon: <DotIcon />,
      },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Elemen UI",
    subItems: [
      {
        name: "Alert",
        path: "/alerts",
        icon: <DotIcon />,
      },
      {
        name: "Avatar",
        path: "/avatars",
        icon: <DotIcon />,
      },
      {
        name: "Badge",
        path: "/badge",
        icon: <DotIcon />,
      },
      {
        name: "Tombol",
        path: "/buttons",
        icon: <DotIcon />,
      },
      {
        name: "Gambar",
        path: "/images",
        icon: <DotIcon />,
      },
      {
        name: "Video",
        path: "/videos",
        icon: <DotIcon />,
      },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Autentikasi",
    subItems: [
      {
        name: "Masuk",
        path: "/signin",
        icon: <DotIcon />,
      },
      {
        name: "Daftar",
        path: "/signup",
        icon: <DotIcon />,
      },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      const currentFullPath = location.pathname + location.search;
      return currentFullPath === path || location.pathname === path;
    },
    [location.pathname, location.search]
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
    const activeOthers = findActiveMenus(othersItems, "others");
    setOpenSubmenus([...activeMain, ...activeOthers]);
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
                  to={nav.path}
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
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
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
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
