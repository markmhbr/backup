import api from "./api";

export interface PelaporanSekolah {
  pelaporan_id: string;
  pelaporan_sekolah_id: string;
  judul: string;
  deskripsi: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  aktif: boolean;
  jumlah_dokumen: number;
}

export interface PelaporanSekolahDetail extends PelaporanSekolah {
  dokumen: {
    pelaporan_dokumen_id: string;
    nama_file: string;
    file_url: string;
    ukuran_file: number | null;
    created_at: string;
  }[];
}

export const pelaporanService = {
  getList: async (page: number = 1, limit: number = 10) => {
    const response = await api.get("/simak/pelaporan", {
      params: { page, limit }
    });
    return response.data;
  },

  getDetail: async (id: string) => {
    const response = await api.get(`/simak/pelaporan/${id}`);
    return response.data;
  },

  uploadDokumen: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post(`/simak/pelaporan/${id}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
