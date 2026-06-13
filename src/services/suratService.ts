import api from './api';

export const suratService = {
  // Pengaturan Nomor Surat
  getPengaturanNomor: async () => {
    const response = await api.get('/surat/pengaturan');
    return response.data;
  },

  createPengaturanNomor: async (data: {
    kategori: number;
    nama_label: string;
    format_nomor: string;
    counter?: number;
    aktif?: boolean;
  }) => {
    const response = await api.post('/surat/pengaturan', data);
    return response.data;
  },

  updatePengaturanNomor: async (id: string, data: {
    kategori?: number;
    nama_label?: string;
    format_nomor?: string;
    counter?: number;
    aktif?: boolean;
  }) => {
    const response = await api.patch(`/surat/pengaturan/${id}`, data);
    return response.data;
  },

  deletePengaturanNomor: async (id: string) => {
    const response = await api.delete(`/surat/pengaturan/${id}`);
    return response.data;
  },

  // Template Surat
  getTemplates: async () => {
    const response = await api.get('/surat/template');
    return response.data;
  },

  getTemplateDetail: async (id: string) => {
    const response = await api.get(`/surat/template/${id}`);
    return response.data;
  },

  createTemplate: async (data: {
    nama_template: string;
    kategori: number;
    ukuran_kertas: number;
    margin_atas?: number;
    margin_bawah?: number;
    margin_kiri?: number;
    margin_kanan?: number;
    konten_html: string;
    aktif?: boolean;
  }) => {
    const response = await api.post('/surat/template', data);
    return response.data;
  },

  updateTemplate: async (id: string, data: {
    nama_template?: string;
    kategori?: number;
    ukuran_kertas?: number;
    margin_atas?: number;
    margin_bawah?: number;
    margin_kiri?: number;
    margin_kanan?: number;
    konten_html?: string;
    aktif?: boolean;
  }) => {
    const response = await api.patch(`/surat/template/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string) => {
    const response = await api.delete(`/surat/template/${id}`);
    return response.data;
  },

  // Surat Masuk
  getSuratMasuk: async (params?: { search?: string; limit?: number; page?: number }) => {
    const response = await api.get('/surat/masuk', { params });
    return response.data;
  },

  createSuratMasuk: async (data: {
    tanggal_surat: string;
    tanggal_diterima: string;
    nomor_agenda: string;
    nomor_surat: string;
    asal_surat: string;
    tujuan_disposisi: string;
    perihal: string;
    keterangan?: string;
    file_url: string;
  }) => {
    const response = await api.post('/surat/masuk', data);
    return response.data;
  },

  updateSuratMasuk: async (id: string, data: {
    tanggal_surat?: string;
    tanggal_diterima?: string;
    nomor_agenda?: string;
    nomor_surat?: string;
    asal_surat?: string;
    tujuan_disposisi?: string;
    perihal?: string;
    keterangan?: string;
    file_url?: string;
  }) => {
    const response = await api.patch(`/surat/masuk/${id}`, data);
    return response.data;
  },

  deleteSuratMasuk: async (id: string) => {
    const response = await api.delete(`/surat/masuk/${id}`);
    return response.data;
  },

  // Surat Keluar
  getSuratKeluar: async (params?: {
    search?: string;
    limit?: number;
    page?: number;
    status?: number;
    kategori?: number;
    sub?: string;
  }) => {
    const response = await api.get('/surat/keluar', { params });
    return response.data;
  },

  getSuratKeluarDetail: async (id: string) => {
    const response = await api.get(`/surat/keluar/${id}`);
    return response.data;
  },

  createSuratKeluar: async (data: {
    template_surat_id: string;
    pengaturan_nomor_surat_id: string;
    peserta_didik_id?: string;
    ptk_id?: string;
    tanggal_surat: string;
    perihal: string;
  }) => {
    const response = await api.post('/surat/keluar', data);
    return response.data;
  },

  updateSuratKeluar: async (id: string, data: {
    peserta_didik_id?: string;
    ptk_id?: string;
    tanggal_surat?: string;
    perihal?: string;
  }) => {
    const response = await api.patch(`/surat/keluar/${id}`, data);
    return response.data;
  },

  terbitkanSurat: async (id: string) => {
    const response = await api.post(`/surat/keluar/${id}/terbitkan`);
    return response.data;
  },

  getPreviewSurat: async (id: string) => {
    const response = await api.get(`/surat/keluar/${id}/preview`);
    return response.data;
  },

  deleteSuratKeluar: async (id: string) => {
    const response = await api.delete(`/surat/keluar/${id}`);
    return response.data;
  },
};

export default suratService;
