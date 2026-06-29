import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon, PrinterIcon } from "../../icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Pagination from "../../components/common/Pagination";
import Avatar from "../../components/ui/avatar/Avatar";
import Button from "../../components/ui/button/Button";
import { dapodikService } from "../../services/dapodikService";
import { getFotoUrl } from "../../utils/image";
import { printGTKProfile } from "../../utils/printGTKProfile";

export default function GTKBukuInduk() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all active GTKs (Guru & Tendik)
        const response = await dapodikService.getGTK(itemsPerPage, searchQuery, currentPage, undefined, "aktif");
        if (response && response.data) {
          setData(response.data);
          setTotal(response.meta?.total || response.data.length || 0);
        }
      } catch (error) {
        console.error("Gagal mengambil data GTK:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [itemsPerPage, currentPage, searchQuery]);

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  const handlePrint = async (ptkId: string) => {
    await printGTKProfile([ptkId]);
  };

  return (
    <>
      <PageMeta
        title="Buku Induk GTK | SIMAK Admin Panel"
        description="Buku Induk Pendidik dan Tenaga Kependidikan"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Buku Induk GTK
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cetak dan lihat rekapitulasi lembar buku induk guru & staf.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          {/* Filter Section */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
            <div className="w-20">
              <Select
                options={rowsPerPageOptions}
                value={itemsPerPage.toString()}
                onChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className="relative max-w-sm w-full lg:ml-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="size-5" />
              </span>
              <Input
                type="text"
                placeholder="Cari Nama atau NUPTK..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
              </div>
            )}
            <div className="max-w-full overflow-x-auto custom-scrollbar">
              <Table className="min-w-[900px]">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Foto</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status Kepegawaian</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jenis GTK</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {data.length > 0 ? data.map((item) => (
                    <TableRow key={item.ptk_id}>
                      <TableCell className="px-5 py-4 text-start">
                        <Avatar src={getFotoUrl(item.foto, "/images/user/user-01.jpg")} size="medium" />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                        {item.nama}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {item.status_kepegawaian_id_str || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-gray-500 dark:text-gray-400">
                        {item.jenis_ptk_id_str || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <Button
                          variant="success-outline"
                          size="sm"
                          startIcon={<PrinterIcon className="size-4" />}
                          onClick={() => handlePrint(item.ptk_id)}
                        >
                          Buku Induk
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data GTK ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
