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
import Switch from "../../components/form/switch/Switch";
import imageCompression from "browser-image-compression";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import { dapodikService } from "../../services/dapodikService";
import { referenceService } from "../../services/referenceService";
import Swal from "sweetalert2";
import { getFotoUrl } from "../../utils/image";
import { printGTKProfile } from "../../utils/printGTKProfile";
import { loadMapScripts, initGoogleMapPicker } from "../../utils/map";
import PrintGTKCardPreview from "../../components/gtk/PrintGTKCardPreview";
import Alert from "../../components/ui/alert/Alert";
import { PrinterIcon, PlusIcon, EyeIcon } from "../../icons";

interface SearchableSelectProps {
  options: any[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
  labelKey?: string;
  valueKey?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  disabled,
  placeholder,
  error,
  labelKey = "label",
  valueKey = "value"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => String(opt[valueKey] || opt.id_bank || opt.id) === String(value));
  const displayText = selectedOption ? (selectedOption[labelKey] || selectedOption.nm_bank || selectedOption.nama_bank || selectedOption.nama) : placeholder || "Pilih opsi...";

  const filteredOptions = options.filter((opt) => {
    const label = String(opt[labelKey] || opt.nm_bank || opt.nama_bank || opt.nama || "").toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm("");
        }}
        className={`w-full flex justify-between items-center rounded-lg border p-3 text-sm text-left dark:bg-white/[0.03] dark:text-white ${
          disabled ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed" : "bg-white cursor-pointer"
        } ${error ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"}`}
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform text-gray-500 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <style>{`
            @keyframes dropdownSlideDown {
              from { opacity: 0; transform: translateY(-8px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-dropdown {
              animation: dropdownSlideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              transform-origin: top center;
            }
          `}</style>
          <div className="absolute z-[999] mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg max-h-[300px] flex flex-col overflow-hidden animate-dropdown">
          <div className="p-2 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.02]">
            <input
              type="text"
              autoFocus
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-200 dark:border-gray-800 p-2 text-xs bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <ul className="flex-1 overflow-y-auto max-h-[220px] divide-y divide-gray-50 dark:divide-white/[0.02] custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const optValue = String(opt[valueKey] || opt.id_bank || opt.id);
                const isSelected = String(value) === optValue;
                const optLabel = opt[labelKey] || opt.nm_bank || opt.nama_bank || opt.nama;
                return (
                  <li
                    key={optValue}
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-500/10 truncate transition-colors ${
                      isSelected ? "text-brand-600 dark:text-brand-400 font-semibold bg-brand-50/50 dark:bg-brand-500/5" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {optLabel}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-3 text-xs text-gray-500 text-center dark:text-gray-400">
                Opsi tidak ditemukan
              </li>
            )}
          </ul>
        </div>
      </>
      )}
    </div>
  );
};


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

interface EditGTKPageProps {
  profileId?: string;
}

const EditGTKPage: React.FC<EditGTKPageProps> = ({ profileId }) => {
  const { role, id: paramId } = useParams<{ role: string; id: string }>();
  const id = profileId || paramId;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profil");

  const tabs = [
    { id: "profil", label: "Profil & Identitas" },
    { id: "alamat", label: "Alamat Rumah" },
    { id: "kepegawaian", label: "Kepegawaian" },
    { id: "pendidikan", label: "Pendidikan" },
    { id: "sertifikasi", label: "Sertifikasi & Rekening" },
    { id: "kontak", label: "Kontak" },
    { id: "anak", label: "Data Anak" },
    { id: "dokumen", label: "Upload Dokumen" },
  ];

  const apiBaseUrl = import.meta.env.VITE_API_URL 
    ? (import.meta.env.VITE_API_URL.endsWith("/api") ? import.meta.env.VITE_API_URL.slice(0, -4) : import.meta.env.VITE_API_URL)
    : (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin);

  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(!!id);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isAnakModalOpen, setIsAnakModalOpen] = useState(false);
  const [editingAnakId, setEditingAnakId] = useState<string | null>(null);
  const [anakForm, setAnakForm] = useState<any>({ nama: "", nik: "", nisn: "", jenis_kelamin: "L", tempat_lahir: "", tanggal_lahir: "", status_anak_id: "1", jenjang_pendidikan_id: "0", tahun_masuk: "" });
  const [anakErrors, setAnakErrors] = useState<any>({});
  const [tempCoords, setTempCoords] = useState<{lat: string, lng: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getImageSlides = () => {
    const slides: any[] = [];
    (pendingDocs || []).forEach((doc: any) => {
      const filename = doc.fileName || doc.fileUrl || doc.nama || "";
      const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      if (isImage) {
        const fileUrl = doc.fileUrl.startsWith('/') ? `${apiBaseUrl}${doc.fileUrl}` : doc.fileUrl;
        slides.push({
          src: fileUrl,
          title: doc.nama,
          id: doc.id
        });
      }
    });
    return slides;
  };

  const handleViewDoc = (url: string, filename: string, docId: any) => {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    if (isImage) {
      const slides = getImageSlides();
      const idx = slides.findIndex(s => s.id === docId);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    } else {
      window.open(url, '_blank');
    }
  };
  // Document Upload State
  const [pendingDocs, setPendingDocs] = useState<any[]>([]); 
  const [errors, setErrors] = useState<any>({});

  const isMarried = formData?.statusPerkawinan === '1' || formData?.statusPerkawinan === 1;
  const hasSertifikasi = formData?.memilikiSertifikasi === 'Ya' || (formData?.riwayatSertifikasi && formData?.riwayatSertifikasi.length > 0);

  const hasTabError = (tabId: string) => {
    if (tabId === "profil") {
      return !!(errors.kk || errors.agama_id || errors.statusPerkawinan || (isMarried && (errors.namaPasangan || errors.pekerjaanPasangan)) || errors.namaWajibPajak || errors.npwp);
    }
    if (tabId === "alamat") {
      return !!(errors.kampungJalan || errors.rt || errors.rw || errors.desaKelurahan || errors.provinsi || errors.kotaKabupaten || errors.kecamatan || errors.kodePos || errors.lintang || errors.bujur);
    }
    if (tabId === "kepegawaian") {
      return !!(errors.sumber_gaji_id);
    }
    if (tabId === "sertifikasi") {
      return !!(hasSertifikasi && (errors.namaBank || errors.cabangBank || errors.noRekening || errors.atasNamaRekening));
    }
    if (tabId === "kontak") {
      return !!(errors.noTelpRumah || errors.noHp || errors.noWa || errors.idTelegram);
    }
    return false;
  };

  const [isPengajuanModalOpen, setIsPengajuanModalOpen] = useState(false);
  const [isFormPengajuanOpen, setIsFormPengajuanOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedPersonForCard, setSelectedPersonForCard] = useState<any | null>(null);

  const [isCompletenessModalOpen, setIsCompletenessModalOpen] = useState(false);
  const [hasShownCompletenessAlert, setHasShownCompletenessAlert] = useState(false);

  const getEmptyFields = () => {
    if (!formData || !formData.nama) return [];

    const requiredFields = [
      { key: 'nama', label: 'Nama Lengkap' },
      { key: 'nik', label: 'NIK' },
      { key: 'kk', label: 'No. Kartu Keluarga' },
      { key: 'jk', label: 'Jenis Kelamin' },
      { key: 'tempatLahir', label: 'Tempat Lahir' },
      { key: 'tanggalLahir', label: 'Tanggal Lahir' },
      { key: 'ibuKandung', label: 'Nama Ibu Kandung' },
      { key: 'agama_id', label: 'Agama' },
      { key: 'statusPerkawinan', label: 'Status Perkawinan' },
      { key: 'namaPasangan', label: 'Nama Pasangan' },
      { key: 'pekerjaanPasangan', label: 'Pekerjaan Pasangan' },
      { key: 'namaWajibPajak', label: 'Nama Wajib Pajak' },
      { key: 'npwp', label: 'NPWP' },
      { key: 'kampungJalan', label: 'Alamat Jalan' },
      { key: 'rt', label: 'RT' },
      { key: 'rw', label: 'RW' },
      { key: 'desaKelurahan', label: 'Desa/Kelurahan' },
      { key: 'provinsi', label: 'Provinsi' },
      { key: 'kotaKabupaten', label: 'Kabupaten/Kota' },
      { key: 'kecamatan', label: 'Kecamatan' },
      { key: 'kodePos', label: 'Kode Pos' },
      { key: 'lintang', label: 'Lintang' },
      { key: 'bujur', label: 'Bujur' },
      { key: 'sumber_gaji_id', label: 'Sumber Gaji' },
      { key: 'idBank', label: 'Nama Bank' },
      { key: 'noRekening', label: 'No. Rekening' },
      { key: 'atasNamaRekening', label: 'Rekening Atas Nama' },
      { key: 'cabangBank', label: 'Kantor Cabang Bank (KCP)' },
      { key: 'noHp', label: 'Nomor HP' },
      { key: 'noWa', label: 'Nomor WhatsApp' },
      { key: 'idTelegram', label: 'ID Telegram' },
      { key: 'email', label: 'Email' }
    ];

    const checkFilled = (field: any) => {
      if (field.key === 'provinsi' || field.key === 'kotaKabupaten' || field.key === 'kecamatan') {
        const desa = formData['desaKelurahan'];
        const prov = formData['provinsi'];
        const kab = formData['kotaKabupaten'];
        const kec = formData['kecamatan'];
        return !!((desa && desa !== '-' && desa !== '') || (prov && prov !== '-' && prov !== '') || (kab && kab !== '-' && kab !== '') || (kec && kec !== '-' && kec !== ''));
      }

      const val = formData[field.key];
      if (val !== undefined && val !== null && val !== '' && val !== '-' && val !== 0 && val !== '0') {
        return true;
      }
      return false;
    };

    return requiredFields.filter(field => {
      if (field.key === 'idBank' || field.key === 'noRekening' || field.key === 'atasNamaRekening' || field.key === 'cabangBank') {
        return hasSertifikasi;
      }
      if (field.key === 'namaPasangan' || field.key === 'pekerjaanPasangan') {
        return isMarried;
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
      await printGTKProfile([id]);
    }
  };

  const handlePrintCard = () => {
    if (!id || !formData) return;
    setSelectedPersonForCard({
      ptk_id: id,
      nama: formData.nama,
      foto: formData.avatar,
      nuptk: formData.nuptk,
      nik: formData.nik,
      avatar: getFotoUrl(formData.avatar, ""),
      jabatan: formData.jabatanPtk || formData.jenisPtk || "GTK",
      jenis: "Guru",
      qr_token: formData.qr_token || "",
    });
    setIsCardModalOpen(true);
  };
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [pengajuanForm, setPengajuanForm] = useState<any>({});

  const [bankList, setBankList] = useState<any[]>([]);
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
        const [banksRes, optionsRes, provsRes] = await Promise.allSettled([
          referenceService.getBank(),
          referenceService.getOptions(),
          referenceService.getWilayah(1)
        ]);

        if (banksRes.status === "fulfilled") {
          const val = banksRes.value;
          setBankList(val?.data || val || []);
        }
        if (optionsRes.status === "fulfilled") {
          const val = optionsRes.value;
          setRefOptions(val?.data || val || null);
        }
        if (provsRes.status === "fulfilled") {
          const val = provsRes.value;
          setProvinces(val?.data || val || []);
        }
      } catch (err) {
        console.error("Gagal mengambil data referensi:", err);
      }
    };
    loadReferences();
  }, []);

  const FIELD_MAP_GTK: { [key: string]: { label: string, dbKey: string, localKey: string } } = {
    nama: { label: 'Nama Lengkap', dbKey: 'nama', localKey: 'nama' },
    nik: { label: 'NIK', dbKey: 'nik', localKey: 'nik' },
    no_kk: { label: 'No. Kartu Keluarga', dbKey: 'no_kk', localKey: 'kk' },
    jenis_kelamin: { label: 'Jenis Kelamin', dbKey: 'jenis_kelamin', localKey: 'jk' },
    tempat_lahir: { label: 'Tempat Lahir', dbKey: 'tempat_lahir', localKey: 'tempatLahir' },
    tanggal_lahir: { label: 'Tanggal Lahir', dbKey: 'tanggal_lahir', localKey: 'tanggalLahir' },
    nama_ibu_kandung: { label: 'Nama Ibu Kandung', dbKey: 'nama_ibu_kandung', localKey: 'ibuKandung' },
    agama_id: { label: 'Agama', dbKey: 'agama_id', localKey: 'agama_id' },
    status_perkawinan: { label: 'Status Perkawinan', dbKey: 'status_perkawinan', localKey: 'statusPerkawinan' },
    nama_suami_istri: { label: 'Nama Pasangan', dbKey: 'nama_suami_istri', localKey: 'namaPasangan' },
    pekerjaan_suami_istri: { label: 'Pekerjaan Pasangan', dbKey: 'pekerjaan_suami_istri', localKey: 'pekerjaanPasangan' },
    nama_wajib_pajak: { label: 'Nama Wajib Pajak', dbKey: 'nama_wajib_pajak', localKey: 'namaWajibPajak' },
    npwp: { label: 'NPWP', dbKey: 'npwp', localKey: 'npwp' },
    alamat_jalan: { label: 'Kampung/Jalan', dbKey: 'alamat_jalan', localKey: 'kampungJalan' },
    rt: { label: 'RT', dbKey: 'rt', localKey: 'rt' },
    rw: { label: 'RW', dbKey: 'rw', localKey: 'rw' },
    nama_dusun: { label: 'Dusun', dbKey: 'nama_dusun', localKey: 'dusun' },
    wilayah: { label: 'Wilayah (Provinsi, Kab, Kec, Desa)', dbKey: 'wilayah', localKey: 'wilayah' },
    kode_pos: { label: 'Kode Pos', dbKey: 'kode_pos', localKey: 'kodePos' },
    lintang_bujur: { label: 'Koordinat (Lintang & Bujur)', dbKey: 'lintang_bujur', localKey: 'lintang_bujur' },
    id_bank: { label: 'Nama Bank', dbKey: 'id_bank', localKey: 'idBank' },
    nama_kcp: { label: 'Cabang Bank', dbKey: 'nama_kcp', localKey: 'cabangBank' },
    rekening_bank: { label: 'No. Rekening', dbKey: 'rekening_bank', localKey: 'noRekening' },
    rekening_atas_nama: { label: 'Atas Nama Rekening', dbKey: 'rekening_atas_nama', localKey: 'atasNamaRekening' },
    no_telepon_rumah: { label: 'No. Telepon Rumah', dbKey: 'no_telepon_rumah', localKey: 'noTelpRumah' },
    no_hp: { label: 'No. Handphone', dbKey: 'no_hp', localKey: 'noHp' }
  };

  useEffect(() => {
    if (isFormPengajuanOpen) {
      const loadDataOnOpen = async () => {
        try {
          if (provinces.length === 0) {
            const provsRes = await referenceService.getWilayah(1);
            setProvinces(provsRes?.data || provsRes || []);
          }
          if (bankList.length === 0) {
            const banksRes = await referenceService.getBank();
            setBankList(banksRes?.data || banksRes || []);
          }
        } catch (e) {
          console.error("Gagal reload data referensi:", e);
        }
      };
      loadDataOnOpen();
    }
  }, [isFormPengajuanOpen, provinces.length, bankList.length]);

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
        initialForm["kabupaten_kota"] = formData["kotaKabupaten"] || "";
        initialForm["kecamatan"] = formData["kecamatan"] || "";
        initialForm["desa_kelurahan"] = formData["desaKelurahan"] || "";
      } else {
        const mapping = FIELD_MAP_GTK[fieldKey];
        if (mapping) {
          initialForm[fieldKey] = formData[mapping.localKey] || "";
        }
      }
    });
    setPengajuanForm(initialForm);
    
    setIsPengajuanModalOpen(false);
    setIsFormPengajuanOpen(true);
  };

  const handlePengajuanInputChange = (fieldKey: string, val: string) => {
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

  const handleDesaChange = (desaName: string) => {
    handlePengajuanInputChange("desa_kelurahan", desaName);
    handlePengajuanInputChange("_desa_name", desaName);
  };

  const handleAddrProvinceChange = async (provCode: string, provName: string) => {
    handleInputChange("provinsi", provName);
    handleInputChange("kotaKabupaten", "");
    handleInputChange("kecamatan", "");
    handleInputChange("desaKelurahan", "");
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
    handleInputChange("kotaKabupaten", kabName);
    handleInputChange("kecamatan", "");
    handleInputChange("desaKelurahan", "");
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
    setAddrDesas([]);
    if (!kecCode) return;
    try {
      const res = await referenceService.getWilayah(4, kecCode);
      setAddrDesas(res?.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddrDesaChange = (desaName: string) => {
    handleInputChange("desaKelurahan", desaName);
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
            sebelumnya: formData["kotaKabupaten"] || null,
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
        } else {
          const mapping = FIELD_MAP_GTK[fieldKey];
          if (mapping) {
            if (fieldKey === "id_bank") {
              const bankName = bankList.find((b: any) => String(b.id_bank || b.id) === String(pengajuanForm[fieldKey]))?.nm_bank || "";
              perubahan[mapping.dbKey] = {
                sebelumnya: formData[mapping.localKey] || null,
                diajukan: pengajuanForm[fieldKey] || null,
                diajukan_nama: bankName
              };
            } else {
              perubahan[mapping.dbKey] = {
                sebelumnya: formData[mapping.localKey] || null,
                diajukan: pengajuanForm[fieldKey] || null
              };
            }
          }
        }
      });

      await dapodikService.buatPengajuanPerbaikan({
        ptk_id: id,
        tipe: 'GTK',
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
          const result = await dapodikService.getGtkDetail(id);
          if (result.status === "success" && result.data) {
            const data = result.data;
            
            // Set dynamic list of documents from backend if present
            setPendingDocs(data.foto_dokumen || []);

            // Set main formData state (mapping snake_case db fields to camelCase template keys)
            setFormData({
              id: data.ptk_id,
              nama: data.nama || "",
              nik: data.nik || "",
              kk: data.no_kk || "",
              nuptk: data.nuptk || "",
              nipNiyNigb: data.nip || data.niy_nigk || "",
              jk: data.jenis_kelamin || "L",
              tempatLahir: data.tempat_lahir || "",
              tanggalLahir: formatDateToIndonesian(data.tanggal_lahir),
              ibuKandung: data.nama_ibu_kandung || "",
              agama: data.agama_nama || "",
              agama_id: data.agama_id || "",
              kewarganegaraan: data.kewarganegaraan || "ID",
              statusPerkawinan: data.status_perkawinan !== null && data.status_perkawinan !== undefined ? String(data.status_perkawinan) : "",
              namaPasangan: data.nama_suami_istri || "",
              pekerjaanPasangan: data.pekerjaan_suami_istri !== null && data.pekerjaan_suami_istri !== undefined ? String(data.pekerjaan_suami_istri) : "",
              namaWajibPajak: data.nm_wp || data.nama_wajib_pajak || "",
              npwp: data.npwp || "",
              
              kampungJalan: data.alamat_jalan || "",
              rt: format3Digits(data.rt),
              rw: format3Digits(data.rw),
              dusun: data.nama_dusun || "",
              provinsi: data.provinsi || "",
              kotaKabupaten: data.kabupaten || data.kabupaten_kota || "",
              kecamatan: data.kecamatan || "",
              desaKelurahan: data.desa_kelurahan || "",
              kodePos: data.kode_pos || "",
              lintang: data.lintang ? String(data.lintang) : "",
              bujur: data.bujur ? String(data.bujur) : "",
              
              jenisPtk: data.jenis_ptk_nama || "",
              jabatanPtk: data.jabatan_ptk_nama || "",
              ptkInduk: data.ptk_induk_str || "",
              skPengangkatan: data.sk_pengangkatan || "",
              tmtPengangkatan: formatDateToIndonesian(data.tmt_pengangkatan),
              lembagaPengangkat: data.lembaga_pengangkat_nama || "",
              skCpns: data.sk_cpns || "",
              tmtCpns: formatDateToIndonesian(data.tmt_cpns),
              tmtPns: formatDateToIndonesian(data.tmt_pns),
              pangkatTerakhir: data.pangkat_golongan_nama || "",
              sumberGaji: data.sumber_gaji_nama || "",
              sumber_gaji_id: data.sumber_gaji_id || "",
              
              riwayatKepangkatan: data.rwy_kepangkatan ? data.rwy_kepangkatan.map((k: any) => ({
                gol: k.pangkat_golongan_nama || k.pangkat || "-",
                nomorSk: k.nomor_sk || "",
                tmt: formatDateToIndonesian(k.tmt_pangkat || k.tmt_golongan),
                masaKerja: k.masa_kerja_gol_tahun !== undefined ? `${k.masa_kerja_gol_tahun || 0}th ${k.masa_kerja_gol_bulan || 0}bln` : (k.masaKerja || `${k.masa_kerja_tahun || 0}th ${k.masa_kerja_bulan || 0}bln`),
              })) : [],
              
              tugasTambahan: data.tugas_tambahan ? data.tugas_tambahan.map((t: any) => ({
                jabatan: t.jabatan_tugas_nama || t.jabatan_ptk_id || "-",
                nomorSk: t.nomor_sk || "",
                tmt: formatDateToIndonesian(t.tmt_tambahan),
                tst: formatDateToIndonesian(t.tst_tambahan),
                jumlahJam: t.jumlah_jam_diakui !== undefined ? Number(t.jumlah_jam_diakui) : (t.jumlah_jam !== null && t.jumlah_jam !== undefined ? Number(t.jumlah_jam) : 0),
              })) : [],

              anak: data.anak || [],
              
              pendidikanTerakhir: data.pendidikan_terakhir || "",
              bidangStudi: data.bidang_studi_terakhir || "",
              riwayatPendidikan: (data.riwayat_pendidikan_formal && data.riwayat_pendidikan_formal.length > 0)
                ? data.riwayat_pendidikan_formal
                : (data.rwy_pend_formal ? (typeof data.rwy_pend_formal === 'string' ? JSON.parse(data.rwy_pend_formal) : data.rwy_pend_formal) : []),
              
              lisensiKepsek: data.lisensi_kepsek ? "Ya" : "Tidak",
              nuk: data.nuks || "",
              keahlianLab: data.keahlian_laboratorium_nama || "",
              kebutuhanKhusus: data.kebutuhan_khusus_nama || "",
              keahlianBraille: data.keahlian_braille_str || "",
              bahasaIsyarat: data.keahlian_bhs_isyarat_str || "",
              
              noTelpRumah: data.no_telepon_rumah || "",
              noHp: data.no_hp || "",
              noWa: data.no_whatsapp || data.no_wa || "",
              email: data.penggunas?.[0]?.email || "",
              idTelegram: data.id_telegram || "",
              
              riwayatSertifikasi: data.rwy_sertifikasi ? data.rwy_sertifikasi.map((s: any) => ({
                lembagaSertifikasi: s.lembaga_sertifikasi_nama || s.kode_lemb_sert || "",
                bidangStudi: s.bidang_studi_nama || s.bidang_studi_id_str || "",
                jenisSertifikasi: s.jenis_sertifikasi_nama || s.id_jenis_sertifikasi || "",
                tglBerlaku: formatDateToIndonesian(s.tgl_sert),
                tglHabisBerlaku: formatDateToIndonesian(s.tgl_exp_sert),
                noSertifikasi: s.nomor_sertifikat || "",
                noRegistrasi: s.nomer_registrasi || "",
                nomorPeserta: s.nomor_peserta || "",
                kualifikasi: s.kualifikasi || "",
              })) : [],
              memilikiSertifikasi: data.rwy_sertifikasi && data.rwy_sertifikasi.length > 0 ? "Ya" : "Tidak",
              avatar: data.foto || "",
              
              idBank: data.id_bank || "",
              namaBank: data.id_bank || "",
              cabangBank: data.nama_kcp || "",
              noRekening: data.rekening_bank || "",
              atasNamaRekening: data.rekening_atas_nama || "",
              qr_token: data.qr_token || "",
            });
          }
        } catch (error) {
          Swal.fire("Error", "Gagal mengambil data GTK", "error");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev: any) => ({ ...prev, [field]: false }));
    }

    if (field === "memilikiSertifikasi" && value === "Tidak") {
      setFormData((prev: any) => ({ 
        ...prev, 
        namaBank: "", 
        cabangBank: "", 
        noRekening: "", 
        atasNamaRekening: "" 
      }));
      setErrors((prev: any) => ({ 
        ...prev, 
        namaBank: false, 
        cabangBank: false, 
        noRekening: false, 
        atasNamaRekening: false 
      }));
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
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
      const response = await fetch(url);
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
      window.open(url, '_blank');
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
        const result = await dapodikService.uploadGtkFoto(id, file);
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

  const handleAddNewRow = () => {
    const newRow = {
      id: `local_${Date.now()}_${Math.random()}`,
      nama: "",
      file: null as File | null,
      fileUrl: "",
      isNew: true,
      isSavedLocally: false
    };
    setPendingDocs((prev) => [...prev, newRow]);
  };

  const handleReplaceDocument = async (doc: any) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf,image/jpeg,image/png,image/webp';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        Swal.fire({ title: "Format Salah", text: "Gunakan format PDF atau Gambar (JPG, PNG, WebP).", icon: "error", confirmButtonColor: "#465FFF" });
        return;
      }
      if (file.size > 200 * 1024) {
        Swal.fire({ title: "Berkas Terlalu Besar", text: `Ukuran berkas (${(file.size / 1024).toFixed(1)}KB) melebihi batas 200KB.`, icon: "error", confirmButtonColor: "#465FFF" });
        return;
      }

      try {
        Swal.fire({ title: "Mengganti dokumen...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await dapodikService.uploadGtkDokumen(id!, file, doc.nama);
        Swal.fire({ title: "Berhasil", text: `Dokumen "${doc.nama}" berhasil diganti.`, icon: "success", confirmButtonColor: "#465FFF", timer: 1500, showConfirmButton: false });

        // Reload documents list
        const result = await dapodikService.getGtkDetail(id!);
        if (result.status === "success" && result.data) {
          setPendingDocs(result.data.foto_dokumen || []);
        }
      } catch (err: any) {
        Swal.fire({ title: "Gagal", text: err.response?.data?.message || "Gagal mengganti dokumen.", icon: "error", confirmButtonColor: "#465FFF" });
      }
    };
    fileInput.click();
  };

  const handleRowFileChange = (rowId: string, file: File | null) => {
    if (!file) return;
    
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

    if (file.size > maxSize) {
      Swal.fire({
        title: "Berkas PDF Terlalu Besar",
        text: `Ukuran berkas PDF Anda (${(file.size / 1024).toFixed(1)}Kb) melebihi batas maksimal 200KB. Harap kompres berkas PDF Anda terlebih dahulu sebelum mengunggah.`,
        icon: "error",
        confirmButtonColor: "#465FFF",
      });
      return;
    }

    setPendingDocs((prev) =>
      prev.map((d) => {
        if (d.id === rowId) {
          return {
            ...d,
            file: file,
            fileUrl: URL.createObjectURL(file)
          };
        }
        return d;
      })
    );
  };

  const handleRowNameChange = (rowId: string, name: string) => {
    setPendingDocs((prev) =>
      prev.map((d) => {
        if (d.id === rowId) {
          return { ...d, nama: name };
        }
        return d;
      })
    );
  };


  const handleSaveAllNewDocuments = async () => {
    const newDocs = pendingDocs.filter((d) => d.isNew);
    if (newDocs.length === 0) return;

    // Validate that all new docs have both name and file selected
    const incompleteDoc = newDocs.some(d => (!d.nama?.trim() && d.file) || (d.nama?.trim() && !d.file));
    if (incompleteDoc) {
      Swal.fire({
        title: "Dokumen Belum Lengkap",
        text: "Ada dokumen baru yang belum diisi nama dokumennya atau belum dipilih berkas PDF-nya. Silakan lengkapi atau hapus kartu dokumen tersebut.",
        icon: "warning",
        confirmButtonColor: "#465FFF"
      });
      return;
    }

    const emptyDoc = newDocs.some(d => !d.nama?.trim() && !d.file);
    if (emptyDoc) {
      Swal.fire({
        title: "Dokumen Kosong",
        text: "Terdapat kartu dokumen baru yang masih kosong. Silakan lengkapi atau hapus kartu tersebut sebelum menyimpan.",
        icon: "warning",
        confirmButtonColor: "#465FFF"
      });
      return;
    }

    try {
      Swal.fire({
        title: "Sedang mengunggah semua dokumen...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      for (const doc of newDocs) {
        await dapodikService.uploadGtkDokumen(id!, doc.file, doc.nama);
      }

      Swal.fire({
        title: "Berhasil",
        text: "Semua dokumen baru berhasil disimpan ke server.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // Reload GTK documents list
      const result = await dapodikService.getGtkDetail(id!);
      if (result.status === "success" && result.data) {
        setPendingDocs(result.data.foto_dokumen || []);
      }
    } catch (err: any) {
      console.error("Gagal mengunggah dokumen", err);
      Swal.fire({
        title: "Gagal Mengunggah",
        text: err.response?.data?.message || "Terjadi kesalahan saat mengunggah dokumen ke server.",
        icon: "error",
        confirmButtonColor: "#465FFF",
      });
    }
  };

  const handleRemovePendingDocument = async (doc: any) => {
    const confirm = await Swal.fire({
      title: "Hapus Dokumen?",
      text: `Apakah Anda yakin ingin menghapus dokumen "${doc.nama || 'ini'}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#EF4444",
    });

    if (!confirm.isConfirmed) return;

    if (!doc.isNew) {
      try {
        Swal.fire({
          title: "Sedang menghapus...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await dapodikService.deleteGtkDokumen(id!, doc.fileName);

        Swal.fire({ 
          title: "Berhasil", 
          text: `Dokumen "${doc.nama}" berhasil dihapus`, 
          icon: "success", 
          confirmButtonColor: "#465FFF",
          timer: 1500,
          showConfirmButton: false
        });

        // Reload list
        const result = await dapodikService.getGtkDetail(id!);
        if (result.status === "success" && result.data) {
          setPendingDocs(result.data.foto_dokumen || []);
        }
      } catch (err: any) {
        console.error("Gagal menghapus dokumen", err);
        Swal.fire({
          title: "Gagal Menghapus",
          text: err.response?.data?.message || "Terjadi kesalahan saat menghapus dokumen.",
          icon: "error",
          confirmButtonColor: "#465FFF",
        });
      }
    } else {
      setPendingDocs((prev) => prev.filter((d) => d.id !== doc.id));
      Swal.fire({ 
        title: "Berhasil", 
        text: `Dokumen "${doc.nama}" berhasil dihapus`, 
        icon: "success", 
        confirmButtonColor: "#465FFF",
        timer: 1500,
        showConfirmButton: false
      });
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

  const handleSave = async () => {
    if (!id) return;

    if (formData.kk && formData.kk.length !== 16) {
      Swal.fire({
        title: "Gagal Menyimpan",
        text: "Nomor KK harus tepat 16 digit.",
        icon: "error",
        confirmButtonColor: "#465FFF"
      });
      return;
    }

    let hasError = false;
    const newErrors: any = {};
    
    // Check validation constraints matching required fields
    if (!formData.kk) { newErrors.kk = true; hasError = true; }
    if (!formData.agama_id) { newErrors.agama_id = true; hasError = true; }
    if (!formData.statusPerkawinan) { newErrors.statusPerkawinan = true; hasError = true; }
    
    if (isMarried) {
      if (!formData.namaPasangan) { newErrors.namaPasangan = true; hasError = true; }
      if (!formData.pekerjaanPasangan) { newErrors.pekerjaanPasangan = true; hasError = true; }
    }
    
    if (!formData.namaWajibPajak) { newErrors.namaWajibPajak = true; hasError = true; }
    if (!formData.npwp) { newErrors.npwp = true; hasError = true; }
    
    // Alamat
    if (!formData.kampungJalan) { newErrors.kampungJalan = true; hasError = true; }
    if (!formData.rt) { newErrors.rt = true; hasError = true; }
    if (!formData.rw) { newErrors.rw = true; hasError = true; }
    if (!formData.desaKelurahan) { newErrors.desaKelurahan = true; hasError = true; }
    if (!formData.provinsi) { newErrors.provinsi = true; hasError = true; }
    if (!formData.kotaKabupaten) { newErrors.kotaKabupaten = true; hasError = true; }
    if (!formData.kecamatan) { newErrors.kecamatan = true; hasError = true; }
    if (!formData.kodePos) { newErrors.kodePos = true; hasError = true; }
    if (!formData.lintang) { newErrors.lintang = true; hasError = true; }
    if (!formData.bujur) { newErrors.bujur = true; hasError = true; }
    
    // Kepegawaian / Sumber Gaji
    if (!formData.sumber_gaji_id) { newErrors.sumber_gaji_id = true; hasError = true; }
    
    // Bank jika Sertifikasi
    if (hasSertifikasi) {
      if (!formData.namaBank) { newErrors.namaBank = true; hasError = true; }
      if (!formData.cabangBank) { newErrors.cabangBank = true; hasError = true; }
      if (!formData.noRekening) { newErrors.noRekening = true; hasError = true; }
      if (!formData.atasNamaRekening) { newErrors.atasNamaRekening = true; hasError = true; }
    }
    
    // Kontak
    if (!formData.noTelpRumah) { newErrors.noTelpRumah = true; hasError = true; }
    if (!formData.noHp) { newErrors.noHp = true; hasError = true; }
    if (!formData.noWa) { newErrors.noWa = true; hasError = true; }
    if (!formData.idTelegram) { newErrors.idTelegram = true; hasError = true; }

    // Validate staged documents
    const newDocsForValidation = pendingDocs.filter((d) => d.isNew);
    if (newDocsForValidation.length > 0) {
      Swal.fire({
        title: "Dokumen Belum Disimpan",
        text: "Terdapat dokumen baru yang belum diunggah. Silakan klik tombol 'Simpan' pada kartu dokumen tersebut terlebih dahulu atau hapus kartu tersebut.",
        icon: "warning",
        confirmButtonColor: "#465FFF"
      });
      return;
    }

    if (hasError) {
      setErrors(newErrors);
      Swal.fire({
        title: "Gagal Menyimpan",
        text: "Ada kolom wajib diisi yang masih kosong. Periksa bagian bertanda merah.",
        icon: "error",
        confirmButtonColor: "#465FFF"
      });
      return;
    }

    setLoading(true);
    try {
      // Map component camelCase keys back to valid database columns
      const updatePayload = {
        nama: formData.nama,
        nik: formData.nik,
        no_kk: formData.kk,
        nuptk: formData.nuptk,
        nip: formData.nipNiyNigb,
        jenis_kelamin: formData.jk,
        tempat_lahir: formData.tempatLahir,
        tanggal_lahir: formData.tanggalLahir ? new Date(formData.tanggalLahir) : null,
        nama_ibu_kandung: formData.ibuKandung,
        agama_id: formData.agama_id || null,
        kewarganegaraan: formData.kewarganegaraan,
        status_perkawinan: formData.statusPerkawinan,
        nama_suami_istri: formData.namaPasangan,
        pekerjaan_suami_istri: formData.pekerjaanPasangan || null,
        nama_wajib_pajak: formData.namaWajibPajak,
        nm_wp: formData.namaWajibPajak,
        npwp: formData.npwp,
        
        alamat_jalan: formData.kampungJalan,
        rt: sanitizeRtRw(formData.rt),
        rw: sanitizeRtRw(formData.rw),
        nama_dusun: formData.dusun,
        provinsi: formData.provinsi,
        kabupaten_kota: formData.kotaKabupaten,
        kecamatan: formData.kecamatan,
        desa_kelurahan: formData.desaKelurahan,
        kode_pos: formData.kodePos,
        lintang: formData.lintang ? formData.lintang : null,
        bujur: formData.bujur ? formData.bujur : null,
        
        jenis_ptk_id: formData.jenis_ptk_id || null,
        jabatan_ptk_id: formData.jabatan_ptk_id || null,
        ptk_induk: formData.ptk_induk || null,
        sk_pengangkatan: formData.skPengangkatan,
        tmt_pengangkatan: formData.tmtPengangkatan ? new Date(formData.tmtPengangkatan) : null,
        lembaga_pengangkat_id: formData.lembaga_pengangkat_id || null,
        sk_cpns: formData.skCpns,
        tmt_cpns: formData.tmtCpns ? new Date(formData.tmtCpns) : null,
        tmt_pns: formData.tmtPns ? new Date(formData.tmtPns) : null,
        pangkat_golongan_id: formData.pangkat_golongan_id || null,
        sumber_gaji_id: formData.sumber_gaji_id || null,
        
        pendidikan_terakhir: formData.pendidikanTerakhir,
        bidang_studi_terakhir: formData.bidangStudi,
        
        lisensi_kepsek: formData.lisensiKepsek === "Ya",
        nuks: formData.nuk,
        keahlian_laboratorium_id: formData.keahlian_laboratorium_id || null,
        kebutuhan_khusus_id: formData.kebutuhan_khusus_id || null,
        keahlian_braille: formData.keahlian_braille || null,
        keahlian_bahasa_isyarat: formData.keahlian_bahasa_isyarat || null,

        no_telepon_rumah: formData.noTelpRumah,
        no_hp: formData.noHp,
        no_whatsapp: formData.noWa,
        no_wa: formData.noWa,
        email_akun: formData.email,
        id_telegram: formData.idTelegram,
        foto: formData.avatar,

        id_bank: formData.namaBank,
        nama_kcp: formData.cabangBank,
        rekening_bank: formData.noRekening,
        rekening_atas_nama: formData.atasNamaRekening,
      };

      await dapodikService.updateGtk(id, updatePayload);

      // Reload GTK data to get final clean URLs/IDs from backend
      try {
        const result = await dapodikService.getGtkDetail(id);
        if (result.status === "success" && result.data) {
          setPendingDocs(result.data.foto_dokumen || []);
        }
      } catch (e) {
        console.error("Gagal memuat ulang data dokumen setelah disimpan", e);
      }

      Swal.fire({
        title: "Berhasil",
        text: "Data Berhasil disimpan",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      if (!profileId) {
        navigate(`/${role}/gtk-data`);
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

  const handleEditAnakClick = (a: any) => {
    setEditingAnakId(a.anak_id);
    setAnakForm({
      nama: a.nama || "",
      nik: a.nik || "",
      nisn: a.nisn || "",
      jenis_kelamin: a.jenis_kelamin || "L",
      tempat_lahir: a.tempat_lahir || "",
      tanggal_lahir: a.tanggal_lahir ? a.tanggal_lahir.split('T')[0] : "",
      status_anak_id: String(a.status_anak_id || "1"),
      jenjang_pendidikan_id: String(a.jenjang_pendidikan_id || "0"),
      tahun_masuk: String(a.tahun_masuk || ""),
    });
    setAnakErrors({});
    setIsAnakModalOpen(true);
  };

  const handleDeleteAnakClick = async (anakId: string) => {
    Swal.fire({
      title: "Hapus Data Anak?",
      text: "Apakah Anda yakin ingin menghapus data anak ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: "Sedang menghapus...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          await dapodikService.deleteGtkAnak(id!, anakId);

          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Data anak berhasil dihapus!",
            timer: 2000,
            showConfirmButton: false
          });

          const refreshedData = await dapodikService.getGtkDetail(id!);
          if (refreshedData.status === "success" && refreshedData.data) {
            setFormData((prev: any) => ({
              ...prev,
              anak: refreshedData.data.anak || []
            }));
          }
        } catch (err: any) {
          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: err.response?.data?.message || "Gagal menghapus data anak.",
            timer: 2500,
            showConfirmButton: false
          });
        }
      }
    });
  };

  const handleSaveAnak = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    if (!anakForm.nama) errors.nama = "Nama anak wajib diisi";
    if (!anakForm.tanggal_lahir) errors.tanggal_lahir = "Tanggal lahir wajib diisi";
    if (anakForm.nik && anakForm.nik.length !== 16) errors.nik = "NIK harus tepat 16 digit";
    if (anakForm.nisn && anakForm.nisn.length !== 10) errors.nisn = "NISN harus tepat 10 digit";

    if (Object.keys(errors).length > 0) {
      setAnakErrors(errors);
      return;
    }

    try {
      Swal.fire({
        title: "Sedang menyimpan...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const payload = {
        nama: anakForm.nama,
        nik: anakForm.nik || null,
        nisn: anakForm.nisn || null,
        jenis_kelamin: anakForm.jenis_kelamin,
        tempat_lahir: anakForm.tempat_lahir || null,
        tanggal_lahir: anakForm.tanggal_lahir,
        status_anak_id: Number(anakForm.status_anak_id),
        jenjang_pendidikan_id: Number(anakForm.jenjang_pendidikan_id),
        tahun_masuk: anakForm.tahun_masuk ? Number(anakForm.tahun_masuk) : null,
      };

      let response;
      if (editingAnakId) {
        response = await dapodikService.updateGtkAnak(id!, editingAnakId, payload);
      } else {
        response = await dapodikService.createGtkAnak(id!, payload);
      }

      if (response) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: editingAnakId ? "Data anak berhasil diperbarui!" : "Data anak berhasil ditambahkan!",
          timer: 2000,
          showConfirmButton: false
        });

        setIsAnakModalOpen(false);
        setEditingAnakId(null);
        const refreshedData = await dapodikService.getGtkDetail(id!);
        if (refreshedData.status === "success" && refreshedData.data) {
          setFormData((prev: any) => ({
            ...prev,
            anak: refreshedData.data.anak || []
          }));
        }
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menyimpan data anak.",
        timer: 2500,
        showConfirmButton: false
      });
    }
  };

  useEffect(() => {
    if (isMapModalOpen) {
      setTimeout(initMap, 200);
    }
  }, [isMapModalOpen]);

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

  return (
    <>
      <PageMeta
        title={`Ubah Data GTK - ${formData.nama || ""} | SIMAK Admin Panel`}
        description="Edit GTK details page"
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
                onClick={() => navigate(`/${role}/gtk-data`)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Daftar
              </button>
            )}
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {profileId ? "Profil Saya" : "Ubah Data Guru dan Tenaga Kependidikan"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {profileId ? "Rincian profil dan data identitas Anda" : <>Ubah rincian data untuk GTK: <span className="font-semibold text-brand-500">{formData.nama || "Memuat..."}</span></>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {!profileId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/${role}/gtk-data`)}
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
          {activeTab === "profil" && (
            <div className={`rounded-2xl border ${errors.namaWajibPajak || errors.npwp ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Profil & Identitas
              </h4>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Photo Column */}
              <div className="w-full lg:w-1/3 flex flex-col items-center pr-8 lg:border-r lg:border-gray-100 dark:lg:border-white/[0.05]">
                <div className="relative group">
                  <div className="w-48 h-64 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/[0.02]">
                    {formData.avatar ? (
                      <img src={getFotoUrl(formData.avatar)} alt="Profile" className="w-full h-full object-cover object-top" />
                    ) : (
                      <img src="/images/default/profile.jpg" alt="Profile Fallback" className="w-full h-full object-cover object-top opacity-60" />
                    )}
                  </div>
                  <button onClick={handleTriggerUpload} className="absolute bottom-2 right-2 p-2 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-4 text-xs text-gray-700 dark:text-gray-400 text-center italic">
                  Format: JPG, JPEG, PNG. <br/>Maksimal 500Kb.
                </p>
                <Button variant="outline" size="sm" className="mt-4 w-full text-gray-800 dark:text-gray-200" onClick={handleTriggerUpload}>Ganti Foto</Button>

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
              
              {/* Form Inputs Column */}
              <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.nama || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>NIK</Label><Input value={formData.nik || ""} maxLength={16} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2">
                    <Label>Nomor KK <span className="text-red-500">*</span></Label>
                    <Input 
                      error={errors.kk}
                      value={formData.kk || ""} 
                      maxLength={16} 
                      placeholder="Masukkan Nomor KK" 
                      onChange={(e) => handleInputChange("kk", e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="space-y-2"><Label>NUPTK</Label><Input value={formData.nuptk || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>NIP/NIY/NIGB</Label><Input value={formData.nipNiyNigb || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Jenis Kelamin</Label><Input value={formData.jk === "L" ? "Laki-laki" : formData.jk === "P" ? "Perempuan" : formData.jk || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Tempat Lahir</Label><Input value={formData.tempatLahir || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>Tanggal Lahir</Label><Input value={formData.tanggalLahir || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2">
                    <Label>Nama Ibu Kandung</Label>
                    <Input value={formData.ibuKandung || ""} placeholder="Data kosong dari Dapodik" disabled />
                  </div>
                  <div className="space-y-2"><Label>Kewarganegaraan</Label><Input value={formData.kewarganegaraan || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
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
                    <Label>Status Perkawinan <span className="text-red-500">*</span></Label>
                    <select
                      value={formData.statusPerkawinan || ""}
                      onChange={(e) => handleInputChange("statusPerkawinan", e.target.value)}
                      className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.statusPerkawinan ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                    >
                      <option value="">Pilih Status Perkawinan</option>
                      <option value="1">Kawin</option>
                      <option value="2">Belum Kawin</option>
                      <option value="3">Janda/Duda</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Pasangan {isMarried && <span className="text-red-500">*</span>}</Label>
                    <Input 
                      error={errors.namaPasangan}
                      value={formData.namaPasangan || ""} 
                      placeholder="Masukkan nama pasangan" 
                      onChange={(e) => handleInputChange("namaPasangan", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pekerjaan Pasangan {isMarried && <span className="text-red-500">*</span>}</Label>
                    <select
                      value={formData.pekerjaanPasangan || ""}
                      onChange={(e) => handleInputChange("pekerjaanPasangan", e.target.value)}
                      className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.pekerjaanPasangan ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                    >
                      <option value="">Pilih Pekerjaan Pasangan</option>
                      {(refOptions?.pekerjaan || refOptions?.mst_pekerjaan || []).map((o: any, idx: number) => (
                        <option key={o.pekerjaan_id || o.id || idx} value={o.pekerjaan_id || o.id}>{o.nama || o.pekerjaan}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Wajib Pajak <span className="text-red-500">*</span></Label>
                    <Input 
                      error={errors.namaWajibPajak} 
                      value={formData.namaWajibPajak || ""} 
                      placeholder="Masukkan nama wajib pajak"
                      onChange={(e) => handleInputChange("namaWajibPajak", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NPWP <span className="text-red-500">*</span></Label>
                    <Input 
                      error={errors.npwp} 
                      value={formData.npwp || ""} 
                      placeholder="Masukkan NPWP"
                      onChange={(e) => handleInputChange("npwp", e.target.value)} 
                    />
                  </div>
              </div>
            </div>
          </div>
          )}

          {/* Card 2: Alamat */}
          {activeTab === "alamat" && (
            <div className={`rounded-2xl border ${errors.lintang || errors.bujur ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Alamat Rumah
              </h4>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kampung/Jalan <span className="text-red-500">*</span></Label>
                  <Input 
                    error={errors.kampungJalan}
                    value={formData.kampungJalan || ""} 
                    placeholder="Masukkan kampung atau jalan" 
                    onChange={(e) => handleInputChange("kampungJalan", e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>RT <span className="text-red-500">*</span></Label>
                    <Input 
                      error={errors.rt}
                      value={formData.rt || ""} 
                      placeholder="000"
                      onChange={(e) => handleInputChange("rt", e.target.value.replace(/\D/g, ''))} 
                      onBlur={() => handleInputChange("rt", format3Digits(formData.rt))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RW <span className="text-red-500">*</span></Label>
                    <Input 
                      error={errors.rw}
                      value={formData.rw || ""} 
                      placeholder="000"
                      onChange={(e) => handleInputChange("rw", e.target.value.replace(/\D/g, ''))} 
                      onBlur={() => handleInputChange("rw", format3Digits(formData.rw))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dusun</Label>
                  <Input 
                    error={errors.dusun}
                    value={formData.dusun || ""} 
                    placeholder="Masukkan dusun" 
                    onChange={(e) => handleInputChange("dusun", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provinsi <span className="text-red-500">*</span></Label>
                  <select
                    value={addrProvinces.find(p => p.nama === formData.provinsi)?.kode_wilayah || ""}
                    onChange={(e) => {
                      const selectedOpt = addrProvinces.find(p => String(p.kode_wilayah) === e.target.value);
                      handleAddrProvinceChange(e.target.value, selectedOpt?.nama || "");
                    }}
                    className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.provinsi ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                  >
                    <option value="">{formData.provinsi || "Pilih Provinsi"}</option>
                    {addrProvinces.map((prov, idx) => (
                      <option key={prov.kode_wilayah || idx} value={prov.kode_wilayah}>{prov.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Kab./Kota <span className="text-red-500">*</span></Label>
                  <select
                    value={addrKabupatens.find(k => k.nama === formData.kotaKabupaten)?.kode_wilayah || ""}
                    onChange={(e) => {
                      const selectedOpt = addrKabupatens.find(k => String(k.kode_wilayah) === e.target.value);
                      handleAddrKabupatenChange(e.target.value, selectedOpt?.nama || "");
                    }}
                    className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.kotaKabupaten ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                  >
                    <option value="">{formData.kotaKabupaten || "Pilih Kabupaten/Kota"}</option>
                    {addrKabupatens.map((kab, idx) => (
                      <option key={kab.kode_wilayah || idx} value={kab.kode_wilayah}>{kab.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Kecamatan <span className="text-red-500">*</span></Label>
                  <select
                    value={formData.kecamatan || ""}
                    onChange={(e) => {
                      handleAddrKecamatanChange(e.target.value);
                    }}
                    className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.kecamatan ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                  >
                    <option value="">{formData.kecamatan || "Pilih Kecamatan"}</option>
                    {addrKecamatans.map((kec, idx) => (
                      <option key={kec.kode_wilayah || idx} value={kec.kode_wilayah}>{kec.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Desa/Kelurahan <span className="text-red-500">*</span></Label>
                  <select
                    value={formData.desaKelurahan || ""}
                    onChange={(e) => {
                      handleAddrDesaChange(e.target.value);
                    }}
                    className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.desaKelurahan ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                  >
                    <option value="">{formData.desaKelurahan || "Pilih Desa/Kelurahan"}</option>
                    {addrDesas.map((desa, idx) => (
                      <option key={desa.nama || idx} value={desa.nama}>{desa.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Kode Pos <span className="text-red-500">*</span></Label>
                  <Input 
                    error={errors.kodePos}
                    value={formData.kodePos || ""} 
                    placeholder="Masukkan kode pos" 
                    onChange={(e) => handleInputChange("kodePos", e.target.value.replace(/\D/g, ''))} 
                  />
                </div>
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
          )}

          {/* Card 3: Kepegawaian */}
          {activeTab === "kepegawaian" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Kepegawaian
              </h4>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis PTK</Label>
                    <Input value={formData.jenisPtk || ""} disabled placeholder="Data kosong dari Dapodik" />
                  </div>
                  <div className="space-y-2">
                    <Label>Jabatan PTK</Label>
                    <Input value={formData.jabatanPtk || ""} disabled placeholder="Data kosong dari Dapodik" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status Induk (PTK Induk)</Label>
                    <Input value={formData.ptkInduk || ""} disabled placeholder="Data kosong dari Dapodik" />
                  </div>
                   <div className="space-y-2"><Label>SK. Pengangkatan</Label><Input value={formData.skPengangkatan || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>TMT Pengangkatan</Label><Input value={formData.tmtPengangkatan || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2">
                    <Label>Lembaga Pengangkat</Label>
                    <Input value={formData.lembagaPengangkat || ""} disabled placeholder="Data kosong dari Dapodik" />
                  </div>
                  <div className="space-y-2"><Label>SK CPNS</Label><Input value={formData.skCpns || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>TMT CPNS</Label><Input value={formData.tmtCpns || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>TMT PNS</Label><Input value={formData.tmtPns || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2">
                    <Label>Pangkat Terakhir</Label>
                    <Input value={formData.pangkatTerakhir || ""} disabled placeholder="Data kosong dari Dapodik" />
                  </div>
                   <div className="space-y-2 md:col-span-2">
                    <Label>Sumber Gaji <span className="text-red-500">*</span></Label>
                    <select
                      value={formData.sumber_gaji_id || ""}
                      onChange={(e) => {
                        const opt = (refOptions?.sumber_gaji || refOptions?.sumber_gaji_id || []).find((o: any) => String(o.sumber_gaji_id || o.id) === e.target.value);
                        setFormData((prev: any) => ({
                          ...prev,
                          sumber_gaji_id: e.target.value,
                          sumberGaji: opt?.nama || opt?.sumber_gaji || ""
                        }));
                      }}
                      className={`w-full rounded-lg border p-3 text-sm dark:bg-white/[0.03] dark:text-white ${errors.sumber_gaji_id ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"}`}
                    >
                      <option value="">Pilih Sumber Gaji</option>
                      {(refOptions?.sumber_gaji || refOptions?.sumber_gaji_id || []).map((o: any, idx: number) => (
                        <option key={o.sumber_gaji_id || o.id || idx} value={o.sumber_gaji_id || o.id}>{o.nama || o.sumber_gaji}</option>
                      ))}
                    </select>
                  </div>
              </div>
              
              <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 dark:text-white/90">Riwayat Kepangkatan</h5>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="max-w-full overflow-x-auto custom-scrollbar">
                      <Table className="min-w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                              <TableRow>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Gol</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nomor SK</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">TMT</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Masa Kerja</TableCell>
                              </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                              {formData.riwayatKepangkatan && formData.riwayatKepangkatan.length > 0 ? (
                                  formData.riwayatKepangkatan.map((r: any, i: number) => (
                                      <TableRow key={i}>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.gol || r.pangkat || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.nomorSk || r.nomor_sk || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.tmt || (r.tmt_golongan ? formatDateToIndonesian(r.tmt_golongan) : "-")}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.masaKerja || `${r.masa_kerja_tahun || 0}th ${r.masa_kerja_bulan || 0}bln`}</TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={4} className="px-5 py-10 text-center italic text-gray-500">Belum ada riwayat kepangkatan</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 dark:text-white/90">Tugas Tambahan</h5>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="max-w-full overflow-x-auto custom-scrollbar">
                      <Table className="min-w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                              <TableRow>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jabatan / Tugas</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nomor SK</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">TMT</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">TST</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jml Jam</TableCell>
                              </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                              {formData.tugasTambahan && formData.tugasTambahan.length > 0 ? (
                                  formData.tugasTambahan.map((t: any, i: number) => (
                                      <TableRow key={i}>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{t.jabatan || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{t.nomorSk || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{t.tmt || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{t.tst || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{t.jumlahJam || 0}</TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={5} className="px-5 py-10 text-center italic text-gray-500">Belum ada tugas tambahan</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                    </div>
                  </div>
              </div>
            </div>
          </div>
          )}

          {/* Card 4: Pendidikan */}
          {activeTab === "pendidikan" && (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Pendidikan Formal
              </h4>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label>Pendidikan Terakhir</Label>
                      <Input 
                          value={formData.pendidikanTerakhir || ""} 
                          disabled
                          placeholder="Data kosong dari Dapodik" 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>Bidang Studi</Label>
                      <Input 
                          value={formData.bidangStudi || ""} 
                          disabled
                          placeholder="Data kosong dari Dapodik" 
                      />
                  </div>
              </div>

              <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 dark:text-white/90">Riwayat Pendidikan</h5>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="max-w-full overflow-x-auto custom-scrollbar">
                      <Table className="min-w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                              <TableRow>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jenjang</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Institusi</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tahun Lulus</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">IPK</TableCell>
                              </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                              {formData.riwayatPendidikan && formData.riwayatPendidikan.length > 0 ? (
                                  formData.riwayatPendidikan.map((r: any, i: number) => (
                                      <TableRow key={i}>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.jenjang || r.jenjang_pendidikan_id_str || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.institusi || r.nama_satuan_pendidikan || r.satuan_pendidikan_formal || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.tahunLulus || r.tahun_lulus || "-"}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.ipk || (r.ipk_rata_rata_nilai !== null && r.ipk_rata_rata_nilai !== undefined ? String(r.ipk_rata_rata_nilai) : "-")}</TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={4} className="px-5 py-10 text-center italic text-gray-500">Belum ada riwayat pendidikan</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                    </div>
                  </div>
              </div>
              </div>
            </div>

            {/* Card 5: Kompetensi */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
              <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Kompetensi
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Lisensi Kepsek</Label><Input value={formData.lisensiKepsek || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                <div className="space-y-2"><Label>No. Registrasi (NUK)</Label><Input value={formData.nuk || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                <div className="space-y-2">
                  <Label>Keahlian Lab</Label>
                  <Input value={formData.keahlianLab || ""} disabled placeholder="Data kosong dari Dapodik" />
                </div>
                <div className="space-y-2">
                  <Label>Menangani Keb. Khusus</Label>
                  <Input value={formData.kebutuhanKhusus || ""} disabled placeholder="Data kosong dari Dapodik" />
                </div>
                <div className="space-y-2">
                  <Label>Keahlian Braille</Label>
                  <Input value={formData.keahlianBraille || ""} disabled placeholder="Data kosong dari Dapodik" />
                </div>
                <div className="space-y-2">
                  <Label>Bahasa Isyarat</Label>
                  <Input value={formData.bahasaIsyarat || ""} disabled placeholder="Data kosong dari Dapodik" />
                </div>
              </div>
            </div>
          </>
          )}
 
          {/* Card 6: Kontak */}
          {activeTab === "kontak" && (
            <div className={`rounded-2xl border ${errors.noTelpRumah || errors.noHp || errors.noWa || errors.idTelegram ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Kontak
              </h4>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Telp Rumah <span className="text-red-500">*</span></Label>
                <Input 
                  error={errors.noTelpRumah}
                  value={formData.noTelpRumah || ""} 
                  onChange={(e) => handleInputChange("noTelpRumah", e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 022-123456" 
                />
              </div>
              <div className="space-y-2">
                <Label>No. Handphone <span className="text-red-500">*</span></Label>
                <Input 
                  error={errors.noHp}
                  value={formData.noHp || ""} 
                  onChange={(e) => handleInputChange("noHp", e.target.value.replace(/\D/g, ''))}
                  placeholder="0812XXXXXXXX" 
                />
              </div>
              <div className="space-y-2">
                <Label>No. Whatsapp <span className="text-red-500">*</span></Label>
                <Input 
                  error={errors.noWa}
                  value={formData.noWa || ""} 
                  onChange={(e) => handleInputChange("noWa", e.target.value.replace(/\D/g, ''))}
                  placeholder="0812XXXXXXXX" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={formData.email || ""} 
                  disabled
                  placeholder="nama@email.com" 
                />
              </div>
              <div className="space-y-2">
                <Label>Id. Telegram <span className="text-red-500">*</span></Label>
                <Input 
                  error={errors.idTelegram}
                  value={formData.idTelegram || ""} 
                  onChange={(e) => handleInputChange("idTelegram", e.target.value)}
                  placeholder="@username" 
                />
              </div>
            </div>
          </div>
          )}

          {/* Card 7: Sertifikasi (Serdik) & Data Bank */}
          {activeTab === "sertifikasi" && (
            <div className={`rounded-2xl border ${formData.memilikiSertifikasi === "Ya" && (errors.namaBank || errors.cabangBank || errors.noRekening || errors.atasNamaRekening) ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Sertifikasi (Serdik) & Rekening Bank
              </h4>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 dark:text-white/90">Riwayat Sertifikasi</h5>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="max-w-full overflow-x-auto custom-scrollbar">
                      <Table className="min-w-full">
                          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                              <TableRow>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Lembaga Sertifikasi</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Bidang Studi</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jenis Sertifikasi</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Berlaku</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Habis Berlaku</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No. Sertifikasi</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No. Registrasi</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nomor Peserta</TableCell>
                                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Kualifikasi</TableCell>
                              </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                              {formData.riwayatSertifikasi && formData.riwayatSertifikasi.length > 0 ? (
                                  formData.riwayatSertifikasi.map((r: any, i: number) => (
                                      <TableRow key={i}>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.lembagaSertifikasi}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.bidangStudi}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.jenisSertifikasi}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.tglBerlaku}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.tglHabisBerlaku}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.noSertifikasi}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.noRegistrasi}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.nomorPeserta}</TableCell>
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.kualifikasi}</TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  <TableRow>
                                      <TableCell colSpan={9} className="px-5 py-10 text-center italic text-gray-500">Belum ada riwayat sertifikasi</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                    </div>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <Label className="mb-0">Apakah memiliki riwayat sertifikasi guru? <i className="bx bx-lock-alt ms-1 text-muted small" title="Data sinkron otomatis dari Dapodik"></i></Label>
                  <Switch 
                      label=""
                      checked={formData.memilikiSertifikasi === "Ya"}
                      onChange={(checked) => handleInputChange("memilikiSertifikasi", checked ? "Ya" : "Tidak")}
                      disabled
                  />
              </div>

              <div className="space-y-4 border-t pt-6 border-gray-100 dark:border-white/[0.05]">
                  <h5 className="font-semibold text-gray-800 dark:text-white/90">Data Bank</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Bank {hasSertifikasi && <span className="text-red-500">*</span>}</Label>
                        <SearchableSelect
                          options={bankList}
                          value={formData.namaBank || ""}
                          onChange={(value) => handleInputChange("namaBank", value)}
                          disabled={!hasSertifikasi}
                          placeholder="Pilih Bank"
                          error={errors.namaBank}
                          labelKey="nm_bank"
                          valueKey="id_bank"
                        />
                      </div>
                       <div className="space-y-2">
                        <Label>Cabang Bank {hasSertifikasi && <span className="text-red-500">*</span>}</Label>
                        <Input 
                          error={errors.cabangBank}
                          value={formData.cabangBank || ""} 
                          onChange={(e) => handleInputChange("cabangBank", e.target.value)}
                          placeholder={hasSertifikasi ? "Nama cabang" : "Tidak memerlukan sertifikasi"} 
                          disabled={!hasSertifikasi}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No. Rekening {hasSertifikasi && <span className="text-red-500">*</span>}</Label>
                        <Input 
                          error={errors.noRekening}
                          value={formData.noRekening || ""} 
                          onChange={(e) => handleInputChange("noRekening", e.target.value.replace(/\D/g, ''))}
                          placeholder={hasSertifikasi ? "Nomor rekening" : "Tidak memerlukan sertifikasi"} 
                          disabled={!hasSertifikasi}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Atas Nama (a.n.) {hasSertifikasi && <span className="text-red-500">*</span>}</Label>
                        <Input 
                          error={errors.atasNamaRekening}
                          value={formData.atasNamaRekening || ""} 
                          onChange={(e) => handleInputChange("atasNamaRekening", e.target.value)}
                          placeholder={hasSertifikasi ? "Nama pemilik rekening" : "Tidak memerlukan sertifikasi"} 
                          disabled={!hasSertifikasi}
                        />
                      </div>
                  </div>
              </div>
            </div>
          </div>
          )}

          {/* Card: Anak */}
          {activeTab === "anak" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
              <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3 flex justify-between items-center">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Data Anak
                </h4>
                <Button size="sm" onClick={() => {
                  setAnakForm({ nama: "", nik: "", nisn: "", jenis_kelamin: "L", tempat_lahir: "", tanggal_lahir: "", status_anak_id: "1", jenjang_pendidikan_id: "0", tahun_masuk: "" });
                  setAnakErrors({});
                  setEditingAnakId(null);
                  setIsAnakModalOpen(true);
                }}
                variant="outline"
                startIcon={<PlusIcon className="size-4 fill-current" />}>
                  Tambah Anak
                </Button>
              </div>
              
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto custom-scrollbar">
                  <Table className="min-w-full">
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NIK</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NISN</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jenis Kelamin</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tempat, Tgl Lahir</TableCell>
                         <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jenjang Pendidikan</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status Anak</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Aksi</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {formData.anak && formData.anak.length > 0 ? (
                        formData.anak.map((a: any, i: number) => (
                          <TableRow key={i} className={Number(a.soft_delete || 0) === 1 ? "opacity-60 bg-gray-50/50 dark:bg-white/[0.01]" : ""}>
                            <TableCell className="px-5 py-4 text-gray-700 font-medium text-start text-theme-sm dark:text-gray-300">{a.nama || "-"}</TableCell>
                            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{a.nik?.trim() || "-"}</TableCell>
                            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{a.nisn?.trim() || "-"}</TableCell>
                            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {a.jenis_kelamin === "L" ? "Laki-laki" : a.jenis_kelamin === "P" ? "Perempuan" : a.jenis_kelamin || "-"}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {a.tempat_lahir || "-"}, {a.tanggal_lahir ? formatDateToIndonesian(a.tanggal_lahir) : "-"}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {a.jenjang_pendidikan?.nama || a.jenjang_pendidikan_id || "-"}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {a.status_anak?.nama || a.status_anak_id || "-"}
                              {Number(a.soft_delete || 0) === 1 && (
                                <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">Non-Aktif</span>
                              )}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-center text-theme-sm">
                              {Number(a.soft_delete || 0) === 1 ? (
                                <span className="text-gray-400 dark:text-gray-600">-</span>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditAnakClick(a)}
                                    className="text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 p-1"
                                    title="Edit"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAnakClick(a.anak_id)}
                                    className="text-error-500 hover:text-error-700 dark:hover:text-error-400 p-1"
                                    title="Hapus"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="px-5 py-10 text-center italic text-gray-500">Belum ada data anak</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Card 8: Dokumen */}
          {activeTab === "dokumen" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
              <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3 flex justify-between items-center">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Upload Dokumen
                </h4>
                <Button 
                   variant="outline"
                   size="sm" 
                   onClick={handleAddNewRow}
                   type="button"
                   startIcon={<PlusIcon className="size-4 fill-current" />}
                 >
                   Tambah
                 </Button>
              </div>

              <Alert
                variant="warning"
                title="Informasi Upload Dokumen"
                message="Dokumen yang diunggah harus memiliki format PDF dan ukuran maksimal 200 KB."
              />

              <div className="mt-4">
                {pendingDocs && pendingDocs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pendingDocs.map((doc: any) => {
                      if (doc.isNew) {
                        return (
                          <div key={doc.id} className="border border-dashed border-gray-300 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl p-5 flex flex-col justify-between min-h-[190px] shadow-sm">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                                  <span className="text-[10px] text-brand-500 font-semibold tracking-wider uppercase">Unggahan Baru</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePendingDocument(doc)}
                                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1"
                                  title="Hapus"
                                >
                                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              <Input 
                                value={doc.nama || ""} 
                                onChange={(e) => handleRowNameChange(doc.id, e.target.value)} 
                                placeholder="Nama File (KTP / Ijazah)" 
                                className="h-9 text-xs"
                              />
                              <input 
                                type="file" 
                                accept="application/pdf"
                                className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-50 file:text-brand-700 dark:file:bg-white/[0.05] dark:file:text-white border border-gray-200 dark:border-gray-800 rounded-lg h-9 px-2 flex items-center pt-1.5"
                                onChange={(e) => handleRowFileChange(doc.id, e.target.files ? e.target.files[0] : null)}
                              />
                              {doc.file && (
                                <p className="text-[10px] text-brand-600 font-medium truncate">Terpilih: {doc.file.name}</p>
                              )}
                            </div>
                          </div>
                        );
                      } else {
                        const fileUrl = doc.fileUrl.startsWith('/') ? `${apiBaseUrl}${doc.fileUrl}` : doc.fileUrl;
                        return (
                          <div key={doc.id} className="border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.02] rounded-2xl p-5 flex flex-col justify-between min-h-[190px] shadow-sm">
                            <div className="flex items-start gap-3 min-w-0">
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
                              <div className="min-w-0">
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Nama Dokumen</span>
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate mt-0.5" title={doc.nama}>{doc.nama}</h5>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.03]">
                              <button 
                                type="button"
                                onClick={() => handleViewDoc(fileUrl, doc.fileName || doc.fileUrl || doc.nama, doc.id)}
                                className="flex-1 py-1.5 text-xs font-bold text-center text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-white/[0.03] rounded-lg border border-brand-100 dark:border-white/[0.05] transition-colors"
                              >
                                Lihat
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDownloadDoc(fileUrl, doc.nama)} 
                                className="flex-1 py-1.5 text-xs font-bold text-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.05] transition-colors"
                              >
                                Unduh
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReplaceDocument(doc)}
                                className="flex-1 py-1.5 text-xs font-bold text-center text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg border border-amber-100 dark:border-amber-500/20 transition-colors"
                              >
                                Ganti
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePendingDocument(doc)}
                                className="flex-1 py-1.5 text-xs font-bold text-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20 transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada dokumen yang ditambahkan. Klik tombol "+ Tambah" di atas untuk mengunggah dokumen baru.</p>
                  </div>
                )}

                {pendingDocs && pendingDocs.some(d => d.isNew) && (
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                    <Button
                      type="button"
                      variant="primary-outline"
                      onClick={handleSaveAllNewDocuments}
                      disabled={loading}
                      className="px-6 py-2.5 text-sm font-semibold flex items-center gap-2"
                    >
                      Simpan Dokumen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>


      </div>

      {/* Leaflet Map Modal (popup coordinate picker) */}
      <Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} showCloseButton={false} className="max-w-[900px] p-0 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white dark:bg-gray-900 pr-12">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Cari & Pilih Lokasi</h3>
          <button type="button" onClick={() => setIsMapModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Pilih Data yang Ingin Diperbaiki</h3>
          <button onClick={() => setIsPengajuanModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
          {Object.keys(FIELD_MAP_GTK)
            .filter((key) => {
              const allowedKeys = [
                "nama", "nik", "jenis_kelamin", "tempat_lahir", "tanggal_lahir", "nama_ibu_kandung"
              ];
              return allowedKeys.includes(key);
            })
            .map((key) => {
              const field = FIELD_MAP_GTK[key];
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
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Formulir Pengajuan Perbaikan Data</h3>
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
            const field = FIELD_MAP_GTK[fieldKey];
            if (!field) return null;

            let oldVal = "";
            if (fieldKey === "lintang_bujur") {
              oldVal = `Lintang: ${formData.lintang || "-"}, Bujur: ${formData.bujur || "-"}`;
            } else if (fieldKey === "wilayah") {
              oldVal = `${formData.provinsi || "-"} / ${formData.kotaKabupaten || "-"} / ${formData.kecamatan || "-"} / ${formData.desaKelurahan || "-"}`;
            } else {
              oldVal = formData[field.localKey] || "-";
              if (fieldKey === "jenis_kelamin") {
                oldVal = formData.jk === "L" ? "Laki-laki" : formData.jk === "P" ? "Perempuan" : formData.jk || "-";
              } else if (fieldKey === "status_perkawinan") {
                oldVal = formData.statusPerkawinan || "-";
              } else if (fieldKey === "agama_id") {
                oldVal = formData.agama || "-";
              } else if (fieldKey === "id_bank") {
                oldVal = formData.namaBank || "-";
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
                  ) : fieldKey === "status_perkawinan" ? (
                    <select
                      value={pengajuanForm[fieldKey] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handlePengajuanInputChange(fieldKey, val);
                        if (val !== "1") {
                          handlePengajuanInputChange("nama_suami_istri", "");
                          handlePengajuanInputChange("pekerjaan_suami_istri", "");
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                    >
                      <option value="">Pilih Status Perkawinan</option>
                      <option value="1">Kawin</option>
                      <option value="2">Belum Kawin</option>
                      <option value="3">Janda/Duda</option>
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
                      ]).map((r: any, idx: number) => (
                        <option key={r.agama_id || r.id || idx} value={r.agama_id || r.id}>
                          {r.nama || r.nama_agama || r.agama_nama}
                        </option>
                      ))}
                    </select>
                  ) : fieldKey === "id_bank" ? (
                    <SearchableSelect
                      options={bankList}
                      value={pengajuanForm[fieldKey] || ""}
                      onChange={(value) => handlePengajuanInputChange(fieldKey, value)}
                      placeholder="Pilih Bank"
                      labelKey="nm_bank"
                      valueKey="id_bank"
                    />
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
                        {provinces.map((p: any, idx: number) => (
                          <option key={p.kode_wilayah || idx} value={p.kode_wilayah}>
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
                        {kabupatens.map((k: any, idx: number) => (
                          <option key={k.kode_wilayah || idx} value={k.kode_wilayah}>
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
                        {kecamatans.map((kec: any, idx: number) => (
                          <option key={kec.kode_wilayah || idx} value={kec.kode_wilayah}>
                            {kec.nama}
                          </option>
                        ))}
                      </select>

                      <select
                        value={pengajuanForm.desa_kelurahan || ""}
                        onChange={(e) => handleDesaChange(e.target.value)}
                        disabled={!pengajuanForm.kecamatan}
                        className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none disabled:opacity-50"
                      >
                        <option value="">Pilih Desa/Kelurahan</option>
                        {desas.map((d: any, idx: number) => (
                          <option key={d.kode_wilayah || idx} value={d.nama}>
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
                  ) : (
                    <input
                      type={fieldKey === 'tanggal_lahir' ? 'date' : 'text'}
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

      <PrintGTKCardPreview
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        person={selectedPersonForCard}
      />

      {/* Modal: Tambah Anak */}
      <Modal isOpen={isAnakModalOpen} onClose={() => { setIsAnakModalOpen(false); setEditingAnakId(null); }} className="max-w-[600px] p-6 overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/[0.05] pb-4 mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            {editingAnakId ? "Edit Data Anak" : "Tambah Data Anak"}
          </h3>
          <button onClick={() => { setIsAnakModalOpen(false); setEditingAnakId(null); }} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSaveAnak} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nama Anak <span className="text-red-500">*</span></Label>
              <Input
                value={anakForm.nama || ""}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, nama: e.target.value }))}
                placeholder="Masukkan nama lengkap anak"
                error={anakErrors.nama}
              />
            </div>
            <div className="space-y-2">
              <Label>NIK</Label>
              <Input
                value={anakForm.nik || ""}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, nik: e.target.value.replace(/\D/g, '').substring(0, 16) }))}
                placeholder="Masukkan 16 digit NIK"
                error={anakErrors.nik}
              />
            </div>
            <div className="space-y-2">
              <Label>NISN</Label>
              <Input
                value={anakForm.nisn || ""}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, nisn: e.target.value.replace(/\D/g, '').substring(0, 10) }))}
                placeholder="Masukkan 10 digit NISN"
                error={anakErrors.nisn}
              />
            </div>
            <div className="space-y-2">
              <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
              <select
                value={anakForm.jenis_kelamin || "L"}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, jenis_kelamin: e.target.value }))}
                className="w-full rounded-lg border p-3 text-sm dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-800 focus:outline-none"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tempat Lahir</Label>
              <Input
                value={anakForm.tempat_lahir || ""}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, tempat_lahir: e.target.value }))}
                placeholder="Tempat lahir anak"
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Lahir <span className="text-red-500">*</span></Label>
              <input
                type="date"
                value={anakForm.tanggal_lahir || ""}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, tanggal_lahir: e.target.value }))}
                className={`w-full rounded-lg border p-3 text-sm dark:bg-gray-900 dark:text-white ${anakErrors.tanggal_lahir ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-800"} focus:outline-none`}
              />
            </div>
            <div className="space-y-2">
              <Label>Tahun Masuk Sekolah</Label>
              <Input
                type="number"
                value={anakForm.tahun_masuk || ""}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, tahun_masuk: e.target.value }))}
                placeholder="Contoh: 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Jenjang Pendidikan <span className="text-red-500">*</span></Label>
              <select
                value={anakForm.jenjang_pendidikan_id || "0"}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, jenjang_pendidikan_id: e.target.value }))}
                className="w-full rounded-lg border p-3 text-sm dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-800 focus:outline-none"
              >
                {(refOptions?.jenjang_pendidikan || []).map((p: any, idx: number) => (
                  <option key={p.jenjang_pendidikan_id || p.id || idx} value={p.jenjang_pendidikan_id || p.id}>{p.nama || p.jenjang_pendidikan}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status Anak <span className="text-red-500">*</span></Label>
              <select
                value={anakForm.status_anak_id || "1"}
                onChange={(e) => setAnakForm((p: any) => ({ ...p, status_anak_id: e.target.value }))}
                className="w-full rounded-lg border p-3 text-sm dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-800 focus:outline-none"
              >
                <option value="1">Anak Kandung</option>
                <option value="2">Anak Tiri</option>
                <option value="3">Anak Angkat</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 dark:border-white/[0.05] pt-4">
            <button
              type="button"
              onClick={() => setIsAnakModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02]"
            >
              Batal
            </button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

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

export default EditGTKPage;
