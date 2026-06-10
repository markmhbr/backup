import React from "react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";

const AbsensiPD: React.FC = () => {
  return (
    <>
      <PageMeta
        title="Absensi Peserta Didik | SIMAK"
        description="Halaman absensi peserta didik"
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Absensi Peserta Didik
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola dan pantau data kehadiran harian peserta didik di seluruh kelas.
          </p>
        </div>
      </div>

      <ComponentCard title="Daftar Kehadiran Peserta Didik">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Data rekapitulasi kehadiran harian peserta didik berdasarkan hasil scan barcode.
        </p>
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
           <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>
           </div>
           <p className="text-gray-500 font-medium">Data kehadiran peserta didik belum tersedia</p>
           <p className="text-xs text-gray-400 mt-1">Gunakan menu Scanner QR untuk mencatat kehadiran hari ini.</p>
        </div>
      </ComponentCard>
    </>
  );
};

export default AbsensiPD;
