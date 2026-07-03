import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import EditGTKPage from "./EditGTKPage";
import EditStudentPage from "./EditStudentPage";
import PageMeta from "../../components/common/PageMeta";

export default function ProfilePage() {
  const { user } = useAuth();
  
  // Get active logged-in user ID to key our sessionStorage cache securely
  const getUserId = (): string | null => {
    try {
      const saved = localStorage.getItem("user_data");
      if (saved) return JSON.parse(saved).id;
    } catch (e) {}
    return null;
  };

  const userId = getUserId();
  const cacheKeyType = userId ? `profile_type_${userId}` : null;
  const cacheKeyTarget = userId ? `profile_target_id_${userId}` : null;
  const cacheKeyAdmin = userId ? `profile_admin_data_${userId}` : null;

  const [profileType, setProfileType] = useState<"gtk" | "siswa" | "admin" | null>(() => {
    return cacheKeyType ? (sessionStorage.getItem(cacheKeyType) as any) : null;
  });
  const [targetId, setTargetId] = useState<string | null>(() => {
    return cacheKeyTarget ? sessionStorage.getItem(cacheKeyTarget) : null;
  });
  const [adminData, setAdminData] = useState<any>(() => {
    const cached = cacheKeyAdmin ? sessionStorage.getItem(cacheKeyAdmin) : null;
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(() => {
    // If we already have the profile type cached, we don't need to show the full screen loading
    return cacheKeyType ? !sessionStorage.getItem(cacheKeyType) : true;
  });

  useEffect(() => {
    // If already cached in sessionStorage, do not fetch again
    if (cacheKeyType && sessionStorage.getItem(cacheKeyType)) {
      return;
    }

    const fetchMe = async () => {
      try {
        setLoading(true);
        const res = await api.get("/auth/me");
        const data = res.data;
        
        if (data.ptk_id) {
          if (cacheKeyType) sessionStorage.setItem(cacheKeyType, "gtk");
          if (cacheKeyTarget) sessionStorage.setItem(cacheKeyTarget, data.ptk_id);
          setProfileType("gtk");
          setTargetId(data.ptk_id);
        } else if (data.peserta_didik_id) {
          if (cacheKeyType) sessionStorage.setItem(cacheKeyType, "siswa");
          if (cacheKeyTarget) sessionStorage.setItem(cacheKeyTarget, data.peserta_didik_id);
          setProfileType("siswa");
          setTargetId(data.peserta_didik_id);
        } else {
          if (cacheKeyType) sessionStorage.setItem(cacheKeyType, "admin");
          if (cacheKeyAdmin) sessionStorage.setItem(cacheKeyAdmin, JSON.stringify(data));
          setProfileType("admin");
          setAdminData(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data profil:", err);
        if (cacheKeyType) sessionStorage.setItem(cacheKeyType, "admin");
        setProfileType("admin");
        // Fallback ke data user dari context
        if (user) {
          const fallback = {
            nama: user.nama,
            email: user.email,
            peran_nama: user.role,
            username: user.email?.split("@")[0] || "admin",
          };
          if (cacheKeyAdmin) sessionStorage.setItem(cacheKeyAdmin, JSON.stringify(fallback));
          setAdminData(fallback);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [user, cacheKeyType, cacheKeyTarget, cacheKeyAdmin]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (profileType === "gtk" && targetId) {
    return <EditGTKPage profileId={targetId} />;
  }

  if (profileType === "siswa" && targetId) {
    return <EditStudentPage profileId={targetId} />;
  }

  // Tampilan Profil Utama untuk Admin, Super Admin, dan Operator
  return (
    <>
      <PageMeta
        title="Profil Saya | SIMAK"
        description="Halaman profil pengguna sistem informasi sekolah"
      />
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        {/* Header Profil */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] md:p-8">
          {/* Latar Belakang Gradien Estetis */}
          <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/20 to-blue-500/20 blur-3xl dark:from-brand-500/10 dark:to-blue-500/10"></div>
          
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-3xl font-extrabold text-white shadow-lg shadow-brand-500/30">
              {adminData?.nama ? adminData.nama.substring(0, 2).toUpperCase() : "AD"}
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {adminData?.nama || "User"}
              </h2>
              <p className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {adminData?.peran_nama || "Administrator"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {adminData?.email || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Informasi Detail */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] md:p-8">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 border-b pb-3 border-gray-100 dark:border-white/[0.05]">
            <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Informasi Identitas
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nama Lengkap</span>
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">{adminData?.nama || "-"}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Username / User ID</span>
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">{adminData?.username || "-"}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email Akun</span>
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">{adminData?.email || "-"}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hak Akses / Peran</span>
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">{adminData?.peran_nama || "-"}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nomor Handphone</span>
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">{adminData?.no_hp || "-"}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nomor Telepon Rumah</span>
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">{adminData?.no_telepon || "-"}</p>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Alamat Lengkap</span>
              <p className="text-base font-semibold text-gray-800 dark:text-white/90">{adminData?.alamat || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
