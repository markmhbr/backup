import React from "react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";

const AbsensiGTK: React.FC = () => {
  return (
    <>
      <PageMeta
        title="Absensi GTK | SIMAK"
        description="Halaman absensi GTK"
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Absensi GTK
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pantau kehadiran harian Guru dan Tenaga Kependidikan secara real-time.
          </p>
        </div>
      </div>

      <ComponentCard title="Daftar Kehadiran GTK">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Riwayat kehadiran harian Guru dan Staf yang tercatat melalui sistem scanner.
        </p>
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
           <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
           </div>
           <p className="text-gray-500 font-medium">Data kehadiran GTK belum tersedia</p>
           <p className="text-xs text-gray-400 mt-1">Belum ada data masuk untuk hari ini.</p>
        </div>
      </ComponentCard>
    </>
  );
};

export default AbsensiGTK;
