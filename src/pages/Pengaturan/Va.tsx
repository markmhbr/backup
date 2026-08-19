import React, { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { dapodikService } from "../../services/dapodikService";
import Swal from "sweetalert2";

export default function VaSettings() {
  const [sekolahId, setSekolahId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vaData, setVaData] = useState({
    is_active: false,
    client_id: "",
    secret_key: "",
    private_key: "",
    bjb_public_key: "",
    api_url: "",
    mode: "sandbox",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const sch = await dapodikService.getSekolah();
        if (sch?.status === "success" && sch.data?.sekolah_id) {
          setSekolahId(sch.data.sekolah_id);
          const settings = await dapodikService.getPengaturanVa(sch.data.sekolah_id);
          if (settings?.status === "success" && settings.data) {
            const cfg = settings.data;
            setVaData({
              is_active: cfg.is_active ?? false,
              client_id: cfg.client_id ?? "",
              secret_key: cfg.secret_key ?? "",
              private_key: cfg.private_key ?? "",
              bjb_public_key: cfg.bjb_public_key ?? "",
              api_url: cfg.api_url ?? "",
              mode: cfg.mode ?? "sandbox",
            });
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data pengaturan VA:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVaData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVaData((prev) => ({
      ...prev,
      is_active: e.target.checked,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolahId) {
      Swal.fire("Error", "ID Sekolah tidak ditemukan.", "error");
      return;
    }

    setSaving(true);
    Swal.fire({
      title: "Menyimpan...",
      text: "Sedang menyimpan konfigurasi Virtual Account",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await dapodikService.updatePengaturanVa(sekolahId, {
        is_active: vaData.is_active,
        client_id: vaData.client_id || null,
        secret_key: vaData.secret_key || null,
        private_key: vaData.private_key || null,
        bjb_public_key: vaData.bjb_public_key || null,
        api_url: vaData.api_url || null,
        mode: vaData.mode,
      });

      Swal.fire({
        title: "Berhasil!",
        text: "Konfigurasi Virtual Account berhasil disimpan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: "Gagal Menyimpan!",
        text: err.response?.data?.message || err.message || "Terjadi kesalahan saat menyimpan pengaturan.",
        icon: "error",
        confirmButtonColor: "#465fff",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="SIMAK | Pengaturan Virtual Account"
        description="Konfigurasi Integrasi Virtual Account"
      />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Konfigurasi Virtual Account (VA)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola pengaturan integrasi pembayaran tagihan siswa menggunakan Virtual Account Bank .
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <Label className="font-bold text-gray-800 dark:text-white/90">Aktifkan Pembayaran VA </Label>
              <p className="text-xs text-gray-500">Tentukan apakah pembayaran via Virtual Account  akan diaktifkan untuk siswa.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={vaData.is_active}
                onChange={handleToggleActive}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID / Biller Code</Label>
              <Input
                id="client_id"
                name="client_id"
                type="text"
                placeholder="Masukkan Biller Code / Client ID "
                value={vaData.client_id}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">Mode Lingkungan</Label>
              <select
                id="mode"
                name="mode"
                value={vaData.mode}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="sandbox">Sandbox (Pengujian)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="api_url">API Base URL</Label>
              <Input
                id="api_url"
                name="api_url"
                type="text"
                placeholder="https:..."
                value={vaData.api_url}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="secret_key">Secret Key / API Key</Label>
              <Input
                id="secret_key"
                name="secret_key"
                type="password"
                placeholder="Masukkan Secret Key"
                value={vaData.secret_key}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="private_key">Private Key (SNAP BI)</Label>
              <textarea
                id="private_key"
                name="private_key"
                rows={5}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                value={vaData.private_key}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bjb_public_key"> Public Key</Label>
              <textarea
                id="bjb_public_key"
                name="bjb_public_key"
                rows={5}
                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                value={vaData.bjb_public_key}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
            <Button type="submit" disabled={saving}>Simpan Konfigurasi</Button>
          </div>
        </form>
      </div>
    </>
  );
}
