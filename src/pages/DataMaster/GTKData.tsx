import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { DownloadIcon, PrinterIcon, UserCircleIcon, CheckCircleIcon, SearchIcon, PencilIcon } from "../../icons";

import Swal from "sweetalert2";
import GuruTable from "../../components/gtk/GuruTable";
import TendikTable from "../../components/gtk/TendikTable";
import NonAktifTable from "../../components/gtk/NonAktifTable";
import RekapGTKTable from "../../components/gtk/RekapGTKTable";
import RekapGTKPendidikanTable from "../../components/gtk/RekapGTKPendidikanTable";
import RekapGTKUsiaTable from "../../components/gtk/RekapGTKUsiaTable";
import { useModal } from "../../hooks/useModal";
import EditGTKModal from "../../components/gtk/EditGTKModal";

export default function GTKData() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "guru" | "tendik" | "rekap" | "nonaktif";
  
  const [activeTab, setActiveTab] = useState<"guru" | "tendik" | "rekap" | "nonaktif">(
    tabParam || "guru"
  );

  // Sync state with URL parameter
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedGTKIds, setSelectedGTKIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [completenessFilter, setCompletenessFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { isOpen, openModal, closeModal } = useModal();

  const completenessOptions = [
    { value: "all", label: "Semua Kelengkapan" },
    { value: "100", label: "Lengkap Data 100%" },
    { value: "99", label: "Lengkap Data < 100%" },
    { value: "50", label: "Lengkap Data < 50%" },
  ];

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedGTKIds(selectedIds);
  };

  const handleEditData = () => {
    openModal();
  };

  const handleRegister = () => {
    Swal.fire({
      title: "Registrasi GTK?",
      text: `Anda akan meregistrasi ${selectedGTKIds.length} item yang dipilih.`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#465fff",
      confirmButtonText: "Ya, Registrasi!",
    });
  };

  const handleShowProfile = () => {
    Swal.fire({
      title: "Lihat Profil?",
      text: `Menampilkan profil untuk ${selectedGTKIds.length} item yang dipilih.`,
      icon: "info",
      confirmButtonColor: "#465fff",
    });
  };

  const handleExport = () => {
    Swal.fire({
      title: "Export Data GTK?",
      text: `Data ${activeTab === 'nonaktif' ? 'GTK Non Aktif' : activeTab} akan diunduh dalam format Excel.`,
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
        title="GTK | SIMAK Admin Panel"
        description="GTK management page"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Data Guru dan Tenaga Kependidikan (GTK)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola dan lihat informasi GTK di sini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedGTKIds.length > 0 && (
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
              variant="primary-outline"
              size="sm"
              className="min-w-[110px]"
              startIcon={<UserCircleIcon className="size-4" />}
              onClick={handleShowProfile}
            >
              Profil
            </Button>
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
                    placeholder="Cari Nama atau NUPTK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
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
          )}

          {activeTab === "guru" && (
            <div className="space-y-4">
              <GuruTable 
                onSelectionChange={handleSelectionChange} 
                searchTerm={searchQuery} 
                completenessFilter={completenessFilter}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}

          {activeTab === "tendik" && (
            <div className="space-y-4">
              <TendikTable 
                onSelectionChange={handleSelectionChange} 
                searchTerm={searchQuery} 
                completenessFilter={completenessFilter}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}

          {activeTab === "rekap" && (
            <div className="space-y-8">
              <div>
                <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                  Rekap GTK berdasarkan Kategori
                </h4>
                <RekapGTKTable 
                  searchTerm={searchQuery} 
                />
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                  Rekap GTK berdasarkan Pendidikan
                </h4>
                <RekapGTKPendidikanTable />
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                  Rekap GTK berdasarkan Usia
                </h4>
                <RekapGTKUsiaTable />
              </div>
            </div>
          )}

          {activeTab === "nonaktif" && (
            <div className="space-y-4">
              <NonAktifTable 
                onSelectionChange={handleSelectionChange} 
                searchTerm={searchQuery} 
                completenessFilter={completenessFilter}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>

      <EditGTKModal 
        isOpen={isOpen}
        onClose={closeModal}
        selectedIds={selectedGTKIds}
      />
    </>
  );
}
