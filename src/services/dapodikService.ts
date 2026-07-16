import api from './api';

export const dapodikService = {
  getPesertaDidik: async (limit: number = 10, search: string = '', page: number = 1, rombelName?: string, status?: 'aktif' | 'non-aktif', tingkat?: string, completeness?: string) => {
    try {
      let url = `/dapodik/peserta-didik?limit=${limit}&page=${page}&search=${search}`;
      if (rombelName) url += `&rombel=${rombelName}`;
      if (status) url += `&status=${status}`;
      if (tingkat) url += `&tingkat=${tingkat}`;
      if (completeness) url += `&completeness=${completeness}`;
      
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

  getCadisdiks: async () => {
    try {
      const response = await api.get('/dapodik/cadisdik');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data cadisdik:', error);
      throw error;
    }
  },

  getMasterLayanan: async (kategori?: number) => {
    try {
      const response = await api.get('/dapodik/master-layanan', {
        params: { kategori }
      });
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data master layanan:', error);
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

  uploadSyncData: async (endpoint: string, data: any[]) => {
    try {
      const response = await api.post(`/sync/${endpoint}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Gagal upload sync data untuk ${endpoint}:`, error);
      throw error;
    }
  },

  getGTK: async (limit: number = 10, search: string = '', page: number = 1, type?: 'guru' | 'tendik', status?: 'aktif' | 'non-aktif', completeness?: string) => {
    try {
      let url = `/dapodik/gtk?limit=${limit}&page=${page}&search=${search}`;
      if (type) url += `&type=${type}`;
      if (status) url += `&status=${status}`;
      if (completeness) url += `&completeness=${completeness}`;
      
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

  getRombonganBelajar: async (type: string = 'reguler', limit: number = 10, page: number = 1, search: string = '', tingkat: string = '') => {
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

  getRombelRekapKategori: async () => {
    try {
      const response = await api.get('/dapodik/rombongan-belajar/rekap-kategori');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil rekap kategori rombel:', error);
      throw error;
    }
  },

  getRombelRekapKompetensi: async () => {
    try {
      const response = await api.get('/dapodik/rombongan-belajar/rekap-kompetensi');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil rekap kompetensi rombel:', error);
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

  getPdRekapAgama: async () => {
    try {
      const response = await api.get('/dapodik/peserta-didik/rekap-agama');
      return response.data;
    } catch (error) {
      console.error('Error fetching pd rekap agama:', error);
      throw error;
    }
  },

  getPdRekapMasukAktif: async () => {
    try {
      const response = await api.get('/dapodik/peserta-didik/rekap-masuk-aktif');
      return response.data;
    } catch (error) {
      console.error('Error fetching pd rekap masuk aktif:', error);
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

  createGtkAnak: async (id: string, data: any) => {
    try {
      const response = await api.post(`/dapodik/gtk/${id}/anak`, data);
      return response.data;
    } catch (error) {
      console.error(`Error creating gtk anak for ${id}:`, error);
      throw error;
    }
  },

  updateGtkAnak: async (id: string, anakId: string, data: any) => {
    try {
      const response = await api.patch(`/dapodik/gtk/${id}/anak/${anakId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating gtk anak ${anakId} for ${id}:`, error);
      throw error;
    }
  },

  deleteGtkAnak: async (id: string, anakId: string) => {
    try {
      const response = await api.delete(`/dapodik/gtk/${id}/anak/${anakId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting gtk anak ${anakId} for ${id}:`, error);
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
  },

  uploadLogo: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await api.post('/dapodik/sekolah/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Gagal mengunggah logo sekolah:', error);
      throw error;
    }
  },

  updateSekolah: async (data: any) => {
    try {
      const response = await api.patch('/dapodik/sekolah', data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal memperbarui data sekolah:', error);
      throw error;
    }
  },

  uploadSiswaDokumen: async (uuid: string, file: File, docName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nama_dokumen', docName);
    const response = await api.post(`/dapodik/siswa/${uuid}/upload-dokumen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteSiswaDokumen: async (uuid: string, fileName: string) => {
    const response = await api.delete(`/dapodik/siswa/${uuid}/dokumen/${fileName}`);
    return response.data;
  },

  uploadGtkDokumen: async (uuid: string, file: File, docName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nama_dokumen', docName);
    const response = await api.post(`/dapodik/gtk/${uuid}/upload-dokumen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteGtkDokumen: async (uuid: string, fileName: string) => {
    const response = await api.delete(`/dapodik/gtk/${uuid}/dokumen/${fileName}`);
    return response.data;
  },

  uploadSiswaFoto: async (uuid: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/dapodik/siswa/${uuid}/upload-foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadGtkFoto: async (uuid: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/dapodik/gtk/${uuid}/upload-foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadGtkTandaTangan: async (uuid: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/dapodik/gtk/${uuid}/upload-tanda-tangan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getTanah: async (limit: number = 10, search: string = '', page: number = 1) => {
    try {
      const response = await api.get(`/dapodik/tanah?limit=${limit}&page=${page}&search=${search}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data tanah:', error);
      throw error;
    }
  },

  getBangunan: async (limit: number = 10, search: string = '', page: number = 1) => {
    try {
      const response = await api.get(`/dapodik/bangunan?limit=${limit}&page=${page}&search=${search}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data bangunan:', error);
      throw error;
    }
  },

  getRuang: async (limit: number = 10, search: string = '', page: number = 1) => {
    try {
      const response = await api.get(`/dapodik/ruang?limit=${limit}&page=${page}&search=${search}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data ruang:', error);
      throw error;
    }
  },

  buatPengajuanPerbaikan: async (payload: {
    ptk_id?: string;
    peserta_didik_id?: string;
    tipe: 'GTK' | 'SISWA';
    perubahan: any;
  }) => {
    try {
      const response = await api.post('/pengajuan-perbaikan', payload);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengajukan perbaikan data:', error);
      throw error;
    }
  },

  getPengajuanPerbaikan: async () => {
    try {
      const response = await api.get('/pengajuan-perbaikan');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil daftar pengajuan perbaikan:', error);
      throw error;
    }
  },

  setujuiPengajuan: async (id: string) => {
    try {
      const response = await api.post(`/pengajuan-perbaikan/${id}/setujui`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menyetujui pengajuan:', error);
      throw error;
    }
  },

  tolakPengajuan: async (id: string) => {
    try {
      const response = await api.post(`/pengajuan-perbaikan/${id}/tolak`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menolak pengajuan:', error);
      throw error;
    }
  },

  getPengaturanUmum: async (sekolahId: string) => {
    try {
      const response = await api.get(`/pengaturan-umum/${sekolahId}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil pengaturan umum:', error);
      throw error;
    }
  },

  updatePengaturanUmum: async (sekolahId: string, data: any) => {
    try {
      const response = await api.post(`/pengaturan-umum/${sekolahId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menyimpan pengaturan umum:', error);
      throw error;
    }
  },

  getTugasTambahan: async (limit: number = 10, search: string = '', page: number = 1, index?: number) => {
    try {
      let url = `/dapodik/tugas-tambahan?limit=${limit}&page=${page}&search=${search}`;
      if (index !== undefined) url += `&index=${index}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data tugas tambahan:', error);
      throw error;
    }
  },

  createTugasTambahan: async (data: any) => {
    try {
      const response = await api.post('/dapodik/tugas-tambahan', data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menambah tugas tambahan:', error);
      throw error;
    }
  },

  updateTugasTambahan: async (id: string, data: any) => {
    try {
      const response = await api.patch(`/dapodik/tugas-tambahan/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengubah tugas tambahan:', error);
      throw error;
    }
  },

  deleteTugasTambahan: async (id: string) => {
    try {
      const response = await api.delete(`/dapodik/tugas-tambahan/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menghapus tugas tambahan:', error);
      throw error;
    }
  },

  getCustomJabatans: async (index?: number) => {
    try {
      let url = '/dapodik/tugas-tambahan/custom-jabatans';
      if (index !== undefined) url += `?index=${index}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data custom jabatans:', error);
      throw error;
    }
  },

  getCustomJumlahJam: async (index?: number) => {
    try {
      let url = '/dapodik/tugas-tambahan/custom-jumlah-jam';
      if (index !== undefined) url += `?index=${index}`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data custom jumlah jam:', error);
      throw error;
    }
  },

  updateGtkMode: async (sekolahId: string, ptkId: string, modePresensi: number) => {
    try {
      const response = await api.patch(`/kurikulum/presensi/gtk-mode/${sekolahId}/${ptkId}`, { mode_presensi: modePresensi });
      return response.data;
    } catch (error: any) {
      console.error('Gagal memperbarui mode presensi GTK:', error);
      throw error;
    }
  },

  getJenisKeluarRef: async () => {
    try {
      const response = await api.get('/kurikulum/mutasi-pd/reference');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data referensi jenis keluar:', error);
      throw error;
    }
  },

  getMutasiPd: async (sekolahId: string) => {
    try {
      const response = await api.get(`/kurikulum/mutasi-pd/${sekolahId}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil data mutasi:', error);
      throw error;
    }
  },

  createMutasiPd: async (payload: { peserta_didik_id: string; jenis_keluar_id: string; alasan?: string }, file?: File) => {
    try {
      const formData = new FormData();
      formData.append('peserta_didik_id', payload.peserta_didik_id);
      formData.append('jenis_keluar_id', payload.jenis_keluar_id);
      if (payload.alasan) {
        formData.append('alasan', payload.alasan);
      }
      if (file) {
        formData.append('file', file);
      }
      const response = await api.post('/kurikulum/mutasi-pd', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Gagal membuat pengajuan mutasi:', error);
      throw error;
    }
  },

  approveMutasiPd: async (id: string) => {
    try {
      const response = await api.patch(`/kurikulum/mutasi-pd/${id}/approve`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menyetujui pengajuan mutasi:', error);
      throw error;
    }
  },

  rejectMutasiPd: async (id: string, alasanTolak: string) => {
    try {
      const response = await api.patch(`/kurikulum/mutasi-pd/${id}/reject`, { alasan_tolak: alasanTolak });
      return response.data;
    } catch (error: any) {
      console.error('Gagal menolak pengajuan mutasi:', error);
      throw error;
    }
  }
};
