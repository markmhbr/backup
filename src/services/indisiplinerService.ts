import api from './api';

export const indisiplinerService = {
  // Master Jenis Pelanggaran
  getJenisPelanggaran: async (sekolahId: string) => {
    const response = await api.get('/indisipliner/jenis-pelanggaran', {
      params: { sekolah_id: sekolahId },
    });
    return response.data;
  },

  createJenisPelanggaran: async (data: { sekolah_id: string; nama: string; target: number; poin: number }) => {
    const response = await api.post('/indisipliner/jenis-pelanggaran', data);
    return response.data;
  },

  // Master Jenis Tindak Lanjut
  getJenisTindakLanjut: async (sekolahId: string) => {
    const response = await api.get('/indisipliner/jenis-tindak-lanjut', {
      params: { sekolah_id: sekolahId },
    });
    return response.data;
  },

  createJenisTindakLanjut: async (data: { sekolah_id: string; nama: string; target: number }) => {
    const response = await api.post('/indisipliner/jenis-tindak-lanjut', data);
    return response.data;
  },

  // Transaksi Pelanggaran
  getPelanggaran: async (
    sekolahId: string,
    filter?: { peserta_didik_id?: string; ptk_id?: string; status?: number }
  ) => {
    const response = await api.get('/indisipliner/pelanggaran', {
      params: { sekolah_id: sekolahId, ...filter },
    });
    return response.data;
  },

  createPelanggaran: async (data: {
    sekolah_id: string;
    peserta_didik_id?: string;
    ptk_id?: string;
    jenis_pelanggaran_id: string;
    tanggal: string;
    waktu: string;
    keterangan?: string;
    status?: number;
    pelapor_ptk_id?: string;
  }) => {
    const response = await api.post('/indisipliner/pelanggaran', data);
    return response.data;
  },

  updatePelanggaranStatus: async (id: string, status: number) => {
    const response = await api.patch(`/indisipliner/pelanggaran/${id}/status`, { status });
    return response.data;
  },

  // Transaksi Tindak Lanjut
  createTindakLanjut: async (data: {
    pelanggaran_id: string;
    jenis_tindak_lanjut_id: string;
    tanggal: string;
    keterangan?: string;
    petugas_ptk_id?: string;
  }) => {
    const response = await api.post('/indisipliner/tindak-lanjut', data);
    return response.data;
  },

  // Summary & Rekap Sekolah
  getSchoolSummary: async (sekolahId: string) => {
    const response = await api.get(`/indisipliner/rekap-sekolah/${sekolahId}`);
    return response.data;
  },
};
export default indisiplinerService;
