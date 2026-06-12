import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Swal from "sweetalert2";
import { dapodikService } from "../../services/dapodikService";
import { useAuth } from "../../context/AuthContext";

export default function ApiSyncPage() {
  const { logout } = useAuth();
  const [syncKey, setSyncKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncKey) {
      Swal.fire({
        title: "Error",
        text: "API Key wajib diisi",
        icon: "error",
        confirmButtonColor: "#465FFF",
      });
      return;
    }

    setLoading(true);
    try {
      // Mengirim key dan host saat ini (termasuk port) ke backend
      const domain = window.location.host;
      const response = await dapodikService.validateSyncKey(syncKey, domain);
      
      if (response.status === "success") {
        setStatus("success");
        setMessage("API Key berhasil diverifikasi dan disinkronkan.");
        
        Swal.fire({
          title: "Berhasil!",
          text: "Sinkronisasi berhasil. Anda akan keluar secara otomatis dalam 2 detik.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          logout();
        });
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Gagal melakukan sinkronisasi. Periksa kembali API Key Anda.");
      
      Swal.fire({
        title: "Gagal",
        text: err.response?.data?.message || "Koneksi ke backend gagal.",
        icon: "error",
        confirmButtonColor: "#465FFF",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Sync API | SIMAK Admin Panel"
        description="Synchronize your local data with the central SIMAK API"
      />
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
          <div className="mb-8 text-center">
            <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white/90 sm:text-2xl">
              Sinkronisasi API
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masukkan API Key yang diberikan oleh admin pusat untuk mengaktifkan fitur sekolah Anda.
            </p>
          </div>

          <form onSubmit={handleSync}>
            <div className="space-y-6">
              <div>
                <Label>API Key</Label>
                <Input
                  type="text"
                  placeholder="Masukkan 32 karakter API Key..."
                  value={syncKey}
                  onChange={(e) => setSyncKey(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Memverifikasi..." : "Hubungkan Sekarang"}
              </Button>
            </div>
          </form>

          {status !== "idle" && (
            <div className={`mt-6 p-4 rounded-xl text-sm ${
              status === "success" ? "bg-success-50 text-success-600" : "bg-error-50 text-error-600"
            }`}>
              {message}
            </div>
          )}

          <div className="mt-8 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02]">
            <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
              Bantuan
            </h4>
            <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>API Key digunakan untuk memvalidasi kepemilikan data sekolah.</li>
              <li>Pastikan backend Anda sudah terinstal dan berjalan.</li>
              <li>Jika data tetap reload, pastikan data sekolah di backend sudah ada.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
