import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import OriginalInput from "../../components/form/input/InputField";
import type { InputProps } from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import api from "../../services/api";

const Input: React.FC<InputProps> = (props) => {
  return <OriginalInput {...props} showStatusIcon={true} />;
};
import Switch from "../../components/form/switch/Switch";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import { dapodikService } from "../../services/dapodikService";
import { referenceService } from "../../services/referenceService";
import Swal from "sweetalert2";
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

const EditGTKPage: React.FC = () => {
  const { role, id } = useParams<{ role: string; id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profil");

  const tabs = [
    { id: "profil", label: "Profil & Identitas" },
    { id: "alamat", label: "Alamat Rumah" },
    { id: "kepegawaian", label: "Kepegawaian" },
    { id: "pendidikan", label: "Pendidikan" },
    { id: "sertifikasi", label: "Sertifikasi & Rekening" },
    { id: "kontak", label: "Kontak" },
    { id: "dokumen", label: "Berkas Dokumen" },
  ];

  const apiBaseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace("/api", "") 
    : "http://localhost:3000";

  const hasTabError = (tabId: string) => {
    if (tabId === "kontak") return !!(errors.noWa || errors.idTelegram);
    return false;
  };

  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState<{lat: string, lng: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Document Upload State
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]); 
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<any>({});

  const [isPengajuanModalOpen, setIsPengajuanModalOpen] = useState(false);
  const [isFormPengajuanOpen, setIsFormPengajuanOpen] = useState(false);
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

  const handleReset2FA = async () => {
    const confirm = await Swal.fire({
      title: "Set Ulang Authenticator?",
      text: "Pengguna harus melakukan scan ulang QR code Google Authenticator saat login berikutnya.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Set Ulang!",
      cancelButtonText: "Batal"
    });

    if (confirm.isConfirmed) {
      try {
        Swal.fire({
          title: "Memproses...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await api.post("/auth/reset-2fa", { ptk_id: id });
        
        Swal.fire("Berhasil", "Authenticator (2FA) berhasil diset ulang.", "success");
      } catch (err: any) {
        console.error(err);
        const errMsg = err.response?.data?.message || "Gagal menyetel ulang authenticator.";
        Swal.fire("Error", errMsg, "error");
      }
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
              tanggalLahir: data.tanggal_lahir ? data.tanggal_lahir.split('T')[0] : "",
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
              tmtPengangkatan: data.tmt_pengangkatan ? data.tmt_pengangkatan.split('T')[0] : "",
              lembagaPengangkat: data.lembaga_pengangkat_nama || "",
              skCpns: data.sk_cpns || "",
              tmtCpns: data.tmt_cpns ? data.tmt_cpns.split('T')[0] : "",
              tmtPns: data.tmt_pns ? data.tmt_pns.split('T')[0] : "",
              pangkatTerakhir: data.pangkat_golongan_nama || "",
              sumberGaji: data.sumber_gaji_nama || "",
              sumber_gaji_id: data.sumber_gaji_id || "",
              
              riwayatKepangkatan: data.rwy_kepangkatan ? data.rwy_kepangkatan.map((k: any) => ({
                gol: k.pangkat_golongan_nama || k.pangkat || "-",
                nomorSk: k.nomor_sk || "",
                tmt: k.tmt_pangkat ? k.tmt_pangkat.split('T')[0] : (k.tmt_golongan ? k.tmt_golongan.split('T')[0] : "-"),
                masaKerja: k.masa_kerja_gol_tahun !== undefined ? `${k.masa_kerja_gol_tahun || 0}th ${k.masa_kerja_gol_bulan || 0}bln` : (k.masaKerja || `${k.masa_kerja_tahun || 0}th ${k.masa_kerja_bulan || 0}bln`),
              })) : [],
              
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
                tglBerlaku: s.tgl_sert ? s.tgl_sert.split('T')[0] : "",
                tglHabisBerlaku: s.tgl_exp_sert ? s.tgl_exp_sert.split('T')[0] : "",
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && id) {
      if (file.size > 500 * 1024) {
        Swal.fire({ title: "File Terlalu Besar", text: "Ukuran foto maksimal adalah 500Kb", icon: "error", confirmButtonColor: "#465FFF" });
        return;
      }
      
      setLoading(true);
      try {
        const result = await dapodikService.uploadGtkFoto(id, file);
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

  const handleAddDocument = async () => {
    if (!id) return;
    if (!docName || !docFile) {
      Swal.fire({
        title: "Data Tidak Lengkap",
        text: "Nama File dan File Dokumen harus diisi",
        icon: "warning",
        confirmButtonColor: "#465FFF",
      });
      return;
    }

    // Validate size: images max 100KB, pdf max 200KB
    const ext = docFile.name.substring(docFile.name.lastIndexOf('.')).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    const maxSize = isImage ? 100 * 1024 : 200 * 1024;
    
    if (docFile.size > maxSize) {
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
      await dapodikService.uploadGtkDokumen(id, docFile, docName);
      
      // Reload GTK data
      const result = await dapodikService.getGtkDetail(id);
      if (result.status === "success" && result.data) {
        setPendingDocs(result.data.foto_dokumen || []);
      }
      
      // Reset local state
      setDocName("");
      setDocFile(null);
      if (docFileInputRef.current) {
        docFileInputRef.current.value = "";
      }
      Swal.fire({ title: "Berhasil", text: "Dokumen berhasil ditambahkan", icon: "success", confirmButtonColor: "#465FFF" });
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Gagal mengunggah dokumen", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePendingDocument = async (doc: any) => {
    if (!id) return;
    const confirm = await Swal.fire({
      title: "Hapus Dokumen?",
      text: `Apakah Anda yakin ingin menghapus dokumen "${doc.nama}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#EF4444",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await dapodikService.deleteGtkDokumen(id, doc.fileName);
      
      // Reload GTK data
      const result = await dapodikService.getGtkDetail(id);
      if (result.status === "success" && result.data) {
        setPendingDocs(result.data.foto_dokumen || []);
      }
      Swal.fire({ title: "Berhasil", text: "Dokumen berhasil dihapus", icon: "success", confirmButtonColor: "#465FFF" });
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Gagal menghapus dokumen", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCoordinates = () => {
    setIsMapModalOpen(true);
    
    // Load Leaflet and Geosearch dynamically
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("geosearch-css")) {
      const link = document.createElement("link");
      link.id = "geosearch-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet-geosearch@3.11.0/dist/geosearch.css";
      document.head.appendChild(link);
    }

    if (!window.hasOwnProperty("L")) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => loadGeosearch();
      document.head.appendChild(script);
    } else {
      loadGeosearch();
    }
  };

  const loadGeosearch = () => {
    if (!(window as any).GeoSearch) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet-geosearch@3.11.0/dist/bundle.min.js";
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      setTimeout(initMap, 100);
    }
  };

  const initMap = () => {
    const L = (window as any).L;
    const GeoSearch = (window as any).GeoSearch;
    if (!L || !GeoSearch) return;

    const container = document.getElementById("map-picker-container");
    if (!container) return;
    
    // @ts-ignore
    if (container._leaflet_id) { container._leaflet_id = null; container.innerHTML = ""; }

    const initialLat = parseFloat(formData.lintang || "-6.200000");
    const initialLng = parseFloat(formData.bujur || "106.816666");

    const map = L.map("map-picker-container").setView([initialLat, initialLng], 15);

    const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap' });
    const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles &copy; Esri" });

    satelliteLayer.addTo(map);
    const baseMaps = { "Satelit": satelliteLayer, "Jalan": streetLayer };
    L.control.layers(baseMaps).addTo(map);

    const searchControl = new (GeoSearch.GeoSearchControl)({
      provider: new GeoSearch.OpenStreetMapProvider(),
      style: 'bar',
      showMarker: false,
      autoClose: true,
      searchLabel: 'Cari alamat atau tempat...',
    });
    map.addControl(searchControl);

    let marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    setTempCoords({ lat: initialLat.toFixed(6), lng: initialLng.toFixed(6) });

    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setTempCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    });

    marker.on("dragend", (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      setTempCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    });

    map.on('geosearch/showlocation', (result: any) => {
      const { x, y } = result.location;
      marker.setLatLng([y, x]);
      setTempCoords({ lat: y.toFixed(6), lng: x.toFixed(6) });
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
    
    // Check validation constraints matching dashboard required fields (*)
    if (!formData.noWa) { newErrors.noWa = true; hasError = true; }
    if (!formData.idTelegram) { newErrors.idTelegram = true; hasError = true; }

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
      Swal.fire({ title: "Berhasil", text: "Data Berhasil disimpan", icon: "success", confirmButtonColor: "#465FFF" });
      navigate(`/${role}/gtk-data`);
    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMapModalOpen) {
      setTimeout(initMap, 200);
    }
  }, [isMapModalOpen]);

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
            <button
              onClick={() => navigate(`/${role}/gtk-data`)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar
            </button>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              Ubah Data Guru dan Tenaga Kependidikan
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ubah rincian data untuk GTK: <span className="font-semibold text-brand-500">{formData.nama || "Memuat..."}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/${role}/gtk-data`)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] transition-colors"
            >
              Batal
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
                  <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/[0.02]">
                    {formData.avatar ? (
                      <img src={getFotoUrl(formData.avatar)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/images/default/profile.jpg" alt="Profile Fallback" className="w-full h-full object-cover opacity-60" />
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
                          <li>Pastikan wajah terlihat jelas and tegak lurus</li>
                          <li>Pastikan pencahayaan cukup and tidak buram</li>
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
                    <Label>Nomor KK</Label>
                    <Input 
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
                  <div className="space-y-2"><Label>Tanggal Lahir</Label><Input type="date" value={formData.tanggalLahir || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2">
                    <Label>Nama Ibu Kandung</Label>
                    <Input value={formData.ibuKandung || ""} placeholder="Data kosong dari Dapodik" disabled />
                  </div>
                  <div className="space-y-2"><Label>Kewarganegaraan</Label><Input value={formData.kewarganegaraan || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
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
                    <Label>Status Perkawinan</Label>
                    <select
                      value={formData.statusPerkawinan || ""}
                      onChange={(e) => handleInputChange("statusPerkawinan", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                    >
                      <option value="">Pilih Status Perkawinan</option>
                      <option value="1">Kawin</option>
                      <option value="2">Belum Kawin</option>
                      <option value="3">Janda/Duda</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Pasangan</Label>
                    <Input 
                      value={formData.namaPasangan || ""} 
                      placeholder="Masukkan nama pasangan" 
                      onChange={(e) => handleInputChange("namaPasangan", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pekerjaan Pasangan</Label>
                    <select
                      value={formData.pekerjaanPasangan || ""}
                      onChange={(e) => handleInputChange("pekerjaanPasangan", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                    >
                      <option value="">Pilih Pekerjaan Pasangan</option>
                      {(refOptions?.pekerjaan || refOptions?.mst_pekerjaan || []).map((o: any) => (
                        <option key={o.pekerjaan_id || o.id} value={o.pekerjaan_id || o.id}>{o.nama || o.pekerjaan}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Wajib Pajak</Label>
                    <Input 
                      error={errors.namaWajibPajak} 
                      value={formData.namaWajibPajak || ""} 
                      placeholder="Masukkan nama wajib pajak"
                      onChange={(e) => handleInputChange("namaWajibPajak", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NPWP</Label>
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
                <div className="space-y-2"><Label>Kampung/Jalan</Label><Input value={formData.kampungJalan || ""} placeholder="Masukkan kampung atau jalan" onChange={(e) => handleInputChange("kampungJalan", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>RT</Label>
                    <Input 
                      value={formData.rt || ""} 
                      placeholder="000"
                      onChange={(e) => handleInputChange("rt", e.target.value.replace(/\D/g, ''))} 
                      onBlur={() => handleInputChange("rt", format3Digits(formData.rt))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RW</Label>
                    <Input 
                      value={formData.rw || ""} 
                      placeholder="000"
                      onChange={(e) => handleInputChange("rw", e.target.value.replace(/\D/g, ''))} 
                      onBlur={() => handleInputChange("rw", format3Digits(formData.rw))}
                    />
                  </div>
                </div>
                <div className="space-y-2"><Label>Dusun</Label><Input value={formData.dusun || ""} placeholder="Masukkan dusun" onChange={(e) => handleInputChange("dusun", e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Provinsi</Label>
                  <select
                    value={addrProvinces.find(p => p.nama === formData.provinsi)?.kode_wilayah || ""}
                    onChange={(e) => {
                      const selectedOpt = addrProvinces.find(p => String(p.kode_wilayah) === e.target.value);
                      handleAddrProvinceChange(e.target.value, selectedOpt?.nama || "");
                    }}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                  >
                    <option value="">{formData.provinsi || "Pilih Provinsi"}</option>
                    {addrProvinces.map((prov) => (
                      <option key={prov.kode_wilayah} value={prov.kode_wilayah}>{prov.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Kab./Kota</Label>
                  <select
                    value={addrKabupatens.find(k => k.nama === formData.kotaKabupaten)?.kode_wilayah || ""}
                    onChange={(e) => {
                      const selectedOpt = addrKabupatens.find(k => String(k.kode_wilayah) === e.target.value);
                      handleAddrKabupatenChange(e.target.value, selectedOpt?.nama || "");
                    }}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                  >
                    <option value="">{formData.kotaKabupaten || "Pilih Kabupaten/Kota"}</option>
                    {addrKabupatens.map((kab) => (
                      <option key={kab.kode_wilayah} value={kab.kode_wilayah}>{kab.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Kecamatan</Label>
                  <select
                    value={formData.kecamatan || ""}
                    onChange={(e) => {
                      handleAddrKecamatanChange(e.target.value);
                    }}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                  >
                    <option value="">{formData.kecamatan || "Pilih Kecamatan"}</option>
                    {addrKecamatans.map((kec) => (
                      <option key={kec.kode_wilayah} value={kec.kode_wilayah}>{kec.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Desa/Kelurahan</Label>
                  <select
                    value={formData.desaKelurahan || ""}
                    onChange={(e) => {
                      handleAddrDesaChange(e.target.value);
                    }}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                  >
                    <option value="">{formData.desaKelurahan || "Pilih Desa/Kelurahan"}</option>
                    {addrDesas.map((desa) => (
                      <option key={desa.nama} value={desa.nama}>{desa.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2"><Label>Kode Pos</Label><Input value={formData.kodePos || ""} placeholder="Masukkan kode pos" onChange={(e) => handleInputChange("kodePos", e.target.value)} /></div>
                <div className="space-y-2">
                   <Label>Lintang</Label>
                   <Input 
                     error={errors.lintang}
                     value={formData.lintang || ""} 
                     placeholder="Contoh: -6.200000"
                     onChange={(e) => handleInputChange("lintang", e.target.value)} 
                   />
                </div>
                <div className="space-y-2">
                   <Label>Bujur</Label>
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
                  <div className="space-y-2"><Label>TMT Pengangkatan</Label><Input type="date" value={formData.tmtPengangkatan || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2">
                    <Label>Lembaga Pengangkat</Label>
                    <Input value={formData.lembagaPengangkat || ""} disabled placeholder="Data kosong dari Dapodik" />
                  </div>
                  <div className="space-y-2"><Label>SK CPNS</Label><Input value={formData.skCpns || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>TMT CPNS</Label><Input type="date" value={formData.tmtCpns || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2"><Label>TMT PNS</Label><Input type="date" value={formData.tmtPns || ""} placeholder="Data kosong dari Dapodik" disabled /></div>
                  <div className="space-y-2">
                    <Label>Pangkat Terakhir</Label>
                    <Input value={formData.pangkatTerakhir || ""} disabled placeholder="Data kosong dari Dapodik" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Sumber Gaji</Label>
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
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                    >
                      <option value="">Pilih Sumber Gaji</option>
                      {(refOptions?.sumber_gaji || refOptions?.sumber_gaji_id || []).map((o: any) => (
                        <option key={o.sumber_gaji_id || o.id} value={o.sumber_gaji_id || o.id}>{o.nama || o.sumber_gaji}</option>
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
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.tmt || (r.tmt_golongan ? r.tmt_golongan.split('T')[0] : "-")}</TableCell>
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
                <Label>No. Telp Rumah</Label>
                <Input 
                  error={errors.noTelpRumah}
                  value={formData.noTelpRumah || ""} 
                  onChange={(e) => handleInputChange("noTelpRumah", e.target.value)}
                  placeholder="Contoh: 022-123456" 
                />
              </div>
              <div className="space-y-2">
                <Label>No. Handphone</Label>
                <Input 
                  error={errors.noHp}
                  value={formData.noHp || ""} 
                  onChange={(e) => handleInputChange("noHp", e.target.value)}
                  placeholder="0812XXXXXXXX" 
                />
              </div>
              <div className="space-y-2">
                <Label>No. Whatsapp <span className="text-red-500">*</span></Label>
                <Input 
                  error={errors.noWa}
                  value={formData.noWa || ""} 
                  onChange={(e) => handleInputChange("noWa", e.target.value)}
                  placeholder="0812XXXXXXXX" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex gap-2">
                  <Input 
                    type="email" 
                    value={formData.email || ""} 
                    disabled
                    placeholder="nama@email.com" 
                    className="flex-grow"
                  />
                  {formData.email && (
                    <button
                      type="button"
                      onClick={handleReset2FA}
                      className="px-3 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Reset 2FA
                    </button>
                  )}
                </div>
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
                        <Label>Nama Bank</Label>
                        <select
                          value={formData.namaBank || ""}
                          onChange={(e) => handleInputChange("namaBank", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                        >
                          <option value="">Pilih Bank</option>
                          {bankList.map((b: any) => (
                            <option key={b.id_bank || b.id} value={b.id_bank || b.id}>
                              {b.nm_bank || b.nama_bank || b.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                       <div className="space-y-2">
                        <Label>Cabang Bank</Label>
                        <Input 
                          error={errors.cabangBank}
                          value={formData.cabangBank || ""} 
                          onChange={(e) => handleInputChange("cabangBank", e.target.value)}
                          placeholder="Nama cabang" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No. Rekening</Label>
                        <Input 
                          error={errors.noRekening}
                          value={formData.noRekening || ""} 
                          onChange={(e) => handleInputChange("noRekening", e.target.value)}
                          placeholder="Nomor rekening" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Atas Nama (a.n.)</Label>
                        <Input 
                          error={errors.atasNamaRekening}
                          value={formData.atasNamaRekening || ""} 
                          onChange={(e) => handleInputChange("atasNamaRekening", e.target.value)}
                          placeholder="Nama pemilik rekening" 
                        />
                      </div>
                  </div>
              </div>
            </div>
          </div>
          )}

          {/* Card 8: Dokumen */}
          {activeTab === "dokumen" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Berkas Dokumen
              </h4>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 dark:border-white/[0.05] p-6 rounded-xl">
                  <div className="space-y-2">
                      <Label>Nama File</Label>
                      <Input 
                          value={docName} 
                          onChange={(e) => setDocName(e.target.value)} 
                          placeholder="Contoh: KTP / Ijazah" 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>Pilih File</Label>
                      <input 
                        type="file" 
                        ref={docFileInputRef}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-white/[0.05] dark:file:text-white dark:hover:file:bg-white/[0.1] border border-gray-200 dark:border-gray-800 rounded-lg h-11 px-2"
                        onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                      />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                      <Button size="sm" onClick={handleAddDocument}>Tambah File</Button>
                  </div>
              </div>

              <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 dark:text-white/90">Daftar Dokumen</h5>
                  {pendingDocs && pendingDocs.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {pendingDocs.map((doc: any) => (
                              <div key={doc.id} className="border border-gray-200 dark:border-white/[0.05] rounded-xl p-3 flex flex-col items-center relative group">
                                  <button onClick={() => handleRemovePendingDocument(doc)} className="absolute top-2 right-2 bg-error-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                  <a 
                                    href={doc.fileUrl.startsWith('/') ? `${apiBaseUrl}${doc.fileUrl}` : doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-brand-500 hover:underline text-center truncate w-full"
                                    title={doc.nama}
                                  >
                                    {doc.nama}
                                  </a>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-10 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada dokumen yang ditambahkan.</p>
                      </div>
                  )}
              </div>
            </div>
          </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <button
            onClick={() => navigate(`/${role}/gtk-data`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Batal
          </button>
          <Button variant="primary-outline" onClick={handleSave} disabled={loading}>
            Simpan Perubahan
          </Button>
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
           <div className="flex gap-3"><button onClick={() => setIsMapModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400">Batal</button><Button variant="primary" size="sm" onClick={handleUseLocation}>Gunakan Lokasi Ini</Button></div>
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
                      ]).map((r: any) => (
                        <option key={r.agama_id || r.id} value={r.agama_id || r.id}>
                          {r.nama || r.nama_agama || r.agama_nama}
                        </option>
                      ))}
                    </select>
                  ) : fieldKey === "id_bank" ? (
                    <select
                      value={pengajuanForm[fieldKey] || ""}
                      onChange={(e) => handlePengajuanInputChange(fieldKey, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none"
                    >
                      <option value="">Pilih Bank</option>
                      {bankList.map((b: any) => (
                        <option key={b.id_bank || b.id} value={b.id_bank || b.id}>
                          {b.nm_bank || b.nama_bank || b.nama || b.bank_nama}
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
                        onChange={(e) => handleDesaChange(e.target.value)}
                        disabled={!pengajuanForm.kecamatan}
                        className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-sm text-gray-800 dark:text-white/90 outline-none disabled:opacity-50"
                      >
                        <option value="">Pilih Desa/Kelurahan</option>
                        {desas.map((d: any) => (
                          <option key={d.kode_wilayah} value={d.nama}>
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
    </>
  );
};

export default EditGTKPage;
