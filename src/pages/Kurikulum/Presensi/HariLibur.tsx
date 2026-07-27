import React, { useEffect, useState } from "react";
import { formatDateDMY } from "../../../utils/formatDate";
import PageMeta from "../../../components/common/PageMeta";
import { presensiService } from "../../../services/presensiService";
import { useSekolah } from "../../../context/SekolahContext";
import Swal from "sweetalert2";

const HariLibur: React.FC = () => {
  const { sekolah } = useSekolah();
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: new Date().toISOString().split('T')[0],
    keterangan: "",
  });

  const fetchHolidays = async () => {
    if (!sekolah) return;
    setLoading(true);
    try {
      const response = await presensiService.getHariLibur(sekolah.sekolah_id);
      setHolidays(response || []);
    } catch (error) {
      console.error("Gagal mengambil data hari libur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [sekolah?.sekolah_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolah) return;

    setLoading(true);
    try {
      if (editingHolidayId) {
        await presensiService.updateHariLibur(sekolah.sekolah_id, editingHolidayId, formData);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Hari libur berhasil diperbarui.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
        });
      } else {
        await presensiService.createHariLibur(sekolah.sekolah_id, formData);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Hari libur berhasil ditambahkan.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
        });
      }

      setFormData({
        nama: "",
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: new Date().toISOString().split('T')[0],
        keterangan: "",
      });
      setEditingHolidayId(null);
      fetchHolidays();
    } catch (error: any) {
      Swal.fire({
        title: 'Gagal!',
        text: error.response?.data?.message || 'Gagal menyimpan hari libur.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (holiday: any) => {
    setEditingHolidayId(holiday.hari_libur_id);
    setFormData({
      nama: holiday.nama,
      tanggal_mulai: new Date(holiday.tanggal_mulai).toISOString().split('T')[0],
      tanggal_selesai: new Date(holiday.tanggal_selesai).toISOString().split('T')[0],
      keterangan: holiday.keterangan || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingHolidayId(null);
    setFormData({
      nama: "",
      tanggal_mulai: new Date().toISOString().split('T')[0],
      tanggal_selesai: new Date().toISOString().split('T')[0],
      keterangan: "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!sekolah) return;

    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Hari libur ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
    });

    if (result.isConfirmed) {
      try {
        await presensiService.deleteHariLibur(sekolah.sekolah_id, id);
        
        Swal.fire({
          title: 'Terhapus!',
          text: 'Hari libur telah dihapus.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
        });
        
        fetchHolidays();
      } catch (error) {
        Swal.fire({
          title: 'Gagal!',
          text: 'Gagal menghapus hari libur.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
        });
      }
    }
  };

  return (
    <>
      <PageMeta
        title="Pengaturan Hari Libur | SIMAK"
        description="Halaman pengaturan hari libur sekolah"
      />
      
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800/60 dark:bg-white/[0.02] md:p-6 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Hari Libur Sekolah
          </h3>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Atur kalender libur sekolah untuk memvalidasi sistem presensi otomatis peserta didik dan GTK.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800/60 dark:bg-white/[0.02] md:p-6">
            <div className="mb-5">
              <h4 className="text-base font-bold text-gray-800 dark:text-white/90">
                {editingHolidayId ? "Edit Hari Libur" : "Tambah Hari Libur"}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {editingHolidayId ? "Perbarui informasi periode hari libur sekolah." : "Buat jadwal libur sekolah baru."}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Nama Libur
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Libur Hari Raya Idul Fitri"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-transparent py-3 px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-850 dark:text-white/90 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-transparent py-2.5 px-3.5 text-sm text-gray-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-850 dark:text-white/90 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_selesai}
                    onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-transparent py-2.5 px-3.5 text-sm text-gray-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-850 dark:text-white/90 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Keterangan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Masukkan keterangan detail hari libur..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-transparent py-3 px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-850 dark:text-white/90 transition-all resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {editingHolidayId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  {loading ? 'Menyimpan...' : editingHolidayId ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: List Table */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800/60 dark:bg-white/[0.02] md:p-6">
            <div className="mb-5">
              <h4 className="text-base font-bold text-gray-800 dark:text-white/90">
                Daftar Hari Libur
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Berikut adalah daftar hari libur sekolah yang telah dikonfigurasi.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800/60">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left text-sm text-gray-500 dark:text-gray-400">
                  <thead className="bg-gray-50 dark:bg-white/[0.01] text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800/60">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nama Libur</th>
                      <th className="px-6 py-4 font-semibold">Periode</th>
                      <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {holidays.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic bg-white dark:bg-transparent">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <span className="text-2xl">📅</span>
                            <span className="text-sm">Belum ada data hari libur sekolah</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      holidays.map((h) => (
                        <tr key={h.hari_libur_id} className="bg-white dark:bg-transparent hover:bg-gray-50/50 dark:hover:bg-white/[0.005] transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-850 dark:text-white/90 block">{h.nama}</span>
                            {h.keterangan && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 block mt-1 max-w-xs truncate" title={h.keterangan}>
                                {h.keterangan}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-semibold bg-gray-50 dark:bg-white/[0.02] px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-850 w-fit">
                              <span>📅</span>
                              <span>{formatDateDMY(h.tanggal_mulai)}</span>
                              <span className="text-gray-300 dark:text-gray-600">|</span>
                              <span>{formatDateDMY(h.tanggal_selesai)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleEdit(h)}
                                className="p-2 text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 rounded-lg hover:bg-brand-500/10 cursor-pointer transition-all border border-transparent"
                                title="Edit Hari Libur"
                              >
                                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDelete(h.hari_libur_id)}
                                className="p-2 text-red-500 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-500/10 cursor-pointer transition-all border border-transparent"
                                title="Hapus Hari Libur"
                              >
                                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HariLibur;
