import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon, DownloadIcon } from "../../icons";
import SubjectTable from "../../components/school/SubjectTable";
import Button from "../../components/ui/button/Button";
import Swal from "sweetalert2";
import { dapodikService } from "../../services/dapodikService";

export default function SubjectData() {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const handleExport = async () => {
    Swal.fire({
      title: "Export Data Mata Pelajaran?",
      text: "Data Mata Pelajaran akan diunduh dalam format CSV.",
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

          const res = await dapodikService.getMataPelajaran(10000, searchQuery, 1);
          Swal.close();
          const list = res.data || [];

          if (list.length === 0) {
            Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
            return;
          }

          const headers = ["ID / Kode", "Mata Pelajaran"];
          const rows = list.map((item: any) => [
            String(item.mata_pelajaran_id || '').substring(0, 8) || "-",
            item.nama_mata_pelajaran || ""
          ]);

          const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map((val: any) => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `Data_Mata_Pelajaran_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          Swal.fire({
            title: "Berhasil!",
            text: "Data Mata Pelajaran berhasil diunduh.",
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

  return (
    <>
      <PageMeta
        title="SIMAK | Mata Pelajaran"
        description="Halaman pengelolaan data mata pelajaran sekolah"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Mata Pelajaran
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola daftar mata pelajaran dan kurikulum sekolah.
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
                placeholder="Cari Kode atau Nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table Section */}
          <SubjectTable 
            searchTerm={searchQuery}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </>
  );
}
