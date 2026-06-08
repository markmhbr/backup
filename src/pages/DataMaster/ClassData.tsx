import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { DownloadIcon, PrinterIcon, UserCircleIcon, CheckCircleIcon, SearchIcon, PencilIcon } from "../../icons";
import Swal from "sweetalert2";
import RombelTable from "../../components/school/RombelTable";
import WaliTable from "../../components/school/WaliTable";
import EkskulTable from "../../components/school/EkskulTable";
import RekapRombelKategoriTable from "../../components/school/RekapRombelKategoriTable";
import RekapRombelKompetensiTable from "../../components/school/RekapRombelKompetensiTable";

export default function ClassData() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "reguler" | "praktik" | "ekskul" | "pilihan" | "wali" | "rekap";
  
  const [activeTab, setActiveTab] = useState<"reguler" | "praktik" | "ekskul" | "pilihan" | "wali" | "rekap">(
    tabParam || "reguler"
  );

  // Sync state with URL parameter
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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

  const handleSelectionChange = (ids: number[]) => {
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
      title: `Registrasi ${activeTab === 'wali' ? 'Wali Kelas' : 'Rombel'}?`,
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

  const handleExport = () => {
    Swal.fire({
      title: "Export Data?",
      text: `Data Rombongan Belajar (${activeTab}) akan diunduh dalam format Excel.`,
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
              Kelola informasi rombongan belajar, praktik, dan wali kelas di sini.
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
                    placeholder="Cari Rombel atau Wali..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {(activeTab === "reguler" || activeTab === "praktik") && (
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

          {(activeTab === "reguler" || activeTab === "praktik" || activeTab === "pilihan") && (
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

          {activeTab === "wali" && (
            <WaliTable 
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
