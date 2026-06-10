import api from './api';

export const dapodikService = {
  getPesertaDidik: async (limit: number = 10, search: string = '', page: number = 1, rombelName?: string, status?: 'aktif' | 'non-aktif', tingkat?: string) => {
    try {
      let url = `/dapodik/peserta-didik?limit=${limit}&page=${page}&search=${search}`;
      if (rombelName) url += `&rombel=${rombelName}`;
      if (status) url += `&status=${status}`;
      if (tingkat) url += `&tingkat=${tingkat}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data peserta didik:', error);
      throw error;
    }
  },

  getSummary: async () => {
    try {
      const response = await api.get('/dapodik/summary');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data summary:', error);
      throw error;
    }
  },

  getSekolah: async () => {
    try {
      const response = await api.get('/dapodik/sekolah');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data sekolah:', error);
      throw error;
    }
  },

  validateSyncKey: async (key: string, domain: string) => {
    try {
      const response = await api.post('/sync/validate', { key, domain });
      return response.data;
    } catch (error: any) {
      console.error('Gagal validasi API Key:', error);
      throw error;
    }
  },

  getGTK: async (limit: number = 10, search: string = '', page: number = 1, type?: 'guru' | 'tendik', status?: 'aktif' | 'non-aktif') => {
    try {
      let url = `/dapodik/gtk?limit=${limit}&page=${page}&search=${search}`;
      if (type) url += `&type=${type}`;
      if (status) url += `&status=${status}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data GTK:', error);
      throw error;
    }
  },

  getGtkRekapKategori: async () => {
    try {
      const response = await api.get('/dapodik/gtk/rekap-kategori');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil rekap kategori GTK:', error);
      throw error;
    }
  },

  getGtkRekapPendidikan: async () => {
    try {
      const response = await api.get('/dapodik/gtk/rekap-pendidikan');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil rekap pendidikan GTK:', error);
      throw error;
    }
  },

  getGtkRekapUsia: async () => {
    try {
      const response = await api.get('/dapodik/gtk/rekap-usia');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil rekap usia GTK:', error);
      throw error;
    }
  },

  getMataPelajaran: async (limit: number = 10, search: string = '', page: number = 1) => {
    try {
      const response = await api.get(`/dapodik/mata-pelajaran?limit=${limit}&page=${page}&search=${search}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data mata pelajaran:', error);
      throw error;
    }
  },

  getRombonganBelajar: async (type: 'reguler' | 'pilihan' = 'reguler', limit: number = 10, page: number = 1, search: string = '', tingkat: string = '') => {
    try {
      let url = `/dapodik/rombongan-belajar?type=${type}&limit=${limit}&page=${page}&search=${search}`;
      if (tingkat) url += `&tingkat=${tingkat}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data rombongan belajar:', error);
      throw error;
    }
  },

  getEkstrakurikuler: async (search: string = '') => {
    try {
      const response = await api.get(`/dapodik/ekstrakurikuler?search=${search}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data ekstrakurikuler:', error);
      throw error;
    }
  },

  getJurusan: async () => {
    try {
      const response = await api.get('/dapodik/jurusan');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data jurusan:', error);
      throw error;
    }
  },

  getTahunPelajaran: async () => {
    try {
      const response = await api.get('/dapodik/tahun-pelajaran');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data tahun pelajaran:', error);
      throw error;
    }
  },

  getTanah: async () => {
    try {
      const response = await api.get('/dapodik/tanah');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data tanah:', error);
      throw error;
    }
  },

  getRombelAnggota: async (rombelId: string) => {
    try {
      const response = await api.get(`/dapodik/rombongan-belajar/${rombelId}/anggota`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil anggota rombel:', error);
      throw error;
    }
  },

  getRombelPembelajaran: async (rombelId: string) => {
    try {
      const response = await api.get(`/dapodik/rombongan-belajar/${rombelId}/pembelajaran`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil pembelajaran rombel:', error);
      throw error;
    }
  },

  getAllPembelajaran: async () => {
    try {
      const response = await api.get('/dapodik/pembelajaran');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data semua pembelajaran:', error);
      throw error;
    }
  },

  getPdRekapTingkat: async () => {
    try {
      const response = await api.get('/dapodik/peserta-didik/rekap-tingkat');
      return response.data;
    } catch (error) {
      console.error('Error fetching pd rekap tingkat:', error);
      throw error;
    }
  },

  getPdRekapKompetensi: async () => {
    try {
      const response = await api.get('/dapodik/peserta-didik/rekap-kompetensi');
      return response.data;
    } catch (error) {
      console.error('Error fetching pd rekap kompetensi:', error);
      throw error;
    }
  },

  getPdRekapUsia: async () => {
    try {
      const response = await api.get('/dapodik/peserta-didik/rekap-usia');
      return response.data;
    } catch (error) {
      console.error('Error fetching pd rekap usia:', error);
      throw error;
    }
  },

  getGtkDetail: async (id: string) => {
    try {
      const response = await api.get(`/dapodik/gtk/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching gtk detail for ${id}:`, error);
      throw error;
    }
  },

  updateGtk: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/dapodik/gtk/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating gtk ${id}:`, error);
      throw error;
    }
  },

  getPesertaDidikDetail: async (id: string) => {
    try {
      const response = await api.get(`/dapodik/peserta-didik/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching peserta didik detail for ${id}:`, error);
      throw error;
    }
  },

  updatePesertaDidik: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/dapodik/peserta-didik/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating peserta didik ${id}:`, error);
      throw error;
    }
  }
};
