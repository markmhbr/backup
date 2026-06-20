import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Switch from "../../components/form/switch/Switch";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import { dapodikService } from "../../services/dapodikService";
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

  // Regional Data State
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");

  const [errors, setErrors] = useState<any>({});

  // Helper function to convert to Title Case
  const toTitleCase = (str: string) => {
    return str ? str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "";
  };

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

  // Fetch Banks
  useEffect(() => {
    const indonesianBanks = [
      { value: "008", label: "Bank Mandiri" },
      { value: "002", label: "Bank Rakyat Indonesia (BRI)" },
      { value: "009", label: "Bank Negara Indonesia (BNI)" },
      { value: "014", label: "Bank Central Asia (BCA)" },
      { value: "451", label: "Bank Syariah Indonesia (BSI)" },
      { value: "200", label: "Bank Tabungan Negara (BTN)" },
      { value: "022", label: "Bank CIMB Niaga" },
      { value: "013", label: "Bank Permata" },
      { value: "011", label: "Bank Danamon" },
      { value: "426", label: "Bank Mega" },
      { value: "110", label: "Bank BJB" },
      { value: "542", label: "Bank Jago" },
      { value: "147", label: "Bank Muamalat" },
      { value: "213", label: "Bank BTPN" },
      { value: "028", label: "Bank OCBC NISP" },
      { value: "019", label: "Bank Panin" },
      { value: "441", label: "Bank Bukopin" },
      { value: "490", label: "Bank Neo Commerce" },
      { value: "111", label: "BPD DKI" },
      { value: "113", label: "BPD Jateng" },
      { value: "114", label: "BPD Jatim" }
    ];
    setBanks(indonesianBanks.sort((a, b) => a.label.localeCompare(b.label)));
  }, []);

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
              agama: data.agama_id_str || "",
              kewarganegaraan: data.kewarganegaraan || "ID",
              statusPerkawinan: data.status_perkawinan || "",
              namaPasangan: data.nama_suami_istri || "",
              pekerjaanPasangan: data.pekerjaan_suami_istri || "",
              namaWajibPajak: data.nama_wajib_pajak || "",
              npwp: data.npwp || "",
              
              kampungJalan: data.alamat_jalan || "",
              rt: format3Digits(data.rt),
              rw: format3Digits(data.rw),
              dusun: data.dusun || "",
              provinsi: data.provinsi || "",
              kotaKabupaten: data.kabupaten_kota || "",
              kecamatan: data.kecamatan || "",
              desaKelurahan: data.desa_kelurahan || "",
              kodePos: data.kode_pos || "",
              lintang: data.lintang ? String(data.lintang) : "",
              bujur: data.bujur ? String(data.bujur) : "",
              
              jenisPTK: data.jenis_ptk_id_str || "",
              jabatanPTK: data.jabatan_ptk_id_str || "",
              statusInduk: data.ptk_induk === "1" ? "Ya" : data.ptk_induk === "0" ? "Tidak" : data.ptk_induk || "",
              skPengangkatan: data.sk_pengangkatan || "",
              tmtPengangkatan: data.tmt_pengangkatan ? data.tmt_pengangkatan.split('T')[0] : "",
              lembagaPengangkat: data.lembaga_pengangkat || "",
              skCpns: data.sk_cpns || "",
              tmtCpns: data.tmt_cpns ? data.tmt_cpns.split('T')[0] : "",
              tmtPns: data.tmt_pns ? data.tmt_pns.split('T')[0] : "",
              pangkatTerakhir: data.pangkat_golongan_terakhir || "",
              sumberGaji: data.sumber_gaji || "",
              
              riwayatKepangkatan: data.rwy_kepangkatan ? (typeof data.rwy_kepangkatan === 'string' ? JSON.parse(data.rwy_kepangkatan) : data.rwy_kepangkatan) : [],
              
              pendidikanTerakhir: data.pendidikan_terakhir || "",
              bidangStudi: data.bidang_studi_terakhir || "",
              riwayatPendidikan: (data.riwayat_pendidikan_formal && data.riwayat_pendidikan_formal.length > 0)
                ? data.riwayat_pendidikan_formal
                : (data.rwy_pend_formal ? (typeof data.rwy_pend_formal === 'string' ? JSON.parse(data.rwy_pend_formal) : data.rwy_pend_formal) : []),
              
              lisensiKepsek: data.lisensi_kepsek ? "Ya" : "Tidak",
              nuk: data.nuks || "",
              keahlianLab: data.keahlian_laboratorium || "",
              kebutuhanKhusus: data.mampu_menangani_kebutuhan_khusus || "",
              keahlianBraille: data.keahlian_braille ? "Ya" : "Tidak",
              bahasaIsyarat: data.keahlian_bahasa_isyarat ? "Ya" : "Tidak",
              
              noTelpRumah: data.no_telepon_rumah || "",
              noHp: data.no_hp || "",
              noWa: data.no_wa || "",
              email: data.penggunas?.[0]?.email || "",
              idTelegram: data.qr_token || "",
              
              riwayatSertifikasi: data.rwy_sertifikasi ? data.rwy_sertifikasi.map((s: any) => ({
                lembagaSertifikasi: s.lemb_sertifikasi?.nm_lemb_sert || s.kode_lemb_sert || "",
                bidangStudi: s.bidang_studi?.bidang_studi || s.bidang_studi_id_str || "",
                jenisSertifikasi: s.id_jenis_sertifikasi || "",
                tglBerlaku: s.tgl_sert ? s.tgl_sert.split('T')[0] : "",
                tglHabisBerlaku: s.tgl_exp_sert ? s.tgl_exp_sert.split('T')[0] : "",
                noSertifikasi: s.nomor_sertifikat || "",
                noRegistrasi: s.nomer_registrasi || "",
                nomorPeserta: s.nomor_peserta || "",
                kualifikasi: s.kualifikasi || "",
              })) : [],
              memilikiSertifikasi: data.rwy_sertifikasi && data.rwy_sertifikasi.length > 0 ? "Ya" : "Tidak",
              avatar: data.foto || "",
              
              namaBank: data.id_bank || "",
              cabangBank: data.nama_kcp || "",
              noRekening: data.rekening_bank || "",
              atasNamaRekening: data.rekening_atas_nama || "",
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
    if (!formData.namaWajibPajak) { newErrors.namaWajibPajak = true; hasError = true; }
    if (!formData.npwp) { newErrors.npwp = true; hasError = true; }
    if (!formData.lintang) { newErrors.lintang = true; hasError = true; }
    if (!formData.bujur) { newErrors.bujur = true; hasError = true; }
    if (!formData.noTelpRumah) { newErrors.noTelpRumah = true; hasError = true; }
    if (!formData.noHp) { newErrors.noHp = true; hasError = true; }
    if (!formData.noWa) { newErrors.noWa = true; hasError = true; }
    if (!formData.idTelegram) { newErrors.idTelegram = true; hasError = true; }

    if (formData.memilikiSertifikasi === "Ya") {
      if (!formData.namaBank) { newErrors.namaBank = true; hasError = true; }
      if (!formData.cabangBank) { newErrors.cabangBank = true; hasError = true; }
      if (!formData.noRekening) { newErrors.noRekening = true; hasError = true; }
      if (!formData.atasNamaRekening) { newErrors.atasNamaRekening = true; hasError = true; }
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
        agama_id_str: formData.agama,
        kewarganegaraan: formData.kewarganegaraan,
        status_perkawinan: formData.statusPerkawinan,
        nama_suami_istri: formData.namaPasangan,
        pekerjaan_suami_istri: formData.pekerjaanPasangan,
        nama_wajib_pajak: formData.namaWajibPajak,
        npwp: formData.npwp,
        
        alamat_jalan: formData.kampungJalan,
        rt: sanitizeRtRw(formData.rt),
        rw: sanitizeRtRw(formData.rw),
        dusun: formData.dusun,
        provinsi: formData.provinsi,
        kabupaten_kota: formData.kotaKabupaten,
        kecamatan: formData.kecamatan,
        desa_kelurahan: formData.desaKelurahan,
        kode_pos: formData.kodePos,
        lintang: formData.lintang ? formData.lintang : null,
        bujur: formData.bujur ? formData.bujur : null,
        
        jenis_ptk_id_str: formData.jenisPTK,
        jabatan_ptk_id_str: formData.jabatanPTK,
        ptk_induk: formData.statusInduk === "Ya" ? "1" : formData.statusInduk === "Tidak" ? "0" : formData.statusInduk,
        sk_pengangkatan: formData.skPengangkatan,
        tmt_pengangkatan: formData.tmtPengangkatan ? new Date(formData.tmtPengangkatan) : null,
        lembaga_pengangkat: formData.lembagaPengangkat,
        sk_cpns: formData.skCpns,
        tmt_cpns: formData.tmtCpns ? new Date(formData.tmtCpns) : null,
        tmt_pns: formData.tmtPns ? new Date(formData.tmtPns) : null,
        pangkat_golongan_terakhir: formData.pangkatTerakhir,
        sumber_gaji: formData.sumberGaji,
        
        pendidikan_terakhir: formData.pendidikanTerakhir,
        bidang_studi_terakhir: formData.bidangStudi,
        
        lisensi_kepsek: formData.lisensiKepsek === "Ya",
        nuks: formData.nuk,
        keahlian_laboratorium: formData.keahlianLab,
        mampu_menangani_kebutuhan_khusus: formData.kebutuhanKhusus,
        keahlian_braille: formData.keahlianBraille === "Ya",
        keahlian_bahasa_isyarat: formData.bahasaIsyarat === "Ya",

        no_telepon_rumah: formData.noTelpRumah,
        no_hp: formData.noHp,
        no_wa: formData.noWa,
        email_akun: formData.email,
        qr_token: formData.idTelegram,
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
            <Button variant="primary-outline" onClick={handleSave} disabled={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </div>

        {/* Stacked Cards Layout */}
        <div className="space-y-6">

          {/* Card 1: Profil */}
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
                  <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.nama || ""} disabled /></div>
                  <div className="space-y-2"><Label>NIK</Label><Input value={formData.nik || ""} maxLength={16} disabled /></div>
                  <div className="space-y-2"><Label>Nomor KK</Label><Input value={formData.kk || ""} maxLength={16} onChange={(e) => handleInputChange("kk", e.target.value.replace(/\D/g, ''))} /></div>
                  <div className="space-y-2"><Label>NUPTK</Label><Input value={formData.nuptk || ""} disabled /></div>
                  <div className="space-y-2"><Label>NIP/NIY/NIGB</Label><Input value={formData.nipNiyNigb || ""} onChange={(e) => handleInputChange("nipNiyNigb", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Jenis Kelamin</Label><Input value={formData.jk === "L" ? "Laki-laki" : formData.jk === "P" ? "Perempuan" : formData.jk || ""} disabled /></div>
                  <div className="space-y-2"><Label>Tempat Lahir</Label><Input value={formData.tempatLahir || ""} disabled /></div>
                  <div className="space-y-2"><Label>Tanggal Lahir</Label><Input type="date" value={formData.tanggalLahir || ""} disabled /></div>
                  <div className="space-y-2"><Label>Nama Ibu Kandung</Label><Input value={formData.ibuKandung || ""} onChange={(e) => handleInputChange("ibuKandung", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Agama</Label><Input value={formData.agama || ""} disabled /></div>
                  <div className="space-y-2"><Label>Kewarganegaraan</Label><Input value={formData.kewarganegaraan || ""} disabled /></div>
                  <div className="space-y-2"><Label>Status Perkawinan</Label><Input value={formData.statusPerkawinan || ""} onChange={(e) => handleInputChange("statusPerkawinan", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Nama Pasangan</Label><Input value={formData.namaPasangan || ""} onChange={(e) => handleInputChange("namaPasangan", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Pekerjaan Pasangan</Label><Input value={formData.pekerjaanPasangan || ""} onChange={(e) => handleInputChange("pekerjaanPasangan", e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Nama Wajib Pajak <span className="text-red-500">*</span></Label>
                    <Input 
                      error={errors.namaWajibPajak} 
                      value={formData.namaWajibPajak || ""} 
                      onChange={(e) => handleInputChange("namaWajibPajak", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NPWP <span className="text-red-500">*</span></Label>
                    <Input 
                      error={errors.npwp} 
                      value={formData.npwp || ""} 
                      onChange={(e) => handleInputChange("npwp", e.target.value)} 
                    />
                  </div>
              </div>
            </div>
          </div>

          {/* Card 2: Alamat */}
          <div className={`rounded-2xl border ${errors.lintang || errors.bujur ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Alamat Rumah
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Kampung/Jalan</Label><Input value={formData.kampungJalan || ""} onChange={(e) => handleInputChange("kampungJalan", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="space-y-2"><Label>Dusun</Label><Input value={formData.dusun || ""} onChange={(e) => handleInputChange("dusun", e.target.value)} /></div>
              <div className="space-y-2"><Label>Provinsi</Label><Select placeholder="Pilih Provinsi" options={provinces} value={selectedProvinceId} onChange={(val) => {setSelectedProvinceId(val); handleInputChange("provinsi", provinces.find(p=>p.value===val)?.label || ""); }} /></div>
              <div className="space-y-2"><Label>Kab./Kota</Label><Select placeholder="Pilih Kab/Kota" options={regencies} value={selectedRegencyId} disabled={!selectedProvinceId} onChange={(val) => {setSelectedRegencyId(val); handleInputChange("kotaKabupaten", regencies.find(r=>r.value===val)?.label || ""); }} /></div>
              <div className="space-y-2"><Label>Kecamatan</Label><Select placeholder="Pilih Kecamatan" options={districts} value={selectedDistrictId} disabled={!selectedRegencyId} onChange={(val) => {setSelectedDistrictId(val); handleInputChange("kecamatan", districts.find(d=>d.value===val)?.label || ""); }} /></div>
              <div className="space-y-2"><Label>Desa/Kelurahan</Label><Select placeholder="Pilih Desa/Kelurahan" options={villages} value={selectedVillageId} disabled={!selectedDistrictId} onChange={(val) => { setSelectedVillageId(val); handleInputChange("desaKelurahan", villages.find(v=>v.value===val)?.label || ""); }} /></div>
              <div className="space-y-2"><Label>Kode Pos</Label><Input value={formData.kodePos || ""} onChange={(e) => handleInputChange("kodePos", e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Lintang <span className="text-red-500">*</span></Label>
                <Input 
                  error={errors.lintang}
                  value={formData.lintang || ""} 
                  onChange={(e) => handleInputChange("lintang", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Bujur <span className="text-red-500">*</span></Label>
                <Input 
                  error={errors.bujur}
                  value={formData.bujur || ""} 
                  onChange={(e) => handleInputChange("bujur", e.target.value)} 
                />
              </div>
              <div className="col-span-full pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-success-500 text-success-600 hover:bg-success-50 dark:hover:bg-success-950/20" 
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

          {/* Card 3: Kepegawaian */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6">
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Kepegawaian
              </h4>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Jenis PTK</Label><Input value={formData.jenisPTK || ""} disabled /></div>
                  <div className="space-y-2"><Label>Jabatan PTK</Label><Input value={formData.jabatanPTK || ""} disabled /></div>
                  <div className="space-y-2"><Label>Status Induk</Label><Input value={formData.statusInduk || ""} disabled /></div>
                  <div className="space-y-2"><Label>SK. Pengangkatan</Label><Input value={formData.skPengangkatan || ""} disabled /></div>
                  <div className="space-y-2"><Label>TMT Pengangkatan</Label><Input type="date" value={formData.tmtPengangkatan || ""} disabled /></div>
                  <div className="space-y-2"><Label>Lembaga Pengangkat</Label><Input value={formData.lembagaPengangkat || ""} disabled /></div>
                  <div className="space-y-2"><Label>SK CPNS</Label><Input value={formData.skCpns || ""} disabled /></div>
                  <div className="space-y-2"><Label>TMT CPNS</Label><Input type="date" value={formData.tmtCpns || ""} disabled /></div>
                  <div className="space-y-2"><Label>TMT PNS</Label><Input type="date" value={formData.tmtPns || ""} disabled /></div>
                  <div className="space-y-2"><Label>Pangkat Terakhir</Label><Input value={formData.pangkatTerakhir || ""} disabled /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Sumber Gaji</Label><Input value={formData.sumberGaji || ""} onChange={(e) => handleInputChange("sumberGaji", e.target.value)} /></div>
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

          {/* Card 4: Pendidikan */}
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
                          placeholder="Contoh: S1 / Sarjana" 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>Bidang Studi</Label>
                      <Input 
                          value={formData.bidangStudi || ""} 
                          disabled
                          placeholder="Contoh: Bimbingan dan Konseling" 
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
                                          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{r.ipk || r.ipk_rata_rata_nilai || "-"}</TableCell>
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
              <div className="space-y-2"><Label>Lisensi Kepsek</Label><Input value={formData.lisensiKepsek || ""} disabled /></div>
              <div className="space-y-2"><Label>No. Registrasi (NUK)</Label><Input value={formData.nuk || ""} disabled /></div>
              <div className="space-y-2"><Label>Keahlian Lab</Label><Input value={formData.keahlianLab || ""} disabled /></div>
              <div className="space-y-2"><Label>Menangani Keb. Khusus</Label><Input value={formData.kebutuhanKhusus || ""} disabled /></div>
              <div className="space-y-2"><Label>Keahlian Braille</Label><Input value={formData.keahlianBraille || ""} disabled /></div>
              <div className="space-y-2"><Label>Bahasa Isyarat</Label><Input value={formData.bahasaIsyarat || ""} disabled /></div>
            </div>
          </div>

          {/* Card 6: Kontak */}
          <div className={`rounded-2xl border ${errors.noTelpRumah || errors.noHp || errors.noWa || errors.idTelegram ? "border-red-500" : "border-gray-200"} bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Kontak & Komunikasi
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Telp Rumah <span className="text-red-500">*</span></Label>
                <Input 
                  error={errors.noTelpRumah}
                  value={formData.noTelpRumah || ""} 
                  onChange={(e) => handleInputChange("noTelpRumah", e.target.value)}
                  placeholder="Contoh: 022-123456" 
                />
              </div>
              <div className="space-y-2">
                <Label>No. Handphone <span className="text-red-500">*</span></Label>
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

          {/* Card 7: Sertifikasi (Serdik) & Data Bank */}
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
                        <Label>Nama Bank {formData.memilikiSertifikasi === "Ya" && <span className="text-red-500">*</span>}</Label>
                        <Select 
                          className={errors.namaBank ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                          placeholder="Pilih Bank"
                          options={banks}
                          value={formData.namaBank || ""}
                          disabled={formData.memilikiSertifikasi !== "Ya"}
                          onChange={(val) => handleInputChange("namaBank", val)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cabang Bank {formData.memilikiSertifikasi === "Ya" && <span className="text-red-500">*</span>}</Label>
                        <Input 
                          error={errors.cabangBank}
                          value={formData.cabangBank || ""} 
                          disabled={formData.memilikiSertifikasi !== "Ya"}
                          onChange={(e) => handleInputChange("cabangBank", e.target.value)}
                          placeholder="Nama cabang" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>No. Rekening {formData.memilikiSertifikasi === "Ya" && <span className="text-red-500">*</span>}</Label>
                        <Input 
                          error={errors.noRekening}
                          value={formData.noRekening || ""} 
                          disabled={formData.memilikiSertifikasi !== "Ya"}
                          onChange={(e) => handleInputChange("noRekening", e.target.value)}
                          placeholder="Nomor rekening" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Atas Nama (a.n.) {formData.memilikiSertifikasi === "Ya" && <span className="text-red-500">*</span>}</Label>
                        <Input 
                          error={errors.atasNamaRekening}
                          value={formData.atasNamaRekening || ""} 
                          disabled={formData.memilikiSertifikasi !== "Ya"}
                          onChange={(e) => handleInputChange("atasNamaRekening", e.target.value)}
                          placeholder="Nama pemilik rekening" 
                        />
                      </div>
                  </div>
              </div>
            </div>
          </div>

          {/* Card 8: Dokumen */}
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
                                    href={doc.fileUrl.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${doc.fileUrl}` : doc.fileUrl}
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
    </>
  );
};

export default EditGTKPage;
