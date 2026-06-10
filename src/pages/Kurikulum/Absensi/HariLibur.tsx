import React, { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import { absensiService } from "../../../services/absensiService";
import ComponentCard from "../../../components/common/ComponentCard";
import { useSekolah } from "../../../context/SekolahContext";

const HariLibur: React.FC = () => {
  const { sekolah } = useSekolah();
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
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
      const response = await absensiService.getHariLibur(sekolah.sekolah_id);
      setHolidays(response);
    } catch (error) {
      console.error("Gagal mengambil data hari libur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [sekolah]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolah) return;

    setLoading(true);
    try {
      await absensiService.createHariLibur(sekolah.sekolah_id, formData);
      alert("Berhasil menambahkan hari libur!");
      setFormData({
        nama: "",
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: new Date().toISOString().split('T')[0],
        keterangan: "",
      });
      fetchHolidays();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menambahkan hari libur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!sekolah || !window.confirm("Yakin ingin menghapus hari libur ini?")) return;

    try {
      await absensiService.deleteHariLibur(sekolah.sekolah_id, id);
      fetchHolidays();
    } catch (error) {
      alert("Gagal menghapus hari libur");
    }
  };

  return (
    <>
      <PageMeta
        title="Pengaturan Hari Libur | SIMAK"
        description="Halaman pengaturan hari libur sekolah"
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Hari Libur Sekolah
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atur kalender libur sekolah untuk memvalidasi sistem absensi otomatis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ComponentCard title="Tambah Hari Libur">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                  Nama Libur
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Libur Hari Raya Idul Fitri"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formData.tanggal_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={formData.tanggal_selesai}
                  onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                  Keterangan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Keterangan tambahan..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-500 py-3 font-bold text-white hover:bg-brand-600 disabled:opacity-50 shadow-md shadow-brand-500/10 transition-all active:scale-[0.98]"
              >
                {loading ? 'Menyimpan...' : 'Simpan Hari Libur'}
              </button>
            </form>
          </ComponentCard>
        </div>

        <div className="lg:col-span-2">
          <ComponentCard title="Daftar Hari Libur">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-4 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Nama Libur</th>
                    <th className="pb-4 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Periode</th>
                    <th className="pb-4 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-gray-400 italic">
                        Belum ada data hari libur
                      </td>
                    </tr>
                  ) : (
                    holidays.map((h) => (
                      <tr key={h.hari_libur_id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="py-4">
                          <p className="font-semibold text-gray-800 dark:text-white/90">{h.nama}</p>
                          {h.keterangan && <p className="text-xs text-gray-500 mt-0.5">{h.keterangan}</p>}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                          {new Date(h.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(h.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => handleDelete(h.hari_libur_id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Hapus"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default HariLibur;
