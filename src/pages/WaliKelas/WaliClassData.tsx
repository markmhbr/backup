import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { DownloadIcon, PrinterIcon, UserCircleIcon, CheckCircleIcon, SearchIcon, PencilIcon } from "../../icons";
import Swal from "sweetalert2";
import StudentTable from "../../components/student/StudentTable";
import { dapodikService } from "../../services/dapodikService";
import { openBiodataPrintWindow } from "../../utils/printStudent";
import * as XLSX from "xlsx";
import { Modal } from "../../components/ui/modal";

export default function WaliClassData() {
  const { role } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [isWali, setIsWali] = useState<boolean | null>(null);
  const [rombelInfo, setRombelInfo] = useState<any | null>(null);

  // Filter States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [completenessFilter, setCompletenessFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  // Mutasi / Registrasi Keluar States
  const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
  const [jenisKeluarRefList, setJenisKeluarRefList] = useState<any[]>([]);
  const [selectedJenisKeluar, setSelectedJenisKeluar] = useState("");
  const [alasanMutasi, setAlasanMutasi] = useState("");
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [submittingMutasi, setSubmittingMutasi] = useState(false);

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "20", label: "20" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const completenessOptions = [
    { value: "all", label: "Semua Pengisian" },
    { value: "complete", label: "Lengkap (100%)" },
    { value: "incomplete", label: "Belum Lengkap (<100%)" },
  ];

  const gradeOptions = [
    { value: "all", label: "Semua Tingkat" },
    { value: "10", label: "Tingkat 10" },
    { value: "11", label: "Tingkat 11" },
    { value: "12", label: "Tingkat 12" },
  ];

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const checkWaliStatus = async () => {
      setLoading(true);
      try {
        const res = await dapodikService.getRombonganBelajar("reguler", 100);
        if (res?.status === "success" && res.data) {
          const userSession = localStorage.getItem('user_data');
          const ptkId = userSession ? JSON.parse(userSession).ptk_id : null;
          
          const matchedClass = res.data.find((rombel: any) => rombel.ptk_id === ptkId);
          if (matchedClass) {
            setIsWali(true);
            setRombelInfo(matchedClass);
          } else {
            setIsWali(false);
          }
        } else {
          setIsWali(false);
        }
      } catch (e) {
        console.error("Gagal memeriksa status wali kelas:", e);
        setIsWali(false);
      } finally {
        setLoading(false);
      }
    };
    checkWaliStatus();
  }, []);

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedStudentIds(selectedIds);
  };

  const handleShowProfile = async () => {
    if (selectedStudentIds.length === 0) return;
    try {
      Swal.fire({
        title: 'Mempersiapkan Profil...',
        text: 'Mohon tunggu sementara data sedang dimuat.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const sekolahRes = await dapodikService.getSekolah();
      const sekolah = sekolahRes.data || {};

      const studentsData = await Promise.all(
        selectedStudentIds.map(async (id) => {
          const res = await dapodikService.getPesertaDidikDetail(id);
          return res.data;
        })
      );

      Swal.close();
      openBiodataPrintWindow(studentsData, sekolah);
    } catch (error: any) {
      Swal.close();
      console.error("Gagal memuat profil untuk dicetak:", error);
      Swal.fire("Error", "Gagal memuat profil untuk dicetak: " + (error?.message || error), "error");
    }
  };

  const handleEditData = () => {
    if (selectedStudentIds.length === 0) return;
    navigate(`/${role}/student-data/edit/${selectedStudentIds[0]}`);
  };

  const handleRegister = async () => {
    if (selectedStudentIds.length !== 1) {
      Swal.fire("Info", "Silakan pilih tepat 1 siswa untuk registrasi mutasi/keluar.", "info");
      return;
    }
    
    try {
      Swal.fire({
        title: "Memuat...",
        text: "Memuat referensi jenis keluar.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      const res = await dapodikService.getJenisKeluarRef();
      Swal.close();
      setJenisKeluarRefList(res || []);
      setSelectedJenisKeluar("");
      setAlasanMutasi("");
      setBuktiFile(null);
      setIsMutasiModalOpen(true);
    } catch (err) {
      Swal.close();
      console.error("Gagal memuat jenis keluar:", err);
      Swal.fire("Error", "Gagal memuat referensi jenis keluar.", "error");
    }
  };

  const handleSubmitMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJenisKeluar) {
      Swal.fire("Info", "Silakan pilih jenis keluar.", "info");
      return;
    }
    if (!buktiFile) {
      Swal.fire("Info", "Silakan unggah berkas bukti PDF.", "info");
      return;
    }
    if (buktiFile.size > 200 * 1024) {
      Swal.fire("Peringatan", "Ukuran berkas PDF maksimal 200KB.", "warning");
      return;
    }

    try {
      setSubmittingMutasi(true);
      Swal.fire({
        title: "Menyimpan...",
        text: "Sedang mengunggah berkas bukti dan menyimpan pengajuan mutasi.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await dapodikService.createMutasiPd(
        {
          peserta_didik_id: selectedStudentIds[0],
          jenis_keluar_id: selectedJenisKeluar,
          alasan: alasanMutasi,
        },
        buktiFile
      );

      Swal.close();
      setIsMutasiModalOpen(false);
      setSelectedStudentIds([]); // Clear checkboxes
      Swal.fire({
        title: "Berhasil!",
        text: "Pengajuan mutasi berhasil dibuat dan menunggu persetujuan operator di menu Pengajuan Mutasi.",
        icon: "success",
        confirmButtonColor: "#465fff",
      });
    } catch (err: any) {
      Swal.close();
      console.error(err);
      const errMsg = err.response?.data?.message || "Gagal membuat pengajuan mutasi.";
      Swal.fire("Gagal", errMsg, "error");
    } finally {
      setSubmittingMutasi(false);
    }
  };

  const handleExport = async () => {
    if (!rombelInfo) return;
    try {
      Swal.fire({
        title: "Mengekspor...",
        text: "Sedang mengambil data untuk diekspor",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const resultData = await dapodikService.getPesertaDidik(10000, debouncedSearchQuery, 1, rombelInfo.nama, "aktif");
      const list = resultData.data || [];
      Swal.close();

      if (list.length === 0) {
        Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
        return;
      }

      // Headers (Only columns shown in the table)
      const headers = [
        "Nama", "JK", "Lengkap Data", "NISN", "NIPD", "NIK", "No. KK",
        "Tingkat", "Rombel", "Tgl Masuk", "Terdaftar Sebagai", "Tempat Lahir", "Tgl Lahir"
      ];

      // Rows
      const rows = list.map((item: any) => {
        const isFieldFilled = (valItem: any, key: string) => {
          const value = valItem[key];
          if (value && value !== '-' && value !== '' && value !== 0 && value !== '0') {
            return true;
          }
          if (key === 'provinsi' || key === 'kabupaten_kota' || key === 'kecamatan') {
            const desa = valItem['desa_kelurahan'];
            const kodeWilayah = valItem['kode_wilayah'];
            return !!((desa && desa !== '-' && desa !== '') || (kodeWilayah && kodeWilayah !== '-' && kodeWilayah !== ''));
          }
          return false;
        };

        const allFields = [
          'nama', 'jenis_kelamin', 'nik', 'tempat_lahir', 'tanggal_lahir',
          'agama_id_str', 'no_kk', 'reg_akta_lahir', 'anak_keberapa',
          'nomor_telepon_seluler', 'no_whatsapp', 'email_aktif',
          'alamat_jalan', 'rt', 'rw', 'nama_dusun', 'desa_kelurahan', 'provinsi', 'kabupaten_kota', 'kecamatan',
          'kode_pos', 'jenis_tinggal_id', 'alat_transportasi_id', 'lintang', 'bujur',
          'tinggi_badan', 'berat_badan', 'lingkar_kepala', 'jarak_rumah_ke_sekolah', 'waktu_tempuh_ke_sekolah',
          'menit_tempuh_ke_sekolah', 'jumlah_saudara_kandung',
          'nama_ayah', 'nik_ayah', 'tahun_lahir_ayah', 'jenjang_pendidikan_ayah', 'pekerjaan_id_ayah', 'penghasilan_id_ayah',
          'nama_ibu', 'nik_ibu', 'tahun_lahir_ibu', 'jenjang_pendidikan_ibu', 'pekerjaan_id_ibu', 'penghasilan_id_ibu',
          'nama_wali', 'nik_wali', 'tahun_lahir_wali', 'jenjang_pendidikan_wali', 'pekerjaan_id_wali', 'penghasilan_id_wali'
        ];

        const fields = allFields.filter(key => {
          if (key.endsWith('_wali')) {
            return item['is_wali'] === true || item['is_wali'] === 1 || item['is_wali'] === '1' || !!(item['nama_wali'] || item['nik_wali']);
          }
          return true;
        });

        let filled = 0;
        fields.forEach(f => {
          if (isFieldFilled(item, f)) {
            filled++;
          }
        });
        const lengkapData = Math.round((filled / fields.length) * 100);
        const rombel = item.rombongan_belajar || item.anggota_rombel?.[0]?.rombongan_belajar;
        const jenisPendaftaran = item.jenis_pendaftaran_id === 1 || String(item.jenis_pendaftaran_id) === "1" ? "Siswa Baru" : "Pindahan";

        return [
          item.nama || "",
          item.jenis_kelamin || "",
          `${lengkapData}%`,
          item.nisn || "",
          item.nipd || "",
          item.nik || "",
          item.no_kk || "",
          rombel?.tingkat_pendidikan_id ? String(rombel.tingkat_pendidikan_id) : "",
          rombel?.nama || "",
          item.tanggal_masuk_sekolah ? new Date(item.tanggal_masuk_sekolah).toLocaleDateString('id-ID') : "",
          jenisPendaftaran,
          item.tempat_lahir || "",
          item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : ""
        ];
      });

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kelas");
      XLSX.writeFile(workbook, `Siswa_Kelas_${rombelInfo.nama}_${new Date().toISOString().split('T')[0]}.xlsx`);

      Swal.fire("Berhasil", "Data kelas berhasil diunduh.", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Gagal mengekspor data kelas", "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <p className="text-gray-500 font-medium">Memuat Informasi Kelas...</p>
      </div>
    );
  }

  if (isWali === false) {
    return (
      <>
        <PageMeta title="Data Kelas | SIMAK" description="Data rombel wali kelas" />
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
            ⚠
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Akses Terbatas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
            Halaman ini hanya dapat diakses oleh GTK yang terdaftar sebagai Wali Kelas aktif.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Kelas ${rombelInfo?.nama || ""} | SIMAK`} description="Data Peserta Didik di Rombel Anda" />
      <div className="space-y-6">
        {/* Header Card */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Data Peserta Didik (Kelas: {rombelInfo?.nama})
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola informasi profil peserta didik kelas binaan Anda di sini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedStudentIds.length > 0 && (
              <>
                <Button
                  variant="error-outline"
                  size="sm"
                  className="min-w-[110px]"
                  startIcon={<CheckCircleIcon className="size-4" />}
                  onClick={handleRegister}
                >
                  Register
                </Button>
                <Button
                  variant="primary-outline"
                  size="sm"
                  className="min-w-[110px]"
                  startIcon={<UserCircleIcon className="size-4" />}
                  onClick={handleShowProfile}
                >
                  Profil
                </Button>
                <Button
                  variant="warning-outline"
                  size="sm"
                  className="min-w-[110px]"
                  startIcon={<PencilIcon className="size-4" />}
                  onClick={handleEditData}
                >
                  Ubah
                </Button>
              </>
            )}
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

        {/* Filters and StudentTable wrapper */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 print-area">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
            <div className="w-20">
              <Select
                options={rowsPerPageOptions}
                defaultValue={itemsPerPage.toString()}
                onChange={(value) => setItemsPerPage(parseInt(value))}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full lg:justify-end">
              <div className="relative max-w-sm w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon className="size-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Cari Nama atau NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full sm:w-56">
                <Select
                  options={gradeOptions}
                  defaultValue={gradeFilter}
                  onChange={(value) => setGradeFilter(value)}
                />
              </div>
              <div className="w-full sm:w-56">
                <Select
                  options={completenessOptions}
                  defaultValue={completenessFilter}
                  onChange={(value) => setCompletenessFilter(value)}
                />
              </div>
            </div>
          </div>

          {rombelInfo && (
            <StudentTable
              type="aktif"
              onSelectionChange={handleSelectionChange}
              searchTerm={debouncedSearchQuery}
              completenessFilter={completenessFilter}
              gradeFilter={gradeFilter}
              itemsPerPage={itemsPerPage}
              rombelFilter={rombelInfo.nama}
            />
          )}
        </div>
      </div>

      {/* Modal Registrasi Keluar/Mutasi */}
      <Modal
        isOpen={isMutasiModalOpen}
        onClose={() => setIsMutasiModalOpen(false)}
        className="max-w-[500px] p-6 flex flex-col"
      >
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            Registrasi Mutasi / PD Keluar
          </h4>
          <button
            onClick={() => setIsMutasiModalOpen(false)}
            className="text-gray-400 hover:text-gray-500 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmitMutasi} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Jenis Keluar
            </label>
            <select
              value={selectedJenisKeluar}
              onChange={(e) => setSelectedJenisKeluar(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            >
              <option value="">-- Pilih Jenis Keluar --</option>
              {jenisKeluarRefList.map((item) => (
                <option key={item.jenis_keluar_id} value={item.jenis_keluar_id}>
                  {item.ket_keluar}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Alasan Keluar
            </label>
            <textarea
              value={alasanMutasi}
              onChange={(e) => setAlasanMutasi(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[80px]"
              placeholder="Masukkan alasan mutasi atau keluar siswa..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Unggah Bukti Dokumen (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setBuktiFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-700"
              required
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Hanya menerima file berformat PDF dengan ukuran maksimal 200KB.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsMutasiModalOpen(false)}
              disabled={submittingMutasi}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submittingMutasi}>
              {submittingMutasi ? "Menyimpan..." : "Kirim Pengajuan"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
