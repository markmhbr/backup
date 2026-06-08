import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { PrinterIcon, SearchIcon } from "../../icons";
import Swal from "sweetalert2";
import GTKCardTable from "../../components/gtk/GTKCardTable";

export default function GTKCardPage() {
  const [activeTab, setActiveTab] = useState<"guru" | "tendik">("guru");
  const [searchQuery, setSearchQuery] = useState("");

  const handlePrint = () => {
    Swal.fire({
      title: "Cetak Kartu ID?",
      text: `Menyiapkan proses cetak kartu untuk kategori ${activeTab === "guru" ? "Guru" : "Tendik"}.`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#465fff",
      confirmButtonText: "Ya, Cetak!",
    });
  };

  return (
    <>
      <PageMeta
        title="SIMAK | Kartu ID GTK"
        description="Halaman cetak kartu identitas GTK"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Kartu ID GTK
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cetak kartu identitas resmi untuk Guru dan Tenaga Kependidikan.
            </p>
          </div>
          <div>
            <Button 
                variant="outline" 
                size="sm" 
                className="min-w-[110px]"
                onClick={handlePrint}
                startIcon={<PrinterIcon className="size-4" />}
            >
              Cetak Kartu
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          {/* Tab Section */}
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-white/[0.05] mb-6">
            <button
              onClick={() => setActiveTab("guru")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "guru"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Guru
            </button>
            <button
              onClick={() => setActiveTab("tendik")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "tendik"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Tendik
            </button>
          </div>

          {/* Filter Section */}
          <div className="mb-6">
            <div className="max-w-[300px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="h-4 w-4" />
              </span>
              <Input
                type="text"
                placeholder="Cari Nama atau NUPTK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table Section */}
          <GTKCardTable 
            type={activeTab}
            searchTerm={searchQuery}
          />
        </div>
      </div>
    </>
  );
}
