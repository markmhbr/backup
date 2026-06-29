import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { DownloadIcon, PrinterIcon, UserCircleIcon, CheckCircleIcon, SearchIcon, PencilIcon } from "../../icons";
import Swal from "sweetalert2";
import RombelTable from "../../components/school/RombelTable";
import EkskulTable from "../../components/school/EkskulTable";
import RekapRombelKategoriTable from "../../components/school/RekapRombelKategoriTable";
import RekapRombelKompetensiTable from "../../components/school/RekapRombelKompetensiTable";
import { dapodikService } from "../../services/dapodikService";

export default function ClassData() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "reguler" | "praktik" | "ekskul" | "pilihan" | "rekap" | "wali";
  
  const [activeTab, setActiveTab] = useState<"reguler" | "praktik" | "ekskul" | "pilihan" | "rekap" | "wali">(
    tabParam || "reguler"
  );

  // Sync state with URL parameter
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const gradeOptions = [
    { value: "all", label: "Semua Tingkat" },
    { value: "10", label: "Tingkat 10" },
    { value: "11", label: "Tingkat 11" },
    { value: "12", label: "Tingkat 12" },
  ];

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const handleEditData = () => {
    Swal.fire({
      title: "Ubah Data?",
      text: `Anda akan mengubah data untuk ${selectedIds.length} item yang dipilih.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#465fff",
      confirmButtonText: "Ya, Ubah!",
    });
  };

  const handleRegister = () => {
    Swal.fire({
      title: "Registrasi Rombel?",
      text: `Anda akan meregistrasi ${selectedIds.length} data yang dipilih.`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#465fff",
      confirmButtonText: "Ya, Registrasi!",
    });
  };

  const handleShowProfile = () => {
    Swal.fire({
      title: "Lihat Profil?",
      text: `Menampilkan profil untuk ${selectedIds.length} data yang dipilih.`,
      icon: "info",
      confirmButtonColor: "#465fff",
    });
  };

  const handleExport = async () => {
    Swal.fire({
      title: `Export Data ${activeTab === 'rekap' ? 'Rekap Rombel' : activeTab === 'ekskul' ? 'Ekskul' : 'Rombel'}?`,
      text: `Data ${activeTab === 'rekap' ? 'Rekapitulasi' : activeTab === 'ekskul' ? 'Ekskul' : activeTab} akan diunduh dalam format CSV.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Export!",
      cancelButtonText: "Batal"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: "Mengekspor...",
            text: "Sedang mengambil data untuk diekspor",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          if (activeTab === "rekap") {
            const [resKategori, resKompetensi] = await Promise.all([
              dapodikService.getRombelRekapKategori(),
              dapodikService.getRombelRekapKompetensi()
            ]);

            Swal.close();

            const dataKategori = resKategori.data || [];
            const dataKompetensi = resKompetensi.data || [];

            const rows: string[][] = [];

            // 1. Kategori
            rows.push(["REKAP ROMBEL BERDASARKAN KATEGORI"]);
            rows.push(["Kategori Rombel", "Tingkat 10", "Tingkat 11", "Tingkat 12", "Total"]);
            dataKategori.forEach((item: any) => {
              rows.push([
                item.kategori || "",
                String(item.tingkat10 || 0),
                String(item.tingkat11 || 0),
                String(item.tingkat12 || 0),
                String(item.total || 0)
              ]);
            });
            rows.push([]); // blank separator

            // 2. Kompetensi
            rows.push(["REKAP ROMBEL BERDASARKAN KOMPETENSI KEAHLIAN"]);
            rows.push(["Kompetensi Keahlian", "Tingkat 10", "Tingkat 11", "Tingkat 12", "Total"]);
            dataKompetensi.forEach((item: any) => {
              rows.push([
                item.kompetensi || "",
                String(item.tingkat10 || 0),
                String(item.tingkat11 || 0),
                String(item.tingkat12 || 0),
                String(item.total || 0)
              ]);
            });

            const csvContent = "\uFEFF" + rows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Rekap_Rombel_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Swal.fire({
              title: "Berhasil!",
              text: "Rekap Rombel berhasil diunduh.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            return;
          }

          if (activeTab === "ekskul") {
            const res = await dapodikService.getEkstrakurikuler(searchQuery);
            Swal.close();
            const list = res.data || [];

            if (list.length === 0) {
              Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
              return;
            }

            const headers = ["Nama Ekskul", "Pembina", "Prasarana"];
            const rows = list.map((item: any) => [
              item.nama || "",
              item.ptk_id_str || "",
              item.id_ruang_str || ""
            ]);

            const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map((val: any) => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Data_Ekskul_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Swal.fire({
              title: "Berhasil!",
              text: "Data Ekskul berhasil diunduh.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            return;
          }

          // reguler, praktik, pilihan, wali
          const res = await dapodikService.getRombonganBelajar(activeTab, 10000, 1, searchQuery, gradeFilter);
          Swal.close();
          const list = res.data || [];

          if (list.length === 0) {
            Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
            return;
          }

          const headers = ["Nama Rombel", "Wali Kelas", "Tingkat", "Kurikulum", "Ruang", "Jumlah PD", "Moving Kelas", "Kebutuhan Khusus"];
          const rows = list.map((item: any) => [
            item.nama || "",
            item.ptk_id_str || "",
            item.tingkat_pendidikan_id_str || "",
            item.kurikulum_id_str || "",
            item.id_ruang_str || "",
            String(item.jumlah_siswa || 0),
            item.movingKelas || "Tidak",
            item.kebutuhanKhusus || "Tidak"
          ]);

          const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map((val: any) => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `Data_Rombel_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          Swal.fire({
            title: "Berhasil!",
            text: `Data Rombel ${activeTab} berhasil diunduh.`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });

        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Gagal memproses ekspor data", "error");
        }
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <PageMeta
        title="Rombongan Belajar | SIMAK Admin Panel"
        description="Rombongan Belajar management page"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Rombongan Belajar (Rombel)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola informasi rombongan belajar dan praktik di sini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.length > 0 && (
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

        {/* Tab Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 print-area">
          {activeTab !== "rekap" && (
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
                    placeholder="Cari Rombel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {(activeTab === "reguler" || activeTab === "praktik" || activeTab === "wali") && (
                  <div className="w-full sm:w-56">
                      <Select
                          options={gradeOptions}
                          defaultValue={gradeFilter}
                          onChange={(value) => setGradeFilter(value)}
                      />
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === "reguler" || activeTab === "praktik" || activeTab === "pilihan" || activeTab === "wali") && (
            <RombelTable 
              type={activeTab}
              onSelectionChange={handleSelectionChange} 
              searchTerm={searchQuery} 
              gradeFilter={gradeFilter}
              itemsPerPage={itemsPerPage}
            />
          )}

          {activeTab === "ekskul" && (
            <EkskulTable 
              onSelectionChange={handleSelectionChange} 
              searchTerm={searchQuery}
              itemsPerPage={itemsPerPage}
            />
          )}



          {activeTab === "rekap" && (
            <div className="space-y-8">
              <div>
                <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                  Rekap Rombel berdasarkan Kategori
                </h4>
                <RekapRombelKategoriTable />
              </div>
              <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                  Rekap Rombel berdasarkan Kompetensi Keahlian
                </h4>
                <RekapRombelKompetensiTable />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
