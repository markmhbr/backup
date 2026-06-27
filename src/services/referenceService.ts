import api from './api';

export const referenceService = {
  getOptions: async () => {
    try {
      const response = await api.get('/reference/options');
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
    try {
      const response = await api.get('/reference/bank', {
        params: { search }
      });
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data bank:', error);
      throw error;
    }
  },

  getWilayah: async (level: number, parentCode?: string) => {
    try {
      const response = await api.get('/reference/wilayah', {
        params: { level, parentCode }
      });
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data wilayah:', error);
      throw error;
    }
  }
};
