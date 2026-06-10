import api from './api';

export interface PengaturanJadwalHari {
  pengaturan_hari_id: string;
  sekolah_id: string;
  jenis_jadwal_id: string;
  hari: number;
  jam_masuk: string;
  jam_pulang: string;
  aktif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface JenisJadwal {
  jenis_jadwal_id: string;
  sekolah_id?: string;
  nama: string;
  custom_mapel: boolean;
  aktif: boolean;
  pengaturan_jadwal?: PengaturanJadwalSlot[];
  pengaturan_hari?: PengaturanJadwalHari[];
  created_at?: string;
  updated_at?: string;
}


export interface PengaturanJadwalSlot {
  pengaturan_jadwal_id: string;
  sekolah_id?: string;
  jenis_jadwal_id: string;
  hari: number;
  tipe: number;
  urutan: number;
  durasi_menit: number;
  aktif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface JadwalEntry {
  jadwal_pelajaran_id?: string;
  sekolah_id?: string;
  jenis_jadwal_id: string;
  rombongan_belajar_id: string;
  pembelajaran_id: string;
  hari: number;
  urutan: number;
  aktif?: boolean;
  created_at?: string;
  updated_at?: string;
  pembelajaran?: {
    nama_mata_pelajaran?: string;
    ptk_id_str?: string;
    gtk?: {
      nama?: string;
    };
  };
}

export const jadwalService = {
  // =====================
  // JENIS JADWAL
  // =====================

  getJenisJadwal: async () => {
    try {
      const response = await api.get('/jadwal/jenis-jadwal');
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil jenis jadwal:', error);
      throw error;
    }
  },

  createJenisJadwal: async (data: { nama: string; jam_masuk: string; jam_pulang: string; custom_mapel?: boolean }) => {
    try {
      const response = await api.post('/jadwal/jenis-jadwal', data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal membuat jenis jadwal:', error);
      throw error;
    }
  },

  updateJenisJadwal: async (id: string, data: { nama?: string; custom_mapel?: boolean; aktif?: boolean }) => {
    try {
      const response = await api.patch(`/jadwal/jenis-jadwal/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengupdate jenis jadwal:', error);
      throw error;
    }
  },

  deleteJenisJadwal: async (id: string) => {
    try {
      const response = await api.delete(`/jadwal/jenis-jadwal/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menghapus jenis jadwal:', error);
      throw error;
    }
  },

  toggleJenisJadwal: async (id: string, aktif: boolean) => {
    try {
      const response = await api.patch(`/jadwal/jenis-jadwal/${id}/toggle`, { aktif });
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengubah status jenis jadwal:', error);
      throw error;
    }
  },

  updatePengaturanHari: async (data: { jenis_jadwal_id: string; hari: number; jam_masuk?: string; jam_pulang?: string; aktif?: boolean }) => {
    try {
      const response = await api.patch('/jadwal/pengaturan-hari', data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal memperbarui jam operasional harian:', error);
      throw error;
    }
  },


  // =====================
  // PENGATURAN JADWAL
  // =====================

  getPengaturanJadwal: async (jenisJadwalId: string, hari?: number) => {
    try {
      let url = `/jadwal/pengaturan-jadwal?jenisJadwalId=${jenisJadwalId}`;
      if (hari !== undefined) {
        url += `&hari=${hari}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil pengaturan jadwal:', error);
      throw error;
    }
  },

  upsertPengaturanJadwal: async (data: {
    jenis_jadwal_id: string;
    hari: number;
    urutan: number;
    tipe: number;
    durasi_menit: number;
    aktif?: boolean;
  }) => {
    try {
      const response = await api.post('/jadwal/pengaturan-jadwal', data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menyimpan pengaturan jadwal:', error);
      throw error;
    }
  },

  deletePengaturanJadwal: async (id: string) => {
    try {
      const response = await api.delete(`/jadwal/pengaturan-jadwal/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menghapus pengaturan jadwal:', error);
      throw error;
    }
  },

  // =====================
  // JADWAL PELAJARAN
  // =====================

  getJadwalPelajaran: async (jenisJadwalId: string, rombelId: string) => {
    try {
      const response = await api.get(`/jadwal/jadwal-pelajaran?jenisJadwalId=${jenisJadwalId}&rombelId=${rombelId}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal mengambil jadwal pelajaran:', error);
      throw error;
    }
  },

  upsertJadwalPelajaran: async (data: {
    jenis_jadwal_id: string;
    rombongan_belajar_id: string;
    pembelajaran_id: string;
    hari: number;
    urutan: number;
  }) => {
    try {
      const response = await api.post('/jadwal/jadwal-pelajaran', data);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menyimpan jadwal pelajaran:', error);
      throw error;
    }
  },

  deleteJadwalPelajaran: async (id: string) => {
    try {
      const response = await api.delete(`/jadwal/jadwal-pelajaran/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Gagal menghapus jadwal pelajaran:', error);
      throw error;
    }
  },
};
