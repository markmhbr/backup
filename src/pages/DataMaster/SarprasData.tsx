import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import TanahTable from "../../components/sarpras/TanahTable";
import BangunanTable from "../../components/sarpras/BangunanTable";
import RuangTable from "../../components/sarpras/RuangTable";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon, DownloadIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import { dapodikService } from "../../services/dapodikService";

export default function SarprasData() {
  const [activeTab, setActiveTab] = useState<"tanah" | "bangunan" | "ruang">("tanah");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const tabs = [
    { id: "tanah", label: "Tanah" },
    { id: "bangunan", label: "Bangunan" },
    { id: "ruang", label: "Ruangan" },
  ];

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const handleExport = async () => {
    Swal.fire({
      title: `Export Data ${activeTab === 'tanah' ? 'Tanah' : activeTab === 'bangunan' ? 'Bangunan' : 'Ruangan'}?`,
      text: `Data ${activeTab === 'tanah' ? 'Tanah' : activeTab === 'bangunan' ? 'Bangunan' : 'Ruangan'} akan diunduh dalam format CSV.`,
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

          if (activeTab === "tanah") {
            const res = await dapodikService.getTanah(10000, searchQuery, 1);
            Swal.close();
            const list = res.data || [];

            if (list.length === 0) {
              Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
              return;
            }

            const headers = ["Nama", "Jenis", "No. Sertifikat", "Panjang (m)", "Lebar (m)", "Luas (m²)", "Alamat"];
            const rows = list.map((item: any) => [
              item.nama || "",
              item.jenis_prasarana_id_str || "Tanah",
              item.no_sertifikat_tanah || "-",
              String(item.panjang || 0),
              String(item.lebar || 0),
              String(item.luas || 0),
              item.alamat_jalan || "-"
            ]);

            const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map((val: any) => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Data_Tanah_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Swal.fire({
              title: "Berhasil!",
              text: "Data Tanah berhasil diunduh.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            return;
          }

          if (activeTab === "bangunan") {
            const res = await dapodikService.getBangunan(10000, searchQuery, 1);
            Swal.close();
            const list = res.data || [];

            if (list.length === 0) {
              Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
              return;
            }

            const headers = ["Nama", "Jenis", "Thn Dibangun", "Jml Lantai", "Panjang (m)", "Lebar (m)", "Luas Tapak (m²)", "Nilai Aset"];
            const rows = list.map((item: any) => [
              item.nama || "",
              item.jenis_prasarana_id_str || "Bangunan",
              item.thn_dibangun || "-",
              String(item.jml_lantai || 1),
              String(item.panjang || 0),
              String(item.lebar || 0),
              String(item.luas_tapak_bangunan || 0),
              `Rp ${Number(item.nilai_perolehan_aset || 0).toLocaleString('id-ID')}`
            ]);

            const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map((val: any) => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Data_Bangunan_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Swal.fire({
              title: "Berhasil!",
              text: "Data Bangunan berhasil diunduh.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            return;
          }

          if (activeTab === "ruang") {
            const res = await dapodikService.getRuang(10000, searchQuery, 1);
            Swal.close();
            const list = res.data || [];

            if (list.length === 0) {
              Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
              return;
            }

            const headers = ["Nama Ruang", "Kode Ruang", "Jenis", "Lantai", "Panjang (m)", "Lebar (m)", "Luas (m²)", "Kapasitas"];
            const rows = list.map((item: any) => [
              item.nm_ruang || "",
              item.kd_ruang || "-",
              item.jenis_prasarana_id_str || "Ruang",
              String(item.lantai || 1),
              String(item.panjang || 0),
              String(item.lebar || 0),
              String(item.luas_ruang || 0),
              String(item.kapasitas || 0)
            ]);

            const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map((val: any) => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Data_Ruangan_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Swal.fire({
              title: "Berhasil!",
              text: "Data Ruangan berhasil diunduh.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            return;
          }

        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Gagal memproses ekspor data", "error");
        }
      }
    });
  };

  return (
    <>
      <PageMeta
        title="Sarana & Prasarana | SIMAK Admin Panel"
        description="Data Tanah, Bangunan, dan Ruangan Sekolah"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Sarana & Prasarana
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola daftar tanah, gedung, dan ruangan sekolah Anda di sini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="success-outline"
              size="sm"
              className="min-w-[110px]"
              startIcon={<DownloadIcon className="size-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 no-print">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery(""); // Reset search when changing tab
              }}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-brand-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          {/* Filter Section */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
            <div className="w-20">
              <Select
                options={rowsPerPageOptions}
                value={itemsPerPage.toString()}
                onChange={(value) => setItemsPerPage(Number(value))}
              />
            </div>
            
            <div className="relative max-w-sm w-full lg:ml-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="size-5" />
              </span>
              <Input
                type="text"
                placeholder={`Cari ${activeTab === 'tanah' ? 'Tanah' : activeTab === 'bangunan' ? 'Bangunan' : 'Ruangan'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === "tanah" && (
              <TanahTable searchTerm={searchQuery} itemsPerPage={itemsPerPage} />
            )}

            {activeTab === "bangunan" && (
              <BangunanTable searchTerm={searchQuery} itemsPerPage={itemsPerPage} />
            )}

            {activeTab === "ruang" && (
              <RuangTable searchTerm={searchQuery} itemsPerPage={itemsPerPage} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
