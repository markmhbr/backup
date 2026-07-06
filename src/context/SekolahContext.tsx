import React, { createContext, useContext, useState, useEffect } from 'react';
import { dapodikService } from '../services/dapodikService';
import { useAuth } from './AuthContext';
import { getFotoUrl } from '../utils/image';

interface Sekolah {
  sekolah_id: string;
  nama: string;
  npsn: string;
  logo: string | null;
  radius?: number | null;
}

interface SekolahContextType {
  sekolah: Sekolah | null;
  loading: boolean;
  refreshSekolah: () => Promise<void>;
}

const SekolahContext = createContext<SekolahContextType | undefined>(undefined);

export const SekolahProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  const fetchSekolah = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token || (user && user.role === 'Super Admin')) {
      setSekolah(null);
      setLoading(false);
      return;
    }

    try {
      const result = await dapodikService.getSekolah();
      if (result.status === 'success') {
        const raw = result.data;
        setSekolah({
          ...raw,
          logo: raw.logo ? `${getFotoUrl(raw.logo, '')}?t=${Date.now()}` : null,
        });
      }
    } catch (err) {
      console.error('Gagal mengambil data sekolah:', err);
      setSekolah(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSekolah();
  }, [isAuthenticated, user]);

  return (
    <SekolahContext.Provider value={{ sekolah, loading, refreshSekolah: fetchSekolah }}>
      {children}
    </SekolahContext.Provider>
  );
};

export const useSekolah = () => {
  const context = useContext(SekolahContext);
  if (context === undefined) {
    throw new Error('useSekolah must be used within a SekolahProvider');
  }
  return context;
};
