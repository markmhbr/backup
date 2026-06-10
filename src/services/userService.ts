import api from './api';

// Contoh service untuk User. Simpan semua logika pemanggilan API di sini.
export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getById: async (id: string | number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  // Anda bisa menambahkan method lain seperti create, update, delete
};
