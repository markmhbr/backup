import api from './api';

export const sppService = {
  // Master Pengaturan Tagihan
  getPengaturanTagihan: async (sekolahId: string) => {
    const response = await api.get(`/spp/pengaturan/${sekolahId}`);
    return response.data;
  },

  createPengaturanTagihan: async (data: {
    sekolah_id: string;
    nama_tagihan: string;
    nominal: number;
    tipe: number;
    aktif?: boolean;
  }) => {
    const response = await api.post('/spp/pengaturan', data);
    return response.data;
  },

  updatePengaturanTagihan: async (id: string, data: {
    nama_tagihan?: string;
    nominal?: number;
    tipe?: number;
    aktif?: boolean;
  }) => {
    const response = await api.patch(`/spp/pengaturan/${id}`, data);
    return response.data;
  },

  deletePengaturanTagihan: async (id: string) => {
    const response = await api.delete(`/spp/pengaturan/${id}`);
    return response.data;
  },

  createPengaturanTagihanRombel: async (data: {
    pengaturan_tagihan_id: string;
    rombongan_belajar_id: string;
  }) => {
    const response = await api.post('/spp/pengaturan-rombel', data);
    return response.data;
  },

  deletePengaturanTagihanRombel: async (id: string) => {
    const response = await api.delete(`/spp/pengaturan-rombel/${id}`);
    return response.data;
  },

  // Tagihan SPP Siswa
  generateSppTagihan: async (data: {
    sekolah_id: string;
    pengaturan_tagihan_id: string;
  }) => {
    const response = await api.post('/spp/generate', data);
    return response.data;
  },

  getTagihanSpp: async (sekolahId: string, filter?: { peserta_didik_id?: string; status?: number }) => {
    const response = await api.get(`/spp/tagihan/${sekolahId}`, {
      params: filter,
    });
    return response.data;
  },

  // Transaksi SPP
  createTransaksiSpp: async (data: {
    spp_id: string;
    sekolah_id: string;
    peserta_didik_id: string;
    jenis_transaksi: number; // 1 = Pembayaran, 2 = Beasiswa, 3 = Denda, 4 = Pengurangan, 5 = Pengembalian Dana
    nominal: number;
    tanggal_transaksi: string;
    metode_pembayaran?: number; // 1 = Tunai, 2 = Transfer, 3 = QRIS, 4 = Virtual Account
    keterangan?: string;
  }) => {
    const response = await api.post('/spp/transaksi', data);
    return response.data;
  },

  // Laporan & Rekapitulasi
  getTunggakanPerSiswa: async (sekolahId: string) => {
    const response = await api.get(`/spp/laporan/tunggakan-siswa/${sekolahId}`);
    return response.data;
  },

  getTunggakanPerKelas: async (sekolahId: string) => {
    const response = await api.get(`/spp/laporan/tunggakan-kelas/${sekolahId}`);
    return response.data;
  },

  getTotalPembayaran: async (sekolahId: string) => {
    const response = await api.get(`/spp/laporan/total-pembayaran/${sekolahId}`);
    return response.data;
  },

  getTotalBeasiswa: async (sekolahId: string) => {
    const response = await api.get(`/spp/laporan/total-beasiswa/${sekolahId}`);
    return response.data;
  },

  getRekapBulanan: async (sekolahId: string) => {
    const response = await api.get(`/spp/laporan/rekap-bulanan/${sekolahId}`);
    return response.data;
  },

  getRekapTahunPelajaran: async (sekolahId: string) => {
    const response = await api.get(`/spp/laporan/rekap-tahun-pelajaran/${sekolahId}`);
    return response.data;
  },
};

export default sppService;
