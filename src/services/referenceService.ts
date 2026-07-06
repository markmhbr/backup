import api from './api';

const cacheGet = (key: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { value, expiry } = JSON.parse(cached);
        if (!expiry || expiry > Date.now()) {
          return value;
        }
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.error('Failed to get from cache:', e);
  }
  return null;
};

const cacheSet = (key: string, value: any, ttlMs: number = 24 * 60 * 60 * 1000) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = {
        value,
        expiry: Date.now() + ttlMs,
      };
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Failed to set cache:', e);
  }
};

export const referenceService = {
  getOptions: async () => {
    const cacheKey = 'ref_options';
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
    try {
      const response = await api.get('/reference/options');
      cacheSet(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data opsi referensi:', error);
      throw error;
    }
  },

  getMstWilayah: async (search?: string, limit?: number) => {
    try {
      const response = await api.get('/reference/mst-wilayah', {
        params: { search, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data wilayah:', error);
      throw error;
    }
  },

  getBank: async (search?: string) => {
    const cacheKey = `ref_bank_${search || ''}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
    try {
      const response = await api.get('/reference/bank', {
        params: { search }
      });
      cacheSet(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data bank:', error);
      throw error;
    }
  },

  getWilayah: async (level: number, parentCode?: string) => {
    const cacheKey = `ref_wilayah_${level}_${parentCode || ''}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
    try {
      const response = await api.get('/reference/wilayah', {
        params: { level, parentCode }
      });
      cacheSet(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data wilayah:', error);
      throw error;
    }
  },

  getJabatanPtk: async () => {
    const cacheKey = 'ref_jabatan_ptk';
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
    try {
      const response = await api.get('/reference/jabatan-ptk');
      cacheSet(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data jabatan ptk:', error);
      throw error;
    }
  }
};
