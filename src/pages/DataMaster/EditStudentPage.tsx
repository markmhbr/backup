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
import Switch from "../../components/form/switch/Switch";
import { Modal } from "../../components/ui/modal";
import { dapodikService } from "../../services/dapodikService";
import { getFotoUrl } from "../../utils/image";
import { referenceService } from "../../services/referenceService";
import { printStudentProfile } from "../../utils/printStudentProfile";
import PrintPDCardPreview from "../../components/student/PrintPDCardPreview";

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

const formatDateToIndonesian = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return cleanDate;
};

interface EditStudentPageProps {
  profileId?: string;
}

const EditStudentPage: React.FC<EditStudentPageProps> = ({ profileId }) => {
  const { role, id: paramId } = useParams<{ role: string; id: string }>();
  const id = profileId || paramId;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profil");

  const tabs = [
    { id: "profil", label: "Profil & Identitas" },
    { id: "alamat", label: "Alamat & Tempat Tinggal" },
    { id: "periodik", label: "Data Periodik" },
    { id: "orangtua", label: "Orang Tua & Wali" },
    { id: "dokumen", label: "Berkas Dokumen" },
  ];

  const apiBaseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace("/api", "") 
    : "http://localhost:3000";

  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(!!id);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPengajuanModalOpen, setIsPengajuanModalOpen] = useState(false);
  const [isKkDropdownOpen, setIsKkDropdownOpen] = useState(false);
  const [isKkAyahDropdownOpen, setIsKkAyahDropdownOpen] = useState(false);
  const [isKkIbuDropdownOpen, setIsKkIbuDropdownOpen] = useState(false);
  const [isFormPengajuanOpen, setIsFormPengajuanOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [pengajuanForm, setPengajuanForm] = useState<any>({});
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<any | null>(null);

  const [isCompletenessModalOpen, setIsCompletenessModalOpen] = useState(false);
  const [hasShownCompletenessAlert, setHasShownCompletenessAlert] = useState(false);

  const getEmptyFields = () => {
    if (!formData || !formData.nama) return [];
    
    const requiredFields = [
      { key: 'nama', label: 'Nama Lengkap' },
      { key: 'jk', label: 'Jenis Kelamin' },
      { key: 'nik', label: 'NIK' },
      { key: 'tempatLahir', label: 'Tempat Lahir' },
      { key: 'tanggalLahir', label: 'Tanggal Lahir' },
      { key: 'agama_id', label: 'Agama' },
      { key: 'kk', label: 'No. Kartu Keluarga' },
      { key: 'reg_akta_lahir', label: 'Register Akta Lahir' },
      { key: 'anak_keberapa', label: 'Anak ke-' },
      { key: 'noHp', label: 'Nomor HP' },
      { key: 'noWa', label: 'Nomor WhatsApp' },
      { key: 'emailAktif', label: 'Email Aktif' },
      { key: 'kampungJalan', label: 'Alamat Jalan' },
      { key: 'rt', label: 'RT' },
      { key: 'rw', label: 'RW' },
      { key: 'dusun', label: 'Nama Dusun' },
      { key: 'desaKelurahan', label: 'Desa/Kelurahan' },
      { key: 'provinsi', label: 'Provinsi' },
      { key: 'kabupatenKota', label: 'Kabupaten/Kota' },
      { key: 'kecamatan', label: 'Kecamatan' },
      { key: 'kodePos', label: 'Kode Pos' },
      { key: 'jenisTinggalId', label: 'Jenis Tinggal' },
      { key: 'alatTransportasiId', label: 'Alat Transportasi' },
      { key: 'lintang', label: 'Lintang' },
      { key: 'bujur', label: 'Bujur' },
      { key: 'tinggiBadan', label: 'Tinggi Badan' },
      { key: 'beratBadan', label: 'Berat Badan' },
      { key: 'lingkarKepala', label: 'Lingkar Kepala' },
      { key: 'jarakRumah', label: 'Jarak Rumah' },
      { key: 'waktuTempuh', label: 'Waktu Tempuh' },
      { key: 'menitTempuh', label: 'Menit Tempuh' },
      { key: 'jumlahSaudara', label: 'Jumlah Saudara' },
      { key: 'namaAyah', label: 'Nama Ayah' },
      { key: 'nikAyah', label: 'NIK Ayah' },
      { key: 'tahunLahirAyah', label: 'Tahun Lahir Ayah' },
      { key: 'jenjang_pendidikan_ayah', label: 'Pendidikan Ayah' },
      { key: 'pekerjaan_id_ayah', label: 'Pekerjaan Ayah' },
      { key: 'penghasilan_id_ayah', label: 'Penghasilan Ayah' },
      { key: 'namaIbu', label: 'Nama Ibu' },
      { key: 'nikIbu', label: 'NIK Ibu' },
      { key: 'tahunLahirIbu', label: 'Tahun Lahir Ibu' },
      { key: 'jenjang_pendidikan_ibu', label: 'Pendidikan Ibu' },
      { key: 'pekerjaan_id_ibu', label: 'Pekerjaan Ibu' },
      { key: 'penghasilan_id_ibu', label: 'Penghasilan Ibu' },
      { key: 'namaWali', label: 'Nama Wali' },
      { key: 'nikWali', label: 'NIK Wali' },
      { key: 'tahunLahirWali', label: 'Tahun Lahir Wali' },
      { key: 'jenjang_pendidikan_wali', label: 'Pendidikan Wali' },
      { key: 'pekerjaan_id_wali', label: 'Pekerjaan Wali' },
      { key: 'penghasilan_id_wali', label: 'Penghasilan Wali' }
    ];

    const isWaliMode = formData.isWali === true || formData.isWali === 1 || formData.isWali === '1' || !!(formData.namaWali || formData.nikWali);

    const checkFilled = (field: any) => {
      if (field.key === 'provinsi' || field.key === 'kabupatenKota' || field.key === 'kecamatan') {
        const desa = formData['desaKelurahan'] || formData['desaKelurahanCode'];
        const prov = formData['provinsi'];
        const kab = formData['kabupatenKota'] || formData['kabupatenKotaName'];
        const kec = formData['kecamatan'] || formData['kecamatanName'];
        return !!((desa && desa !== '-' && desa !== '') || (prov && prov !== '-' && prov !== '') || (kab && kab !== '-' && kab !== '') || (kec && kec !== '-' && kec !== ''));
      }
      
      const val = formData[field.key];
      if (val !== undefined && val !== null && val !== '' && val !== '-' && val !== 0 && val !== '0') {
        return true;
      }
      return false;
    };

    return requiredFields.filter(field => {
      if (field.key.endsWith('Wali') || field.key.endsWith('_wali')) {
        return isWaliMode;
      }
      return true;
    }).map(field => ({
      ...field,
      filled: checkFilled(field)
    }));
  };

  const fieldStatus = getEmptyFields();
  const emptyCount = fieldStatus.filter(f => !f.filled).length;
  const totalCount = fieldStatus.length;
  const completenessPercentage = totalCount > 0 ? Math.round(((totalCount - emptyCount) / totalCount) * 100) : 0;

  useEffect(() => {
    if (profileId && formData && formData.nama && !loading && !hasShownCompletenessAlert) {
      const statusList = getEmptyFields();
      const emptyFields = statusList.filter(f => !f.filled);
      if (emptyFields.length > 0) {
        setIsCompletenessModalOpen(true);
        setHasShownCompletenessAlert(true);
      }
    }
  }, [profileId, formData, loading, hasShownCompletenessAlert]);

  const handlePrintBiodata = async () => {
    if (id) {
      await printStudentProfile([id]);
    }
  };

  const handlePrintCard = () => {
    if (!id || !formData) return;
    setSelectedStudentForCard({
      peserta_didik_id: id,
      nama: formData.nama,
      foto: formData.avatar,
      nisn: formData.nisn,
      nipd: formData.nipd,
      jenis_kelamin: formData.jk,
      avatar: getFotoUrl(formData.avatar, ""),
      qr_token: formData.qrToken || "",
    });
    setIsCardModalOpen(true);
  };

  const [refOptions, setRefOptions] = useState<any>(null);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [kabupatens, setKabupatens] = useState<any[]>([]);
  const [kecamatans, setKecamatans] = useState<any[]>([]);
  const [desas, setDesas] = useState<any[]>([]);

  const [addrProvinces, setAddrProvinces] = useState<any[]>([]);
  const [addrKabupatens, setAddrKabupatens] = useState<any[]>([]);
  const [addrKecamatans, setAddrKecamatans] = useState<any[]>([]);
  const [addrDesas, setAddrDesas] = useState<any[]>([]);

  useEffect(() => {
    if (provinces.length > 0) {
      setAddrProvinces(provinces);
    }
  }, [provinces]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [optionsRes, provsRes] = await Promise.allSettled([
          referenceService.getOptions(),
          referenceService.getWilayah(1)
        ]);

        if (optionsRes.status === "fulfilled") {
          const val = optionsRes.value;
          setRefOptions(val?.data || val || null);
        }
        if (provsRes.status === "fulfilled") {
          const val = provsRes.value;
          setProvinces(val?.data || val || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadReferences();
  }, []);

  const handleAddrProvinceChange = async (provCode: string, provName: string) => {
    handleInputChange("provinsi", provName);
    handleInputChange("kabupaten", "");
    handleInputChange("kecamatan", "");
    handleInputChange("desaKelurahan", "");
    handleInputChange("desaKelurahanCode", "");
    setAddrKabupatens([]);
    setAddrKecamatans([]);
    setAddrDesas([]);
    if (!provCode) return;
    try {
      const res = await referenceService.getWilayah(2, provCode);
      setAddrKabupatens(res?.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddrKabupatenChange = async (kabCode: string, kabName: string) => {
    handleInputChange("kabupaten", kabName);
    handleInputChange("kecamatan", "");
    handleInputChange("desaKelurahan", "");
    handleInputChange("desaKelurahanCode", "");
    setAddrKecamatans([]);
    setAddrDesas([]);
    if (!kabCode) return;
    try {
      const res = await referenceService.getWilayah(3, kabCode);
      setAddrKecamatans(res?.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddrKecamatanChange = async (kecCode: string) => {
    handleInputChange("kecamatan", kecCode);
    handleInputChange("desaKelurahan", "");
    handleInputChange("desaKelurahanCode", "");
    setAddrDesas([]);
    if (!kecCode) return;
    try {
      const res = await referenceService.getWilayah(4, kecCode);
      setAddrDesas(res?.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddrDesaChange = (desaCode: string, desaName: string) => {
    handleInputChange("desaKelurahan", desaName);
    handleInputChange("desaKelurahanCode", desaCode);
  };

  // Pre-load address hierarchy when student data is fetched
  useEffect(() => {
    const loadAddressHierarchy = async () => {
      const desaCode = formData.desaKelurahanCode; // e.g. "0207152003"
      if (desaCode && desaCode.length >= 6) {
        try {
          const provCode = desaCode.substring(0, 2) + "0000";
          const kabCode = desaCode.substring(0, 4) + "00";
          const kecCode = desaCode.substring(0, 6);

          // Fetch kabupatens for this province
          const kabRes = await referenceService.getWilayah(2, provCode);
          setAddrKabupatens(kabRes?.data || kabRes || []);

          // Fetch kecamatans for this kabupaten
          const kecRes = await referenceService.getWilayah(3, kabCode);
          setAddrKecamatans(kecRes?.data || kecRes || []);

          // Fetch desas for this kecamatan
          const desaRes = await referenceService.getWilayah(4, kecCode);
          setAddrDesas(desaRes?.data || desaRes || []);
        } catch (e) {
          console.error("Gagal load address hierarchy on mount:", e);
        }
      }
    };
    if (formData.desaKelurahanCode && addrProvinces.length > 0 && addrKabupatens.length === 0) {
      loadAddressHierarchy();
    }
  }, [formData.desaKelurahanCode, addrProvinces.length, addrKabupatens.length]);

  useEffect(() => {
    if (isFormPengajuanOpen) {
      const loadDataOnOpen = async () => {
        try {
          if (provinces.length === 0) {
            const provsRes = await referenceService.getWilayah(1);
            setProvinces(provsRes?.data || provsRes || []);
          }
          if (!refOptions) {
            const optionsRes = await referenceService.getOptions();
            setRefOptions(optionsRes?.data || optionsRes || null);
          }
        } catch (e) {
          console.error("Gagal reload data referensi:", e);
        }
      };
      loadDataOnOpen();
    }
  }, [isFormPengajuanOpen, provinces.length, refOptions]);

  const FIELD_MAP_SISWA: { [key: string]: { label: string, dbKey: string, localKey: string } } = {
    nama: { label: 'Nama Lengkap', dbKey: 'nama', localKey: 'nama' },
    tempat_lahir: { label: 'Tempat Lahir', dbKey: 'tempat_lahir', localKey: 'tempatLahir' },
    tanggal_lahir: { label: 'Tanggal Lahir', dbKey: 'tanggal_lahir', localKey: 'tanggalLahir' },
    jenis_kelamin: { label: 'Jenis Kelamin', dbKey: 'jenis_kelamin', localKey: 'jk' },
    nik: { label: 'NIK', dbKey: 'nik', localKey: 'nik' },
    nama_ibu_kandung: { label: 'Nama Ibu Kandung', dbKey: 'nama_ibu_kandung', localKey: 'namaIbu' },
    no_kk: { label: 'No. Kartu Keluarga', dbKey: 'no_kk', localKey: 'noKK' },
    reg_akta_lahir: { label: 'No. Register Akte Lahir', dbKey: 'reg_akta_lahir', localKey: 'noAkte' },
    agama_id: { label: 'Agama', dbKey: 'agama_id', localKey: 'agama_id' },
    anak_keberapa: { label: 'Anak Ke-', dbKey: 'anak_keberapa', localKey: 'anakKe' },
    alamat_jalan: { label: 'Jalan atau Kampung', dbKey: 'alamat_jalan', localKey: 'jalan' },
    rt: { label: 'RT', dbKey: 'rt', localKey: 'rt' },
    rw: { label: 'RW', dbKey: 'rw', localKey: 'rw' },
    wilayah: { label: 'Wilayah (Provinsi, Kab, Kec, Desa)', dbKey: 'wilayah', localKey: 'wilayah' },
    kode_pos: { label: 'Kode Pos', dbKey: 'kode_pos', localKey: 'kodePos' },
    tempat_tinggal: { label: 'Tempat Tinggal', dbKey: 'jenis_tinggal_id', localKey: 'jenisTinggalId' },
    transportasi: { label: 'Alat Transportasi', dbKey: 'alat_transportasi_id', localKey: 'alatTransportasiId' },
    lintang_bujur: { label: 'Koordinat (Lintang & Bujur)', dbKey: 'lintang_bujur', localKey: 'lintang_bujur' },
    no_telepon_rumah: { label: 'No. Telepon Rumah', dbKey: 'no_telepon_rumah', localKey: 'noTelpRumah' },
    no_hp: { label: 'No. Handphone (WhatsApp)', dbKey: 'nomor_telepon_seluler', localKey: 'noHp' },
    tinggi_badan: { label: 'Tinggi Badan (cm)', dbKey: 'tinggi_badan', localKey: 'tinggiBadan' },
    berat_badan: { label: 'Berat Badan (kg)', dbKey: 'berat_badan', localKey: 'beratBadan' },
    lingkar_kepala: { label: 'Lingkar Kepala (cm)', dbKey: 'lingkar_kepala', localKey: 'lingkarKepala' },
    jarak_sekolah: { label: 'Jarak Rumah ke Sekolah', dbKey: 'jarak_sekolah', localKey: 'jarak_sekolah' },
    waktu_tempuh: { label: 'Waktu Tempuh ke Sekolah', dbKey: 'waktu_tempuh', localKey: 'waktu_tempuh' },
    jumlah_saudara_kandung: { label: 'Jumlah Saudara Kandung', dbKey: 'jumlah_saudara_kandung', localKey: 'jumlahSaudara' },
    data_orang_tua: { label: 'Data Orang Tua (Ayah & Ibu)', dbKey: 'data_orang_tua', localKey: 'data_orang_tua' },
    data_wali: { label: 'Data Wali', dbKey: 'data_wali', localKey: 'data_wali' }
  };

  const handleToggleKebutuhanKhusus = (id: number, type: "siswa" | "ayah" | "ibu" = "siswa") => {
    setFormData((prev: any) => {
      const idKey = type === "siswa" 
        ? "kebutuhan_khusus_id" 
        : type === "ayah" 
          ? "kebutuhan_khusus_id_ayah" 
          : "kebutuhan_khusus_id_ibu";
          
      const strKey = type === "siswa" 
        ? "kebutuhanKhusus" 
        : type === "ayah" 
          ? "kebutuhanKhususAyah" 
          : "kebutuhanKhususIbu";

      let currentMask = prev[idKey] || 0;
      if (id === 0) {
        currentMask = 0;
      } else {
        if ((currentMask & id) === id) {
          // Uncheck
          currentMask = currentMask & ~id;
        } else {
          // Check
          currentMask = currentMask | id;
        }
      }
      
      const selectedIds = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]
        .filter(x => (currentMask & x) === x);
      const options = refOptions?.kebutuhan_khusus || [];
      const names = selectedIds.map(x => {
        const opt = options.find((o: any) => (o.kebutuhan_khusus_id || o.id) === x);
        return opt ? (opt.kebutuhan_khusus || opt.nama) : "";
      }).filter(Boolean);
      
      const kebutuhanKhususStr = names.length === 0 ? "Tidak ada" : names.join(", ");

      return {
        ...prev,
        [idKey]: currentMask,
        [strKey]: kebutuhanKhususStr
      };
    });
  };

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleStartPerbaikan = () => {
    if (selectedFields.length === 0) {
      Swal.fire("Info", "Pilih minimal satu data untuk diajukan perbaikan", "info");
      return;
    }
    
    const initialForm: any = {};
    selectedFields.forEach(fieldKey => {
      if (fieldKey === "lintang_bujur") {
        initialForm["lintang"] = formData["lintang"] || "";
        initialForm["bujur"] = formData["bujur"] || "";
      } else if (fieldKey === "wilayah") {
        initialForm["provinsi"] = formData["provinsi"] || "";
        initialForm["kabupaten_kota"] = formData["kabupaten"] || "";
        initialForm["kecamatan"] = formData["kecamatan"] || "";
        initialForm["desa_kelurahan"] = formData["desaKelurahan"] || "";
      } else if (fieldKey === "jarak_sekolah") {
        initialForm["jarak_rumah_ke_sekolah"] = formData["jarakRumah"] || "";
        initialForm["jarak_rumah_ke_sekolah_km"] = formData["jarakRumahKm"] || "";
      } else if (fieldKey === "waktu_tempuh") {
        initialForm["waktu_tempuh_ke_sekolah"] = formData["waktuTempuh"] || "";
        initialForm["menit_tempuh_ke_sekolah"] = formData["menitTempuh"] || "";
      } else if (fieldKey === "data_orang_tua") {
        initialForm["nama_ayah"] = formData["namaAyah"] || "";
        initialForm["nik_ayah"] = formData["nikAyah"] || "";
        initialForm["pekerjaan_id_ayah"] = formData["pekerjaan_id_ayah"] || "";
        initialForm["tahun_lahir_ayah"] = formData["tahunLahirAyah"] || "";
        initialForm["jenjang_pendidikan_ayah"] = formData["jenjang_pendidikan_ayah"] || "";
        initialForm["penghasilan_id_ayah"] = formData["penghasilan_id_ayah"] || "";

        initialForm["nama_ibu_kandung"] = formData["namaIbu"] || "";
        initialForm["nik_ibu"] = formData["nikIbu"] || "";
        initialForm["pekerjaan_id_ibu"] = formData["pekerjaan_id_ibu"] || "";
        initialForm["tahun_lahir_ibu"] = formData["tahunLahirIbu"] || "";
        initialForm["jenjang_pendidikan_ibu"] = formData["jenjang_pendidikan_ibu"] || "";
        initialForm["penghasilan_id_ibu"] = formData["penghasilan_id_ibu"] || "";
      } else if (fieldKey === "data_wali") {
        initialForm["is_wali"] = formData["isWali"] || false;
        initialForm["nama_wali"] = formData["namaWali"] || "";
        initialForm["nik_wali"] = formData["nikWali"] || "";
        initialForm["pekerjaan_id_wali"] = formData["pekerjaan_id_wali"] || "";
        initialForm["tahun_lahir_wali"] = formData["tahunLahirWali"] || "";
        initialForm["jenjang_pendidikan_wali"] = formData["jenjang_pendidikan_wali"] || "";
        initialForm["penghasilan_id_wali"] = formData["penghasilan_id_wali"] || "";
      } else {
        const mapping = FIELD_MAP_SISWA[fieldKey];
        if (mapping) {
          initialForm[fieldKey] = formData[mapping.localKey] || "";
        }
      }
    });
    setPengajuanForm(initialForm);
    
    setIsPengajuanModalOpen(false);
    setIsFormPengajuanOpen(true);
  };

  const handlePengajuanInputChange = (fieldKey: string, val: any) => {
    setPengajuanForm((prev: any) => ({
      ...prev,
      [fieldKey]: val,
    }));
  };

  const handleCheckPengajuan = async () => {
    try {
      Swal.fire({
        title: "Memeriksa...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const sch = await dapodikService.getSekolah();
      if (!sch?.data?.sekolah_id) {
        Swal.close();
        Swal.fire("Error", "Gagal mengidentifikasi sekolah Anda.", "error");
        return;
      }

      const settings = await dapodikService.getPengaturanUmum(sch.data.sekolah_id);
      Swal.close();

      if (!settings?.data?.waktu_mulai_pengajuan || !settings?.data?.waktu_sampai_pengajuan) {
        Swal.fire("Pengajuan Ditutup", "Pengajuan perbaikan belum dibuka oleh sekolah (waktu pengajuan belum diatur).", "info");
        return;
      }

      const now = new Date();
      const currentDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now); // "YYYY-MM-DD"
      
      const start = settings.data.waktu_mulai_pengajuan;
      const end = settings.data.waktu_sampai_pengajuan;

      if (currentDateStr < start || currentDateStr > end) {
        Swal.fire(
          "Pengajuan Ditutup",
          `Pengajuan perbaikan ditutup. Hanya diperbolehkan dari tanggal ${start} s.d ${end}. Saat ini tanggal ${currentDateStr}.`,
          "warning"
        );
        return;
      }

      setIsPengajuanModalOpen(true);
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Gagal memeriksa waktu pengajuan.", "error");
    }
  };



  const handleProvinceChange = async (provName: string, provCode: string) => {
    handlePengajuanInputChange("provinsi", provName);
    handlePengajuanInputChange("_provinsi_code", provCode);
    handlePengajuanInputChange("kabupaten_kota", "");
    handlePengajuanInputChange("_kabupaten_code", "");
    handlePengajuanInputChange("kecamatan", "");
    handlePengajuanInputChange("desa_kelurahan", "");
    setKabupatens([]);
    setKecamatans([]);
    setDesas([]);
    if (!provCode) return;
    try {
      const res = await referenceService.getWilayah(2, provCode);
      setKabupatens(res?.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleKabupatenChange = async (kabName: string, kabCode: string) => {
    handlePengajuanInputChange("kabupaten_kota", kabName);
    handlePengajuanInputChange("_kabupaten_code", kabCode);
    handlePengajuanInputChange("kecamatan", "");
    handlePengajuanInputChange("desa_kelurahan", "");
    setKecamatans([]);
    setDesas([]);
    if (!kabCode) return;
    try {
      const res = await referenceService.getWilayah(3, kabCode);
      setKecamatans(res?.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleKecamatanChange = async (kecName: string, kecCode: string) => {
    handlePengajuanInputChange("kecamatan", kecCode);
    handlePengajuanInputChange("_kecamatan_name", kecName);
    handlePengajuanInputChange("desa_kelurahan", "");
    setDesas([]);
    if (!kecCode) return;
    try {
      const res = await referenceService.getWilayah(4, kecCode);
      setDesas(res?.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDesaChange = (desaName: string, desaCode: string) => {
    handlePengajuanInputChange("desa_kelurahan", desaCode); // save code!
    handlePengajuanInputChange("_desa_name", desaName);
  };

  const handleSubmitPengajuan = async () => {
    setLoading(true);
    try {
      const perubahan: any = {};
      selectedFields.forEach(fieldKey => {
        if (fieldKey === "lintang_bujur") {
          perubahan["lintang"] = {
            sebelumnya: formData["lintang"] || null,
            diajukan: pengajuanForm["lintang"] || null
          };
          perubahan["bujur"] = {
            sebelumnya: formData["bujur"] || null,
            diajukan: pengajuanForm["bujur"] || null
          };
        } else if (fieldKey === "wilayah") {
          perubahan["provinsi"] = {
            sebelumnya: formData["provinsi"] || null,
            diajukan: pengajuanForm["provinsi"] || null
          };
          perubahan["kabupaten_kota"] = {
            sebelumnya: formData["kabupaten"] || null,
            diajukan: pengajuanForm["kabupaten_kota"] || null
          };
          const rawKecName = pengajuanForm["_kecamatan_name"] || "";
          const kecPart = rawKecName.startsWith("Kec.") ? rawKecName : `Kec. ${rawKecName}`;
          const rawKabName = pengajuanForm["kabupaten_kota"] || "";
          const kabPart = rawKabName.startsWith("Kab.") ? rawKabName : `Kab. ${rawKabName}`;
          perubahan["kecamatan"] = {
            sebelumnya: formData["kecamatan"] || null,
            diajukan: pengajuanForm["kecamatan"] || null,
            diajukan_nama: rawKecName ? `${kecPart} - ${kabPart}` : ""
          };
          perubahan["desa_kelurahan"] = {
            sebelumnya: formData["desaKelurahan"] || null,
            diajukan: pengajuanForm["desa_kelurahan"] || null,
            diajukan_nama: pengajuanForm["_desa_name"] || ""
          };
        } else if (fieldKey === "jarak_sekolah") {
          perubahan["jarak_rumah_ke_sekolah"] = {
            sebelumnya: formData["jarakRumah"] || null,
            diajukan: pengajuanForm["jarak_rumah_ke_sekolah"] || null
          };
          perubahan["jarak_rumah_ke_sekolah_km"] = {
            sebelumnya: formData["jarakRumahKm"] || null,
            diajukan: pengajuanForm["jarak_rumah_ke_sekolah_km"] || null
          };
        } else if (fieldKey === "waktu_tempuh") {
          perubahan["waktu_tempuh_ke_sekolah"] = {
            sebelumnya: formData["waktuTempuh"] || null,
            diajukan: pengajuanForm["waktu_tempuh_ke_sekolah"] || null
          };
          perubahan["menit_tempuh_ke_sekolah"] = {
            sebelumnya: formData["menitTempuh"] || null,
            diajukan: pengajuanForm["menit_tempuh_ke_sekolah"] || null
          };
        } else if (fieldKey === "data_orang_tua") {
          // Ayah
          perubahan["nama_ayah"] = { sebelumnya: formData["namaAyah"] || null, diajukan: pengajuanForm["nama_ayah"] || null };
          perubahan["nik_ayah"] = { sebelumnya: formData["nikAyah"] || null, diajukan: pengajuanForm["nik_ayah"] || null };
          perubahan["pekerjaan_id_ayah"] = { sebelumnya: formData["pekerjaan_id_ayah"] || null, diajukan: pengajuanForm["pekerjaan_id_ayah"] || null };
          perubahan["tahun_lahir_ayah"] = { sebelumnya: formData["tahunLahirAyah"] || null, diajukan: pengajuanForm["tahun_lahir_ayah"] || null };
          perubahan["jenjang_pendidikan_ayah"] = { sebelumnya: formData["jenjang_pendidikan_ayah"] || null, diajukan: pengajuanForm["jenjang_pendidikan_ayah"] || null };
          perubahan["penghasilan_id_ayah"] = { sebelumnya: formData["penghasilan_id_ayah"] || null, diajukan: pengajuanForm["penghasilan_id_ayah"] || null };
          // Ibu
          perubahan["nama_ibu_kandung"] = { sebelumnya: formData["namaIbu"] || null, diajukan: pengajuanForm["nama_ibu_kandung"] || null };
          perubahan["nik_ibu"] = { sebelumnya: formData["nikIbu"] || null, diajukan: pengajuanForm["nik_ibu"] || null };
          perubahan["pekerjaan_id_ibu"] = { sebelumnya: formData["pekerjaan_id_ibu"] || null, diajukan: pengajuanForm["pekerjaan_id_ibu"] || null };
          perubahan["tahun_lahir_ibu"] = { sebelumnya: formData["tahunLahirIbu"] || null, diajukan: pengajuanForm["tahun_lahir_ibu"] || null };
          perubahan["jenjang_pendidikan_ibu"] = { sebelumnya: formData["jenjang_pendidikan_ibu"] || null, diajukan: pengajuanForm["jenjang_pendidikan_ibu"] || null };
          perubahan["penghasilan_id_ibu"] = { sebelumnya: formData["penghasilan_id_ibu"] || null, diajukan: pengajuanForm["penghasilan_id_ibu"] || null };
        } else if (fieldKey === "data_wali") {
          perubahan["is_wali"] = { sebelumnya: formData["isWali"] || false, diajukan: pengajuanForm["is_wali"] || false };
          perubahan["nama_wali"] = { sebelumnya: formData["namaWali"] || null, diajukan: pengajuanForm["nama_wali"] || null };
          perubahan["nik_wali"] = { sebelumnya: formData["nikWali"] || null, diajukan: pengajuanForm["nik_wali"] || null };
          perubahan["pekerjaan_id_wali"] = { sebelumnya: formData["pekerjaan_id_wali"] || null, diajukan: pengajuanForm["pekerjaan_id_wali"] || null };
          perubahan["tahun_lahir_wali"] = { sebelumnya: formData["tahunLahirWali"] || null, diajukan: pengajuanForm["tahun_lahir_wali"] || null };
          perubahan["jenjang_pendidikan_wali"] = { sebelumnya: formData["jenjang_pendidikan_wali"] || null, diajukan: pengajuanForm["jenjang_pendidikan_wali"] || null };
          perubahan["penghasilan_id_wali"] = { sebelumnya: formData["penghasilan_id_wali"] || null, diajukan: pengajuanForm["penghasilan_id_wali"] || null };
        } else {
          const mapping = FIELD_MAP_SISWA[fieldKey];
          if (mapping) {
            perubahan[mapping.dbKey] = {
              sebelumnya: formData[mapping.localKey] || null,
              diajukan: pengajuanForm[fieldKey] || null
            };
          }
        }
      });

      await dapodikService.buatPengajuanPerbaikan({
        peserta_didik_id: id,
        tipe: 'SISWA',
        perubahan: perubahan
      });

      Swal.fire({
        title: "Berhasil",
        text: "Pengajuan perbaikan data berhasil dikirim dan menunggu persetujuan.",
        icon: "success",
        confirmButtonColor: "#465FFF"
      });
      setIsFormPengajuanOpen(false);
      setSelectedFields([]);
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Gagal mengirim pengajuan perbaikan data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Data from Backend
  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setLoading(true);
        setFormData({});
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
              tanggalLahir: formatDateToIndonesian(data.tanggal_lahir),
              jk: data.jenis_kelamin || "",
              nisn: data.nisn || "",
              nipd: data.nipd || "",
              nik: data.nik || "",
              noKK: data.no_kk || "",
              noAkte: data.reg_akta_lahir || "",
              kebutuhanKhusus: data.kebutuhan_khusus_nama || "",
              kebutuhan_khusus_id: data.kebutuhan_khusus_id || 0,
              agama: data.agama_nama || "",
              anakKe: data.anak_keberapa !== null && data.anak_keberapa !== undefined ? String(data.anak_keberapa) : "",
              idHobby: data.id_hobby !== null && data.id_hobby !== undefined ? String(data.id_hobby) : "",
              idCita: data.id_cita !== null && data.id_cita !== undefined ? String(data.id_cita) : "",
              avatar: data.foto || "",
              jalan: data.alamat_jalan || "",
              rt: format3Digits(data.rt),
              rw: format3Digits(data.rw),
              provinsi: data.provinsi || "",
              kabupaten: data.kabupaten || data.kabupaten_kota || "",
              kecamatan: data.kode_wilayah ? data.kode_wilayah.trim().substring(0, 6) : "",
              kecamatanName: data.kecamatan || "",
              desaKelurahan: data.desa_kelurahan || "",
              desaKelurahanCode: data.kode_wilayah ? data.kode_wilayah.trim() : "",
              kodePos: data.kode_pos || "",
              jenisTinggal: data.jenis_tinggal_nama || "",
              jenisTinggalId: data.jenis_tinggal_id || "",
              alatTransportasi: data.alat_transportasi_nama || "",
              alatTransportasiId: data.alat_transportasi_id || "",
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
              noWa: data.no_whatsapp || data.no_wa || "",
              emailAktif: data.email_aktif || data.email || "",
              emailAkun: data.penggunas?.[0]?.email || "",
              tinggiBadan: data.tinggi_badan !== null && data.tinggi_badan !== undefined ? String(data.tinggi_badan) : "",
              beratBadan: data.berat_badan !== null && data.berat_badan !== undefined ? String(data.berat_badan) : "",
              lingkarKepala: data.lingkar_kepala !== null && data.lingkar_kepala !== undefined ? String(data.lingkar_kepala) : "",
              jarakRumah: data.jarak_rumah_ke_sekolah !== null && data.jarak_rumah_ke_sekolah !== undefined ? String(data.jarak_rumah_ke_sekolah) : "",
              jarakRumahKm: data.jarak_rumah_ke_sekolah_km !== null && data.jarak_rumah_ke_sekolah_km !== undefined ? String(data.jarak_rumah_ke_sekolah_km) : "",
              waktuTempuh: data.waktu_tempuh_ke_sekolah !== null && data.waktu_tempuh_ke_sekolah !== undefined ? String(data.waktu_tempuh_ke_sekolah) : "",
              menitTempuh: data.menit_tempuh_ke_sekolah !== null && data.menit_tempuh_ke_sekolah !== undefined ? String(data.menit_tempuh_ke_sekolah) : "",
              jumlahSaudara: data.jumlah_saudara_kandung !== null && data.jumlah_saudara_kandung !== undefined ? String(data.jumlah_saudara_kandung) : "",
              agama_id: data.agama_id || "",

              // Ayah
              namaAyah: data.nama_ayah || "",
              nikAyah: data.nik_ayah || "",
              pekerjaanAyah: data.pekerjaan_ayah_nama || "",
              pekerjaan_id_ayah: data.pekerjaan_id_ayah || "",
              tahunLahirAyah: data.tahun_lahir_ayah !== null && data.tahun_lahir_ayah !== undefined ? String(data.tahun_lahir_ayah) : "",
              jenjangPendidikanAyah: data.jenjang_pendidikan_ayah_nama || "",
              jenjang_pendidikan_ayah: data.jenjang_pendidikan_ayah || "",
              penghasilanAyah: data.penghasilan_ayah_nama || "",
              penghasilan_id_ayah: data.penghasilan_id_ayah || "",
              kebutuhan_khusus_id_ayah: data.kebutuhan_khusus_id_ayah || 0,
              kebutuhanKhususAyah: data.kebutuhan_khusus_ayah_nama || "",

              // Ibu
              namaIbu: data.nama_ibu_kandung || data.nama_ibu || "",
              nikIbu: data.nik_ibu || "",
              pekerjaanIbu: data.pekerjaan_ibu_nama || "",
              pekerjaan_id_ibu: data.pekerjaan_id_ibu || "",
              tahunLahirIbu: data.tahun_lahir_ibu !== null && data.tahun_lahir_ibu !== undefined ? String(data.tahun_lahir_ibu) : "",
              jenjangPendidikanIbu: data.jenjang_pendidikan_ibu_nama || "",
              jenjang_pendidikan_ibu: data.jenjang_pendidikan_ibu || "",
              penghasilanIbu: data.penghasilan_ibu_nama || "",
              penghasilan_id_ibu: data.penghasilan_id_ibu || "",
              kebutuhan_khusus_id_ibu: data.kebutuhan_khusus_id_ibu || 0,
              kebutuhanKhususIbu: data.kebutuhan_khusus_ibu_nama || "",

              // Wali
              isWali: data.is_wali === true || data.is_wali === 1 || data.is_wali === "1" || !!(data.nama_wali || data.nik_wali),
              namaWali: data.nama_wali || "",
              nikWali: data.nik_wali || "",
              pekerjaanWali: data.pekerjaan_wali_nama || "",
              pekerjaan_id_wali: data.pekerjaan_id_wali || "",
              tahunLahirWali: data.tahun_lahir_wali !== null && data.tahun_lahir_wali !== undefined ? String(data.tahun_lahir_wali) : "",
              jenjangPendidikanWali: data.jenjang_pendidikan_wali_nama || "",
              jenjang_pendidikan_wali: data.jenjang_pendidikan_wali || "",
              penghasilanWali: data.penghasilan_wali_nama || "",
              penghasilan_id_wali: data.penghasilan_id_wali || "",
              qrToken: data.qr_token || "",
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
        reg_akta_lahir: formData.noAkte,
        kebutuhan_khusus_id: formData.kebutuhan_khusus_id || null,
        agama_id: formData.agama_id || null,
        anak_keberapa: formData.anakKe ? String(formData.anakKe) : null,
        foto: formData.avatar,
        alamat_jalan: formData.jalan,
        rt: sanitizeRtRw(formData.rt),
        rw: sanitizeRtRw(formData.rw),
        provinsi: formData.provinsi,
        kabupaten_kota: formData.kabupaten,
        kecamatan: formData.desaKelurahanCode || formData.kecamatan,
        desa_kelurahan: formData.desaKelurahan,
        kode_pos: formData.kodePos,
        jenis_tinggal_id: formData.jenis_tinggal_id || null,
        alat_transportasi_id: formData.alat_transportasi_id || null,
        lintang: formData.lintang ? formData.lintang : null,
        bujur: formData.bujur ? formData.bujur : null,
        penerima_kip: formData.penerimaKIP,
        layak_pip: formData.layakKIP,
        penerima_kps: formData.penerimaKPS,
        id_hobby: formData.idHobby || null,
        id_cita: formData.idCita || null,
        
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
        kebutuhan_khusus_id_ayah: formData.kebutuhan_khusus_id_ayah || null,
        
        // Ibu
        nama_ibu_kandung: formData.namaIbu,
        nama_ibu: formData.namaIbu,
        nik_ibu: formData.nikIbu,
        pekerjaan_id_ibu: formData.pekerjaan_id_ibu || null,
        tahun_lahir_ibu: formData.tahunLahirIbu ? String(formData.tahunLahirIbu) : null,
        jenjang_pendidikan_ibu: formData.jenjang_pendidikan_ibu || null,
        penghasilan_id_ibu: formData.penghasilan_id_ibu || null,
        kebutuhan_khusus_id_ibu: formData.kebutuhan_khusus_id_ibu || null,
        
        // Wali
        is_wali: formData.isWali || false,
        nama_wali: formData.isWali ? (formData.namaWali || null) : null,
        nik_wali: formData.isWali ? (formData.nikWali || null) : null,
        pekerjaan_id_wali: formData.isWali ? (formData.pekerjaan_id_wali || null) : null,
        tahun_lahir_wali: formData.isWali ? (formData.tahunLahirWali ? String(formData.tahunLahirWali) : null) : null,
        jenjang_pendidikan_wali: formData.isWali ? (formData.jenjang_pendidikan_wali || null) : null,
        penghasilan_id_wali: formData.isWali ? (formData.penghasilan_id_wali || null) : null,
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



  if (loading && !formData.id) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

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
            {!profileId && (
              <button
                onClick={() => navigate(`/${role}/student-data`)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Daftar
              </button>
            )}
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {profileId ? "Profil Saya" : "Ubah Data Peserta Didik"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {profileId ? "Rincian profil dan data identitas Anda" : <>Ubah rincian data untuk siswa: <span className="font-semibold text-brand-500">{formData.nama || "Memuat..."}</span></>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {!profileId && (
              <button
                onClick={() => navigate(`/${role}/student-data`)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] transition-colors"
              >
                Batal
              </button>
            )}
            <button
              onClick={handlePrintBiodata}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Cetak Biodata
            </button>
            <button
              onClick={handlePrintCard}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Cetak Kartu ID
            </button>
            <button
              onClick={handleCheckPengajuan}
              className="px-4 py-2.5 rounded-lg border border-brand-500 text-sm font-semibold text-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors"
            >
              Pengajuan Perbaikan
            </button>
            <Button variant="primary-outline" onClick={handleSave} disabled={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </div>

        {profileId && (
          <div className="p-5 rounded-2xl border border-warning-200 bg-warning-50 dark:border-warning-900/30 dark:bg-warning-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shadow-sm">
            <div className="flex gap-4">
              <div className="p-2.5 bg-warning-100 dark:bg-warning-900/30 rounded-xl text-warning-600 dark:text-warning-400 self-start">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-warning-800 dark:text-warning-300 text-base">
                  Persentase Kelengkapan Profil Anda: {completenessPercentage}%
                </h4>
                <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
                  {emptyCount > 0 
                    ? `Terdapat ${emptyCount} kolom wajib yang masih belum terisi di profil Anda. Klik tombol di kanan untuk melihat kolom yang kosong.` 
                    : "Selamat! Profil Anda telah terisi lengkap 100%."}
                </p>
              </div>
            </div>
            {emptyCount > 0 && (
              <button 
                type="button"
                onClick={() => setIsCompletenessModalOpen(true)}
                className="px-5 py-2.5 text-sm font-bold text-white bg-warning-600 hover:bg-warning-700 active:bg-warning-800 rounded-xl transition-colors shadow-sm whitespace-nowrap self-start sm:self-center"
              >
                Lihat Kolom Kosong
              </button>
            )}
          </div>
        )}

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
                    <div className="space-y-2"><Label>Tanggal Lahir</Label><Input value={formData.tanggalLahir || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>Jenis Kelamin</Label><Input value={formData.jk === "L" ? "Laki-laki" : formData.jk === "P" ? "Perempuan" : formData.jk || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>NISN</Label><Input value={formData.nisn || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>NIPD</Label><Input value={formData.nipd || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                    <div className="space-y-2"><Label>NIK</Label><Input value={formData.nik || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                     <div className="space-y-2">
                       <Label>No. Kartu Keluarga</Label>
                       <Input 
                         value={formData.noKK || ""} 
                         maxLength={16}
                         placeholder="Masukkan No. Kartu Keluarga" 
                         onChange={(e) => handleInputChange("noKK", e.target.value.replace(/\D/g, ''))} 
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>No. Register Akte Lahir</Label>
                       <Input 
                         value={formData.noAkte || ""} 
                         placeholder="Masukkan No. Register Akte Lahir" 
                         onChange={(e) => handleInputChange("noAkte", e.target.value)} 
                       />
                     </div>
                      <div className="space-y-2 relative">
                        <Label>Berkebutuhan Khusus</Label>
                        <button
                          type="button"
                          onClick={() => setIsKkDropdownOpen(!isKkDropdownOpen)}
                          className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white bg-white text-left cursor-pointer"
                        >
                          <span className="truncate">
                            {formData.kebutuhanKhusus || "Tidak ada"}
                          </span>
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isKkDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setIsKkDropdownOpen(false)}
                            />
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-950 z-20 space-y-1">
                              {(refOptions?.kebutuhan_khusus || []).map((o: any) => {
                                const oid = o.kebutuhan_khusus_id || o.id;
                                const currentMask = formData.kebutuhan_khusus_id || 0;
                                const isChecked = oid === 0 ? currentMask === 0 : (currentMask & oid) === oid;
                                return (
                                  <label
                                    key={oid}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleKebutuhanKhusus(oid)}
                                      className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 size-4"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {o.kebutuhan_khusus || o.nama}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Agama</Label>
                        <select
                          value={formData.agama_id || ""}
                          onChange={(e) => {
                            const opt = (refOptions?.agama || []).find((a: any) => String(a.agama_id || a.id) === e.target.value);
                            setFormData((prev: any) => ({
                              ...prev,
                              agama_id: e.target.value,
                              agama: opt?.nama || opt?.agama || ""
                            }));
                          }}
                          className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                        >
                          <option value="">Pilih Agama</option>
                          {(refOptions?.agama || []).map((a: any) => (
                            <option key={a.agama_id || a.id} value={a.agama_id || a.id}>{a.nama || a.agama}</option>
                          ))}
                        </select>
                      </div>
                     <div className="space-y-2">
                       <Label>Anak ke-</Label>
                       <Input 
                         type="number" 
                         value={formData.anakKe || ""} 
                         placeholder="Masukkan Anak ke- (angka)" 
                         onChange={(e) => handleInputChange("anakKe", e.target.value)} 
                       />
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
                    <div className="space-y-2">
                      <Label>No. Telp. Rumah</Label>
                      <Input 
                        value={formData.noTelpRumah || ""} 
                        placeholder="Masukkan No. Telepon Rumah" 
                        onChange={(e) => handleInputChange("noTelpRumah", e.target.value.replace(/\D/g, ''))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>No. Handphone</Label>
                      <Input 
                        value={formData.noHp || ""} 
                        placeholder="Masukkan No. Handphone" 
                        onChange={(e) => handleInputChange("noHp", e.target.value.replace(/\D/g, ''))} 
                      />
                    </div>
                    <div className="space-y-2"><Label>No. Whatsapp <span className="text-red-500">*</span></Label><Input value={formData.noWa || ""} placeholder="0812XXXXXXXX" onChange={(e) => handleInputChange("noWa", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Email Aktif <span className="text-red-500">*</span></Label><Input type="email" value={formData.emailAktif || ""} placeholder="nama@email.com" onChange={(e) => handleInputChange("emailAktif", e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Email Akun</Label>
                      <Input 
                        type="email" 
                        value={formData.emailAkun || ""} 
                        placeholder="Data kosong dari Dapodik" 
                        disabled 
                      />
                    </div>
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

          {/* Card 1.5: Alamat & Tempat Tinggal */}
          <div style={{ display: activeTab === "alamat" ? "block" : "none" }}>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
              <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Alamat & Tempat Tinggal
                </h4>
              </div>
              <div className="space-y-8">
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
                    <div className="space-y-2">
                      <Label>Jalan atau Kampung</Label>
                      <Input 
                        value={formData.jalan || ""} 
                        placeholder="Masukkan jalan atau kampung" 
                        onChange={(e) => handleInputChange("jalan", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>RT</Label>
                      <Input 
                        value={formData.rt || ""} 
                        placeholder="Masukkan RT (contoh: 001)" 
                        onChange={(e) => handleInputChange("rt", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>RW</Label>
                      <Input 
                        value={formData.rw || ""} 
                        placeholder="Masukkan RW (contoh: 002)" 
                        onChange={(e) => handleInputChange("rw", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provinsi</Label>
                      <select
                        value={addrProvinces.find(p => p.nama?.trim().toLowerCase() === formData.provinsi?.trim().toLowerCase())?.kode_wilayah?.trim() || ""}
                        onChange={(e) => {
                          const code = e.target.value?.trim();
                          const name = addrProvinces.find(p => p.kode_wilayah?.trim() === code)?.nama || "";
                          handleAddrProvinceChange(code, name);
                        }}
                        className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                      >
                        <option value="">{formData.provinsi || "Pilih Provinsi"}</option>
                        {addrProvinces.map((p) => (
                          <option key={p.kode_wilayah?.trim()} value={p.kode_wilayah?.trim()}>{p.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kab./Kota</Label>
                      <select
                        value={addrKabupatens.find(k => k.nama?.trim().toLowerCase() === formData.kabupaten?.trim().toLowerCase())?.kode_wilayah?.trim() || ""}
                        onChange={(e) => {
                          const code = e.target.value?.trim();
                          const name = addrKabupatens.find(k => k.kode_wilayah?.trim() === code)?.nama || "";
                          handleAddrKabupatenChange(code, name);
                        }}
                        className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                        disabled={!formData.provinsi}
                      >
                        <option value="">{formData.kabupaten || "Pilih Kab./Kota"}</option>
                        {addrKabupatens.map((k) => (
                          <option key={k.kode_wilayah?.trim()} value={k.kode_wilayah?.trim()}>{k.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kecamatan</Label>
                      <select
                        value={formData.kecamatan?.trim() || ""}
                        onChange={(e) => {
                          const code = e.target.value?.trim();
                          const name = addrKecamatans.find(k => k.kode_wilayah?.trim() === code)?.nama || "";
                          handleInputChange("kecamatanName", name);
                          handleAddrKecamatanChange(code);
                        }}
                        className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                        disabled={!formData.kabupaten}
                      >
                        <option value="">{formData.kecamatanName || "Pilih Kecamatan"}</option>
                        {addrKecamatans.map((k) => (
                          <option key={k.kode_wilayah?.trim()} value={k.kode_wilayah?.trim()}>{k.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Desa/Kelurahan</Label>
                      <select
                        value={formData.desaKelurahanCode?.trim() || ""}
                        onChange={(e) => {
                          const code = e.target.value?.trim();
                          const name = addrDesas.find(d => d.kode_wilayah?.trim() === code)?.nama || "";
                          handleAddrDesaChange(code, name);
                        }}
                        className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                        disabled={!formData.kecamatan}
                      >
                        <option value="">{formData.desaKelurahan || "Pilih Desa/Kelurahan"}</option>
                        {addrDesas.map((d) => (
                          <option key={d.kode_wilayah?.trim()} value={d.kode_wilayah?.trim()}>{d.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kode Pos</Label>
                      <Input 
                        value={formData.kodePos || ""} 
                        placeholder="Masukkan Kode Pos" 
                        onChange={(e) => handleInputChange("kodePos", e.target.value.replace(/\D/g, ''))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tempat Tinggal</Label>
                      <select
                        value={formData.jenis_tinggal_id || formData.jenisTinggalId || ""}
                        onChange={(e) => {
                          const opt = (refOptions?.jenis_tinggal || []).find((t: any) => String(t.jenis_tinggal_id || t.id) === e.target.value);
                          setFormData((prev: any) => ({
                            ...prev,
                            jenis_tinggal_id: e.target.value,
                            jenisTinggalId: e.target.value,
                            jenisTinggal: opt?.nama || opt?.jenis_tinggal || ""
                          }));
                        }}
                        className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                      >
                        <option value="">Pilih Tempat Tinggal</option>
                        {(refOptions?.jenis_tinggal || []).map((t: any) => (
                          <option key={t.jenis_tinggal_id || t.id} value={t.jenis_tinggal_id || t.id}>{t.nama || t.jenis_tinggal}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Transportasi</Label>
                      <select
                        value={formData.alat_transportasi_id || formData.alatTransportasiId || ""}
                        onChange={(e) => {
                          const opt = (refOptions?.alat_transportasi || []).find((t: any) => String(t.alat_transportasi_id || t.id) === e.target.value);
                          setFormData((prev: any) => ({
                            ...prev,
                            alat_transportasi_id: e.target.value,
                            alatTransportasiId: e.target.value,
                            alatTransportasi: opt?.nama || opt?.alat_transportasi || ""
                          }));
                        }}
                        className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                      >
                        <option value="">Pilih Alat Transportasi</option>
                        {(refOptions?.alat_transportasi || []).map((t: any) => (
                          <option key={t.alat_transportasi_id || t.id} value={t.alat_transportasi_id || t.id}>{t.nama || t.alat_transportasi}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Lintang</Label>
                        <Input 
                          value={formData.lintang || ""} 
                          placeholder="Contoh: -6.200000" 
                          onChange={(e) => handleInputChange("lintang", e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bujur</Label>
                        <Input 
                          value={formData.bujur || ""} 
                          placeholder="Contoh: 106.816666" 
                          onChange={(e) => handleInputChange("bujur", e.target.value)} 
                        />
                      </div>
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
                  <div className="space-y-2">
                    <Label>Tinggi Badan (cm)</Label>
                    <Input 
                      type="number" 
                      value={formData.tinggiBadan || ""} 
                      placeholder="Masukkan Tinggi Badan" 
                      onChange={(e) => handleInputChange("tinggiBadan", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Berat Badan (kg)</Label>
                    <Input 
                      type="number" 
                      value={formData.beratBadan || ""} 
                      placeholder="Masukkan Berat Badan" 
                      onChange={(e) => handleInputChange("beratBadan", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lingkar Kepala (cm)</Label>
                    <Input 
                      type="number" 
                      value={formData.lingkarKepala || ""} 
                      placeholder="Masukkan Lingkar Kepala" 
                      onChange={(e) => handleInputChange("lingkarKepala", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jarak Rumah ke Sekolah (m)</Label>
                    <Input 
                      type="number" 
                      value={formData.jarakRumah || ""} 
                      placeholder="Masukkan Jarak Rumah" 
                      onChange={(e) => handleInputChange("jarakRumah", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jarak Rumah ke Sekolah (km)</Label>
                    <Input 
                      type="number" 
                      value={formData.jarakRumahKm || ""} 
                      placeholder="Masukkan Jarak Rumah (KM)" 
                      onChange={(e) => handleInputChange("jarakRumahKm", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Tempuh (jam/menit)</Label>
                    <Input 
                      type="number" 
                      value={formData.waktuTempuh || ""} 
                      placeholder="Masukkan Waktu Tempuh (jam)" 
                      onChange={(e) => handleInputChange("waktuTempuh", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Menit Tempuh (menit)</Label>
                    <Input 
                      type="number" 
                      value={formData.menitTempuh || ""} 
                      placeholder="Masukkan Waktu Tempuh (menit)" 
                      onChange={(e) => handleInputChange("menitTempuh", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah Saudara Kandung</Label>
                    <Input 
                      type="number" 
                      value={formData.jumlahSaudara || ""} 
                      placeholder="Masukkan Jumlah Saudara Kandung" 
                      onChange={(e) => handleInputChange("jumlahSaudara", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hobi</Label>
                    <select
                      value={formData.idHobby || ""}
                      onChange={(e) => handleInputChange("idHobby", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                    >
                      <option value="">Pilih Hobi</option>
                      {(refOptions?.jenis_hobby || []).map((h: any) => (
                        <option key={h.id_hobby || h.id} value={h.id_hobby || h.id}>{h.nm_hobby || h.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cita-Cita</Label>
                    <select
                      value={formData.idCita || ""}
                      onChange={(e) => handleInputChange("idCita", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                    >
                      <option value="">Pilih Cita-Cita</option>
                      {(refOptions?.jenis_cita || []).map((c: any) => (
                        <option key={c.id_cita || c.id} value={c.id_cita || c.id}>{c.nm_cita || c.nama}</option>
                      ))}
                    </select>
                  </div>

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
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input 
                    value={formData.namaAyah || ""} 
                    placeholder="Masukkan Nama Lengkap Ayah" 
                    onChange={(e) => handleInputChange("namaAyah", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>NIK</Label>
                  <Input 
                    value={formData.nikAyah || ""} 
                    maxLength={16}
                    placeholder="Masukkan NIK Ayah" 
                    onChange={(e) => handleInputChange("nikAyah", e.target.value.replace(/\D/g, ''))} 
                  />
                </div>
                <div className="space-y-2">
                   <Label>Pekerjaan</Label>
                   <select
                     value={formData.pekerjaan_id_ayah || ""}
                     onChange={(e) => {
                       const opt = (refOptions?.pekerjaan || []).find((p: any) => String(p.pekerjaan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         pekerjaan_id_ayah: e.target.value,
                         pekerjaanAyah: opt?.nama || opt?.pekerjaan || ""
                       }));
                     }}
                     className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                   >
                     <option value="">Pilih Pekerjaan</option>
                     {(refOptions?.pekerjaan || []).map((p: any) => (
                       <option key={p.pekerjaan_id || p.id} value={p.pekerjaan_id || p.id}>{p.nama || p.pekerjaan}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Tahun Lahir</Label>
                   <Input 
                     type="number" 
                     value={formData.tahunLahirAyah || ""} 
                     placeholder="Masukkan Tahun Lahir Ayah" 
                     onChange={(e) => handleInputChange("tahunLahirAyah", e.target.value)} 
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Pendidikan</Label>
                   <select
                     value={formData.jenjang_pendidikan_ayah || ""}
                     onChange={(e) => {
                       const opt = (refOptions?.jenjang_pendidikan || []).find((p: any) => String(p.jenjang_pendidikan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         jenjang_pendidikan_ayah: e.target.value,
                         jenjangPendidikanAyah: opt?.nama || opt?.jenjang_pendidikan || ""
                       }));
                     }}
                     className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                   >
                     <option value="">Pilih Pendidikan</option>
                     {(refOptions?.jenjang_pendidikan || []).map((p: any) => (
                       <option key={p.jenjang_pendidikan_id || p.id} value={p.jenjang_pendidikan_id || p.id}>{p.nama || p.jenjang_pendidikan}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Penghasilan</Label>
                   <select
                     value={formData.penghasilan_id_ayah || ""}
                     onChange={(e) => {
                       const opt = (refOptions?.penghasilan || []).find((p: any) => String(p.penghasilan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         penghasilan_id_ayah: e.target.value,
                         penghasilanAyah: opt?.nama || opt?.penghasilan || ""
                       }));
                     }}
                     className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                   >
                     <option value="">Pilih Penghasilan</option>
                     {(refOptions?.penghasilan || []).map((p: any) => (
                       <option key={p.penghasilan_id || p.id} value={p.penghasilan_id || p.id}>{p.nama || p.penghasilan}</option>
                     ))}
                   </select>
                 </div>
                  <div className="space-y-2 relative">
                    <Label>Berkebutuhan Khusus</Label>
                    <button
                      type="button"
                      onClick={() => setIsKkAyahDropdownOpen(!isKkAyahDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white bg-white text-left cursor-pointer"
                    >
                      <span className="truncate">
                        {formData.kebutuhanKhususAyah || "Tidak ada"}
                      </span>
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isKkAyahDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsKkAyahDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-950 z-20 space-y-1">
                          {(refOptions?.kebutuhan_khusus || []).map((o: any) => {
                            const oid = o.kebutuhan_khusus_id || o.id;
                            const currentMask = formData.kebutuhan_khusus_id_ayah || 0;
                            const isChecked = oid === 0 ? currentMask === 0 : (currentMask & oid) === oid;
                            return (
                              <label
                                key={oid}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleKebutuhanKhusus(oid, "ayah")}
                                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 size-4"
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {o.kebutuhan_khusus || o.nama}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
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
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input value={formData.namaIbu || ""} placeholder="Data kosong dari Dapodik" disabled />
                </div>
                <div className="space-y-2">
                  <Label>NIK</Label>
                  <Input 
                    value={formData.nikIbu || ""} 
                    maxLength={16}
                    placeholder="Masukkan NIK Ibu" 
                    onChange={(e) => handleInputChange("nikIbu", e.target.value.replace(/\D/g, ''))} 
                  />
                </div>
                <div className="space-y-2">
                   <Label>Pekerjaan</Label>
                   <select
                     value={formData.pekerjaan_id_ibu || ""}
                     onChange={(e) => {
                       const opt = (refOptions?.pekerjaan || []).find((p: any) => String(p.pekerjaan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         pekerjaan_id_ibu: e.target.value,
                         pekerjaanIbu: opt?.nama || opt?.pekerjaan || ""
                       }));
                     }}
                     className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                   >
                     <option value="">Pilih Pekerjaan</option>
                     {(refOptions?.pekerjaan || []).map((p: any) => (
                       <option key={p.pekerjaan_id || p.id} value={p.pekerjaan_id || p.id}>{p.nama || p.pekerjaan}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Tahun Lahir</Label>
                   <Input 
                     type="number" 
                     value={formData.tahunLahirIbu || ""} 
                     placeholder="Masukkan Tahun Lahir Ibu" 
                     onChange={(e) => handleInputChange("tahunLahirIbu", e.target.value)} 
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Pendidikan</Label>
                   <select
                     value={formData.jenjang_pendidikan_ibu || ""}
                     onChange={(e) => {
                       const opt = (refOptions?.jenjang_pendidikan || []).find((p: any) => String(p.jenjang_pendidikan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         jenjang_pendidikan_ibu: e.target.value,
                         jenjangPendidikanIbu: opt?.nama || opt?.jenjang_pendidikan || ""
                       }));
                     }}
                     className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                   >
                     <option value="">Pilih Pendidikan</option>
                     {(refOptions?.jenjang_pendidikan || []).map((p: any) => (
                       <option key={p.jenjang_pendidikan_id || p.id} value={p.jenjang_pendidikan_id || p.id}>{p.nama || p.jenjang_pendidikan}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Penghasilan</Label>
                   <select
                     value={formData.penghasilan_id_ibu || ""}
                     onChange={(e) => {
                       const opt = (refOptions?.penghasilan || []).find((p: any) => String(p.penghasilan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         penghasilan_id_ibu: e.target.value,
                         penghasilanIbu: opt?.nama || opt?.penghasilan || ""
                       }));
                     }}
                     className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                   >
                     <option value="">Pilih Penghasilan</option>
                     {(refOptions?.penghasilan || []).map((p: any) => (
                       <option key={p.penghasilan_id || p.id} value={p.penghasilan_id || p.id}>{p.nama || p.penghasilan}</option>
                     ))}
                   </select>
                 </div>
                  <div className="space-y-2 relative">
                    <Label>Berkebutuhan Khusus</Label>
                    <button
                      type="button"
                      onClick={() => setIsKkIbuDropdownOpen(!isKkIbuDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white bg-white text-left cursor-pointer"
                    >
                      <span className="truncate">
                        {formData.kebutuhanKhususIbu || "Tidak ada"}
                      </span>
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isKkIbuDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsKkIbuDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-950 z-20 space-y-1">
                          {(refOptions?.kebutuhan_khusus || []).map((o: any) => {
                            const oid = o.kebutuhan_khusus_id || o.id;
                            const currentMask = formData.kebutuhan_khusus_id_ibu || 0;
                            const isChecked = oid === 0 ? currentMask === 0 : (currentMask & oid) === oid;
                            return (
                              <label
                                key={oid}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleKebutuhanKhusus(oid, "ibu")}
                                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 size-4"
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {o.kebutuhan_khusus || o.nama}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
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
               
               <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.01] border border-gray-200 dark:border-gray-800 mb-4 shadow-sm">
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Apakah mempunyai wali?</span>
                 <Switch
                   label="Apakah mempunyai wali?"
                   checked={formData.isWali || false}
                   onChange={(checked) => {
                     setFormData((prev: any) => ({
                       ...prev,
                       isWali: checked,
                       ...(checked ? {} : {
                         namaWali: "",
                         nikWali: "",
                         pekerjaanWali: "",
                         pekerjaan_id_wali: null,
                         tahunLahirWali: "",
                         jenjangPendidikanWali: "",
                         jenjang_pendidikan_wali: null,
                         penghasilanWali: "",
                         penghasilan_id_wali: null,
                       })
                     }));
                   }}
                 />
               </div>

               {formData.isWali ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Nama Lengkap</Label>
                     <Input 
                       value={formData.namaWali || ""} 
                       placeholder="Masukkan Nama Lengkap Wali" 
                       onChange={(e) => handleInputChange("namaWali", e.target.value)} 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>NIK</Label>
                     <Input 
                       value={formData.nikWali || ""} 
                       maxLength={16}
                       placeholder="Masukkan NIK Wali" 
                       onChange={(e) => handleInputChange("nikWali", e.target.value.replace(/\D/g, ''))} 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Pekerjaan</Label>
                     <select
                       value={formData.pekerjaan_id_wali || ""}
                       onChange={(e) => {
                         const opt = (refOptions?.pekerjaan || []).find((p: any) => String(p.pekerjaan_id || p.id) === e.target.value);
                         setFormData((prev: any) => ({
                           ...prev,
                           pekerjaan_id_wali: e.target.value,
                           pekerjaanWali: opt?.nama || opt?.pekerjaan || ""
                         }));
                       }}
                       className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                     >
                       <option value="">Pilih Pekerjaan</option>
                       {(refOptions?.pekerjaan || []).map((p: any) => (
                         <option key={p.pekerjaan_id || p.id} value={p.pekerjaan_id || p.id}>{p.nama || p.pekerjaan}</option>
                       ))}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label>Tahun Lahir</Label>
                     <Input 
                       type="number" 
                       value={formData.tahunLahirWali || ""} 
                       placeholder="Masukkan Tahun Lahir Wali" 
                       onChange={(e) => handleInputChange("tahunLahirWali", e.target.value)} 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Pendidikan</Label>
                     <select
                       value={formData.jenjang_pendidikan_wali || ""}
                       onChange={(e) => {
                         const opt = (refOptions?.jenjang_pendidikan || []).find((p: any) => String(p.jenjang_pendidikan_id || p.id) === e.target.value);
                         setFormData((prev: any) => ({
                           ...prev,
                           jenjang_pendidikan_wali: e.target.value,
                           jenjangPendidikanWali: opt?.nama || opt?.jenjang_pendidikan || ""
                         }));
                       }}
                       className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                     >
                       <option value="">Pilih Pendidikan</option>
                       {(refOptions?.jenjang_pendidikan || []).map((p: any) => (
                         <option key={p.jenjang_pendidikan_id || p.id} value={p.jenjang_pendidikan_id || p.id}>{p.nama || p.jenjang_pendidikan}</option>
                       ))}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label>Penghasilan</Label>
                     <select
                       value={formData.penghasilan_id_wali || ""}
                       onChange={(e) => {
                         const opt = (refOptions?.penghasilan || []).find((p: any) => String(p.penghasilan_id || p.id) === e.target.value);
                         setFormData((prev: any) => ({
                           ...prev,
                           penghasilan_id_wali: e.target.value,
                           penghasilanWali: opt?.nama || opt?.penghasilan || ""
                         }));
                       }}
                       className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                     >
                       <option value="">Pilih Penghasilan</option>
                       {(refOptions?.penghasilan || []).map((p: any) => (
                         <option key={p.penghasilan_id || p.id} value={p.penghasilan_id || p.id}>{p.nama || p.penghasilan}</option>
                       ))}
                     </select>
                   </div>
                 </div>
               ) : (
                 <div className="p-4 text-center rounded-xl bg-gray-50/50 dark:bg-white/[0.01] border border-dashed border-gray-200 dark:border-gray-800 text-sm text-gray-500 italic">
                   Peserta didik tidak punya wali
                 </div>
               )}
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


      </div>

      {/* Modal Checklist Pengajuan Perbaikan */}
      <Modal isOpen={isPengajuanModalOpen} onClose={() => setIsPengajuanModalOpen(false)} className="max-w-[600px] p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-white/[0.05] pb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Pilih Data Siswa yang Ingin Diperbaiki</h3>
          <button onClick={() => setIsPengajuanModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
          {Object.keys(FIELD_MAP_SISWA)
            .filter((key) => {
              const allowedKeys = [
                "nama", "jenis_kelamin", "nik", "tempat_lahir", "tanggal_lahir", "nama_ibu_kandung"
              ];
              return allowedKeys.includes(key);
            })
            .map((key) => {
              const field = FIELD_MAP_SISWA[key];
              const isChecked = selectedFields.includes(key);
              return (
                <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleFieldToggle(key)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 size-4"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
                </label>
              );
            })}
        </div>
        <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 dark:border-white/[0.05] pt-4">
          <button
            onClick={() => setIsPengajuanModalOpen(false)}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Batal
          </button>
          <Button variant="primary" onClick={handleStartPerbaikan}>
            Mulai Perbaikan
          </Button>
        </div>
      </Modal>

      {/* Modal Form Pengajuan Perbaikan Side-by-Side */}
      <Modal isOpen={isFormPengajuanOpen} onClose={() => setIsFormPengajuanOpen(false)} className="max-w-[800px] p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-white/[0.05] pb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Formulir Pengajuan Perbaikan Data Siswa</h3>
          <button onClick={() => setIsFormPengajuanOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2 p-1">
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 border-b pb-2">
            <div>Data Sebelumnya</div>
            <div>Data yang Diajukan</div>
          </div>
          {selectedFields.map((fieldKey) => {
            const field = FIELD_MAP_SISWA[fieldKey];
            if (!field) return null;

            let oldVal = "";
            if (fieldKey === "lintang_bujur") {
              oldVal = `Lintang: ${formData.lintang || "-"}, Bujur: ${formData.bujur || "-"}`;
            } else if (fieldKey === "wilayah") {
              oldVal = `${formData.provinsi || "-"} / ${formData.kabupaten || "-"} / ${formData.kecamatan || "-"} / ${formData.desaKelurahan || "-"}`;
            } else if (fieldKey === "jarak_sekolah") {
              oldVal = `Jarak: ${formData.jarakRumah || "-"} m / ${formData.jarakRumahKm || "-"} km`;
            } else if (fieldKey === "waktu_tempuh") {
              oldVal = `Waktu Tempuh: ${formData.waktuTempuh || "-"} jam ${formData.menitTempuh || "-"} menit`;
            } else if (fieldKey === "data_orang_tua") {
              oldVal = `Ayah: ${formData.namaAyah || "-"} (NIK: ${formData.nikAyah || "-"}), Ibu: ${formData.namaIbu || "-"} (NIK: ${formData.nikIbu || "-"})`;
            } else if (fieldKey === "data_wali") {
              oldVal = formData.isWali 
                ? `Wali: ${formData.namaWali || "-"} (NIK: ${formData.nikWali || "-"})` 
                : "Tidak ada wali";
            } else {
              oldVal = formData[field.localKey] || "-";
              if (fieldKey === "jenis_kelamin") {
                oldVal = formData.jk === "L" ? "Laki-laki" : formData.jk === "P" ? "Perempuan" : formData.jk || "-";
              } else if (fieldKey === "agama_id") {
                oldVal = formData.agama || "-";
              } else if (fieldKey === "tempat_tinggal") {
                oldVal = formData.jenisTinggal || "-";
              } else if (fieldKey === "transportasi") {
                oldVal = formData.alatTransportasi || "-";
              }
            }

            return (
              <div key={fieldKey} className="grid grid-cols-2 gap-4 items-start border-b border-gray-50 dark:border-white/[0.01] pb-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{field.label}</label>
                  <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-400 min-h-[45px] flex items-center">
                    {oldVal}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{field.label} Baru</label>
                  {fieldKey === "jenis_kelamin" ? (
                    <select
                      value={pengajuanForm[fieldKey] || ""}
                      onChange={(e) => handlePengajuanInputChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  ) : fieldKey === "agama_id" ? (
                    <select
                      value={pengajuanForm[fieldKey] || ""}
                      onChange={(e) => handlePengajuanInputChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                    >
                      <option value="">Pilih Agama</option>
                      {(refOptions?.agama || refOptions?.mst_agama || [
                        { agama_id: 1, nama: "Islam" },
                        { agama_id: 2, nama: "Kristen" },
                        { agama_id: 3, nama: "Katolik" },
                        { agama_id: 4, nama: "Hindu" },
                        { agama_id: 5, nama: "Buddha" },
                        { agama_id: 6, nama: "Khonghucu" }
                      ]).map((r: any) => (
                        <option key={r.agama_id || r.id} value={r.agama_id || r.id}>
                          {r.nama || r.nama_agama || r.agama_nama}
                        </option>
                      ))}
                    </select>
                  ) : fieldKey === "tempat_tinggal" ? (
                    <select
                      value={pengajuanForm[fieldKey] || ""}
                      onChange={(e) => handlePengajuanInputChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                    >
                      <option value="">Pilih Tempat Tinggal</option>
                      {(refOptions?.jenis_tinggal || refOptions?.mst_jenis_tinggal || []).map((t: any) => (
                        <option key={t.jenis_tinggal_id || t.id} value={t.jenis_tinggal_id || t.id}>
                          {t.nama || t.jenis_tinggal_nama || t.nama_jenis_tinggal}
                        </option>
                      ))}
                    </select>
                  ) : fieldKey === "transportasi" ? (
                    <select
                      value={pengajuanForm[fieldKey] || ""}
                      onChange={(e) => handlePengajuanInputChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                    >
                      <option value="">Pilih Alat Transportasi</option>
                      {(refOptions?.alat_transportasi || refOptions?.mst_alat_transportasi || []).map((t: any) => (
                        <option key={t.alat_transportasi_id || t.id} value={t.alat_transportasi_id || t.id}>
                          {t.nama || t.alat_transportasi_nama || t.nama_alat_transportasi}
                        </option>
                      ))}
                    </select>
                  ) : fieldKey === "wilayah" ? (
                    <div className="space-y-2">
                      <select
                        value={pengajuanForm._provinsi_code || ""}
                        onChange={(e) => {
                          const code = e.target.value;
                          const name = provinces.find((p: any) => p.kode_wilayah === code)?.nama || "";
                          handleProvinceChange(name, code);
                        }}
                        className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map((p: any) => (
                          <option key={p.kode_wilayah} value={p.kode_wilayah}>
                            {p.nama}
                          </option>
                        ))}
                      </select>

                      <select
                        value={pengajuanForm._kabupaten_code || ""}
                        onChange={(e) => {
                          const code = e.target.value;
                          const name = kabupatens.find((k: any) => k.kode_wilayah === code)?.nama || "";
                          handleKabupatenChange(name, code);
                        }}
                        disabled={!pengajuanForm.provinsi}
                        className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none disabled:opacity-50"
                      >
                        <option value="">Pilih Kabupaten/Kota</option>
                        {kabupatens.map((k: any) => (
                          <option key={k.kode_wilayah} value={k.kode_wilayah}>
                            {k.nama}
                          </option>
                        ))}
                      </select>

                      <select
                        value={pengajuanForm.kecamatan || ""}
                        onChange={(e) => {
                          const code = e.target.value;
                          const name = kecamatans.find((kec: any) => kec.kode_wilayah === code)?.nama || "";
                          handleKecamatanChange(name, code);
                        }}
                        disabled={!pengajuanForm.kabupaten_kota}
                        className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none disabled:opacity-50"
                      >
                        <option value="">Pilih Kecamatan</option>
                        {kecamatans.map((kec: any) => (
                          <option key={kec.kode_wilayah} value={kec.kode_wilayah}>
                            {kec.nama}
                          </option>
                        ))}
                      </select>

                      <select
                        value={pengajuanForm.desa_kelurahan || ""}
                        onChange={(e) => {
                          const code = e.target.value;
                          const opt = e.target.options[e.target.selectedIndex];
                          const name = opt.text || "";
                          handleDesaChange(name, code);
                        }}
                        disabled={!pengajuanForm.kecamatan}
                        className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none disabled:opacity-50"
                      >
                        <option value="">Pilih Desa/Kelurahan</option>
                        {desas.map((d: any) => (
                          <option key={d.kode_wilayah} value={d.kode_wilayah}>
                            {d.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : fieldKey === "lintang_bujur" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={pengajuanForm.lintang || ""}
                        onChange={(e) => handlePengajuanInputChange("lintang", e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                        placeholder="Lintang"
                      />
                      <input
                        type="text"
                        value={pengajuanForm.bujur || ""}
                        onChange={(e) => handlePengajuanInputChange("bujur", e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                        placeholder="Bujur"
                      />
                    </div>
                  ) : fieldKey === "jarak_sekolah" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400">Jarak (meter)</span>
                        <input
                          type="number"
                          value={pengajuanForm.jarak_rumah_ke_sekolah || ""}
                          onChange={(e) => handlePengajuanInputChange("jarak_rumah_ke_sekolah", e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                          placeholder="Jarak dalam meter"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400">Jarak (km)</span>
                        <input
                          type="number"
                          value={pengajuanForm.jarak_rumah_ke_sekolah_km || ""}
                          onChange={(e) => handlePengajuanInputChange("jarak_rumah_ke_sekolah_km", e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                          placeholder="Jarak dalam KM"
                        />
                      </div>
                    </div>
                  ) : fieldKey === "waktu_tempuh" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400">Waktu Tempuh (jam)</span>
                        <input
                          type="number"
                          value={pengajuanForm.waktu_tempuh_ke_sekolah || ""}
                          onChange={(e) => handlePengajuanInputChange("waktu_tempuh_ke_sekolah", e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                          placeholder="Jam"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400">Waktu Tempuh (menit)</span>
                        <input
                          type="number"
                          value={pengajuanForm.menit_tempuh_ke_sekolah || ""}
                          onChange={(e) => handlePengajuanInputChange("menit_tempuh_ke_sekolah", e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                          placeholder="Menit"
                        />
                      </div>
                    </div>
                  ) : fieldKey === "data_orang_tua" ? (
                    <div className="space-y-4 border p-3 rounded-xl dark:border-gray-800 bg-gray-50/10 dark:bg-white/[0.01]">
                      {/* Data Ayah */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-bold text-gray-700 dark:text-white/80 border-b pb-1">Data Ayah</h6>
                        <input
                          type="text"
                          value={pengajuanForm.nama_ayah || ""}
                          onChange={(e) => handlePengajuanInputChange("nama_ayah", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          placeholder="Nama Ayah"
                        />
                        <input
                          type="text"
                          value={pengajuanForm.nik_ayah || ""}
                          onChange={(e) => handlePengajuanInputChange("nik_ayah", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          placeholder="NIK Ayah"
                        />
                        <select
                          value={pengajuanForm.pekerjaan_id_ayah || ""}
                          onChange={(e) => handlePengajuanInputChange("pekerjaan_id_ayah", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                        >
                          <option value="">Pilih Pekerjaan Ayah</option>
                          {(refOptions?.pekerjaan || refOptions?.mst_pekerjaan || []).map((o: any) => (
                            <option key={o.pekerjaan_id || o.id} value={o.pekerjaan_id || o.id}>{o.nama || o.pekerjaan_nama}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={pengajuanForm.tahun_lahir_ayah || ""}
                          onChange={(e) => handlePengajuanInputChange("tahun_lahir_ayah", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          placeholder="Tahun Lahir Ayah"
                        />
                        <select
                          value={pengajuanForm.jenjang_pendidikan_ayah || ""}
                          onChange={(e) => handlePengajuanInputChange("jenjang_pendidikan_ayah", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                        >
                          <option value="">Pilih Pendidikan Ayah</option>
                          {(refOptions?.jenjang_pendidikan || refOptions?.mst_jenjang_pendidikan || []).map((o: any) => (
                            <option key={o.jenjang_pendidikan_id || o.id} value={o.jenjang_pendidikan_id || o.id}>{o.nama || o.jenjang_pendidikan_nama}</option>
                          ))}
                        </select>
                        <select
                          value={pengajuanForm.penghasilan_id_ayah || ""}
                          onChange={(e) => handlePengajuanInputChange("penghasilan_id_ayah", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                        >
                          <option value="">Pilih Penghasilan Ayah</option>
                          {(refOptions?.penghasilan || refOptions?.mst_penghasilan || []).map((o: any) => (
                            <option key={o.penghasilan_id || o.id} value={o.penghasilan_id || o.id}>{o.nama || o.penghasilan_nama}</option>
                          ))}
                        </select>
                      </div>

                      {/* Data Ibu */}
                      <div className="space-y-2 mt-4 pt-2 border-t dark:border-gray-800">
                        <h6 className="text-xs font-bold text-gray-700 dark:text-white/80 border-b pb-1">Data Ibu Kandung</h6>
                        <input
                          type="text"
                          value={pengajuanForm.nama_ibu_kandung || ""}
                          onChange={(e) => handlePengajuanInputChange("nama_ibu_kandung", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          placeholder="Nama Ibu Kandung"
                        />
                        <input
                          type="text"
                          value={pengajuanForm.nik_ibu || ""}
                          onChange={(e) => handlePengajuanInputChange("nik_ibu", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          placeholder="NIK Ibu"
                        />
                        <select
                          value={pengajuanForm.pekerjaan_id_ibu || ""}
                          onChange={(e) => handlePengajuanInputChange("pekerjaan_id_ibu", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                        >
                          <option value="">Pilih Pekerjaan Ibu</option>
                          {(refOptions?.pekerjaan || refOptions?.mst_pekerjaan || []).map((o: any) => (
                            <option key={o.pekerjaan_id || o.id} value={o.pekerjaan_id || o.id}>{o.nama || o.pekerjaan_nama}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={pengajuanForm.tahun_lahir_ibu || ""}
                          onChange={(e) => handlePengajuanInputChange("tahun_lahir_ibu", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          placeholder="Tahun Lahir Ibu"
                        />
                        <select
                          value={pengajuanForm.jenjang_pendidikan_ibu || ""}
                          onChange={(e) => handlePengajuanInputChange("jenjang_pendidikan_ibu", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                        >
                          <option value="">Pilih Pendidikan Ibu</option>
                          {(refOptions?.jenjang_pendidikan || refOptions?.mst_jenjang_pendidikan || []).map((o: any) => (
                            <option key={o.jenjang_pendidikan_id || o.id} value={o.jenjang_pendidikan_id || o.id}>{o.nama || o.jenjang_pendidikan_nama}</option>
                          ))}
                        </select>
                        <select
                          value={pengajuanForm.penghasilan_id_ibu || ""}
                          onChange={(e) => handlePengajuanInputChange("penghasilan_id_ibu", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                        >
                          <option value="">Pilih Penghasilan Ibu</option>
                          {(refOptions?.penghasilan || refOptions?.mst_penghasilan || []).map((o: any) => (
                            <option key={o.penghasilan_id || o.id} value={o.penghasilan_id || o.id}>{o.nama || o.penghasilan_nama}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : fieldKey === "data_wali" ? (
                    <div className="space-y-4 border p-3 rounded-xl dark:border-gray-800 bg-gray-50/10 dark:bg-white/[0.01]">
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Punya Wali?</span>
                        <Switch
                          label="Punya Wali?"
                          checked={pengajuanForm.is_wali || false}
                          onChange={(checked) => {
                            handlePengajuanInputChange("is_wali", checked);
                            if (!checked) {
                              handlePengajuanInputChange("nama_wali", "");
                              handlePengajuanInputChange("nik_wali", "");
                              handlePengajuanInputChange("pekerjaan_id_wali", "");
                              handlePengajuanInputChange("tahun_lahir_wali", "");
                              handlePengajuanInputChange("jenjang_pendidikan_wali", "");
                              handlePengajuanInputChange("penghasilan_id_wali", "");
                            }
                          }}
                        />
                      </div>
                      {pengajuanForm.is_wali ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={pengajuanForm.nama_wali || ""}
                            onChange={(e) => handlePengajuanInputChange("nama_wali", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                            placeholder="Nama Wali"
                          />
                          <input
                            type="text"
                            value={pengajuanForm.nik_wali || ""}
                            onChange={(e) => handlePengajuanInputChange("nik_wali", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                            placeholder="NIK Wali"
                          />
                          <select
                            value={pengajuanForm.pekerjaan_id_wali || ""}
                            onChange={(e) => handlePengajuanInputChange("pekerjaan_id_wali", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          >
                            <option value="">Pilih Pekerjaan Wali</option>
                            {(refOptions?.pekerjaan || refOptions?.mst_pekerjaan || []).map((o: any) => (
                              <option key={o.pekerjaan_id || o.id} value={o.pekerjaan_id || o.id}>{o.nama || o.pekerjaan_nama}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={pengajuanForm.tahun_lahir_wali || ""}
                            onChange={(e) => handlePengajuanInputChange("tahun_lahir_wali", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                            placeholder="Tahun Lahir Wali"
                          />
                          <select
                            value={pengajuanForm.jenjang_pendidikan_wali || ""}
                            onChange={(e) => handlePengajuanInputChange("jenjang_pendidikan_wali", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          >
                            <option value="">Pilih Pendidikan Wali</option>
                            {(refOptions?.jenjang_pendidikan || refOptions?.mst_jenjang_pendidikan || []).map((o: any) => (
                              <option key={o.jenjang_pendidikan_id || o.id} value={o.jenjang_pendidikan_id || o.id}>{o.nama || o.jenjang_pendidikan_nama}</option>
                            ))}
                          </select>
                          <select
                            value={pengajuanForm.penghasilan_id_wali || ""}
                            onChange={(e) => handlePengajuanInputChange("penghasilan_id_wali", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 rounded-lg text-xs"
                          >
                            <option value="">Pilih Penghasilan Wali</option>
                            {(refOptions?.penghasilan || refOptions?.mst_penghasilan || []).map((o: any) => (
                              <option key={o.penghasilan_id || o.id} value={o.penghasilan_id || o.id}>{o.nama || o.penghasilan_nama}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="p-2 text-center text-xs text-gray-500 italic">Peserta didik tidak punya wali</div>
                      )}
                    </div>
                  ) : (
                    <input
                      type={fieldKey === 'tanggal_lahir' ? 'date' : fieldKey === 'rt' || fieldKey === 'rw' || fieldKey === 'anak_keberapa' || fieldKey === 'tinggi_badan' || fieldKey === 'berat_badan' || fieldKey === 'lingkar_kepala' || fieldKey === 'jumlah_saudara_kandung' ? 'number' : 'text'}
                      value={pengajuanForm[fieldKey] || ""}
                      onChange={(e) => handlePengajuanInputChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                      placeholder={`Masukkan ${field.label} baru...`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 dark:border-white/[0.05] pt-4">
          <button
            onClick={() => {
              setIsFormPengajuanOpen(false);
              setIsPengajuanModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Kembali
          </button>
          <Button variant="primary" onClick={handleSubmitPengajuan} disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Pengajuan"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isCompletenessModalOpen}
        onClose={() => setIsCompletenessModalOpen(false)}
        className="max-w-md p-6"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Kolom Profil yang Belum Terisi
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Silakan lengkapi data berikut agar profil Anda mencapai 100% lengkap.
            </p>
          </div>

          <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-gray-600 dark:text-gray-400">Kelengkapan</span>
              <span className={completenessPercentage === 100 ? 'text-success-500' : completenessPercentage < 50 ? 'text-error-500' : 'text-warning-500'}>
                {completenessPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  completenessPercentage === 100 ? 'bg-success-500' : completenessPercentage < 50 ? 'bg-error-500' : 'bg-warning-500'
                }`} 
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {getEmptyFields().map((field) => (
              <div key={field.key} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-gray-800/40">
                <span className="text-gray-600 dark:text-gray-400 font-medium">{field.label}</span>
                <span className={`inline-flex items-center gap-1 font-semibold ${field.filled ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                  {field.filled ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      Terisi
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Kosong
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsCompletenessModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      <PrintPDCardPreview
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        student={selectedStudentForCard}
      />
    </>
  );
};

export default EditStudentPage;
