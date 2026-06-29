import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../services/api";
import Swal from "sweetalert2";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);

  const handleDownloadBackup = async () => {
    setLoading(true);
    Swal.fire({
      title: "Membuat Backup...",
      text: "Sedang mengemas data sekolah dalam format SQL",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await api.get("/dapodik/backup/generate", {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      
      const dateStr = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `backup_simak_school_${dateStr}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      Swal.close();
      Swal.fire({
        title: "Berhasil!",
        text: "Backup PostgreSQL SQL berhasil diunduh.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.close();
      Swal.fire("Error", "Gagal memproses backup data sekolah.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Backup Data Sekolah | SIMAK"
        description="Download full schema database SQL backup"
      />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
            Backup & Ekspor Data Database
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ekspor semua data sekolah Anda yang berada di skema <strong>dapodik</strong>, <strong>simak</strong>, dan <strong>mandala</strong> dalam satu berkas berkstensi SQL standar PostgreSQL.
          </p>
        </div>

        <div className="max-w-2xl mx-auto rounded-3xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.02] shadow-xl text-center space-y-6 relative overflow-hidden">
          {/* Decorative background grid */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/50 pointer-events-none" />

          <div className="relative flex flex-col items-center">
            {/* PostgreSQL animated stylized icon wrapper */}
            <div className="w-24 h-24 rounded-full bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center mb-4 shadow-inner">
              <svg
                className={`w-12 h-12 text-brand-600 dark:text-brand-400 ${
                  loading ? "animate-pulse" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>

            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
              Backup PostgreSQL Database
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mt-2">
              Berkas backup yang dihasilkan mencakup seluruh relasi data (GTK, Peserta Didik, Rombel, Presensi, Keuangan, Surat, dan Layanan) yang disaring spesifik untuk sekolah Anda saja.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30 text-left max-w-lg mx-auto">
            <h5 className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Catatan Keamanan & Pemulihan
            </h5>
            <ul className="text-xs text-amber-700 dark:text-amber-500/90 list-disc pl-5 space-y-1">
              <li>Jangan bagikan berkas SQL hasil backup kepada pihak ketiga yang tidak berwenang.</li>
              <li>Restore sql backup akan menimpa data yang ada saat ini secara <code>CASCADE</code>.</li>
              <li>Pastikan server database target menggunakan engine PostgreSQL 12 atau yang lebih baru.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={handleDownloadBackup}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-brand-500 text-white font-bold hover:bg-brand-600 transition-all shadow-lg hover:shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Mengunduh...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Mulai Ekspor Backup (SQL)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
