import React from "react";
import { Navigate, useLocation } from "react-router";
import { useSekolah } from "../../context/SekolahContext";
import { useAuth } from "../../context/AuthContext";
import { getRoleSlug } from "../../services/roleUtils";

const SyncGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sekolah, loading } = useSekolah();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const rolePath = user ? `/${getRoleSlug(user.role)}` : "";
  const syncApiPath = `${rolePath}/sync-api`;

  // Super Admin tidak perlu pengecekan sinkronisasi sekolah
  if (user && user.role === 'Super Admin') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Jika sudah login tapi data sekolah tidak ada (belum sinkron)
  // Dan tidak sedang di halaman sync-api, paksa ke halaman sync-api
  if (isAuthenticated && !sekolah && location.pathname !== syncApiPath && location.pathname !== "/sync-api") {
    return <Navigate to={syncApiPath} replace />;
  }

  // Jika sudah sinkron tapi malah buka halaman sync-api, kembalikan ke dashboard
  if (isAuthenticated && sekolah && (location.pathname === syncApiPath || location.pathname === "/sync-api")) {
    return <Navigate to={rolePath || "/"} replace />;
  }

  return <>{children}</>;
};

export default SyncGuard;
