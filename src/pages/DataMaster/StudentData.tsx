import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { DownloadIcon, PrinterIcon, UserCircleIcon, CheckCircleIcon, SearchIcon, PencilIcon } from "../../icons";
import { dapodikService } from "../../services/dapodikService";
import Swal from "sweetalert2";
import StudentTable from "../../components/student/StudentTable";
import PDKeluarTable from "../../components/student/PDKeluarTable";
import RekapPDTable from "../../components/student/RekapPDTable";
import RekapPDKompetensiTable from "../../components/student/RekapPDKompetensiTable";
import RekapPDUsiaTable from "../../components/student/RekapPDUsiaTable";
import { useModal } from "../../hooks/useModal";
import EditStudentModal from "../../components/student/EditStudentModal";

export default function StudentData() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "aktif" | "rekap" | "keluar";
  
  const [activeTab, setActiveTab] = useState<"aktif" | "rekap" | "keluar">(
    tabParam || "aktif"
  );

  // Sync state with URL parameter
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [completenessFilter, setCompletenessFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isOpen, openModal, closeModal } = useModal();

  const completenessOptions = [
    { value: "all", label: "Semua Kelengkapan" },
    { value: "100", label: "Lengkap Data 100%" },
    { value: "99", label: "Lengkap Data < 100%" },
    { value: "50", label: "Lengkap Data < 50%" },
  ];

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

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedStudentIds(selectedIds);
  };

  const handleEditData = () => {
    openModal();
  };

  const handleRegister = () => {
    Swal.fire({
      title: `Registrasi ${activeTab === 'keluar' ? 'PD Keluar' : 'Siswa'}?`,
      text: `Anda akan meregistrasi ${selectedStudentIds.length} data yang dipilih.`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#465fff",
      confirmButtonText: "Ya, Registrasi!",
    });
  };

  const handleShowProfile = () => {
    Swal.fire({
      title: "Lihat Profil?",
      text: `Menampilkan profil untuk ${selectedStudentIds.length} data yang dipilih.`,
      icon: "info",
      confirmButtonColor: "#465fff",
    });
  };

  const handleExport = () => {
    Swal.fire({
      title: "Export Data?",
      text: `Data ${activeTab === 'aktif' ? 'Peserta Didik' : activeTab === 'rekap' ? 'Rekap PD' : 'PD Keluar'} akan diunduh dalam format Excel.`,
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

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (jsonData.length === 0) {
        Swal.fire("Info", "File JSON kosong.", "info");
        return;
      }

      await dapodikService.uploadSyncData('pesertadidik', jsonData);
      
      Swal.fire({
        title: "Berhasil!",
        text: `Berhasil mensinkronisasi ${jsonData.length} data Peserta Didik.`,
        icon: "success",
        confirmButtonColor: "#10b981",
      }).then(() => {
        window.location.reload();
      });
      
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Gagal!",
        text: "Terjadi kesalahan saat mengupload data sinkronisasi.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <PageMeta
        title="Peserta Didik | SIMAK Admin Panel"
        description="Student data management page"
      />
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Data Peserta Didik (PD)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola informasi profil sekolah Anda di sini.
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
            <Button
              variant="primary"
              size="sm"
              className="min-w-[110px]"
              disabled={isUploading}
              onClick={handleTriggerUpload}
            >
              {isUploading ? "Uploading..." : "Upload JSON Dapodik"}
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
                    placeholder="Cari Nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {activeTab === "aktif" && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "aktif" && (
            <StudentTable 
                type="aktif" 
                onSelectionChange={handleSelectionChange} 
                searchTerm={searchQuery}
                completenessFilter={completenessFilter}
                gradeFilter={gradeFilter}
                itemsPerPage={itemsPerPage}
            />
          )}

          {activeTab === "rekap" && (
            <div className="space-y-8">
                <div>
                    <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                        Rekap PD berdasarkan Tingkat
                    </h4>
                    <RekapPDTable 
                        searchTerm={searchQuery}
                    />
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                    <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                        Rekap PD berdasarkan Kompetensi Keahlian
                    </h4>
                    <RekapPDKompetensiTable 
                        searchTerm={searchQuery}
                    />
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                    <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                        Rekap PD berdasarkan Usia
                    </h4>
                    <RekapPDUsiaTable />
                </div>
            </div>
          )}

          {activeTab === "keluar" && (
            <div className="space-y-4">
              <PDKeluarTable 
                onSelectionChange={handleSelectionChange} 
                searchTerm={searchQuery}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>

      <EditStudentModal 
        isOpen={isOpen}
        onClose={closeModal}
        selectedIds={selectedStudentIds}
      />
    </>
  );
}
