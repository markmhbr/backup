import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import Swal from "sweetalert2";
import { dapodikService } from "../../services/dapodikService";

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

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose, selectedIds }) => {
  const [activeTab, setActiveTab] = useState("Profil");
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to convert to Title Case
  const toTitleCase = (str: string) => {
    return str ? str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "";
  };

  // Regional Data State
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");

  // Fetch Provinces on Mount
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((p: any) => ({ value: p.id, label: toTitleCase(p.name) }));
        setProvinces(formatted.sort((a: any, b: any) => a.label.localeCompare(b.label)));
      });
  }, []);

  // Fetch Regencies
  useEffect(() => {
    if (selectedProvinceId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`)
        .then(res => res.json())
        .then(data => {
          const formatted = data.map((r: any) => ({ value: r.id, label: toTitleCase(r.name) }));
          setRegencies(formatted.sort((a: any, b: any) => a.label.localeCompare(b.label)));
        });
    } else {
      setRegencies([]);
    }
    setDistricts([]);
    setVillages([]);
  }, [selectedProvinceId]);

  // Fetch Districts
  useEffect(() => {
    if (selectedRegencyId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedRegencyId}.json`)
        .then(res => res.json())
        .then(data => {
          const formatted = data.map((d: any) => ({ value: d.id, label: toTitleCase(d.name) }));
          setDistricts(formatted.sort((a: any, b: any) => a.label.localeCompare(b.label)));
        });
    } else {
      setDistricts([]);
    }
    setVillages([]);
  }, [selectedRegencyId]);

  // Fetch Villages
  useEffect(() => {
    if (selectedDistrictId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrictId}.json`)
        .then(res => res.json())
        .then(data => {
          const formatted = data.map((v: any) => ({ value: v.id, label: toTitleCase(v.name) }));
          setVillages(formatted.sort((a: any, b: any) => a.label.localeCompare(b.label)));
        });
    } else {
      setVillages([]);
    }
  }, [selectedDistrictId]);

  const tabs = [
    "Profil",
    "Data Periodik",
    "Orang Tua & Wali",
    "Dokumen",
  ];

  // Fetch Data from Backend
  useEffect(() => {
    const fetchData = async () => {
      if (isOpen && selectedIds.length === 1) {
        setLoading(true);
        try {
          const result = await dapodikService.getPesertaDidikDetail(selectedIds[0]);
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
              kebutuhanKhusus: data.kebutuhan_khusus || "",
              agama: data.agama_id_str || "",
              anakKe: data.anak_keberapa || "",
              avatar: data.foto || "",
              jalan: data.alamat_jalan || "",
              rt: format3Digits(data.rt),
              rw: format3Digits(data.rw),
              provinsi: data.provinsi || "",
              kabupaten: data.kabupaten_kota || "",
              kecamatan: data.kecamatan || "",
              desaKelurahan: data.desa_kelurahan || "",
              kodePos: data.kode_pos || "",
              tempatTinggal: data.jenis_tinggal_id_str || "",
              transportasi: data.alat_transportasi_id_str || "",
              lintang: data.lintang ? String(data.lintang) : "",
              bujur: data.bujur ? String(data.bujur) : "",
              penerimaKIP: data.penerima_kip || "",
              layakKIP: data.layak_pip || "",
              penerimaKPS: data.penerima_kps || "",
              noTelpRumah: data.nomor_telepon_rumah || "",
              noHp: data.nomor_telepon_seluler || "",
              noWa: data.no_wa || "",
              emailAktif: data.email || "",
              emailAkun: data.penggunas?.[0]?.email || "",
              tinggiBadan: data.tinggi_badan || "",
              beratBadan: data.berat_badan || "",
              lingkarKepala: data.lingkar_kepala || "",
              
              // Ayah
              namaAyah: data.nama_ayah || "",
              nikAyah: data.nik_ayah || "",
              pekerjaanAyah: data.pekerjaan_ayah_id_str || "",
              tahunLahirAyah: data.tahun_lahir_ayah || "",
              pendidikanAyah: data.pendidikan_ayah_id_str || "",
              penghasilanAyah: data.penghasilan_ayah_id_str || "",
              
              // Ibu
              namaIbu: data.nama_ibu_kandung || data.nama_ibu || "",
              nikIbu: data.nik_ibu || "",
              pekerjaanIbu: data.pekerjaan_ibu_id_str || "",
              tahunLahirIbu: data.tahun_lahir_ibu || "",
              pendidikanIbu: data.pendidikan_ibu_id_str || "",
              penghasilanIbu: data.penghasilan_ibu_id_str || "",
              
              // Wali
              namaWali: data.nama_wali || "",
              nikWali: data.nik_wali || "",
              pekerjaanWali: data.pekerjaan_wali_id_str || "",
              tahunLahirWali: data.tahun_lahir_wali || "",
              pendidikanWali: data.pendidikan_wali_id_str || "",
              penghasilanWali: data.penghasilan_wali_id_str || "",
            });

            // Pre-populate regional data names to their matching EMSIFA IDs
            try {
              const provRes = await fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
              const provData = await provRes.json();
              const formattedProvinces = provData.map((p: any) => ({ value: p.id, label: toTitleCase(p.name) }));
              
              const matchedProv = formattedProvinces.find((p: any) => p.label.toLowerCase() === (data.provinsi || '').toLowerCase());
              if (matchedProv) {
                setSelectedProvinceId(matchedProv.value);
                
                const regRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${matchedProv.value}.json`);
                const regData = await regRes.json();
                const formattedRegencies = regData.map((r: any) => ({ value: r.id, label: toTitleCase(r.name) }));
                setRegencies(formattedRegencies);
                
                const matchedReg = formattedRegencies.find((r: any) => r.label.toLowerCase() === (data.kabupaten_kota || '').toLowerCase());
                if (matchedReg) {
                  setSelectedRegencyId(matchedReg.value);
                  
                  const distRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${matchedReg.value}.json`);
                  const distData = await distRes.json();
                  const formattedDistricts = distData.map((d: any) => ({ value: d.id, label: toTitleCase(d.name) }));
                  setDistricts(formattedDistricts);
                  
                  const matchedDist = formattedDistricts.find((d: any) => d.label.toLowerCase() === (data.kecamatan || '').toLowerCase());
                  if (matchedDist) {
                    setSelectedDistrictId(matchedDist.value);
                    
                    const vilRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${matchedDist.value}.json`);
                    const vilData = await vilRes.json();
                    const formattedVillages = vilData.map((v: any) => ({ value: v.id, label: toTitleCase(v.name) }));
                    setVillages(formattedVillages);
                    
                    const matchedVil = formattedVillages.find((v: any) => v.label.toLowerCase() === (data.desa_kelurahan || '').toLowerCase());
                    if (matchedVil) {
                      setSelectedVillageId(matchedVil.value);
                    }
                  }
                }
              }
            } catch (regError) {
              console.error("Gagal memetakan data wilayah:", regError);
            }
          }
        } catch (error) {
          Swal.fire("Error", "Gagal mengambil data peserta didik", "error");
        } finally {
          setLoading(false);
        }
      } else if (isOpen && selectedIds.length > 1) {
        setFormData({ nama: `${selectedIds.length} Data Terpilih` });
      }
    };

    fetchData();
  }, [isOpen, selectedIds]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        Swal.fire({ title: "File Terlalu Besar", text: "Ukuran foto maksimal adalah 500Kb", icon: "error", confirmButtonColor: "#465FFF" });
        return;
      }
      
      setLoading(true);
      try {
        const result = await dapodikService.uploadSiswaFoto(selectedIds[0], file);
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

  const handleSave = async () => {
    if (selectedIds.length !== 1) return;

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
        kebutuhan_khusus: formData.kebutuhanKhusus,
        agama_id_str: formData.agama,
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
        jenis_tinggal_id_str: formData.tempatTinggal,
        alat_transportasi_id_str: formData.transportasi,
        lintang: formData.lintang ? formData.lintang : null,
        bujur: formData.bujur ? formData.bujur : null,
        penerima_kip: formData.penerimaKIP,
        layak_pip: formData.layakKIP,
        penerima_kps: formData.penerimaKPS,
        nomor_telepon_rumah: formData.noTelpRumah,
        nomor_telepon_seluler: formData.noHp,
        no_wa: formData.noWa,
        email: formData.emailAktif,
        email_akun: formData.emailAkun,
        tinggi_badan: formData.tinggiBadan ? String(formData.tinggiBadan) : null,
        berat_badan: formData.beratBadan ? String(formData.beratBadan) : null,
        lingkar_kepala: formData.lingkarKepala ? Number(formData.lingkarKepala) : null,
        
        // Ayah
        nama_ayah: formData.namaAyah,
        nik_ayah: formData.nikAyah,
        pekerjaan_ayah_id_str: formData.pekerjaanAyah,
        tahun_lahir_ayah: formData.tahunLahirAyah ? String(formData.tahunLahirAyah) : null,
        pendidikan_ayah_id_str: formData.pendidikanAyah,
        penghasilan_ayah_id_str: formData.penghasilanAyah,
        
        // Ibu
        nama_ibu_kandung: formData.namaIbu,
        nama_ibu: formData.namaIbu,
        nik_ibu: formData.nikIbu,
        pekerjaan_ibu_id_str: formData.pekerjaanIbu,
        tahun_lahir_ibu: formData.tahunLahirIbu ? String(formData.tahunLahirIbu) : null,
        pendidikan_ibu_id_str: formData.pendidikanIbu,
        penghasilan_ibu_id_str: formData.penghasilanIbu,
        
        // Wali
        nama_wali: formData.namaWali,
        nik_wali: formData.nikWali,
        pekerjaan_wali_id_str: formData.pekerjaanWali,
        tahun_lahir_wali: formData.tahunLahirWali ? String(formData.tahunLahirWali) : null,
        pendidikan_wali_id_str: formData.pendidikanWali,
        penghasilan_wali_id_str: formData.penghasilanWali,
      };

      await dapodikService.updatePesertaDidik(selectedIds[0], updatePayload);
      onClose();
      Swal.fire({
        title: "Berhasil",
        text: "Data Berhasil disimpan",
        icon: "success",
        confirmButtonColor: "#465FFF",
      });
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

  const handleUploadDoc = async (docName: string, file: File | undefined) => {
    if (!file) return;
    
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
      await dapodikService.uploadSiswaDokumen(selectedIds[0], file, docName);
      
      const result = await dapodikService.getPesertaDidikDetail(selectedIds[0]);
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
      await dapodikService.deleteSiswaDokumen(selectedIds[0], fileName);
      
      const result = await dapodikService.getPesertaDidikDetail(selectedIds[0]);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] p-0 overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
      
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      )}

      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Ubah Data Peserta Didik {selectedIds.length === 1 ? `- ${formData.nama}` : `(${selectedIds.length} Data)`}
        </h3>
      </div>

      <div className="px-6 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-brand-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {activeTab === "Profil" && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3 flex flex-col items-center border-r border-gray-100 dark:border-white/[0.05] pr-8">
              <div className="relative group">
                <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/[0.02]">
                  {formData.avatar ? <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" /> : <img src="/images/user/owner.jpg" alt="Profile Fallback" className="w-full h-full object-cover opacity-60" />}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 p-2 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
              </div>
              <p className="mt-4 text-xs text-gray-700 dark:text-gray-400 text-center italic">
                Format: JPG, JPEG, PNG. <br/>Maksimal 500Kb.
              </p>
              <Button variant="outline" size="sm" className="mt-4 w-full text-gray-800" onClick={() => fileInputRef.current?.click()}>Ganti Foto</Button>
            </div>
            <div className="w-full lg:w-2/3 space-y-6">
              <div>
                <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4">
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Identitas Pribadi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.nama || ""} placeholder="Masukkan Nama Lengkap" onChange={(e) => handleInputChange("nama", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Tempat Lahir</Label><Input value={formData.tempatLahir || ""} placeholder="Masukkan Tempat Lahir" onChange={(e) => handleInputChange("tempatLahir", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Tgl Lahir</Label><Input type="date" value={formData.tanggalLahir || ""} onChange={(e) => handleInputChange("tanggalLahir", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Jenis Kelamin</Label><Select value={formData.jk} options={[{value:"L",label:"Laki-laki"},{value:"P",label:"Perempuan"}]} onChange={(val) => handleInputChange("jk", val)} /></div>
                  <div className="space-y-2"><Label>NISN</Label><Input value={formData.nisn || ""} placeholder="NISN harus 10 digit" maxLength={10} onChange={(e) => handleInputChange("nisn", e.target.value)} /></div>
                  <div className="space-y-2"><Label>NIPD</Label><Input value={formData.nipd || ""} placeholder="Masukkan NIPD" onChange={(e) => handleInputChange("nipd", e.target.value)} /></div>
                  <div className="space-y-2"><Label>NIK</Label><Input value={formData.nik || ""} placeholder="NIK harus 16 digit" maxLength={16} onChange={(e) => handleInputChange("nik", e.target.value)} /></div>
                  <div className="space-y-2"><Label>No. Kartu Keluarga</Label><Input value={formData.noKK || ""} placeholder="Nomor KK harus 16 digit" maxLength={16} onChange={(e) => handleInputChange("noKK", e.target.value.replace(/\D/g, ''))} /></div>
                  <div className="space-y-2"><Label>No. Register Akte Lahir</Label><Input value={formData.noAkte || ""} placeholder="Masukkan Nomor Register Akta Lahir" onChange={(e) => handleInputChange("noAkte", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Berkebutuhan Khusus</Label><Input value={formData.kebutuhanKhusus || ""} placeholder="Masukkan Kebutuhan Khusus" onChange={(e) => handleInputChange("kebutuhanKhusus", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Agama</Label><Input value={formData.agama || ""} placeholder="Masukkan Agama" onChange={(e) => handleInputChange("agama", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Anak ke-</Label><Input type="number" value={formData.anakKe || ""} placeholder="Contoh: 1" onChange={(e) => handleInputChange("anakKe", e.target.value)} /></div>
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4">
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Alamat dan Tempat Tinggal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Jalan atau Kampung</Label><Input value={formData.jalan || ""} onChange={(e) => handleInputChange("jalan", e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>RT</Label>
                    <Input 
                      value={formData.rt || ""} 
                      onChange={(e) => handleInputChange("rt", e.target.value.replace(/\D/g, ''))} 
                      onBlur={() => handleInputChange("rt", format3Digits(formData.rt))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RW</Label>
                    <Input 
                      value={formData.rw || ""} 
                      onChange={(e) => handleInputChange("rw", e.target.value.replace(/\D/g, ''))} 
                      onBlur={() => handleInputChange("rw", format3Digits(formData.rw))}
                    />
                  </div>
                  <div className="space-y-2"><Label>Provinsi</Label><Select placeholder="Pilih Provinsi" options={provinces} value={selectedProvinceId} onChange={(val) => {setSelectedProvinceId(val); handleInputChange("provinsi", provinces.find(p=>p.value===val)?.label || ""); }} /></div>
                  <div className="space-y-2"><Label>Kab./Kota</Label><Select placeholder="Pilih Kab/Kota" options={regencies} value={selectedRegencyId} disabled={!selectedProvinceId} onChange={(val) => {setSelectedRegencyId(val); handleInputChange("kabupaten", regencies.find(r=>r.value===val)?.label || ""); }} /></div>
                  <div className="space-y-2"><Label>Kecamatan</Label><Select placeholder="Pilih Kecamatan" options={districts} value={selectedDistrictId} disabled={!selectedRegencyId} onChange={(val) => {setSelectedDistrictId(val); handleInputChange("kecamatan", districts.find(d=>d.value===val)?.label || ""); }} /></div>
                  <div className="space-y-2"><Label>Desa/Kelurahan</Label><Select placeholder="Pilih Desa/Kelurahan" options={villages} value={selectedVillageId} disabled={!selectedDistrictId} onChange={(val) => { setSelectedVillageId(val); handleInputChange("desaKelurahan", villages.find(v=>v.value===val)?.label || ""); }} /></div>
                  <div className="space-y-2"><Label>Kode Pos</Label><Input value={formData.kodePos || ""} onChange={(e) => handleInputChange("kodePos", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Tempat Tinggal</Label><Input value={formData.tempatTinggal || ""} onChange={(e) => handleInputChange("tempatTinggal", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Transportasi</Label><Input value={formData.transportasi || ""} onChange={(e) => handleInputChange("transportasi", e.target.value)} /></div>
                  <div className="col-span-full grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Lintang</Label><Input value={formData.lintang || ""} onChange={(e) => handleInputChange("lintang", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Bujur</Label><Input value={formData.bujur || ""} onChange={(e) => handleInputChange("bujur", e.target.value)} /></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4">
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Kesejahteraan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Penerima KIP</Label><Input value={formData.penerimaKIP || ""} onChange={(e) => handleInputChange("penerimaKIP", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Layak KIP</Label><Input value={formData.layakKIP || ""} onChange={(e) => handleInputChange("layakKIP", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Penerima KPS/PKH</Label><Input value={formData.penerimaKPS || ""} onChange={(e) => handleInputChange("penerimaKPS", e.target.value)} /></div>
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4">
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Kontak
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>No. Telp. Rumah</Label><Input value={formData.noTelpRumah || ""} onChange={(e) => handleInputChange("noTelpRumah", e.target.value)} /></div>
                  <div className="space-y-2"><Label>No. Handphone</Label><Input value={formData.noHp || ""} onChange={(e) => handleInputChange("noHp", e.target.value)} /></div>
                  <div className="space-y-2"><Label>No. Whatsapp</Label><Input value={formData.noWa || ""} onChange={(e) => handleInputChange("noWa", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email Aktif</Label><Input type="email" value={formData.emailAktif || ""} onChange={(e) => handleInputChange("emailAktif", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email Akun</Label><Input type="email" value={formData.emailAkun || ""} disabled /></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "Data Periodik" && (
          <div className="space-y-6">
            <div>
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l-3 1m0 0l3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                Data Fisik
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Tinggi Badan (cm)</Label><Input type="number" value={formData.tinggiBadan || ""} onChange={(e) => handleInputChange("tinggiBadan", e.target.value)} /></div>
                <div className="space-y-2"><Label>Berat Badan (kg)</Label><Input type="number" value={formData.beratBadan || ""} onChange={(e) => handleInputChange("beratBadan", e.target.value)} /></div>
                <div className="space-y-2"><Label>Lingkar Kepala (cm)</Label><Input type="number" value={formData.lingkarKepala || ""} onChange={(e) => handleInputChange("lingkarKepala", e.target.value)} /></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Orang Tua & Wali" && (
          <div className="space-y-8">
            {/* Data Ayah */}
            <div className="space-y-6">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Data Ayah
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.namaAyah || ""} onChange={(e) => handleInputChange("namaAyah", e.target.value)} /></div>
                <div className="space-y-2"><Label>NIK</Label><Input value={formData.nikAyah || ""} onChange={(e) => handleInputChange("nikAyah", e.target.value)} /></div>
                <div className="space-y-2"><Label>Pekerjaan</Label><Input value={formData.pekerjaanAyah || ""} onChange={(e) => handleInputChange("pekerjaanAyah", e.target.value)} /></div>
                <div className="space-y-2"><Label>Tahun Lahir</Label><Input type="number" value={formData.tahunLahirAyah || ""} onChange={(e) => handleInputChange("tahunLahirAyah", e.target.value)} /></div>
                <div className="space-y-2"><Label>Pendidikan</Label><Input value={formData.pendidikanAyah || ""} onChange={(e) => handleInputChange("pendidikanAyah", e.target.value)} /></div>
                <div className="space-y-2"><Label>Penghasilan</Label><Input value={formData.penghasilanAyah || ""} onChange={(e) => handleInputChange("penghasilanAyah", e.target.value)} /></div>
              </div>
            </div>

            {/* Data Ibu */}
            <div className="space-y-6 border-t border-gray-100 dark:border-white/[0.05] pt-8">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Data Ibu
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.namaIbu || ""} onChange={(e) => handleInputChange("namaIbu", e.target.value)} /></div>
                <div className="space-y-2"><Label>NIK</Label><Input value={formData.nikIbu || ""} onChange={(e) => handleInputChange("nikIbu", e.target.value)} /></div>
                <div className="space-y-2"><Label>Pekerjaan</Label><Input value={formData.pekerjaanIbu || ""} onChange={(e) => handleInputChange("pekerjaanIbu", e.target.value)} /></div>
                <div className="space-y-2"><Label>Tahun Lahir</Label><Input type="number" value={formData.tahunLahirIbu || ""} onChange={(e) => handleInputChange("tahunLahirIbu", e.target.value)} /></div>
                <div className="space-y-2"><Label>Pendidikan</Label><Input value={formData.pendidikanIbu || ""} onChange={(e) => handleInputChange("pendidikanIbu", e.target.value)} /></div>
                <div className="space-y-2"><Label>Penghasilan</Label><Input value={formData.penghasilanIbu || ""} onChange={(e) => handleInputChange("penghasilanIbu", e.target.value)} /></div>
              </div>
            </div>

            {/* Data Wali */}
            <div className="space-y-6 border-t border-gray-100 dark:border-white/[0.05] pt-8">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90 mb-4">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Data Wali
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.namaWali || ""} onChange={(e) => handleInputChange("namaWali", e.target.value)} /></div>
                <div className="space-y-2"><Label>NIK</Label><Input value={formData.nikWali || ""} onChange={(e) => handleInputChange("nikWali", e.target.value)} /></div>
                <div className="space-y-2"><Label>Pekerjaan</Label><Input value={formData.pekerjaanWali || ""} onChange={(e) => handleInputChange("pekerjaanWali", e.target.value)} /></div>
                <div className="space-y-2"><Label>Tahun Lahir</Label><Input type="number" value={formData.tahunLahirWali || ""} onChange={(e) => handleInputChange("tahunLahirWali", e.target.value)} /></div>
                <div className="space-y-2"><Label>Pendidikan</Label><Input value={formData.pendidikanWali || ""} onChange={(e) => handleInputChange("pendidikanWali", e.target.value)} /></div>
                <div className="space-y-2"><Label>Penghasilan</Label><Input value={formData.penghasilanWali || ""} onChange={(e) => handleInputChange("penghasilanWali", e.target.value)} /></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Dokumen" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentDocTypes.map((docType) => {
              const existingFile = uploadedDocs.find(f => f.startsWith(docType.key));
              const fileUrl = existingFile 
                ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/storage/${formData.sekolahId}/siswa/${selectedIds[0]}/dokumen/${existingFile}` 
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
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.05] flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400">
          Batal
        </button>
        <Button onClick={handleSave} disabled={loading}>Simpan Perubahan</Button>
      </div>
    </Modal>
  );
};

export default EditStudentModal;
