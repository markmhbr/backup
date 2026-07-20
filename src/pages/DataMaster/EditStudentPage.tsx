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
import imageCompression from "browser-image-compression";
import Switch from "../../components/form/switch/Switch";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Modal } from "../../components/ui/modal";
import { dapodikService } from "../../services/dapodikService";
import { getFotoUrl } from "../../utils/image";
import { loadMapScripts, initGoogleMapPicker } from "../../utils/map";
import { referenceService } from "../../services/referenceService";
import { printStudentProfile } from "../../utils/printStudentProfile";
import PrintPDCardPreview from "../../components/student/PrintPDCardPreview";
import Alert from "../../components/ui/alert/Alert";
import { PrinterIcon, EyeIcon } from "../../icons";

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
  const isOperator = role?.toLowerCase().includes("operator") || role?.toLowerCase().includes("admin");
  const backPath = isOperator ? `/${role}/student-data` : `/${role}/wali/class-data`;

  const [activeTab, setActiveTab] = useState("profil");

  const tabs = [
    { id: "profil", label: "Profil & Identitas" },
    { id: "alamat", label: "Alamat & Tempat Tinggal" },
    { id: "periodik", label: "Data Periodik" },
    { id: "orangtua", label: "Orang Tua & Wali" },
    { id: "dokumen", label: "Upload Dokumen" },
  ];

  const apiBaseUrl = import.meta.env.VITE_API_URL 
    ? (import.meta.env.VITE_API_URL.endsWith("/api") ? import.meta.env.VITE_API_URL.slice(0, -4) : import.meta.env.VITE_API_URL)
    : (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin);

  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(!!id);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalParentDataRef = useRef<any>({ ayah: {}, ibu: {} });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState<{lat: string, lng: string} | null>(null);

  const getImageSlides = () => {
    const slides: any[] = [];
    const token = localStorage.getItem('auth_token');
    studentDocTypes.forEach((docType) => {
      const existingFile = uploadedDocs.find(f => f.startsWith(docType.key));
      if (existingFile) {
        const ext = existingFile.substring(existingFile.lastIndexOf('.')).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        if (isImage) {
          let fileUrl = `${apiBaseUrl}/storage/${formData.sekolahId}/siswa/${id}/dokumen/${existingFile}?t=${Date.now()}`;
          if (token) {
            fileUrl += `&token=${token}`;
          }
          slides.push({
            src: fileUrl,
            title: docType.name,
            key: docType.key
          });
        }
      }
    });
    return slides;
  };

  const handleViewDoc = (url: string, filename: string, docKey: string) => {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    if (isImage) {
      const slides = getImageSlides();
      const idx = slides.findIndex(s => s.key === docKey);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    } else {
      let finalUrl = url;
      const token = localStorage.getItem('auth_token');
      if (token && !url.includes('token=')) {
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;
      }
      const cacheBustUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      window.open(cacheBustUrl, '_blank');
    }
  };

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
  const [errors, setErrors] = useState<any>({});

  const isWaliMode = formData?.isWali === true || formData?.isWali === 1 || formData?.isWali === '1' || !!(formData?.namaWali || formData?.nikWali);

  const hasTabError = (tabId: string) => {
    if (tabId === "profil") {
      return !!(errors.agama_id || errors.noKK || errors.noAkte || errors.anakKe || errors.noHp || errors.noWa || errors.emailAktif);
    }
    if (tabId === "alamat") {
      return !!(errors.jalan || errors.rt || errors.rw || errors.desaKelurahan || errors.provinsi || errors.kabupaten || errors.kecamatan || errors.kodePos || errors.jenisTinggalId || errors.alatTransportasiId || errors.lintang || errors.bujur);
    }
    if (tabId === "periodik") {
      return !!(errors.tinggiBadan || errors.beratBadan || errors.lingkarKepala || errors.jarakRumah || errors.waktuTempuh || errors.menitTempuh || errors.jumlahSaudara);
    }
    if (tabId === "orangtua") {
      const basicParentErr = errors.namaAyah || errors.nikAyah || errors.tahunLahirAyah || errors.jenjang_pendidikan_ayah || errors.pekerjaan_id_ayah || errors.penghasilan_id_ayah || errors.namaIbu || errors.nikIbu || errors.tahunLahirIbu || errors.jenjang_pendidikan_ibu || errors.pekerjaan_id_ibu || errors.penghasilan_id_ibu;
      if (isWaliMode) {
        return !!(basicParentErr || errors.namaWali || errors.nikWali || errors.tahunLahirWali || errors.jenjang_pendidikan_wali || errors.pekerjaan_id_wali || errors.penghasilan_id_wali);
      }
      return !!basicParentErr;
    }
    return false;
  };

  const getEmptyFields = () => {
    if (!formData || !formData.nama) return [];
    
    const requiredFields = [
      { key: 'nama', label: 'Nama Lengkap' },
      { key: 'jk', label: 'Jenis Kelamin' },
      { key: 'nik', label: 'NIK' },
      { key: 'tempatLahir', label: 'Tempat Lahir' },
      { key: 'tanggalLahir', label: 'Tanggal Lahir' },
      { key: 'agama_id', label: 'Agama' },
      { key: 'noKK', label: 'No. Kartu Keluarga' },
      { key: 'noAkte', label: 'Register Akta Lahir' },
      { key: 'anakKe', label: 'Anak ke-' },
      { key: 'noHp', label: 'Nomor HP' },
      { key: 'noWa', label: 'Nomor WhatsApp' },
      { key: 'emailAktif', label: 'Email Aktif' },
      { key: 'jalan', label: 'Alamat Jalan' },
      { key: 'rt', label: 'RT' },
      { key: 'rw', label: 'RW' },
      { key: 'desaKelurahan', label: 'Desa/Kelurahan' },
      { key: 'provinsi', label: 'Provinsi' },
      { key: 'kabupaten', label: 'Kabupaten/Kota' },
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
      { key: 'penghasilan_id_wali', label: 'Penghasilan Wali' },
      { key: 'doc_ijazah', label: 'Dokumen Ijazah Sekolah Asal' },
      { key: 'doc_kk', label: 'Dokumen Kartu Keluarga' },
      { key: 'doc_akta', label: 'Dokumen Akta Kelahiran' },
      { key: 'doc_ktp_ayah', label: 'Dokumen KTP Ayah' },
      { key: 'doc_ktp_ibu', label: 'Dokumen KTP Ibu' }
    ];

    const checkFilled = (field: any) => {
      if (field.key.startsWith('doc_')) {
        const docKey = field.key === 'doc_ijazah' ? 'ijazah_sekolah_asal'
                     : field.key === 'doc_kk' ? 'kartu_keluarga'
                     : field.key === 'doc_akta' ? 'akta_kelahiran'
                     : field.key === 'doc_ktp_ayah' ? 'ktp_ayah'
                     : 'ktp_ibu';
        return uploadedDocs.some(f => f.startsWith(docKey));
      }

      if (field.key === 'provinsi' || field.key === 'kabupaten' || field.key === 'kecamatan') {
        const desa = formData['desaKelurahan'] || formData['desaKelurahanCode'];
        const prov = formData['provinsi'];
        const kab = formData['kabupaten'] || formData['kabupatenName'];
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
          const rawData = val?.data || val || null;
          if (rawData && Array.isArray(rawData.jenjang_pendidikan)) {
            rawData.jenjang_pendidikan = [...rawData.jenjang_pendidikan].sort((a: any, b: any) => {
              const idA = Number(a.jenjang_pendidikan_id || a.id || 0);
              const idB = Number(b.jenjang_pendidikan_id || b.id || 0);
              return idA - idB;
            });
          }
          setRefOptions(rawData);
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
    handleInputChange("kecamatanName", "");
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
    handleInputChange("kecamatanName", "");
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

          // Concurrent fetch for address hierarchy
          const [kabRes, kecRes, desaRes] = await Promise.all([
            referenceService.getWilayah(2, provCode),
            referenceService.getWilayah(3, kabCode),
            referenceService.getWilayah(4, kecCode)
          ]);

          setAddrKabupatens(kabRes?.data || kabRes || []);
          setAddrKecamatans(kecRes?.data || kecRes || []);
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
    setIsPengajuanModalOpen(true);
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
        timer: 2000,
        showConfirmButton: false
      });
      setIsFormPengajuanOpen(false);
      setSelectedFields([]);
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Gagal mengirim pengajuan perbaikan data",
        icon: "error",
        timer: 2500,
        showConfirmButton: false
      });
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
              avatar: data.foto ? `${data.foto}${data.foto.includes('?') ? '&' : '?'}t=${Date.now()}` : "",
              jalan: data.alamat_jalan || "",
              dusun: data.nama_dusun || "",
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
              status_hidup_ayah: data.status_hidup_ayah !== null && data.status_hidup_ayah !== undefined ? Number(data.status_hidup_ayah) : 0,
              status_hidup_ibu: data.status_hidup_ibu !== null && data.status_hidup_ibu !== undefined ? Number(data.status_hidup_ibu) : 0,
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
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: false }));
    }
  };

  const handleStatusHidupChange = (parent: "ayah" | "ibu", status: "hidup" | "wafat") => {
    const isAyah = parent === "ayah";
    const pekerjaanKey = isAyah ? "pekerjaan_id_ayah" : "pekerjaan_id_ibu";
    const pekerjaanNamaKey = isAyah ? "pekerjaanAyah" : "pekerjaanIbu";
    const penghasilanKey = isAyah ? "penghasilan_id_ayah" : "penghasilan_id_ibu";
    const penghasilanNamaKey = isAyah ? "penghasilanAyah" : "penghasilanIbu";
    const kebutuhanKey = isAyah ? "kebutuhan_khusus_id_ayah" : "kebutuhan_khusus_id_ibu";
    const kebutuhanNamaKey = isAyah ? "kebutuhanKhususAyah" : "kebutuhanKhususIbu";

    setFormData((prev: any) => {
      const isAyah = parent === "ayah";
      const pendidikanKey = isAyah ? "jenjang_pendidikan_ayah" : "jenjang_pendidikan_ibu";
      const pendidikanNamaKey = isAyah ? "pendidikanAyah" : "pendidikanIbu";

      const statusHidupKey = isAyah ? "status_hidup_ayah" : "status_hidup_ibu";
      const isCurrentlyWafat = prev[statusHidupKey] === 1;

      if (status === "wafat") {
        if (!isCurrentlyWafat) {
          originalParentDataRef.current[parent] = {
            pekerjaan_id: prev[pekerjaanKey] || "",
            pekerjaanNama: prev[pekerjaanNamaKey] || "",
            penghasilan_id: prev[penghasilanKey] || "",
            penghasilanNama: prev[penghasilanNamaKey] || "",
            kebutuhan_id: prev[kebutuhanKey] || 0,
            kebutuhanNama: prev[kebutuhanNamaKey] || "",
            pendidikan_id: prev[pendidikanKey] || "",
            pendidikanNama: prev[pendidikanNamaKey] || "",
          };
        }

        const pekerjaanOpt = (refOptions?.pekerjaan || []).find((p: any) => String(p.pekerjaan_id || p.id) === "1");
        const pekerjaanNama = pekerjaanOpt?.nama || pekerjaanOpt?.pekerjaan || "Tidak bekerja";

        const penghasilanOpt = (refOptions?.penghasilan || []).find((p: any) => String(p.penghasilan_id || p.id) === "99");
        const penghasilanNama = penghasilanOpt?.nama || penghasilanOpt?.penghasilan || "Tidak memiliki penghasilan";

        const pendidikanOpt = (refOptions?.jenjang_pendidikan || []).find((p: any) => String(p.jenjang_pendidikan_id || p.id) === "0");
        const pendidikanNama = pendidikanOpt?.nama || pendidikanOpt?.jenjang_pendidikan || "Tidak sekolah";

        return {
          ...prev,
          [statusHidupKey]: 1,
          [pekerjaanKey]: "1",
          [pekerjaanNamaKey]: pekerjaanNama,
          [penghasilanKey]: "99",
          [penghasilanNamaKey]: penghasilanNama,
          [kebutuhanKey]: 0,
          [kebutuhanNamaKey]: "Tidak ada",
          [pendidikanKey]: "0",
          [pendidikanNamaKey]: pendidikanNama,
        };
      } else {
        const backup = originalParentDataRef.current[parent] || {};
        return {
          ...prev,
          [statusHidupKey]: 0,
          [pekerjaanKey]: backup.pekerjaan_id || "",
          [pekerjaanNamaKey]: backup.pekerjaanNama || "",
          [penghasilanKey]: backup.penghasilan_id || "",
          [penghasilanNamaKey]: backup.penghasilanNama || "",
          [kebutuhanKey]: backup.kebutuhan_id || 0,
          [kebutuhanNamaKey]: backup.kebutuhanNama || "Tidak ada",
          [pendidikanKey]: backup.pendidikan_id || "",
          [pendidikanNamaKey]: backup.pendidikanNama || "",
        };
      }
    });

    const nikKey = isAyah ? "nikAyah" : "nikIbu";
    const tahunLahirKey = isAyah ? "tahunLahirAyah" : "tahunLahirIbu";
    
    setErrors((prev: any) => ({
      ...prev,
      [nikKey]: false,
      [tahunLahirKey]: false,
      [pekerjaanKey]: false,
      [penghasilanKey]: false,
    }));
  };

  const compressImage = async (file: File, maxSizeBytes: number): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return file;
    }
    const options = {
      maxSizeMB: maxSizeBytes / (1024 * 1024),
      maxWidthOrHeight: maxSizeBytes > 200 * 1024 ? 2048 : 1600, // 2048px untuk foto 500Kb, 1600px untuk dokumen 100Kb
      useWebWorker: true,
      initialQuality: 0.95, // Kualitas awal tinggi agar tidak blur/pecah
    };
    try {
      const compressedBlob = await imageCompression(file, options);
      return new File([compressedBlob], file.name.substring(0, file.name.lastIndexOf('.')) + '.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
    } catch (error) {
      console.error("Gagal melakukan kompresi gambar:", error);
      return file;
    }
  };

  const handleDownloadDoc = async (url: string, filename: string) => {
    Swal.fire({
      title: "Mengunduh...",
      text: "Sedang mengunduh file dokumen",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    try {
      const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const response = await fetch(cacheBustUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      Swal.close();
    } catch (error) {
      Swal.close();
      const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      window.open(cacheBustUrl, '_blank');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (file && id) {
      if (file.size > 500 * 1024) {
        Swal.fire({
          title: "Mengompres Foto...",
          text: "Ukuran foto melebihi 500Kb. Sedang mengompres foto otomatis...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        file = await compressImage(file, 500 * 1024);
        Swal.close();
      }
      
      if (file.size > 500 * 1024) {
        Swal.fire({ title: "File Terlalu Besar", text: "Ukuran foto maksimal adalah 500Kb", icon: "error", confirmButtonColor: "#465FFF" });
        return;
      }
      
      setLoading(true);
      try {
        const result = await dapodikService.uploadSiswaFoto(id, file);
        if (result.status === "success" && result.data) {
          const relativePath = result.data.filePath;
          const host = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin);
          const fullUrl = `${host}${relativePath}?t=${Date.now()}`;
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
    
    let fileToUpload = file;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const maxSize = 200 * 1024; // 200KB
    
    if (ext !== '.pdf') {
      Swal.fire({
        title: "Format Berkas Salah",
        text: "Hanya berkas format PDF yang diperbolehkan untuk diunggah.",
        icon: "error",
        confirmButtonColor: "#465FFF",
      });
      return;
    }

    if (fileToUpload.size > maxSize) {
      Swal.fire({
        title: "Berkas PDF Terlalu Besar",
        text: `Ukuran berkas PDF Anda (${(fileToUpload.size / 1024).toFixed(1)}Kb) melebihi batas maksimal 200Kb. Harap kompres berkas PDF Anda terlebih dahulu sebelum mengunggah.`,
        icon: "error",
        confirmButtonColor: "#465FFF",
      });
      return;
    }

    setLoading(true);
    try {
      await dapodikService.uploadSiswaDokumen(id, fileToUpload, docName);
      
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
      Swal.fire({ title: "Berhasil", text: `Dokumen "${docLabel}" berhasil dihapus`, icon: "success", confirmButtonColor: "#465FFF" });
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Gagal menghapus dokumen", "error");
    } finally {
      setLoading(false);
    }
  };



  const handleCheckCoordinates = () => {
    setIsMapModalOpen(true);
    setTimeout(() => {
      loadMapScripts(() => initMap());
    }, 100);
  };

  const initMap = () => {
    const initialLat = parseFloat(formData.lintang || "-6.200000");
    const initialLng = parseFloat(formData.bujur || "106.816666");

    initGoogleMapPicker({
      containerId: "map-picker-container",
      initialLat,
      initialLng,
      onCoordsChange: (coords) => setTempCoords(coords),
    });
  };

  const handleUseLocation = () => {
    if (tempCoords) {
      handleInputChange("lintang", tempCoords.lat);
      handleInputChange("bujur", tempCoords.lng);
    }
    setIsMapModalOpen(false);
  };

  useEffect(() => {
    if (isMapModalOpen) {
      setTimeout(initMap, 200);
    }
  }, [isMapModalOpen]);

  const handleSave = async () => {
    if (!id) return;

    // --- Validation ---
    const newErrors: any = {};
    const v = (key: string) => {
      const val = formData[key];
      const isZeroAllowed = [
        "jumlahSaudara",
        "waktuTempuh",
        "menitTempuh",
        "jarakRumahKm",
        "lingkarKepala",
        "tahunLahirAyah",
        "tahunLahirIbu"
      ].includes(key);

      if (isZeroAllowed && (val === 0 || val === "0" || (typeof val === "string" && val.trim() === "0"))) {
        return false;
      }
      return !val || String(val).trim() === "" || String(val).trim() === "-" || String(val).trim() === "0";
    };

    // Profil
    if (v("agama_id")) newErrors.agama_id = true;
    if (v("noKK")) newErrors.noKK = true;
    if (v("noAkte")) newErrors.noAkte = true;
    if (v("anakKe")) newErrors.anakKe = true;
    if (v("noHp")) newErrors.noHp = true;
    if (v("noWa")) newErrors.noWa = true;
    if (v("emailAktif")) newErrors.emailAktif = true;
    if (v("noTelpRumah")) newErrors.noTelpRumah = true;

    // Alamat
    if (v("jalan")) newErrors.jalan = true;
    if (v("rt")) newErrors.rt = true;
    if (v("rw")) newErrors.rw = true;
    if (v("provinsi")) newErrors.provinsi = true;
    if (v("kabupaten")) newErrors.kabupaten = true;
    if (!formData.kecamatan && !formData.kecamatanName) newErrors.kecamatan = true;
    if (!formData.desaKelurahan && !formData.desaKelurahanCode) newErrors.desaKelurahan = true;
    if (v("kodePos")) newErrors.kodePos = true;
    if (!formData.jenis_tinggal_id && !formData.jenisTinggalId) newErrors.jenisTinggalId = true;
    if (!formData.alat_transportasi_id && !formData.alatTransportasiId) newErrors.alatTransportasiId = true;
    if (v("lintang")) newErrors.lintang = true;
    if (v("bujur")) newErrors.bujur = true;

    // Periodik
    if (v("tinggiBadan")) newErrors.tinggiBadan = true;
    if (v("beratBadan")) newErrors.beratBadan = true;
    if (v("lingkarKepala")) newErrors.lingkarKepala = true;
    if (v("jarakRumah")) newErrors.jarakRumah = true;
    if (String(formData.jarakRumah) === "2") {
      const kmVal = Number(formData.jarakRumahKm);
      if (!formData.jarakRumahKm || isNaN(kmVal) || kmVal <= 0) {
        newErrors.jarakRumahKm = true;
      }
    }
    if (v("waktuTempuh")) newErrors.waktuTempuh = true;
    if (v("menitTempuh")) newErrors.menitTempuh = true;
    if (v("jumlahSaudara")) newErrors.jumlahSaudara = true;
    if (v("idHobby")) newErrors.idHobby = true;
    if (v("idCita")) newErrors.idCita = true;

    // Orang Tua - Ayah
    const isAyahWafat = formData.status_hidup_ayah === 1;
    if (v("namaAyah")) newErrors.namaAyah = true;
    if (!isAyahWafat) {
      if (v("nikAyah")) newErrors.nikAyah = true;
      if (v("tahunLahirAyah")) newErrors.tahunLahirAyah = true;
      if (v("pekerjaan_id_ayah")) newErrors.pekerjaan_id_ayah = true;
      if (v("jenjang_pendidikan_ayah")) newErrors.jenjang_pendidikan_ayah = true;
      if (v("penghasilan_id_ayah")) newErrors.penghasilan_id_ayah = true;
    }

    // Orang Tua - Ibu
    const isIbuWafat = formData.status_hidup_ibu === 1;
    if (!isIbuWafat) {
      if (v("nikIbu")) newErrors.nikIbu = true;
      if (v("tahunLahirIbu")) newErrors.tahunLahirIbu = true;
      if (v("pekerjaan_id_ibu")) newErrors.pekerjaan_id_ibu = true;
      if (v("jenjang_pendidikan_ibu")) newErrors.jenjang_pendidikan_ibu = true;
      if (v("penghasilan_id_ibu")) newErrors.penghasilan_id_ibu = true;
    }

    // Wali (only if isWali)
    if (isWaliMode) {
      if (v("namaWali")) newErrors.namaWali = true;
      if (v("nikWali")) newErrors.nikWali = true;
      if (v("tahunLahirWali")) newErrors.tahunLahirWali = true;
      if (v("pekerjaan_id_wali")) newErrors.pekerjaan_id_wali = true;
      if (v("jenjang_pendidikan_wali")) newErrors.jenjang_pendidikan_wali = true;
      if (v("penghasilan_id_wali")) newErrors.penghasilan_id_wali = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Determine which tab to switch to
      if (newErrors.agama_id || newErrors.noKK || newErrors.noAkte || newErrors.anakKe || newErrors.noHp || newErrors.noWa || newErrors.emailAktif || newErrors.noTelpRumah) {
        setActiveTab("profil");
      } else if (newErrors.jalan || newErrors.rt || newErrors.rw || newErrors.provinsi || newErrors.kabupaten || newErrors.kecamatan || newErrors.desaKelurahan || newErrors.kodePos || newErrors.jenisTinggalId || newErrors.alatTransportasiId || newErrors.lintang || newErrors.bujur) {
        setActiveTab("alamat");
      } else if (newErrors.tinggiBadan || newErrors.beratBadan || newErrors.lingkarKepala || newErrors.jarakRumah || newErrors.jarakRumahKm || newErrors.waktuTempuh || newErrors.menitTempuh || newErrors.jumlahSaudara || newErrors.idHobby || newErrors.idCita) {
        setActiveTab("periodik");
      } else {
        setActiveTab("orangtua");
      }

      Swal.fire({
        title: "Validasi Gagal",
        text: `Terdapat ${Object.keys(newErrors).length} kolom wajib yang belum diisi. Silakan lengkapi data yang ditandai merah.`,
        icon: "error",
        confirmButtonColor: "#465FFF"
      });
      return;
    }

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
        nama_dusun: formData.dusun || null,
        rt: sanitizeRtRw(formData.rt),
        rw: sanitizeRtRw(formData.rw),
        provinsi: formData.provinsi,
        kabupaten_kota: formData.kabupaten,
        kecamatan: formData.kecamatan,
        desa_kelurahan: formData.desaKelurahan,
        kode_pos: formData.kodePos,
        jenis_tinggal_id: formData.jenis_tinggal_id || formData.jenisTinggalId || null,
        alat_transportasi_id: formData.alat_transportasi_id || formData.alatTransportasiId || null,
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
        timer: 2000,
        showConfirmButton: false,
      });
      if (!profileId) {
        navigate(backPath);
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Gagal menyimpan data",
        icon: "error",
        timer: 2500,
        showConfirmButton: false,
      });
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

  // Completeness warning banner configurations
  const getBannerConfig = () => {
    const pct = completenessPercentage;
    if (pct < 80) {
      return {
        container: "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10",
        iconContainer: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
        titleClass: "text-red-800 dark:text-red-300",
        descClass: "text-red-700 dark:text-red-400",
        btnClass: "bg-red-600 hover:bg-red-700 active:bg-red-800",
        title: `Persentase Kelengkapan Profil Anda: ${pct}% (Belum Lengkap)`,
        desc: `Terdapat ${emptyCount} kolom wajib yang masih belum terisi di profil Anda. Klik tombol di kanan untuk melihat kolom yang kosong.`,
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    } else if (pct < 100) {
      return {
        container: "border-warning-200 bg-warning-50 dark:border-warning-900/30 dark:bg-warning-900/10",
        iconContainer: "bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400",
        titleClass: "text-warning-800 dark:text-warning-300",
        descClass: "text-warning-700 dark:text-warning-400",
        btnClass: "bg-warning-600 hover:bg-warning-700 active:bg-warning-800",
        title: `Persentase Kelengkapan Profil Anda: ${pct}% (Hampir Lengkap)`,
        desc: `Terdapat ${emptyCount} kolom wajib yang masih belum terisi di profil Anda. Klik tombol di kanan untuk melihat kolom yang kosong.`,
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      };
    } else {
      return {
        container: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10",
        iconContainer: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
        titleClass: "text-emerald-800 dark:text-emerald-300",
        descClass: "text-emerald-700 dark:text-emerald-400",
        btnClass: "",
        title: "Persentase Kelengkapan Profil Anda: 100% (Lengkap)",
        desc: "Selamat! Profil Anda telah terisi lengkap 100%.",
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }
  };

  const banner = getBannerConfig();

  const isAyahWafat = formData.status_hidup_ayah === 1;
  const isIbuWafat = formData.status_hidup_ibu === 1;

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
                onClick={() => navigate(backPath)}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(backPath)}
              >
                Batal
              </Button>
            )}
            <Button
              variant="error-outline"
              size="sm"
              onClick={handlePrintBiodata}
              startIcon={<PrinterIcon className="size-4" />}
            >
              Cetak Biodata
            </Button>
            <Button
              variant="info-outline"
              size="sm"
              onClick={handlePrintCard}
              startIcon={<EyeIcon className="size-4 fill-current" />}
            >
              Kartu ID
            </Button>
            <Button
              variant="warning-outline"
              size="sm"
              onClick={handleCheckPengajuan}
            >
              Pengajuan Perbaikan
            </Button>
            <Button variant="primary-outline" size="sm" onClick={handleSave} disabled={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </div>

        {profileId && (
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shadow-sm ${banner.container}`}>
            <div className="flex gap-4">
              <div className={`p-2.5 rounded-xl self-start ${banner.iconContainer}`}>
                {banner.icon}
              </div>
              <div>
                <h4 className={`font-bold text-base ${banner.titleClass}`}>
                  {banner.title}
                </h4>
                <p className={`text-sm mt-1 ${banner.descClass}`}>
                  {banner.desc}
                </p>
              </div>
            </div>
            {emptyCount > 0 && (
              <button
                type="button"
                onClick={() => setIsCompletenessModalOpen(true)}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-sm whitespace-nowrap self-start sm:self-center ${banner.btnClass}`}
              >
                Lihat Kolom Kosong
              </button>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar whitespace-nowrap no-print mb-6">
          {tabs.map((tab) => {
            const hasError = hasTabError(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors duration-200 border-b-2 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-500"
                    : hasError
                    ? "border-transparent text-red-500 hover:text-red-600 font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
                {hasError && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stacked Cards Layout */}
        <div className="space-y-6">
          
          {/* Card 1: Profil */}
          <div style={{ display: activeTab === "profil" ? "block" : "none" }}>
            <div className={`rounded-2xl border ${hasTabError("profil") ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Profil & Identitas
              </h4>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Photo Upload area */}
              <div className="w-full lg:w-1/4 flex flex-col items-center">
                <div className="relative group">
                  <div className="w-48 h-64 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/[0.02]">
                    {formData.avatar ? (
                      <img src={getFotoUrl(formData.avatar)} alt="Profile" className="w-full h-full object-cover object-top" />
                    ) : (
                      <img src="/images/default/profile.jpg" alt="Profile Fallback" className="w-full h-full object-cover object-top opacity-60" />
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

                <div className="mt-6 w-full">
                  <div className="flex p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-400">Petunjuk Upload</h3>
                      <div className="mt-1 text-xs text-blue-800 dark:text-blue-400/80 leading-relaxed">
                        <ul className="list-disc pl-4 space-y-1 font-medium">
                          <li>Gunakan foto formal dengan latar belakang merah atau biru</li>
                          <li>Pastikan wajah terlihat jelas dan tegak lurus</li>
                          <li>Pastikan pencahayaan cukup dan tidak buram</li>
                          <li>Ukuran Foto 3 x 4 atau 4 x 6</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
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
                       <Label>No. Kartu Keluarga <span className="text-red-500">*</span></Label>
                       <Input 
                         error={errors.noKK}
                         value={formData.noKK || ""} 
                         maxLength={16}
                         placeholder="Masukkan No. Kartu Keluarga" 
                         onChange={(e) => handleInputChange("noKK", e.target.value.replace(/\D/g, ''))} 
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>No. Register Akte Lahir <span className="text-red-500">*</span></Label>
                       <Input 
                         error={errors.noAkte}
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
                        <Label>Agama <span className="text-red-500">*</span></Label>
                        <select
                          value={formData.agama_id || ""}
                          onChange={(e) => {
                            const opt = (refOptions?.agama || []).find((a: any) => String(a.agama_id || a.id) === e.target.value);
                            setFormData((prev: any) => ({
                              ...prev,
                              agama_id: e.target.value,
                              agama: opt?.nama || opt?.agama || ""
                            }));
                            if (errors.agama_id) setErrors((prev: any) => ({ ...prev, agama_id: false }));
                          }}
                          className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.agama_id ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                        >
                          <option value="">Pilih Agama</option>
                          {(refOptions?.agama || []).map((a: any, idx: number) => (
                            <option key={a.agama_id || a.id || idx} value={a.agama_id || a.id}>{a.nama || a.agama}</option>
                          ))}
                        </select>
                      </div>
                     <div className="space-y-2">
                       <Label>Anak ke- <span className="text-red-500">*</span></Label>
                       <Input 
                         type="number" 
                         error={errors.anakKe}
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
                       <Label>No. Telp. Rumah <span className="text-red-500">*</span></Label>
                       <Input 
                         error={errors.noTelpRumah}
                         value={formData.noTelpRumah || ""} 
                         placeholder="Masukkan No. Telepon Rumah" 
                         onChange={(e) => handleInputChange("noTelpRumah", e.target.value.replace(/\D/g, ''))} 
                       />
                    </div>
                    <div className="space-y-2">
                      <Label>No. Handphone <span className="text-red-500">*</span></Label>
                      <Input 
                        error={errors.noHp}
                        value={formData.noHp || ""} 
                        placeholder="Masukkan No. Handphone" 
                        onChange={(e) => handleInputChange("noHp", e.target.value.replace(/\D/g, ''))} 
                      />
                    </div>
                    <div className="space-y-2"><Label>No. Whatsapp <span className="text-red-500">*</span></Label><Input error={errors.noWa} value={formData.noWa || ""} placeholder="0812XXXXXXXX" onChange={(e) => handleInputChange("noWa", e.target.value.replace(/\D/g, ''))} /></div>
                    <div className="space-y-2"><Label>Email Aktif <span className="text-red-500">*</span></Label><Input error={errors.emailAktif} type="email" value={formData.emailAktif || ""} placeholder="nama@email.com" onChange={(e) => handleInputChange("emailAktif", e.target.value)} /></div>
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
            <div className={`rounded-2xl border ${hasTabError("alamat") ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
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
                      <Label>Jalan atau Kampung <span className="text-red-500">*</span></Label>
                      <Input 
                        error={errors.jalan}
                        value={formData.jalan || ""} 
                        placeholder="Masukkan jalan atau kampung" 
                        onChange={(e) => handleInputChange("jalan", e.target.value)} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>RT <span className="text-red-500">*</span></Label>
                        <Input 
                          error={errors.rt}
                          value={formData.rt || ""} 
                          placeholder="Masukkan RT (contoh: 001)" 
                          onChange={(e) => handleInputChange("rt", e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>RW <span className="text-red-500">*</span></Label>
                        <Input 
                          error={errors.rw}
                          value={formData.rw || ""} 
                          placeholder="Masukkan RW (contoh: 002)" 
                          onChange={(e) => handleInputChange("rw", e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Dusun</Label>
                      <Input 
                        error={errors.dusun}
                        value={formData.dusun || ""} 
                        placeholder="Masukkan Nama Dusun" 
                        onChange={(e) => handleInputChange("dusun", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provinsi <span className="text-red-500">*</span></Label>
                      <select
                        value={addrProvinces.find(p => p.nama?.trim().toLowerCase() === formData.provinsi?.trim().toLowerCase())?.kode_wilayah?.trim() || ""}
                        onChange={(e) => {
                          const code = e.target.value?.trim();
                          const name = addrProvinces.find(p => p.kode_wilayah?.trim() === code)?.nama || "";
                          handleAddrProvinceChange(code, name);
                        }}
                        className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.provinsi ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                      >
                        <option value="">{formData.provinsi || "Pilih Provinsi"}</option>
                        {addrProvinces.map((p, idx) => (
                          <option key={p.kode_wilayah?.trim() || idx} value={p.kode_wilayah?.trim()}>{p.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kab./Kota <span className="text-red-500">*</span></Label>
                      <select
                        value={addrKabupatens.find(k => k.nama?.trim().toLowerCase() === formData.kabupaten?.trim().toLowerCase())?.kode_wilayah?.trim() || ""}
                        onChange={(e) => {
                          const code = e.target.value?.trim();
                          const name = addrKabupatens.find(k => k.kode_wilayah?.trim() === code)?.nama || "";
                          handleAddrKabupatenChange(code, name);
                        }}
                        className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.kabupaten ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                        disabled={!formData.provinsi}
                      >
                        <option value="">{formData.kabupaten || "Pilih Kab./Kota"}</option>
                        {addrKabupatens.map((k, idx) => (
                          <option key={k.kode_wilayah?.trim() || idx} value={k.kode_wilayah?.trim()}>{k.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kecamatan <span className="text-red-500">*</span></Label>
                      <select
                        value={formData.kecamatan?.trim() || ""}
                        onChange={(e) => {
                          const code = e.target.value?.trim();
                          const name = addrKecamatans.find(k => k.kode_wilayah?.trim() === code)?.nama || "";
                          handleInputChange("kecamatanName", name);
                          handleAddrKecamatanChange(code);
                        }}
                        className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.kecamatan ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                        disabled={!formData.kabupaten}
                      >
                        <option value="">{formData.kecamatanName || "Pilih Kecamatan"}</option>
                        {addrKecamatans.map((k) => (
                          <option key={k.kode_wilayah?.trim()} value={k.kode_wilayah?.trim()}>{k.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Desa/Kelurahan <span className="text-red-500">*</span></Label>
                      <select
                        value={formData.desaKelurahanCode?.trim() || ""}
                        onChange={(e) => {
                          const code = e.target.value?.trim();
                          const name = addrDesas.find(d => d.kode_wilayah?.trim() === code)?.nama || "";
                          handleAddrDesaChange(code, name);
                        }}
                        className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.desaKelurahan ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                        disabled={!formData.kecamatan}
                      >
                        <option value="">{formData.desaKelurahan || "Pilih Desa/Kelurahan"}</option>
                        {addrDesas.map((d, idx) => (
                          <option key={d.kode_wilayah?.trim() || idx} value={d.kode_wilayah?.trim()}>{d.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kode Pos <span className="text-red-500">*</span></Label>
                      <Input 
                        error={errors.kodePos}
                        value={formData.kodePos || ""} 
                        placeholder="Masukkan Kode Pos" 
                        onChange={(e) => handleInputChange("kodePos", e.target.value.replace(/\D/g, ''))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tempat Tinggal <span className="text-red-500">*</span></Label>
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
                        className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.jenisTinggalId ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                      >
                        <option value="">Pilih Tempat Tinggal</option>
                        {(refOptions?.jenis_tinggal || []).map((t: any, idx: number) => (
                          <option key={t.jenis_tinggal_id || t.id || idx} value={t.jenis_tinggal_id || t.id}>{t.nama || t.jenis_tinggal}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Transportasi <span className="text-red-500">*</span></Label>
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
                        className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.alatTransportasiId ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                      >
                        <option value="">Pilih Alat Transportasi</option>
                        {(refOptions?.alat_transportasi || []).map((t: any, idx: number) => (
                          <option key={t.alat_transportasi_id || t.id || idx} value={t.alat_transportasi_id || t.id}>{t.nama || t.alat_transportasi}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Lintang <span className="text-red-500">*</span></Label>
                        <Input 
                          error={errors.lintang}
                          value={formData.lintang || ""} 
                          placeholder="Contoh: -6.200000" 
                          onChange={(e) => handleInputChange("lintang", e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bujur <span className="text-red-500">*</span></Label>
                        <Input 
                          error={errors.bujur}
                          value={formData.bujur || ""} 
                          placeholder="Contoh: 106.816666" 
                          onChange={(e) => handleInputChange("bujur", e.target.value)} 
                        />
                      </div>
                      <div className="col-span-full pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-200 text-gray-700 hover:bg-gray-50" 
                          type="button"
                          onClick={handleCheckCoordinates}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.4 2.4a1 1 0 01-1.4-1.1V6a1 1 0 01.6-1L9 3l6 2.4 5.4-2.4a1 1 0 011.4 1.1V18a1 1 0 01-.6 1L15 21l-6-2.4zM9 3v17m6-17v17" />
                          </svg>
                          Cek Koordinat / Cari Alamat
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Data Periodik */}
          <div style={{ display: activeTab === "periodik" ? "block" : "none" }}>
            <div className={`rounded-2xl border ${hasTabError("periodik") ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
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
                    <Label>Tinggi Badan (cm) <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      error={errors.tinggiBadan}
                      value={formData.tinggiBadan || ""} 
                      placeholder="Masukkan Tinggi Badan" 
                      onChange={(e) => handleInputChange("tinggiBadan", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Berat Badan (kg) <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      error={errors.beratBadan}
                      value={formData.beratBadan || ""} 
                      placeholder="Masukkan Berat Badan" 
                      onChange={(e) => handleInputChange("beratBadan", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lingkar Kepala (cm) <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      error={errors.lingkarKepala}
                      value={formData.lingkarKepala || ""} 
                      placeholder="Masukkan Lingkar Kepala" 
                      onChange={(e) => handleInputChange("lingkarKepala", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jarak Rumah ke Sekolah <span className="text-red-500">*</span></Label>
                    <div className="flex flex-col space-y-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input 
                          type="radio" 
                          name="jarakRumah" 
                          value="1" 
                          checked={String(formData.jarakRumah) === "1"}
                          onChange={() => {
                            handleInputChange("jarakRumah", "1");
                            handleInputChange("jarakRumahKm", "0");
                          }}
                          className="text-brand-500 focus:ring-brand-500 h-4 w-4 border-gray-300 dark:border-gray-800 bg-transparent"
                        />
                        kurang dari 1 km
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input 
                          type="radio" 
                          name="jarakRumah" 
                          value="2" 
                          checked={String(formData.jarakRumah) === "2"}
                          onChange={() => {
                            handleInputChange("jarakRumah", "2");
                            if (formData.jarakRumahKm === "0" || !formData.jarakRumahKm) {
                              handleInputChange("jarakRumahKm", "");
                            }
                          }}
                          className="text-brand-500 focus:ring-brand-500 h-4 w-4 border-gray-300 dark:border-gray-800 bg-transparent"
                        />
                        lebih dari 1 km
                      </label>
                    </div>
                    {errors.jarakRumah && <span className="text-xs text-red-500 block">Jarak rumah wajib dipilih</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Sebutkan (dalam kilometer) {String(formData.jarakRumah) === "2" && <span className="text-red-500">*</span>}</Label>
                    <Input 
                      type="number"
                      disabled={String(formData.jarakRumah) !== "2"}
                      error={errors.jarakRumahKm}
                      value={String(formData.jarakRumah) === "1" ? "0" : (formData.jarakRumahKm !== undefined && formData.jarakRumahKm !== null ? formData.jarakRumahKm : "")} 
                      placeholder={String(formData.jarakRumah) === "1" ? "0" : "Masukkan jarak dalam KM"} 
                      onChange={(e) => handleInputChange("jarakRumahKm", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Tempuh ke Sekolah (jam / menit) <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input 
                          type="number"
                          min="0"
                          error={errors.waktuTempuh}
                          value={formData.waktuTempuh !== undefined && formData.waktuTempuh !== null ? formData.waktuTempuh : ""} 
                          placeholder="Jam" 
                          onChange={(e) => handleInputChange("waktuTempuh", e.target.value)} 
                        />
                      </div>
                      <span className="text-gray-400 font-bold">/</span>
                      <div className="flex-1">
                        <Input 
                          type="number"
                          min="0"
                          max="59"
                          error={errors.menitTempuh}
                          value={formData.menitTempuh !== undefined && formData.menitTempuh !== null ? formData.menitTempuh : ""} 
                          placeholder="Menit" 
                          onChange={(e) => handleInputChange("menitTempuh", e.target.value)} 
                        />
                      </div>
                    </div>
                    {(errors.waktuTempuh || errors.menitTempuh) && (
                      <span className="text-xs text-red-500 block">Waktu tempuh wajib diisi</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah Saudara Kandung <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      error={errors.jumlahSaudara}
                      value={formData.jumlahSaudara !== undefined && formData.jumlahSaudara !== null ? formData.jumlahSaudara : ""} 
                      placeholder="Masukkan Jumlah Saudara Kandung" 
                      onChange={(e) => handleInputChange("jumlahSaudara", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hobi <span className="text-red-500">*</span></Label>
                    <select
                      value={formData.idHobby || ""}
                      onChange={(e) => {
                        handleInputChange("idHobby", e.target.value);
                        if (errors.idHobby) {
                          setErrors((prev: any) => ({ ...prev, idHobby: false }));
                        }
                      }}
                      className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.idHobby ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                    >
                      <option value="">Pilih Hobi</option>
                      {(refOptions?.jenis_hobby || []).map((h: any) => (
                        <option key={h.id_hobby || h.id} value={h.id_hobby || h.id}>{h.nm_hobby || h.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cita-Cita <span className="text-red-500">*</span></Label>
                    <select
                      value={formData.idCita || ""}
                      onChange={(e) => {
                        handleInputChange("idCita", e.target.value);
                        if (errors.idCita) {
                          setErrors((prev: any) => ({ ...prev, idCita: false }));
                        }
                      }}
                      className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.idCita ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
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
            <div className={`rounded-2xl border ${hasTabError("orangtua") ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-8`}>
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
                  <Label>Status Hidup <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-4 h-11">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="statusHidupAyah"
                        value="hidup"
                        checked={!isAyahWafat}
                        onChange={() => handleStatusHidupChange("ayah", "hidup")}
                        className="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500 size-4 bg-transparent"
                      />
                      Hidup
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="statusHidupAyah"
                        value="wafat"
                        checked={isAyahWafat}
                        onChange={() => handleStatusHidupChange("ayah", "wafat")}
                        className="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500 size-4 bg-transparent"
                      />
                      Wafat
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input 
                    error={errors.namaAyah}
                    value={formData.namaAyah || ""} 
                    placeholder="Masukkan Nama Lengkap Ayah" 
                    onChange={(e) => handleInputChange("namaAyah", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>NIK <span className="text-red-500">*</span></Label>
                  <Input 
                    error={errors.nikAyah}
                    value={formData.nikAyah || ""} 
                    maxLength={16}
                    placeholder="Masukkan NIK Ayah" 
                    disabled={isAyahWafat}
                    onChange={(e) => handleInputChange("nikAyah", e.target.value.replace(/\D/g, ''))} 
                  />
                </div>
                <div className="space-y-2">
                   <Label>Pekerjaan <span className="text-red-500">*</span></Label>
                   <select
                     value={formData.pekerjaan_id_ayah || ""}
                     disabled={isAyahWafat}
                     onChange={(e) => {
                       const opt = (refOptions?.pekerjaan || []).find((p: any) => String(p.pekerjaan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         pekerjaan_id_ayah: e.target.value,
                         pekerjaanAyah: opt?.nama || opt?.pekerjaan || ""
                       }));
                     }}
                     className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.pekerjaan_id_ayah ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                   >
                     <option value="">Pilih Pekerjaan</option>
                     {(refOptions?.pekerjaan || []).map((p: any) => (
                       <option key={p.pekerjaan_id || p.id} value={p.pekerjaan_id || p.id}>{p.nama || p.pekerjaan}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Tahun Lahir <span className="text-red-500">*</span></Label>
                   <Input 
                     type="number" 
                     error={errors.tahunLahirAyah}
                     value={formData.tahunLahirAyah || ""} 
                     placeholder="Masukkan Tahun Lahir Ayah" 
                     disabled={isAyahWafat}
                     onChange={(e) => handleInputChange("tahunLahirAyah", e.target.value)} 
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Pendidikan <span className="text-red-500">*</span></Label>
                   <select
                     value={formData.jenjang_pendidikan_ayah || ""}
                     disabled={isAyahWafat}
                     onChange={(e) => {
                       const opt = (refOptions?.jenjang_pendidikan || []).find((p: any) => String(p.jenjang_pendidikan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         jenjang_pendidikan_ayah: e.target.value,
                         jenjangPendidikanAyah: opt?.nama || opt?.jenjang_pendidikan || ""
                       }));
                     }}
                     className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.jenjang_pendidikan_ayah ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                   >
                     <option value="">Pilih Pendidikan</option>
                     {(refOptions?.jenjang_pendidikan || []).map((p: any) => (
                       <option key={p.jenjang_pendidikan_id || p.id} value={p.jenjang_pendidikan_id || p.id}>{p.nama || p.jenjang_pendidikan}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Penghasilan <span className="text-red-500">*</span></Label>
                   <select
                     value={formData.penghasilan_id_ayah || ""}
                     disabled={isAyahWafat}
                     onChange={(e) => {
                       const opt = (refOptions?.penghasilan || []).find((p: any) => String(p.penghasilan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         penghasilan_id_ayah: e.target.value,
                         penghasilanAyah: opt?.nama || opt?.penghasilan || ""
                       }));
                     }}
                     className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.penghasilan_id_ayah ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
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
                      disabled={isAyahWafat}
                      onClick={() => setIsKkAyahDropdownOpen(!isKkAyahDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white bg-white text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <Label>Status Hidup <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-4 h-11">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="statusHidupIbu"
                        value="hidup"
                        checked={!isIbuWafat}
                        onChange={() => handleStatusHidupChange("ibu", "hidup")}
                        className="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500 size-4 bg-transparent"
                      />
                      Hidup
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="statusHidupIbu"
                        value="wafat"
                        checked={isIbuWafat}
                        onChange={() => handleStatusHidupChange("ibu", "wafat")}
                        className="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500 size-4 bg-transparent"
                      />
                      Wafat
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input value={formData.namaIbu || ""} placeholder="Data kosong dari Dapodik" disabled />
                </div>
                <div className="space-y-2">
                  <Label>NIK <span className="text-red-500">*</span></Label>
                  <Input 
                    error={errors.nikIbu}
                    value={formData.nikIbu || ""} 
                    maxLength={16}
                    placeholder="Masukkan NIK Ibu" 
                    disabled={isIbuWafat}
                    onChange={(e) => handleInputChange("nikIbu", e.target.value.replace(/\D/g, ''))} 
                  />
                </div>
                <div className="space-y-2">
                   <Label>Pekerjaan <span className="text-red-500">*</span></Label>
                   <select
                     value={formData.pekerjaan_id_ibu || ""}
                     disabled={isIbuWafat}
                     onChange={(e) => {
                       const opt = (refOptions?.pekerjaan || []).find((p: any) => String(p.pekerjaan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         pekerjaan_id_ibu: e.target.value,
                         pekerjaanIbu: opt?.nama || opt?.pekerjaan || ""
                       }));
                     }}
                     className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.pekerjaan_id_ibu ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                   >
                     <option value="">Pilih Pekerjaan</option>
                     {(refOptions?.pekerjaan || []).map((p: any) => (
                       <option key={p.pekerjaan_id || p.id} value={p.pekerjaan_id || p.id}>{p.nama || p.pekerjaan}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Tahun Lahir <span className="text-red-500">*</span></Label>
                   <Input 
                     type="number" 
                     error={errors.tahunLahirIbu}
                     value={formData.tahunLahirIbu || ""} 
                     placeholder="Masukkan Tahun Lahir Ibu" 
                     disabled={isIbuWafat}
                     onChange={(e) => handleInputChange("tahunLahirIbu", e.target.value)} 
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Pendidikan <span className="text-red-500">*</span></Label>
                   <select
                     value={formData.jenjang_pendidikan_ibu || ""}
                     disabled={isIbuWafat}
                     onChange={(e) => {
                       const opt = (refOptions?.jenjang_pendidikan || []).find((p: any) => String(p.jenjang_pendidikan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         jenjang_pendidikan_ibu: e.target.value,
                         jenjangPendidikanIbu: opt?.nama || opt?.jenjang_pendidikan || ""
                       }));
                     }}
                     className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.jenjang_pendidikan_ibu ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                   >
                     <option value="">Pilih Pendidikan</option>
                     {(refOptions?.jenjang_pendidikan || []).map((p: any) => (
                       <option key={p.jenjang_pendidikan_id || p.id} value={p.jenjang_pendidikan_id || p.id}>{p.nama || p.jenjang_pendidikan}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Penghasilan <span className="text-red-500">*</span></Label>
                   <select
                     value={formData.penghasilan_id_ibu || ""}
                     disabled={isIbuWafat}
                     onChange={(e) => {
                       const opt = (refOptions?.penghasilan || []).find((p: any) => String(p.penghasilan_id || p.id) === e.target.value);
                       setFormData((prev: any) => ({
                         ...prev,
                         penghasilan_id_ibu: e.target.value,
                         penghasilanIbu: opt?.nama || opt?.penghasilan || ""
                       }));
                     }}
                     className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.penghasilan_id_ibu ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
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
                      disabled={isIbuWafat}
                      onClick={() => setIsKkIbuDropdownOpen(!isKkIbuDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white bg-white text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                     <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                     <Input 
                       error={errors.namaWali}
                       value={formData.namaWali || ""} 
                       placeholder="Masukkan Nama Lengkap Wali" 
                       onChange={(e) => handleInputChange("namaWali", e.target.value)} 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>NIK <span className="text-red-500">*</span></Label>
                     <Input 
                       error={errors.nikWali}
                       value={formData.nikWali || ""} 
                       maxLength={16}
                       placeholder="Masukkan NIK Wali" 
                       onChange={(e) => handleInputChange("nikWali", e.target.value.replace(/\D/g, ''))} 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Pekerjaan <span className="text-red-500">*</span></Label>
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
                       className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.pekerjaan_id_wali ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                     >
                       <option value="">Pilih Pekerjaan</option>
                       {(refOptions?.pekerjaan || []).map((p: any) => (
                         <option key={p.pekerjaan_id || p.id} value={p.pekerjaan_id || p.id}>{p.nama || p.pekerjaan}</option>
                       ))}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label>Tahun Lahir <span className="text-red-500">*</span></Label>
                     <Input 
                       type="number" 
                       error={errors.tahunLahirWali}
                       value={formData.tahunLahirWali || ""} 
                       placeholder="Masukkan Tahun Lahir Wali" 
                       onChange={(e) => handleInputChange("tahunLahirWali", e.target.value)} 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Pendidikan <span className="text-red-500">*</span></Label>
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
                       className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.jenjang_pendidikan_wali ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                     >
                       <option value="">Pilih Pendidikan</option>
                       {(refOptions?.jenjang_pendidikan || []).map((p: any) => (
                         <option key={p.jenjang_pendidikan_id || p.id} value={p.jenjang_pendidikan_id || p.id}>{p.nama || p.jenjang_pendidikan}</option>
                       ))}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label>Penghasilan <span className="text-red-500">*</span></Label>
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
                       className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.penghasilan_id_wali ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
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
                Upload Dokumen
              </h4>
            </div>

            <Alert
              variant="warning"
              title="Informasi Upload Dokumen"
              message="Dokumen yang diunggah harus memiliki format PDF dan ukuran maksimal 200 KB."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studentDocTypes.map((docType) => {
                const existingFile = uploadedDocs.find(f => f.startsWith(docType.key));
                const fileUrl = existingFile 
                  ? `${apiBaseUrl}/storage/${formData.sekolahId}/siswa/${id}/dokumen/${existingFile}?t=${Date.now()}` 
                  : "";

                return (
                  <div key={docType.key} className="space-y-3 border border-gray-200 dark:border-white/[0.05] p-5 rounded-xl bg-gray-50/30 dark:bg-white/[0.01] flex flex-col justify-between">
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300">{docType.name}</Label>
                    </div>
                    {existingFile ? (
                      <div className="flex flex-col gap-3 bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-150 dark:border-white/[0.05] shadow-theme-xs mt-2">
                        <div className="flex items-center gap-2.5">
                          {existingFile.toLowerCase().endsWith('.pdf') ? (
                            <div className="relative w-9 h-11 shrink-0 mr-1">
                              <svg className="w-full h-full" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M4 44V4H26L36 14V44H4Z"
                                  stroke="#EF4444"
                                  strokeWidth="4"
                                  strokeLinejoin="round"
                                  fill="white"
                                />
                                <path
                                  d="M26 4V14H36"
                                  stroke="#EF4444"
                                  strokeWidth="4"
                                  strokeLinejoin="round"
                                />
                                <line x1="10" y1="20" x2="30" y2="20" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
                                <line x1="10" y1="28" x2="30" y2="28" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
                                <line x1="10" y1="36" x2="22" y2="36" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
                              </svg>
                              <div className="absolute -bottom-1 -left-1 bg-red-600 text-white text-[8px] font-extrabold px-1 py-0.2 rounded border border-white leading-none">
                                PDF
                              </div>
                            </div>
                          ) : (
                            <svg className="w-8 h-8 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Nama Berkas</p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={existingFile}>{existingFile}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-gray-100 dark:border-white/[0.05] pt-2">
                          <button 
                            onClick={() => handleViewDoc(fileUrl, existingFile, docType.key)}
                            className="flex-1 text-center py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-white/[0.03] rounded transition-colors border border-brand-100 dark:border-white/[0.05] cursor-pointer"
                          >
                            Lihat
                          </button>
                          <button 
                            onClick={() => handleDownloadDoc(fileUrl, existingFile)} 
                            className="flex-1 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-350 hover:bg-gray-100 dark:hover:bg-white/[0.03] rounded transition-colors border border-gray-200 dark:border-white/[0.05]"
                          >
                            Unduh
                          </button>
                          <button 
                            onClick={() => handleDeleteDoc(existingFile, docType.name)} 
                            className="flex-1 py-1.5 text-xs font-semibold text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 rounded transition-colors border border-error-100 dark:border-error-500/20"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative mt-2">
                        <input 
                          type="file" 
                          id={`file-${docType.key}`}
                          className="hidden"
                          onChange={(e) => handleUploadDoc(docType.name, e.target.files?.[0])}
                          accept="application/pdf"
                        />
                        <label 
                          htmlFor={`file-${docType.key}`}
                          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl p-4 cursor-pointer hover:bg-brand-50/10 transition-all text-center space-y-1 h-24"
                        >
                          <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Pilih & Unggah File</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </div>

        </div>


      </div>

      {/* Leaflet Map Modal (popup coordinate picker) */}
      <Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} className="max-w-[900px] p-0 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Cari & Pilih Lokasi</h3>
          <button onClick={() => setIsMapModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="w-full h-[500px] relative"><div id="map-picker-container" className="w-full h-full"></div></div>
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-white/[0.02] flex justify-between items-center">
           <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Terpilih: <span className="text-brand-500">{tempCoords?.lat}, {tempCoords?.lng}</span></div>
           <div className="flex gap-3">
             <button onClick={() => setIsMapModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400">Batal</button>
             <Button 
               variant="outline" 
               size="sm" 
               type="button"
               onClick={() => {
                 const container = document.getElementById("map-picker-container") as any;
                 if (container && typeof container.triggerGPS === "function") {
                   container.triggerGPS();
                 }
               }}
             >
               <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               Cari Lokasi Saya
             </Button>
             <Button variant="primary" size="sm" onClick={handleUseLocation}>Gunakan Lokasi Ini</Button>
           </div>
         </div>
      </Modal>

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

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={getImageSlides()}
        plugins={[Zoom]}
      />
    </>
  );
};

export default EditStudentPage;
