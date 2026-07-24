import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';

interface ProfileData {
  id: string;
  nama: string;
  tipe: 'siswa' | 'gtk';
  rombel: string;
  sekolah: string;
  hasFoto: boolean;
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getApiUrl = () => {
    const viteApiUrl = import.meta.env.VITE_API_URL;
    if (viteApiUrl) {
      return viteApiUrl.endsWith('/api') ? viteApiUrl : `${viteApiUrl}/api`;
    }
    // Fallback to local or relative path
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api'
      : '/api';
  };

  const apiUrl = getApiUrl();
  const photoUrl = id ? `${apiUrl}/auth/public-profile/photo/${id}` : '';

  useEffect(() => {
    if (!id) {
      setError('ID Profil tidak valid');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${apiUrl}/auth/public-profile/${id}`);
        setProfile(response.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat profil atau data tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, apiUrl]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white px-4 py-8 relative overflow-hidden font-sans">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col items-center transition-all duration-300 hover:shadow-indigo-500/5 hover:border-white/15">
        
        {loading ? (
          /* Loading State skeleton */
          <div className="w-full flex flex-col items-center animate-pulse space-y-6">
            <div className="w-32 h-32 rounded-full bg-white/10"></div>
            <div className="h-6 w-3/4 bg-white/10 rounded"></div>
            <div className="h-4 w-1/2 bg-white/10 rounded"></div>
            <div className="w-full space-y-3 pt-6 border-t border-white/5">
              <div className="h-10 bg-white/10 rounded-xl"></div>
              <div className="h-10 bg-white/10 rounded-xl"></div>
              <div className="h-10 bg-white/10 rounded-xl"></div>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="w-full flex flex-col items-center text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-200">Gagal Memuat Data</h2>
              <p className="text-sm text-gray-400 mt-2">{error}</p>
            </div>
            <button 
              onClick={() => navigate('/signin')}
              className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              Kembali ke Login
            </button>
          </div>
        ) : profile ? (
          /* Profile Card Content */
          <div className="w-full flex flex-col items-center">
            
            {/* School Name Badge */}
            <div className="mb-6 text-center">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-300">
                {profile.sekolah}
              </span>
            </div>

            {/* Avatar Frame with Gradient Border */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-slate-900 bg-slate-800 flex items-center justify-center">
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={profile.nama}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a5b4fc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                    }}
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-indigo-300/50">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            {/* Profile Info Header */}
            <div className="text-center mt-6 mb-8">
              <h1 className="text-2xl font-extrabold tracking-tight text-white line-clamp-2">
                {profile.nama}
              </h1>
              <p className="text-indigo-300/80 font-medium text-sm mt-1 uppercase tracking-widest">
                {profile.tipe === 'siswa' ? 'Siswa / Peserta Didik' : 'GTK / Guru / Staf'}
              </p>
            </div>

            {/* Detailed Data Fields */}
            <div className="w-full space-y-4 pt-6 border-t border-white/10">
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  {profile.tipe === 'siswa' ? 'Kelas / Rombel' : 'Jabatan / Tugas'}
                </span>
                <span className="text-white text-sm font-semibold">
                  {profile.rombel}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  Instansi / Sekolah
                </span>
                <span className="text-white text-sm font-semibold max-w-[200px] truncate" title={profile.sekolah}>
                  {profile.sekolah}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  Status Keaktifan
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-400/25 rounded-md text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Aktif
                </span>
              </div>

            </div>

            {/* Card Footer Information */}
            <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              <span>Verified Profile - SIMAK</span>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
