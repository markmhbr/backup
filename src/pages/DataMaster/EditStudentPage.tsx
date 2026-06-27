import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import OriginalInput from "../../components/form/input/InputField";
import type { InputProps } from "../../components/form/input/InputField";
import Label from "../../components/form/Label";

const Input: React.FC<InputProps> = (props) => {
  return <OriginalInput {...props} showStatusIcon={true} />;
};
import Swal from "sweetalert2";
import { dapodikService } from "../../services/dapodikService";
import { getFotoUrl } from "../../utils/image";


const format3Digits = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "";
  const numStr = String(value).trim();
  if (/^\d+$/.test(numStr)) {
    return numStr.padStart(3, "0");
  }
  return numStr;
};

const sanitizeRtRw = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "";
  const numStr = String(value).trim();
  if (/^\d+$/.test(numStr)) {
    const stripped = numStr.replace(/^0+/, '');
    return stripped === "" ? "0" : stripped;
  }
  return numStr;
};

const EditStudentPage: React.FC = () => {
  const { role, id } = useParams<{ role: string; id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profil");

  const tabs = [
    { id: "profil", label: "Profil & Identitas" },
    { id: "periodik", label: "Data Periodik" },
    { id: "orangtua", label: "Orang Tua & Wali" },
    { id: "dokumen", label: "Berkas Dokumen" },
  ];

  const apiBaseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace("/api", "") 
    : "http://localhost:3000";

  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Data from Backend
  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setLoading(true);
        try {
          const result = await dapodikService.getPesertaDidikDetail(id);
          if (result.status === "success" && result.data) {
            const data = result.data;
            setUploadedDocs(data.uploaded_docs || []);
            setFormData({
              id: data.peserta_didik_id,
              sekolahId: data.sekolah_id || "",
              nama: data.nama,
              tempatLahir: data.tempat_lahir || "",
              tanggalLahir: data.tanggal_lahir ? data.tanggal_lahir.split('T')[0] : "",
              jk: data.jenis_kelamin || "",
              nisn: data.nisn || "",
              nipd: data.nipd || "",
              nik: data.nik || "",
              noKK: data.no_kk || "",
              noAkte: data.no_registrasi_akta_lahir || "",
              kebutuhanKhusus: data.kebutuhan_khusus_nama || "",
              agama: data.agama_nama || "",
              anakKe: data.anak_keberapa !== null && data.anak_keberapa !== undefined ? String(data.anak_keberapa) : "",
              avatar: data.foto || "",
              jalan: data.alamat_jalan || "",
              rt: format3Digits(data.rt),
              rw: format3Digits(data.rw),
              provinsi: data.provinsi || "",
              kabupaten: data.kabupaten || data.kabupaten_kota || "",
              kecamatan: data.kecamatan || "",
              desaKelurahan: data.desa_kelurahan || "",
              kodePos: data.kode_pos || "",
              jenisTinggal: data.jenis_tinggal_nama || "",
              alatTransportasi: data.alat_transportasi_nama || "",
              lintang: data.lintang ? String(data.lintang) : "",
              bujur: data.bujur ? String(data.bujur) : "",
              penerimaKIP: data.penerima_kip === "1" || data.penerima_kip === 1 || data.penerima_kip === true ? "Ya" : "Tidak",
              layakKIP: data.layak_pip === "1" || data.layak_pip === 1 || data.layak_pip === true ? "Ya" : "Tidak",
              penerimaKPS: data.penerima_kps === "1" || data.penerima_kps === 1 || data.penerima_kps === true ? "Ya" : "Tidak",

              idBank: data.bank_nama || "",
              rekeningBank: data.rekening_bank || "",
              namaKCP: data.nama_kcp || "",
              rekeningAtasNama: data.rekening_atas_nama || "",

              noTelpRumah: data.nomor_telepon_rumah || "",
              noHp: data.nomor_telepon_seluler || "",
              noWa: data.no_wa || "",
              emailAktif: data.email || "",
              emailAkun: data.penggunas?.[0]?.email || "",
              tinggiBadan: data.tinggi_badan !== null && data.tinggi_badan !== undefined ? String(data.tinggi_badan) : "",
              beratBadan: data.berat_badan !== null && data.berat_badan !== undefined ? String(data.berat_badan) : "",
              lingkarKepala: data.lingkar_kepala !== null && data.lingkar_kepala !== undefined ? String(data.lingkar_kepala) : "",
              jarakRumah: data.jarak_rumah_ke_sekolah !== null && data.jarak_rumah_ke_sekolah !== undefined ? String(data.jarak_rumah_ke_sekolah) : "",
              jarakRumahKm: data.jarak_rumah_ke_sekolah_km !== null && data.jarak_rumah_ke_sekolah_km !== undefined ? String(data.jarak_rumah_ke_sekolah_km) : "",
              waktuTempuh: data.waktu_tempuh_ke_sekolah !== null && data.waktu_tempuh_ke_sekolah !== undefined ? String(data.waktu_tempuh_ke_sekolah) : "",
              menitTempuh: data.menit_tempuh_ke_sekolah !== null && data.menit_tempuh_ke_sekolah !== undefined ? String(data.menit_tempuh_ke_sekolah) : "",
              jumlahSaudara: data.jumlah_saudara_kandung !== null && data.jumlah_saudara_kandung !== undefined ? String(data.jumlah_saudara_kandung) : "",
              
              // Ayah
              namaAyah: data.nama_ayah || "",
              nikAyah: data.nik_ayah || "",
              pekerjaanAyah: data.pekerjaan_ayah_nama || "",
              tahunLahirAyah: data.tahun_lahir_ayah !== null && data.tahun_lahir_ayah !== undefined ? String(data.tahun_lahir_ayah) : "",
              jenjangPendidikanAyah: data.jenjang_pendidikan_ayah_nama || "",
              penghasilanAyah: data.penghasilan_ayah_nama || "",
              
              // Ibu
              namaIbu: data.nama_ibu_kandung || data.nama_ibu || "",
              nikIbu: data.nik_ibu || "",
              pekerjaanIbu: data.pekerjaan_ibu_nama || "",
              tahunLahirIbu: data.tahun_lahir_ibu !== null && data.tahun_lahir_ibu !== undefined ? String(data.tahun_lahir_ibu) : "",
              jenjangPendidikanIbu: data.jenjang_pendidikan_ibu_nama || "",
              penghasilanIbu: data.penghasilan_ibu_nama || "",
              
              // Wali
              namaWali: data.nama_wali || "",
              nikWali: data.nik_wali || "",
              pekerjaanWali: data.pekerjaan_wali_nama || "",
              tahunLahirWali: data.tahun_lahir_wali !== null && data.tahun_lahir_wali !== undefined ? String(data.tahun_lahir_wali) : "",
              jenjangPendidikanWali: data.jenjang_pendidikan_wali_nama || "",
              penghasilanWali: data.penghasilan_wali_nama || "",
            });

            // Regional data is directly populated to formData above and rendered as disabled Input. No mapping needed.
          }
        } catch (error) {
          Swal.fire("Error", "Gagal mengambil data peserta didik", "error");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) {
      if (file.size > 500 * 1024) {
        Swal.fire({ title: "File Terlalu Besar", text: "Ukuran foto maksimal adalah 500Kb", icon: "error", confirmButtonColor: "#465FFF" });
        return;
      }
      
      setLoading(true);
      try {
        const result = await dapodikService.uploadSiswaFoto(id, file);
        if (result.status === "success" && result.data) {
          const relativePath = result.data.filePath;
          const host = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:3000";
          const fullUrl = `${host}${relativePath}`;
          setFormData((prev: any) => ({ ...prev, avatar: fullUrl }));
          Swal.fire({ title: "Berhasil", text: "Foto profil berhasil diperbarui", icon: "success", confirmButtonColor: "#465FFF" });
        }
      } catch (error: any) {
        Swal.fire("Error", error.response?.data?.message || "Gagal mengunggah foto profil", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUploadDoc = async (docName: string, file: File | undefined) => {
    if (!file || !id) return;
    
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    const maxSize = isImage ? 100 * 1024 : 200 * 1024;
    
    if (file.size > maxSize) {
      Swal.fire({
        title: "File Terlalu Besar",
        text: `Ukuran maksimal file adalah ${isImage ? "100Kb" : "200Kb"}. Silakan kompres terlebih dahulu.`,
        icon: "error",
        confirmButtonColor: "#465FFF",
      });
      return;
    }

    setLoading(true);
    try {
      await dapodikService.uploadSiswaDokumen(id, file, docName);
      
      const result = await dapodikService.getPesertaDidikDetail(id);
      if (result.status === "success" && result.data) {
        setUploadedDocs(result.data.uploaded_docs || []);
      }
      Swal.fire({ title: "Berhasil", text: "Dokumen berhasil diunggah", icon: "success", confirmButtonColor: "#465FFF" });
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Gagal mengunggah dokumen", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (fileName: string, docLabel: string) => {
    if (!id) return;
    const confirm = await Swal.fire({
      title: "Hapus Dokumen?",
      text: `Apakah Anda yakin ingin menghapus dokumen "${docLabel}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#EF4444",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await dapodikService.deleteSiswaDokumen(id, fileName);
      
      const result = await dapodikService.getPesertaDidikDetail(id);
      if (result.status === "success" && result.data) {
        setUploadedDocs(result.data.uploaded_docs || []);
      }
      Swal.fire({ title: "Berhasil", text: "Dokumen berhasil dihapus", icon: "success", confirmButtonColor: "#465FFF" });
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Gagal menghapus dokumen", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    if (formData.noKK && formData.noKK.length !== 16) {
      Swal.fire({
        title: "Validasi Gagal",
        text: "Nomor Kartu Keluarga (KK) harus tepat 16 digit.",
        icon: "error",
        confirmButtonColor: "#465FFF"
      });
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        nama: formData.nama,
        tempat_lahir: formData.tempatLahir,
        tanggal_lahir: formData.tanggalLahir ? new Date(formData.tanggalLahir) : null,
        jenis_kelamin: formData.jk,
        nisn: formData.nisn,
        nipd: formData.nipd,
        nik: formData.nik,
        no_kk: formData.noKK,
        no_registrasi_akta_lahir: formData.noAkte,
        kebutuhan_khusus_id: formData.kebutuhan_khusus_id || null,
        agama_id: formData.agama_id || null,
        anak_keberapa: formData.anakKe ? String(formData.anakKe) : null,
        foto: formData.avatar,
        alamat_jalan: formData.jalan,
        rt: sanitizeRtRw(formData.rt),
        rw: sanitizeRtRw(formData.rw),
        provinsi: formData.provinsi,
        kabupaten_kota: formData.kabupaten,
        kecamatan: formData.kecamatan,
        desa_kelurahan: formData.desaKelurahan,
        kode_pos: formData.kodePos,
        jenis_tinggal_id: formData.jenis_tinggal_id || null,
        alat_transportasi_id: formData.alat_transportasi_id || null,
        lintang: formData.lintang ? formData.lintang : null,
        bujur: formData.bujur ? formData.bujur : null,
        penerima_kip: formData.penerimaKIP,
        layak_pip: formData.layakKIP,
        penerima_kps: formData.penerimaKPS,
        
        id_bank: formData.idBank,
        rekening_bank: formData.rekeningBank,
        nama_kcp: formData.namaKCP,
        rekening_atas_nama: formData.rekeningAtasNama,

        nomor_telepon_rumah: formData.noTelpRumah,
        nomor_telepon_seluler: formData.noHp,
        no_wa: formData.noWa,
        email: formData.emailAktif,
        email_akun: formData.emailAkun,
        tinggi_badan: formData.tinggiBadan ? String(formData.tinggiBadan) : null,
        berat_badan: formData.beratBadan ? String(formData.beratBadan) : null,
        lingkar_kepala: formData.lingkarKepala ? Number(formData.lingkarKepala) : null,
        jarak_rumah_ke_sekolah: formData.jarakRumah ? Number(formData.jarakRumah) : null,
        jarak_rumah_ke_sekolah_km: formData.jarakRumahKm ? Number(formData.jarakRumahKm) : null,
        waktu_tempuh_ke_sekolah: formData.waktuTempuh ? Number(formData.waktuTempuh) : null,
        menit_tempuh_ke_sekolah: formData.menitTempuh ? Number(formData.menitTempuh) : null,
        jumlah_saudara_kandung: formData.jumlahSaudara ? Number(formData.jumlahSaudara) : null,
        
        // Ayah
        nama_ayah: formData.namaAyah,
        nik_ayah: formData.nikAyah,
        pekerjaan_id_ayah: formData.pekerjaan_id_ayah || null,
        tahun_lahir_ayah: formData.tahunLahirAyah ? String(formData.tahunLahirAyah) : null,
        jenjang_pendidikan_ayah: formData.jenjang_pendidikan_ayah || null,
        penghasilan_id_ayah: formData.penghasilan_id_ayah || null,
        
        // Ibu
        nama_ibu_kandung: formData.namaIbu,
        nama_ibu: formData.namaIbu,
        nik_ibu: formData.nikIbu,
        pekerjaan_id_ibu: formData.pekerjaan_id_ibu || null,
        tahun_lahir_ibu: formData.tahunLahirIbu ? String(formData.tahunLahirIbu) : null,
        jenjang_pendidikan_ibu: formData.jenjang_pendidikan_ibu || null,
        penghasilan_id_ibu: formData.penghasilan_id_ibu || null,
        
        // Wali
        nama_wali: formData.namaWali,
        nik_wali: formData.nikWali,
        pekerjaan_id_wali: formData.pekerjaan_id_wali || null,
        tahun_lahir_wali: formData.tahunLahirWali ? String(formData.tahunLahirWali) : null,
        jenjang_pendidikan_wali: formData.jenjang_pendidikan_wali || null,
        penghasilan_id_wali: formData.penghasilan_id_wali || null,
      };

      await dapodikService.updatePesertaDidik(id, updatePayload);
      Swal.fire({
        title: "Berhasil",
        text: "Data Berhasil disimpan",
        icon: "success",
        confirmButtonColor: "#465FFF",
      });
      navigate(`/${role}/student-data`);
    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan data", "error");
    } finally {
      setLoading(false);
    }
  };

  const studentDocTypes = [
    { name: "Ijazah Sekolah Asal", key: "ijazah_sekolah_asal" },
    { name: "Kartu Keluarga", key: "kartu_keluarga" },
    { name: "Akta Kelahiran", key: "akta_kelahiran" },
    { name: "KTP Ayah", key: "ktp_ayah" },
    { name: "KTP Ibu", key: "ktp_ibu" },
  ];



  return (
    <>
      <PageMeta
        title={`Ubah Data Peserta Didik - ${formData.nama || ""} | SIMAK Admin Panel`}
        description="Edit student details page"
      />
      <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />

      {loading && (
        <div className="fixed inset-0 bg-white/50 dark:bg-black/50 z-[9999] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <button
              onClick={() => navigate(`/${role}/student-data`)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar
            </button>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              Ubah Data Peserta Didik
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ubah rincian data untuk siswa: <span className="font-semibold text-brand-500">{formData.nama || "Memuat..."}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/${role}/student-data`)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] transition-colors"
            >
              Batal
            </button>
            <Button variant="primary-outline" onClick={handleSave} disabled={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar whitespace-nowrap no-print mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors duration-200 border-b-2 ${
                activeTab === tab.id
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stacked Cards Layout */}
        <div className="space-y-6">
          
          {/* Card 1: Profil */}
          <div style={{ display: activeTab === "profil" ? "block" : "none" }}>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Profil & Identitas
              </h4>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Photo Upload area */}
              <div className="w-full lg:w-1/4 flex flex-col items-center">
                <div className="relative group">
                  <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/[0.02]">
                    {formData.avatar ? (
                      <img src={getFotoUrl(formData.avatar)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/images/default/profile.jpg" alt="Profile Fallback" className="w-full h-full object-cover opacity-60" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 p-2 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-4 text-xs text-gray-700 dark:text-gray-400 text-center italic">
                  Format: JPG, JPEG, PNG. <br/>Maksimal 500Kb.
                </p>
                <Button variant="outline" size="sm" className="mt-4 w-full text-gray-800 dark:text-gray-200" onClick={() => fileInputRef.current?.click()}>
                  Ganti Foto
                </Button>
              </div>

              {/* Form inputs column */}
              <div className="w-full lg:w-3/4 space-y-8">
                {/* Identitas Pribadi */}
                <div>
                  <h5 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 border-gray-100 dark:border-white/[0.05]">
                    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Identitas Pribadi
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.nama || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>Tempat Lahir</Label><Input value={formData.tempatLahir || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>Tanggal Lahir</Label><Input type="date" value={formData.tanggalLahir || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>Jenis Kelamin</Label><Input value={formData.jk === "L" ? "Laki-laki" : formData.jk === "P" ? "Perempuan" : formData.jk || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>NISN</Label><Input value={formData.nisn || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>NIPD</Label><Input value={formData.nipd || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>NIK</Label><Input value={formData.nik || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>No. Kartu Keluarga</Label><Input value={formData.noKK || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>No. Register Akte Lahir</Label><Input value={formData.noAkte || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                     <div className="space-y-2">
                        <Label>Berkebutuhan Khusus</Label>
                        <Input value={formData.kebutuhanKhusus || ""} disabled placeholder="Data kosong dari Dapodik" />
                      </div>
                      <div className="space-y-2">
                        <Label>Agama</Label>
                        <Input value={formData.agama || ""} disabled placeholder="Data kosong dari Dapodik" />
                      </div>
                     <div className="space-y-2"><Label>Anak ke-</Label><Input type="number" value={formData.anakKe || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  </div>
                </div>
 
                {/* Alamat dan Tempat Tinggal */}
                <div>
                  <h5 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 border-gray-100 dark:border-white/[0.05]">
                    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Alamat dan Tempat Tinggal
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Jalan atau Kampung</Label><Input value={formData.jalan || ""} placeholder="Masukkan jalan atau kampung" disabled /></div>
                    <div className="space-y-2">
                      <Label>RT</Label>
                      <Input value={formData.rt || ""} disabled placeholder="Data kosong dari Dapodik" />
                    </div>
                    <div className="space-y-2">
                      <Label>RW</Label>
                      <Input value={formData.rw || ""} disabled placeholder="Data kosong dari Dapodik" />
                    </div>
                    <div className="space-y-2"><Label>Provinsi</Label><Input value={formData.provinsi || ""} disabled placeholder="Data kosong dari Dapodik" /></div>
                    <div className="space-y-2"><Label>Kab./Kota</Label><Input value={formData.kabupaten || ""} disabled placeholder="Data kosong dari Dapodik" /></div>
                    <div className="space-y-2"><Label>Kecamatan</Label><Input value={formData.kecamatan || ""} disabled placeholder="Data kosong dari Dapodik" /></div>
                    <div className="space-y-2"><Label>Desa/Kelurahan</Label><Input value={formData.desaKelurahan || ""} disabled placeholder="Data kosong dari Dapodik" /></div>
                    <div className="space-y-2"><Label>Kode Pos</Label><Input value={formData.kodePos || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                     <div className="space-y-2">
                       <Label>Tempat Tinggal</Label>
                       <Input value={formData.jenisTinggal || ""} disabled placeholder="Data kosong dari Dapodik" />
                     </div>
                     <div className="space-y-2">
                       <Label>Transportasi</Label>
                       <Input value={formData.alatTransportasi || ""} disabled placeholder="Data kosong dari Dapodik" />
                     </div>
                     <div className="col-span-full grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Lintang</Label><Input value={formData.lintang || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                      <div className="space-y-2"><Label>Bujur</Label><Input value={formData.bujur || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    </div>
                  </div>
                </div>

                {/* Kontak */}
                <div>
                  <h5 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 border-gray-100 dark:border-white/[0.05]">
                    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Kontak
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>No. Telp. Rumah</Label><Input value={formData.noTelpRumah || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>No. Handphone</Label><Input value={formData.noHp || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>No. Whatsapp <span className="text-red-500">*</span></Label><Input value={formData.noWa || ""} placeholder="0812XXXXXXXX" onChange={(e) => handleInputChange("noWa", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Email Aktif <span className="text-red-500">*</span></Label><Input type="email" value={formData.emailAktif || ""} placeholder="nama@email.com" onChange={(e) => handleInputChange("emailAktif", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Email Akun</Label><Input type="email" value={formData.emailAkun || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  </div>
                </div>
 
                {/* Kesejahteraan & Bank */}
                <div>
                  <h5 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 border-gray-100 dark:border-white/[0.05]">
                    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Kesejahteraan & Bank
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Penerima KIP</Label>
                       <Input value={formData.penerimaKIP || ""} disabled placeholder="Data kosong dari Dapodik" />
                     </div>
                     <div className="space-y-2">
                       <Label>Layak PIP</Label>
                       <Input value={formData.layakKIP || ""} disabled placeholder="Data kosong dari Dapodik" />
                     </div>
                     <div className="space-y-2">
                       <Label>Penerima KPS/PKH</Label>
                       <Input value={formData.penerimaKPS || ""} disabled placeholder="Data kosong dari Dapodik" />
                     </div>
                     <div className="space-y-2">
                       <Label>Nama Bank</Label>
                       <Input value={formData.idBank || ""} disabled placeholder="Data kosong dari Dapodik" />
                     </div>
                     <div className="space-y-2"><Label>No. Rekening Bank</Label><Input value={formData.rekeningBank || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                     <div className="space-y-2"><Label>Cabang Bank (KCP)</Label><Input value={formData.namaKCP || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                     <div className="space-y-2"><Label>Rekening Atas Nama</Label><Input value={formData.rekeningAtasNama || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Card 2: Data Periodik */}
          <div style={{ display: activeTab === "periodik" ? "block" : "none" }}>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Data Periodik
              </h4>
            </div>
            
            <div className="space-y-6">
              <div>
                <h5 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 border-gray-100 dark:border-white/[0.05]">
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l-3 1m0 0l3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  Data Fisik
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Tinggi Badan (cm)</Label><Input type="number" value={formData.tinggiBadan || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Berat Badan (kg)</Label><Input type="number" value={formData.beratBadan || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Lingkar Kepala (cm)</Label><Input type="number" value={formData.lingkarKepala || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Jarak Rumah ke Sekolah (m)</Label><Input type="number" value={formData.jarakRumah || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Jarak Rumah ke Sekolah (km)</Label><Input type="number" value={formData.jarakRumahKm || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Waktu Tempuh (jam/menit)</Label><Input type="number" value={formData.waktuTempuh || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Menit Tempuh (menit)</Label><Input type="number" value={formData.menitTempuh || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Jumlah Saudara Kandung</Label><Input type="number" value={formData.jumlahSaudara || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Card 3: Orang Tua & Wali */}
          <div style={{ display: activeTab === "orangtua" ? "block" : "none" }}>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-8">
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Orang Tua & Wali
              </h4>
            </div>

            {/* Data Ayah */}
            <div className="space-y-4">
              <h5 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 border-b pb-2 border-gray-100 dark:border-white/[0.05]">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Data Ayah
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.namaAyah || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                <div className="space-y-2"><Label>NIK</Label><Input value={formData.nikAyah || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                <div className="space-y-2">
                   <Label>Pekerjaan</Label>
                   <Input value={formData.pekerjaanAyah || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
                 <div className="space-y-2"><Label>Tahun Lahir</Label><Input type="number" value={formData.tahunLahirAyah || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                 <div className="space-y-2">
                   <Label>Pendidikan</Label>
                   <Input value={formData.jenjangPendidikanAyah || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
                 <div className="space-y-2">
                   <Label>Penghasilan</Label>
                   <Input value={formData.penghasilanAyah || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
              </div>
            </div>
 
            {/* Data Ibu */}
            <div className="space-y-4 border-t border-gray-100 dark:border-white/[0.05] pt-6">
              <h5 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 border-b pb-2 border-gray-100 dark:border-white/[0.05]">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Data Ibu
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.namaIbu || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                <div className="space-y-2"><Label>NIK</Label><Input value={formData.nikIbu || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                <div className="space-y-2">
                   <Label>Pekerjaan</Label>
                   <Input value={formData.pekerjaanIbu || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
                 <div className="space-y-2"><Label>Tahun Lahir</Label><Input type="number" value={formData.tahunLahirIbu || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                 <div className="space-y-2">
                   <Label>Pendidikan</Label>
                   <Input value={formData.jenjangPendidikanIbu || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
                 <div className="space-y-2">
                   <Label>Penghasilan</Label>
                   <Input value={formData.penghasilanIbu || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
              </div>
            </div>
 
            {/* Data Wali */}
            <div className="space-y-4 border-t border-gray-100 dark:border-white/[0.05] pt-6">
              <h5 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 border-b pb-2 border-gray-100 dark:border-white/[0.05]">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Data Wali
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.namaWali || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                <div className="space-y-2"><Label>NIK</Label><Input value={formData.nikWali || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                <div className="space-y-2">
                   <Label>Pekerjaan</Label>
                   <Input value={formData.pekerjaanWali || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
                 <div className="space-y-2"><Label>Tahun Lahir</Label><Input type="number" value={formData.tahunLahirWali || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                 <div className="space-y-2">
                   <Label>Pendidikan</Label>
                   <Input value={formData.jenjangPendidikanWali || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
                 <div className="space-y-2">
                   <Label>Penghasilan</Label>
                   <Input value={formData.penghasilanWali || ""} disabled placeholder="Data kosong dari Dapodik" />
                 </div>
              </div>
            </div>
          </div>
          </div>

          {/* Card 4: Dokumen */}
          <div style={{ display: activeTab === "dokumen" ? "block" : "none" }}>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Berkas Dokumen
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentDocTypes.map((docType) => {
                const existingFile = uploadedDocs.find(f => f.startsWith(docType.key));
                const fileUrl = existingFile 
                  ? `${apiBaseUrl}/storage/${formData.sekolahId}/siswa/${id}/dokumen/${existingFile}` 
                  : "";

                return (
                  <div key={docType.key} className="space-y-2 border border-gray-150 dark:border-white/[0.05] p-4 rounded-xl bg-gray-50/20 dark:bg-white/[0.01]">
                    <Label>{docType.name}</Label>
                    {existingFile ? (
                      <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-950 p-2.5 px-3.5 rounded-lg border border-gray-200 dark:border-white/[0.05] shadow-theme-xs">
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm font-medium text-brand-500 hover:underline truncate max-w-[200px]"
                          title={existingFile}
                        >
                          {existingFile}
                        </a>
                        <button 
                          onClick={() => handleDeleteDoc(existingFile, docType.name)} 
                          className="text-xs font-semibold text-error-500 hover:text-error-600 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <input 
                        type="file" 
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-white/[0.05] dark:file:text-white dark:hover:file:bg-white/[0.1] border border-gray-200 dark:border-gray-800 rounded-lg h-11 px-2 flex items-center bg-white dark:bg-gray-950" 
                        onChange={(e) => handleUploadDoc(docType.name, e.target.files?.[0])}
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <button
            onClick={() => navigate(`/${role}/student-data`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Batal
          </button>
          <Button variant="primary-outline" onClick={handleSave} disabled={loading}>
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </>
  );
};

export default EditStudentPage;
