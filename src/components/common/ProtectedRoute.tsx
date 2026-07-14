import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { getRoleSlug } from '../../services/roleUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const pathPermissionMap: Record<string, string[]> = {
  '/school-profile': ['profil-sekolah'],
  '/gtk-data': ['gtk-guru', 'gtk-tendik', 'gtk-rekap', 'gtk-nonaktif'],
  '/gtk-data/edit': ['gtk-guru', 'gtk-tendik'],
  '/gtk-perbaikan': ['gtk-perbaikan'],
  '/student-data': ['pd-aktif', 'pd-rekap', 'pd-keluar'],
  '/student-data/edit': ['pd-aktif', 'wali-kelas-data'],
  '/student-perbaikan': ['pd-perbaikan'],
  '/student-mutasi': ['pd-mutasi'],
  '/class-data': ['rombel-reguler', 'rombel-praktik', 'rombel-ekskul', 'rombel-pilihan', 'rombel-wali', 'rombel-rekap'],
  '/class-data/detail': ['rombel-reguler', 'rombel-praktik', 'rombel-ekskul', 'rombel-pilihan', 'rombel-wali', 'rombel-rekap'],
  '/subject-data': ['mata-pelajaran'],
  '/sarpras-data': ['sarpras'],
  '/gtk-buku-induk': ['gtk-buku-induk'],
  '/student-buku-induk': ['pd-buku-induk'],
  '/gtk-tugas': ['gtk-tugas'],
  '/student-tugas': ['pd-tugas'],
  '/academic/year': ['akademik-tahun-pelajaran'],
  '/academic/competency': ['akademik-kompetensi'],
  '/gtk-card': ['gtk-kartu'],
  '/student-card': ['pd-kartu'],
  '/kurikulum/pengaturan-jam': ['kurikulum-pengaturan-jam'],
  '/kurikulum/jadwal-pelajaran': ['kurikulum-jadwal-pelajaran'],
  '/kurikulum/presensi/scanner': ['presensi-scanner'],
  '/kurikulum/presensi/pesertadidik': ['presensi-pd'],
  '/kurikulum/presensi/gtk': ['presensi-gtk'],
  '/kurikulum/presensi/mapel': ['presensi-mapel'],
  '/kurikulum/presensi/rekap': ['presensi-rekap'],
  '/kurikulum/presensi/izin': ['presensi-izin'],
  '/kurikulum/presensi/hari-libur': ['presensi-hari-libur'],
  '/indisipliner': ['indisipliner-pd', 'indisipliner-gtk'],
  '/keuangan': ['keuangan-pengaturan', 'keuangan-tagihan', 'keuangan-laporan'],
  '/surat': ['surat-pengaturan-nomor', 'surat-template', 'surat-masuk', 'surat-keluar', 'surat-arsip'],
  '/layanan': ['layanan-gtk', 'layanan-pd'],
  '/pelaporan': ['layanan-pelaporan'],
  '/pelaporan/detail': ['layanan-pelaporan'],
  '/pengaturan/menu': ['pengaturan-menu'],
  '/pengaturan/backup': ['pengaturan-backup'],
  '/pengaturan/umum': ['pengaturan-umum'],
  '/wali/class-data': ['wali-kelas-data'],
  '/wali/class-rapor': ['wali-kelas-rapor'],
};

const isPathAllowed = (pathname: string, roleSlug: string, allowedMenus: string[], isOperator: boolean): boolean => {
  if (isOperator) return true;

  const rolePrefix = `/${roleSlug}`;
  let subPath = pathname;
  if (pathname.startsWith(rolePrefix)) {
    subPath = pathname.substring(rolePrefix.length);
  }

  // Normalisasi path
  let cleanPath = subPath.split('?')[0];
  if (cleanPath.endsWith('/') && cleanPath !== '/') {
    cleanPath = cleanPath.slice(0, -1);
  }

  if (cleanPath === '' || cleanPath === '/' || cleanPath === '/profile') {
    return true;
  }

  if (cleanPath.startsWith('/wali')) {
    const required = pathPermissionMap[cleanPath];
    if (required && required.length > 0) {
      return required.some((menuId) => allowedMenus.includes(menuId));
    }
    return true;
  }

  let requiredMenus: string[] | undefined = pathPermissionMap[cleanPath];

  if (!requiredMenus) {
    const sortedKeys = Object.keys(pathPermissionMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (cleanPath.startsWith(key + '/') || cleanPath === key) {
        requiredMenus = pathPermissionMap[key];
        break;
      }
    }
  }

  if (requiredMenus && requiredMenus.length > 0) {
    return requiredMenus.some((menuId) => allowedMenus.includes(menuId));
  }

  return true;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading, isAuthenticated, allowedMenus } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Jika tidak punya akses ke role ini, arahkan ke dashboard role miliknya sendiri
    return <Navigate to={`/${getRoleSlug(user.role)}`} replace />;
  }

  if (user) {
    const roleSlug = getRoleSlug(user.role);
    const isOperator = user.role.toLowerCase().includes("operator") || user.role.toLowerCase().includes("admin");
    if (!isPathAllowed(location.pathname, roleSlug, allowedMenus, isOperator)) {
      // Jika mencoba mengakses path yang tidak terotorisasi, kembalikan ke menu yang terakhir kali berhasil dibuka
      const lastAllowedPath = sessionStorage.getItem('last_allowed_path');
      if (lastAllowedPath && lastAllowedPath !== location.pathname) {
        return <Navigate to={lastAllowedPath} replace />;
      }
      return <Navigate to={`/${roleSlug}`} replace />;
    } else {
      // Simpan path yang valid saat ini ke sessionStorage
      sessionStorage.setItem('last_allowed_path', location.pathname + location.search);
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
