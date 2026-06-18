import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import FileInput from "../../components/form/input/FileInput";
import Swal from "sweetalert2";
import { DownloadIcon, PrinterIcon, PlusIcon, TrashBinIcon } from "../../icons";
import { dapodikService } from "../../services/dapodikService";

const format3Digits = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "";
  const numStr = String(value).trim();
  if (/^\d+$/.test(numStr)) {
    return numStr.padStart(3, "0");
  }
  return numStr;
};

export default function SchoolProfile() {
  const [activeTab, setActiveTab] = useState<
    "profil" | "administrasi" | "alamat" | "kontak" | "map"
  >("profil");
  const [loading, setLoading] = useState(true);
  const [cadisdikOptions, setCadisdikOptions] = useState<{ value: string; label: string }[]>([]);

  // Form State
  const [profileData, setProfileData] = useState({
    namaSekolah: "",
    npsn: "",
    nss: "",
    kodeWilayah: "",
    lintang: "",
    bujur: "",
    statusSekolah: "",
    cadisdik_id: "",
    namaKepalaSekolah: "",
    namaOperator: "",
    bentukPendidikan: "",
    logo: "",
  });

  const [alamatData, setAlamatData] = useState({
    jalan: "",
    desa: "",
    kecamatan: "",
    kabupaten: "",
    propinsi: "",
    rt: "",
    rw: "",
    kodePos: "",
  });

  const [kontakData, setKontakData] = useState<{
    email: string;
    telepon: string;
    website: string;
    nomorFax: string;
    socialMedia: string[];
  }>({
    email: "",
    telepon: "",
    website: "",
    nomorFax: "",
    socialMedia: [],
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCadisdiks = async () => {
      try {
        const res = await dapodikService.getCadisdiks();
        if (res.status === "success" && Array.isArray(res.data)) {
          const options = res.data.map((c: any) => ({
            value: c.cadisdik_id,
            label: c.nama_instansi
          }));
          setCadisdikOptions(options);
        }
      } catch (err) {
        console.error("Gagal mengambil data cadisdik:", err);
      }
    };

    const fetchSchoolData = async () => {
      try {
        const result = await dapodikService.getSekolah();
        if (result.status === "success" && result.data) {
          const s = result.data;
          
          setProfileData(prev => ({
            ...prev,
            namaSekolah: s.nama || prev.namaSekolah,
            npsn: s.npsn || prev.npsn,
            nss: s.nss || prev.nss,
            kodeWilayah: s.kode_wilayah || prev.kodeWilayah,
            lintang: s.lintang ? String(s.lintang) : prev.lintang,
            bujur: s.bujur ? String(s.bujur) : prev.bujur,
            statusSekolah: s.status_sekolah_str || prev.statusSekolah,
            bentukPendidikan: s.bentuk_pendidikan_id_str || prev.bentukPendidikan,
            namaKepalaSekolah: s.nama_kepala_sekolah || prev.namaKepalaSekolah,
            namaOperator: s.nama_operator || prev.namaOperator,
            logo: s.logo || prev.logo,
            cadisdik_id: s.cadisdik_id || ""
          }));

          if (s.logo) {
            setLogoPreview(s.logo);
          }

          setAlamatData(prev => ({
            ...prev,
            jalan: s.alamat_jalan || prev.jalan,
            desa: s.desa_kelurahan || prev.desa,
            kecamatan: s.kecamatan || prev.kecamatan,
            kabupaten: s.kabupaten_kota || prev.kabupaten,
            propinsi: s.provinsi || prev.propinsi,
            rt: s.rt || prev.rt,
            rw: s.rw || prev.rw,
            kodePos: s.kode_pos || prev.kodePos,
          }));

          let socialMediaRaw = s.social_media;
          let socialMediaUrls: string[] = [];
          if (Array.isArray(socialMediaRaw)) {
            socialMediaUrls = socialMediaRaw.map((item: any) => 
              typeof item === 'string' ? item : (item.url || "")
            ).filter(url => url !== "");
          }

          setKontakData(prev => ({
            ...prev,
            email: s.email || prev.email,
            telepon: s.nomor_telepon || prev.telepon,
            website: s.website || prev.website,
            nomorFax: s.nomor_fax || prev.nomorFax,
            socialMedia: socialMediaUrls
          }));
        }
      } catch (err) {
        console.error("Gagal mengambil data profil sekolah:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCadisdiks();
    fetchSchoolData();
  }, []);

  const getSocialMediaConfig = (url: string) => {
    const lowerUrl = url.toLowerCase();
    let domain = "";
    try {
      if (url) {
        const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
        domain = urlObj.hostname;
      }
    } catch (e) {
      domain = "";
    }

    const favicon = domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      : null;

    if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) {
      return { name: "Facebook", color: "text-blue-600", icon: "FB", favicon };
    }
    if (lowerUrl.includes("instagram.com")) {
      return { name: "Instagram", color: "text-pink-600", icon: "IG", favicon };
    }
    if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
      return { name: "Twitter/X", color: "text-gray-900", icon: "X", favicon };
    }
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      return { name: "YouTube", color: "text-red-600", icon: "YT", favicon };
    }
    if (lowerUrl.includes("tiktok.com")) {
      return {
        name: "TikTok",
        color: "text-black dark:text-white",
        icon: "TT",
        favicon,
      };
    }
    return { name: "Social Media", color: "text-gray-500", icon: "🔗", favicon };
  };

  const [dataRinci] = useState({
    waktuPenyelenggaraan: "Pagi/6 Hari",
    bersediaMenerimaBOS: "Ya",
    sertifikasiISO: "9001:2015",
    sumberListrik: "PLN",
    dayaVA: "2200",
    kontinuitasListrik: "24 Jam",
    idPelanggan: "123456789012",
    nomorMeter: "9876543210",
    jenisMeter: "Prabayar (Token)",
    statusSambungan: "Aktif",
    listrikUtama: "Ya",
    jenisLayanan: "Dedicated",
    jenisKoneksi: "Fiber Optic",
    provider: "Telkom Indonesia",
    bandwidth: "100 Mbps",
    bandwidthUp: "100 Mbps",
    bandwidthDown: "100 Mbps",
    latency: "5 ms",
  });

  const [kompetensiKeahlian] = useState([
    {
      bidang: "Teknologi Informasi dan Komunikasi",
      program: "Teknik Komputer dan Informatika",
      jurusan: "Pengembangan Perangkat Lunak dan GIM",
      tglSK: "2022-01-01",
      noSK: "421.5/123/DISDIK/2022",
    }
  ]);

  const [akreditasi] = useState({
    noSK: "123/BAN-SM/SK/2023",
    tmt: "2023-05-15",
    tst: "2028-05-15",
    nilai: "A",
    lembaga: "BAN-S/M",
  });

  const tabs = [
    { id: "profil", label: "Profil" },
    { id: "alamat", label: "Alamat" },
    { id: "kontak", label: "Kontak" },
    { id: "map", label: "Map" },
  ];

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Tampilkan preview lokal sementara
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Unggah langsung ke server backend
      try {
        Swal.fire({
          title: "Mengunggah...",
          text: "Sedang mengompresi dan menyimpan logo sekolah",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const result = await dapodikService.uploadLogo(file);

        if (result.status === "success" && result.data?.logo) {
          // Gunakan URL absolut dari server
          setLogoPreview(result.data.logo);
          setProfileData((prev) => ({ ...prev, logo: result.data.logo }));
          
          Swal.fire({
            title: "Berhasil!",
            text: "Logo sekolah berhasil diperbarui.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          throw new Error("Gagal menerima data respon dari server.");
        }
      } catch (err: any) {
        console.error(err);
        Swal.fire({
          title: "Gagal Mengunggah!",
          text: err.response?.data?.message || err.message || "Gagal mengunggah logo.",
          icon: "error",
          confirmButtonColor: "#465fff",
        });
      }
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAlamatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAlamatData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKontakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKontakData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialMediaChange = (index: number, value: string) => {
    setKontakData((prev) => {
      const updatedSocial = [...prev.socialMedia];
      updatedSocial[index] = value;
      return { ...prev, socialMedia: updatedSocial };
    });
  };

  const addSocialMedia = () => {
    setKontakData((prev) => ({
      ...prev,
      socialMedia: [...prev.socialMedia, ""],
    }));
  };

  const removeSocialMedia = (index: number) => {
    setKontakData((prev) => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      Swal.fire({
        title: "Menyimpan...",
        text: "Sedang memperbarui profil sekolah",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const payload = {
        nomor_telepon: kontakData.telepon,
        email: kontakData.email,
        website: kontakData.website,
        nomor_fax: kontakData.nomorFax,
        social_media: kontakData.socialMedia,
        cadisdik_id: profileData.cadisdik_id,
      };

      await dapodikService.updateSekolah(payload);

      Swal.fire({
        title: "Berhasil!",
        text: "Profil sekolah berhasil diperbarui.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: "Gagal Menyimpan!",
        text: err.response?.data?.message || err.message || "Terjadi kesalahan saat menyimpan data.",
        icon: "error",
        confirmButtonColor: "#465fff",
      });
    }
  };

  const handleExport = () => {
    Swal.fire({
      title: "Export Data?",
      text: "Data profil sekolah akan diunduh dalam format Excel.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Export!",
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Berhasil!",
          text: "File sedang diunduh...",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Profil Sekolah | SIMAK Admin Panel"
        description="School profile management page"
      />
      
      {/* Header for Print Only */}
      <div className="print-only">
        <div className="mb-8 border-b-2 border-black pb-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 border border-gray-300 flex items-center justify-center bg-white">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-400">LOGO</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold uppercase">{profileData.namaSekolah}</h1>
              <p className="text-md">NPSN: {profileData.npsn} | NSS: {profileData.nss}</p>
              <p className="text-sm">Bentuk Pendidikan: {profileData.bentukPendidikan} | Status: {profileData.statusSekolah}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-end">
            <p className="text-sm italic font-bold">LAPORAN PROFIL SEKOLAH</p>
            <p className="text-xs text-gray-500 font-medium">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Profil */}
          <section>
            <h3 className="text-sm font-bold bg-gray-100 p-2 border border-gray-300 uppercase mb-2">I. Informasi Umum</h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold w-1/3">Nama Sekolah</td>
                  <td className="border border-gray-300 p-2">{profileData.namaSekolah}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">NPSN / NSS</td>
                  <td className="border border-gray-300 p-2">{profileData.npsn} / {profileData.nss}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Bentuk Pendidikan</td>
                  <td className="border border-gray-300 p-2">{profileData.bentukPendidikan}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Status Sekolah</td>
                  <td className="border border-gray-300 p-2">{profileData.statusSekolah}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Cabang Dinas</td>
                  <td className="border border-gray-300 p-2">
                    {cadisdikOptions.find(o => o.value === profileData.cadisdik_id)?.label || profileData.cadisdik_id}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Kepala Sekolah</td>
                  <td className="border border-gray-300 p-2">{profileData.namaKepalaSekolah}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Operator</td>
                  <td className="border border-gray-300 p-2">{profileData.namaOperator}</td>
                </tr>

                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Koordinat (Lintang/Bujur)</td>
                  <td className="border border-gray-300 p-2">{profileData.lintang} / {profileData.bujur}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 2: Alamat */}
          <section>
            <h3 className="text-sm font-bold bg-gray-100 p-2 border border-gray-300 uppercase mb-2">II. Alamat Lengkap</h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold w-1/3">Jalan</td>
                  <td className="border border-gray-300 p-2">{alamatData.jalan}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">RT / RW</td>
                  <td className="border border-gray-300 p-2">{format3Digits(alamatData.rt)} / {format3Digits(alamatData.rw)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Desa / Kelurahan</td>
                  <td className="border border-gray-300 p-2">{alamatData.desa}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Kecamatan</td>
                  <td className="border border-gray-300 p-2">{alamatData.kecamatan}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Kabupaten / Kota</td>
                  <td className="border border-gray-300 p-2">{alamatData.kabupaten}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Provinsi</td>
                  <td className="border border-gray-300 p-2">{alamatData.propinsi}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Kode Pos</td>
                  <td className="border border-gray-300 p-2">{alamatData.kodePos}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 3: Kontak */}
          <section>
            <h3 className="text-sm font-bold bg-gray-100 p-2 border border-gray-300 uppercase mb-2">III. Informasi Kontak</h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold w-1/3">Email</td>
                  <td className="border border-gray-300 p-2">{kontakData.email}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Telepon</td>
                  <td className="border border-gray-300 p-2">{kontakData.telepon}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Fax</td>
                  <td className="border border-gray-300 p-2">{kontakData.nomorFax}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Website</td>
                  <td className="border border-gray-300 p-2">{kontakData.website}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Media Sosial</td>
                  <td className="border border-gray-300 p-2">
                    <ul className="list-disc pl-4">
                      {kontakData.socialMedia.map((url, i) => {
                        const config = getSocialMediaConfig(url);
                        return (
                          <li key={i} className="flex items-center gap-2">
                            {config.favicon && (
                              <img
                                src={config.favicon}
                                alt=""
                                className="w-3 h-3 object-contain"
                              />
                            )}
                            {config.name}: {url}
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 4: Data Periodik */}
          <section>
            <h3 className="text-sm font-bold bg-gray-100 p-2 border border-gray-300 uppercase mb-2">IV. Data Periodik</h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold w-1/3">Waktu Penyelenggaraan</td>
                  <td className="border border-gray-300 p-2">{dataRinci.waktuPenyelenggaraan}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Bersedia Menerima BOS</td>
                  <td className="border border-gray-300 p-2">{dataRinci.bersediaMenerimaBOS}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sertifikasi ISO</td>
                  <td className="border border-gray-300 p-2">{dataRinci.sertifikasiISO}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 5: Listrik & Internet */}
          <section>
            <h3 className="text-sm font-bold bg-gray-100 p-2 border border-gray-300 uppercase mb-2">V. Listrik & Internet</h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold w-1/3">Sumber Listrik</td>
                  <td className="border border-gray-300 p-2">{dataRinci.sumberListrik}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Daya Listrik (VA)</td>
                  <td className="border border-gray-300 p-2">{dataRinci.dayaVA}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Kontinuitas Listrik</td>
                  <td className="border border-gray-300 p-2">{dataRinci.kontinuitasListrik}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">ID Pelanggan</td>
                  <td className="border border-gray-300 p-2">{dataRinci.idPelanggan}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Nomor Meter</td>
                  <td className="border border-gray-300 p-2">{dataRinci.nomorMeter}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Jenis Meter</td>
                  <td className="border border-gray-300 p-2">{dataRinci.jenisMeter}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Status Sambungan</td>
                  <td className="border border-gray-300 p-2">{dataRinci.statusSambungan}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Listrik Utama</td>
                  <td className="border border-gray-300 p-2">{dataRinci.listrikUtama}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Jenis Layanan Internet</td>
                  <td className="border border-gray-300 p-2">{dataRinci.jenisLayanan}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Jenis Koneksi</td>
                  <td className="border border-gray-300 p-2">{dataRinci.jenisKoneksi}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Provider</td>
                  <td className="border border-gray-300 p-2">{dataRinci.provider}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Bandwidth</td>
                  <td className="border border-gray-300 p-2">{dataRinci.bandwidth}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Bandwidth Up / Down</td>
                  <td className="border border-gray-300 p-2">{dataRinci.bandwidthUp} / {dataRinci.bandwidthDown}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Latency</td>
                  <td className="border border-gray-300 p-2">{dataRinci.latency}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 6: Kompetensi Keahlian */}
          <section>
            <h3 className="text-sm font-bold bg-gray-100 p-2 border border-gray-300 uppercase mb-2">VI. Kompetensi Keahlian</h3>
            <table className="w-full border-collapse border border-gray-300 text-xs text-center">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2">Bidang Keahlian</th>
                  <th className="border border-gray-300 p-2">Program Keahlian</th>
                  <th className="border border-gray-300 p-2">Nama Jurusan</th>
                  <th className="border border-gray-300 p-2">Tgl / No SK Izin</th>
                </tr>
              </thead>
              <tbody>
                {kompetensiKeahlian.map((k, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-2">{k.bidang}</td>
                    <td className="border border-gray-300 p-2">{k.program}</td>
                    <td className="border border-gray-300 p-2">{k.jurusan}</td>
                    <td className="border border-gray-300 p-2">{k.tglSK} / {k.noSK}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Section 7: Akreditasi */}
          <section className="break-inside-avoid">
            <h3 className="text-sm font-bold bg-gray-100 p-2 border border-gray-300 uppercase mb-2">VII. Akreditasi</h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold w-1/3">No. SK Akreditasi</td>
                  <td className="border border-gray-300 p-2">{akreditasi.noSK}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">TMT / TST Akreditasi</td>
                  <td className="border border-gray-300 p-2">{akreditasi.tmt} / {akreditasi.tst}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Nilai Akreditasi</td>
                  <td className="border border-gray-300 p-2">{akreditasi.nilai}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Lembaga Akreditasi</td>
                  <td className="border border-gray-300 p-2">{akreditasi.lembaga}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <div className="space-y-6 no-print">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Profil Sekolah
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola informasi profil sekolah Anda di sini.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="success-outline"
              size="sm"
              className="min-w-[110px]"
              startIcon={<DownloadIcon className="size-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[110px]"
              startIcon={<PrinterIcon className="size-4" />}
              onClick={handlePrint}
            >
              Cetak
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar whitespace-nowrap no-print">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
                activeTab === tab.id
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 print-area">
          {activeTab === "profil" && (
            <div className="space-y-6 tab-content">
              <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 no-print">
                Informasi Umum
              </h4>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4 no-print">
                  <div className="flex flex-col items-center gap-4 p-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-white/[0.01]">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-md bg-white dark:bg-gray-800 flex items-center justify-center">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="School Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 dark:text-gray-600">
                            Logo
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full">
                      <Label className="text-center mb-2">Logo Sekolah</Label>
                      <FileInput onChange={handleLogoChange} />
                      <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                        Format: JPG, PNG. Maksimal 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 print:col-span-12">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label>Nama Sekolah</Label>
                      <Input
                        name="namaSekolah"
                        value={profileData.namaSekolah}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Nomor Pokok (NPSN)</Label>
                      <Input
                        name="npsn"
                        value={profileData.npsn}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Nomor Statistik Sekolah (NSS)</Label>
                      <Input
                        name="nss"
                        value={profileData.nss}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Kode Wilayah</Label>
                      <Input
                        name="kodeWilayah"
                        value={profileData.kodeWilayah}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Bentuk Pendidikan</Label>
                      <Input
                        name="bentukPendidikan"
                        value={profileData.bentukPendidikan}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Status Sekolah</Label>
                      <Input
                        name="statusSekolah"
                        value={profileData.statusSekolah}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Cabang Dinas</Label>
                      <Select
                        options={cadisdikOptions}
                        value={profileData.cadisdik_id}
                        placeholder="Pilih Cabang Dinas"
                        onChange={(value) =>
                          handleSelectChange(value, "cadisdik_id")
                        }
                      />
                    </div>
                    <div>
                      <Label>Nama Kepala Sekolah</Label>
                      <Input
                        name="namaKepalaSekolah"
                        value={profileData.namaKepalaSekolah}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Nama Operator</Label>
                      <Input
                        name="namaOperator"
                        value={profileData.namaOperator}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>

                    <div>
                      <Label>Lintang</Label>
                      <Input
                        name="lintang"
                        value={profileData.lintang}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Bujur</Label>
                      <Input
                        name="bujur"
                        value={profileData.bujur}
                        onChange={handleProfileChange}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end no-print">
                <Button onClick={handleSave}>Simpan Perubahan</Button>
              </div>
            </div>
          )}


          {activeTab === "alamat" && (
            <div className="space-y-6 tab-content">
              <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 no-print">
                Alamat Lengkap
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <Label>Alamat</Label>
                    <Input
                      name="jalan"
                      value={alamatData.jalan}
                      onChange={handleAlamatChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Rt</Label>
                    <Input
                      name="rt"
                      value={format3Digits(alamatData.rt)}
                      onChange={handleAlamatChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Rw</Label>
                    <Input
                      name="rw"
                      value={format3Digits(alamatData.rw)}
                      onChange={handleAlamatChange}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Desa/Kelurahan</Label>
                    <Input
                      name="desa"
                      value={alamatData.desa}
                      onChange={handleAlamatChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Kecamatan</Label>
                    <Input
                      name="kecamatan"
                      value={alamatData.kecamatan}
                      onChange={handleAlamatChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Kabupaten/Kota</Label>
                    <Input
                      name="kabupaten"
                      value={alamatData.kabupaten}
                      onChange={handleAlamatChange}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Propinsi</Label>
                    <Input
                      name="propinsi"
                      value={alamatData.propinsi}
                      onChange={handleAlamatChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Kode Pos</Label>
                    <Input
                      name="kodePos"
                      value={alamatData.kodePos}
                      onChange={handleAlamatChange}
                      disabled
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end no-print">
                <Button onClick={handleSave}>Simpan Perubahan</Button>
              </div>
            </div>
          )}

          {activeTab === "kontak" && (
            <div className="space-y-6 tab-content">
              <div>
                <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 no-print mb-4">
                  Informasi Kontak
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Website</Label>
                    <Input
                      name="website"
                      value={kontakData.website}
                      onChange={handleKontakChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={kontakData.email}
                      onChange={handleKontakChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Nomor Telepon</Label>
                    <Input
                      name="telepon"
                      value={kontakData.telepon}
                      onChange={handleKontakChange}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Nomor Fax</Label>
                    <Input
                      name="nomorFax"
                      value={kontakData.nomorFax}
                      onChange={handleKontakChange}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 no-print">
                    Media Sosial
                  </h4>
                  <Button
                    variant="primary-outline"
                    size="sm"
                    onClick={addSocialMedia}
                    startIcon={<PlusIcon className="size-4 fill-current" />}
                  >
                    Tambah
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {kontakData.socialMedia.map((url, index) => {
                    const config = getSocialMediaConfig(url);
                    return (
                      <div key={index} className="flex flex-col gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01] sm:flex-row sm:items-end">
                        <div className="flex-shrink-0 w-16 text-center">
                          <Label>Platform</Label>
                          <div
                            className={`h-11 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 font-bold ${config.color}`}
                          >
                            {config.favicon ? (
                              <img
                                src={config.favicon}
                                alt={config.name}
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              config.icon
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label>URL/Username ({config.name})</Label>
                          <Input
                            value={url}
                            onChange={(e) => handleSocialMediaChange(index, e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="error-outline"
                            size="sm"
                            onClick={() => removeSocialMedia(index)}
                            className="sm:mb-1"
                          >
                            <TrashBinIcon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {kontakData.socialMedia.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                      <p className="text-sm text-gray-500">Belum ada media sosial ditambahkan.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end no-print pt-4">
                <Button onClick={handleSave}>Simpan Perubahan</Button>
              </div>
            </div>
          )}

          {activeTab === "map" && (
            <div className="space-y-6 tab-content">
              <h4 className="text-md font-semibold text-gray-800 dark:text-white/90 no-print">
                Lokasi Geografis
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 no-print">
                <div>
                  <Label>Lintang</Label>
                  <Input
                    name="lintang"
                    value={profileData.lintang}
                    onChange={handleProfileChange}
                    disabled
                  />
                </div>
                <div>
                  <Label>Bujur</Label>
                  <Input
                    name="bujur"
                    value={profileData.bujur}
                    onChange={handleProfileChange}
                    disabled
                  />
                </div>
              </div>
              <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <iframe
                  title="Google Maps Preview"
                  width="100%"
                  height="400"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${profileData.lintang},${profileData.bujur}&z=15&output=embed`}
                  className="bg-gray-100 dark:bg-gray-800"
                ></iframe>
              </div>
              <div className="flex justify-end no-print">
                <Button onClick={handleSave}>Simpan Perubahan</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
