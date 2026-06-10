import React, { useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import { absensiService } from "../../../services/absensiService";
import ComponentCard from "../../../components/common/ComponentCard";
import QrScanner from "./components/QrScanner";

const Scanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string, data?: any } | null>(null);

  const handleScan = async (scannedToken: string) => {
    if (!scannedToken || loading) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const response = await absensiService.scanAttendance(scannedToken);
      
      let userName = "Pengguna";
      if (response.peserta_didik) userName = response.peserta_didik.nama;
      if (response.gtk) userName = response.gtk.nama;

      const statusText = response.status_masuk === 2 ? "Terlambat" : 
                         response.status_pulang === 2 ? "Pulang Awal" : "Hadir";

      setMessage({ 
        type: 'success', 
        text: `Berhasil mencatat kehadiran: ${userName} (${statusText})`,
        data: response
      });
      
      setTimeout(() => {
        setLoading(false);
      }, 2000);
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || "Gagal mencatat kehadiran. QR Token tidak dikenal atau sekolah sedang libur." 
      });
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Scanner Kehadiran | SIMAK"
        description="Scanner QR Code untuk kehadiran Siswa dan GTK"
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Scanner Kehadiran
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gunakan kamera untuk melakukan absensi massal Siswa dan GTK secara otomatis.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title="Kamera Scanner">
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Arahkan QR Code Siswa atau Guru ke arah kamera untuk mencatat kehadiran otomatis.
          </p>
          
          <div className="relative">
            <QrScanner onScanSuccess={handleScan} />
            
            {loading && (
               <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 flex items-center justify-center backdrop-blur-[2px] rounded-xl z-10">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                  </div>
               </div>
            )}
          </div>
        </ComponentCard>

        <div className="flex flex-col gap-6">
          <ComponentCard title="Status Terakhir">
            <div className="min-h-[120px] flex flex-col justify-center">
              {message ? (
                <div className={`rounded-xl p-5 flex items-start gap-4 animate-fade-in ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-100 dark:border-green-500/20' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20'
                }`}>
                  <div className="mt-0.5">
                    {message.type === 'success' ? (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold">{message.type === 'success' ? 'Berhasil' : 'Gagal'}</p>
                    <p className="text-sm mt-1 leading-relaxed">{message.text}</p>
                    {message.data && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium opacity-70">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Waktu: {new Date(message.data.jam_masuk || message.data.jam_pulang).toLocaleTimeString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                   <p className="text-sm text-gray-400 italic">Menunggu hasil scan kartu...</p>
                </div>
              )}
            </div>
          </ComponentCard>

          <ComponentCard title="Informasi & Instruksi">
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-500 font-bold text-xs">1</span>
                </div>
                <span>Pastikan browser memiliki izin akses kamera. Pilih kamera yang paling jernih jika terdapat lebih dari satu pilihan.</span>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-500 font-bold text-xs">2</span>
                </div>
                <span>Scanner ini otomatis mengenali kartu Siswa maupun GTK. Cukup arahkan barcode ke kotak hijau di layar.</span>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-500 font-bold text-xs">3</span>
                </div>
                <span>Jika belum absen hari ini, status akan menjadi <b>Masuk</b>. Jika sudah, status otomatis menjadi <b>Pulang</b>.</span>
              </li>
            </ul>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default Scanner;
