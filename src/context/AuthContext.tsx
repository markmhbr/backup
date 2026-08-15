import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
  ptk_id?: string | null;
  peserta_didik_id?: string | null;
}

interface LoginResult {
  requires2FA: boolean;
  tempToken?: string;
  is2FASetup?: boolean;
  qrCodeUrl?: string;
  secret?: string;
  accessToken?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<LoginResult>;
  loginWithFaceId: (embedding: number[]) => Promise<any>;
  verify2FA: (tempToken: string, code: string, secret?: string) => Promise<void>;
  switchSekolah: (sekolahId: string) => Promise<any>;
  getJenjangList: () => Promise<any[]>;
  getSekolahByJenjang: (bentukPendidikanId?: number) => Promise<any[]>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setAuthData: (user: User) => void;
  allowedMenus: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 Jam (120 Menit) inaktivitas

const isTokenExpired = (token: string): boolean => {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    return decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user_data');
      const token = localStorage.getItem('auth_token');
      const lastActivity = localStorage.getItem('last_activity');
      
      // Jika waktu inaktif melebihi 2 jam, anggap sesi telah kadaluarsa
      if (lastActivity && Date.now() - Number(lastActivity) >= IDLE_TIMEOUT_MS) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('last_activity');
        setUser(null);
        setLoading(false);
        return;
      }

      if (savedUser && token) {
        try {
          if (isTokenExpired(token)) {
            // Access token expired, attempt silent refresh
            try {
              const response = await api.post('/auth/refresh');
              const { accessToken, user: userData } = response.data;
              localStorage.setItem('auth_token', accessToken);
              if (userData) {
                localStorage.setItem('user_data', JSON.stringify(userData));
                setUser(userData);
                await fetchMenusForUser(userData);
              } else {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);
                await fetchMenusForUser(parsed);
              }
            } catch (refreshErr) {
              // Refresh failed, clear session and log out
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_data');
              localStorage.removeItem('last_activity');
              setUser(null);
            }
          } else {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            await fetchMenusForUser(parsed);
          }
        } catch (err) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('last_activity');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Pemantau inaktivitas pengguna (Auto Logout setelah 2 jam tidak ada aktivitas)
  useEffect(() => {
    if (!user) return;

    if (!localStorage.getItem('last_activity')) {
      localStorage.setItem('last_activity', Date.now().toString());
    }

    let lastSaveTime = Date.now();

    const resetInactivityTimer = () => {
      const now = Date.now();
      // Throttle simpan ke localStorage setiap 10 detik agar tidak memberatkan CPU/Browser
      if (now - lastSaveTime > 10000) {
        lastSaveTime = now;
        localStorage.setItem('last_activity', now.toString());
      }
    };

    // Event penanda interaksi/aktivitas user di device
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));

    // Pemeriksaan berkala tiap 30 detik
    const checkInterval = setInterval(() => {
      const lastActivity = Number(localStorage.getItem('last_activity') || Date.now());
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        logout();
      }
    }, 30000);

    return () => {
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      clearInterval(checkInterval);
    };
  }, [user]);

  const fetchMenusForUser = async (userData: User) => {
    const isOperator = userData.role.toLowerCase().includes("operator") || userData.role.toLowerCase().includes("admin");
    if (isOperator) {
      setAllowedMenus([]);
      return;
    }
    try {
      const res = await api.get('/dapodik/menu-roles/my-menus');
      if (res.data && res.data.data) {
        setAllowedMenus(res.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil menu yang diizinkan:", err);
    }
  };

  const setAuthData = async (userData: User) => {
    setUser(userData);
    localStorage.setItem('last_activity', Date.now().toString());
    await fetchMenusForUser(userData);
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  };

  const loginWithFaceId = async (embedding: number[]): Promise<any> => {
    const response = await api.post('/auth/login-face-id', { embedding });
    const { accessToken, user: userData } = response.data;
    
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('last_activity', Date.now().toString());
    setUser(userData);
    await fetchMenusForUser(userData);
    return response.data;
  };

  const verify2FA = async (tempToken: string, code: string, secret?: string) => {
    const response = await api.post('/auth/verify-2fa', { tempToken, code, secret });
    const { accessToken, user: userData } = response.data;
    
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('last_activity', Date.now().toString());
    setUser(userData);
    await fetchMenusForUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('last_activity');
      setUser(null);
      setAllowedMenus([]);
      window.location.href = '/signin';
    }
  };

  const getJenjangList = async (): Promise<any[]> => {
    const response = await api.get('/auth/superadmin/jenjang');
    return response.data;
  };

  const getSekolahByJenjang = async (bentukPendidikanId?: number): Promise<any[]> => {
    const response = await api.get('/auth/superadmin/sekolah', {
      params: { bentuk_pendidikan_id: bentukPendidikanId }
    });
    return response.data;
  };

  const switchSekolah = async (sekolahId: string): Promise<any> => {
    const response = await api.post('/auth/switch-sekolah', { sekolah_id: sekolahId });
    const { accessToken, user: userData } = response.data;
    
    if (accessToken) {
      localStorage.setItem('auth_token', accessToken);
    }
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      await fetchMenusForUser(userData);
    }
    localStorage.setItem('last_activity', Date.now().toString());
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithFaceId,
      verify2FA, 
      switchSekolah,
      getJenjangList,
      getSekolahByJenjang,
      logout, 
      isAuthenticated: !!user,
      setAuthData,
      allowedMenus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
