import api from './api';

export const absensiService = {
  // Config & Lookup
  getAttendanceConfig: async () => {
    const response = await api.get('/kurikulum/absensi/config');
    return response.data;
  },

  lookupUser: async (token: string) => {
    const response = await api.post('/kurikulum/absensi/lookup', { token });
    return response.data;
  },

  // Scanning
  scanAttendance: async (token: string) => {
    const response = await api.post('/kurikulum/absensi/scan', { token });
    return response.data;
  },

  // Manual Absensi
  absenSiswa: async (sekolahId: string, data: any) => {
    const response = await api.post(`/kurikulum/absensi/peserta-didik/${sekolahId}`, data);
    return response.data;
  },

  absenGtk: async (sekolahId: string, data: any) => {
    const response = await api.post(`/kurikulum/absensi/gtk/${sekolahId}`, data);
    return response.data;
  },

  absenMapel: async (sekolahId: string, data: any) => {
    const response = await api.post(`/kurikulum/absensi/mapel/${sekolahId}`, data);
    return response.data;
  },

  // Hari Libur
  getHariLibur: async (sekolahId: string) => {
    const response = await api.get(`/kurikulum/absensi/hari-libur/${sekolahId}`);
    return response.data;
  },

  createHariLibur: async (sekolahId: string, data: any) => {
    const response = await api.post(`/kurikulum/absensi/hari-libur/${sekolahId}`, data);
    return response.data;
  },

  deleteHariLibur: async (sekolahId: string, id: string) => {
    const response = await api.delete(`/kurikulum/absensi/hari-libur/${sekolahId}/${id}`);
    return response.data;
  },

  // Izin
  createIzin: async (sekolahId: string, data: any) => {
    const response = await api.post(`/kurikulum/absensi/izin/${sekolahId}`, data);
    return response.data;
  },
};
