import React, { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import { absensiService } from "../../../services/absensiService";
import ComponentCard from "../../../components/common/ComponentCard";
import { useSekolah } from "../../../context/SekolahContext";
import QrScanner from "./components/QrScanner";

const IzinSakit: React.FC = () => {
  const { sekolah } = useSekolah();
  const [token, setToken] = useState("");
  const [user, setUser] = useState<{ type: 'pd' | 'gtk', data: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jenis: 4, // Default: Tidak Masuk
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: "",
  });

  const handleLookup = async (tokenToLookup: string) => {
    if (!tokenToLookup) return;
    setLoading(true);
    setError(null);
    setUser(null);

    try {
      const response = await absensiService.lookupUser(tokenToLookup);
      setUser(response);
      setShowScanner(false);
      setToken(tokenToLookup);
    } catch (err: any) {
      setError(err.response?.data?.message || "Data QR Token tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sekolah) return;
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        peserta_didik_id: user.type === 'pd' ? user.data.peserta_didik_id : undefined,
        ptk_id: user.type === 'gtk' ? user.data.ptk_id : undefined,
      };
      
      await absensiService.createIzin(sekolah.sekolah_id, payload);
      alert("Berhasil menyimpan data izin!");
      
      setUser(null);
      setToken("");
      setFormData({ ...formData, keterangan: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan data izin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Input Izin / Sakit | SIMAK"
        description="Halaman input izin atau sakit siswa dan GTK"
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Input Izin / Sakit
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Catat keterangan izin, sakit, atau alasan ketidakhadiran lainnya untuk Siswa dan GTK.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <ComponentCard title="Cari Subjek">
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Scan barcode kartu atau masukkan kode manual untuk mencari Siswa/GTK.
            </p>
            
            <div className="space-y-4">
              {showScanner ? (
                <div className="space-y-3">
                  <QrScanner onScanSuccess={handleLookup} />
                  <button 
                    onClick={() => setShowScanner(false)}
                    className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Batalkan Scan
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Masukkan kode..."
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookup(token)}
                      className="w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-4 pr-10 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                    />
                    <button 
                      onClick={() => handleLookup(token)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-500"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowScanner(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-500/10 py-3 text-sm font-bold text-brand-500 hover:bg-brand-500/20 transition-colors border border-brand-500/20"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    Buka Scanner Kamera
                  </button>
                </>
              )}

              {error && (
                <p className="text-xs text-red-500 mt-2 italic font-medium">{error}</p>
              )}
            </div>
          </ComponentCard>

          {user && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-fade-in shadow-sm border-l-4 border-l-brand-500">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Subjek Terdeteksi
              </h3>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-xl border border-brand-500/20">
                  {user.data.nama.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white/90">{user.data.nama}</h4>
                  <p className="text-xs text-gray-500 mt-1 uppercase font-medium">
                    {user.type === 'pd' ? `Siswa • ${user.data.nisn}` : `GTK • ${user.data.nuptk}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <ComponentCard title="Formulir Izin / Sakit">
            {!user ? (
               <div className="flex flex-col items-center justify-center py-24 opacity-30">
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className="mt-6 text-gray-500 font-medium">Gunakan scanner atau input kode untuk memulai</p>
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                      Jenis Izin
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.jenis}
                        onChange={(e) => setFormData({ ...formData, jenis: parseInt(e.target.value) })}
                        className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                      >
                        <option value={4}>Izin Tidak Masuk</option>
                        <option value={5}>Sakit</option>
                        <option value={1}>Izin Terlambat</option>
                        <option value={2}>Izin Keluar</option>
                        <option value={3}>Izin Pulang Awal</option>
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                    Keterangan / Alasan
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Contoh: Sakit demam dan butuh istirahat..."
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  />
                </div>

                <div className="flex justify-end gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                  <button
                    type="button"
                    onClick={() => { setUser(null); setToken(""); }}
                    className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-brand-500 px-8 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Data Izin'}
                  </button>
                </div>
              </form>
            )}
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default IzinSakit;
