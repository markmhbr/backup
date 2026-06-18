import api from "./api";

export interface LayananMaster {
  layanan_id: string;
  nama_layanan: string;
  kategori_layanan: string;
  kode_layanan: string;
  deskripsi?: string;
  syarat: LayananSyarat[];
}

export interface LayananSyarat {
  layanan_syarat_id: string;
  nama_syarat: string;
  wajib: boolean;
  format_file?: string;
}

export interface PermohonanLayanan {
  permohonan_layanan_id: string;
  layanan_id: string;
  sekolah_id: string;
  peserta_didik_id?: string;
  ptk_id?: string;
  nomor_permohonan: string;
  tanggal_permohonan: string;
  status: number;
  keterangan?: string;
  layanan?: LayananMaster;
  peserta_didik?: any;
  ptk?: any;
  logs?: any[];
  files?: any[];
}

export const layananMandalaService = {
  getMasterLayanan: async (kategori?: number) => {
    const response = await api.get("/layanan-mandala/master", {
      params: { kategori }
    });
    return response.data;
  },

  createPermohonan: async (data: {
    layanan_id: string;
    sekolah_id: string;
    kategori?: number;
    ptk_id?: string;
    peserta_didik_id?: string;
    keterangan?: string;
  }) => {
    const response = await api.post("/dapodik/permohonan-layanan", data);
    return response.data;
  },

  updateStatus: async (id: string, data: { status: number; catatan?: string; petugas_id?: string }) => {
    const response = await api.patch(`/layanan-mandala/permohonan/${id}/status`, data);
    return response.data;
  },

  uploadFile: async (id: string, formData: FormData) => {
    const response = await api.post(`/layanan-mandala/permohonan/${id}/file`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getPermohonan: async (params: { 
    sekolah_id?: string; 
    ptk_id?: string; 
    peserta_didik_id?: string;
    status?: number;
    kategori?: number;
  }) => {
    const response = await api.get("/dapodik/permohonan-layanan", { params });
    return response.data;
  },
};
