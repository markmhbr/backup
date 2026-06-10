import api from './api';

export const syncService = {
  /**
   * Mengetes koneksi ke backend menggunakan API Key yang ada.
   * Kita bisa menggunakan endpoint /api/sync/sekolah dengan data kosong
   * atau membuat endpoint health check khusus.
   */
  testConnection: async () => {
    try {
      // Mencoba memanggil endpoint sync sekolah (data kosong) untuk memvalidasi API Key
      const response = await api.post('/sync/sekolah', []);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Gagal terhubung ke backend' 
      };
    }
  }
};
