import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Pagination from "../../components/common/Pagination";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import { SearchIcon } from "../../icons";
import { pelaporanService, PelaporanSekolah } from "../../services/pelaporanService";
import { useAuth } from "../../context/AuthContext";
import { getRoleSlug } from "../../services/roleUtils";

export default function PelaporanSekolahPage() {
  const { user } = useAuth();
  const roleSlug = user ? getRoleSlug(user.role) : "admin";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PelaporanSekolah[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPelaporan = useCallback(async () => {
    setLoading(true);
    try {
      const response = await pelaporanService.getList(currentPage, itemsPerPage);
      if (response.status === "success") {
        setData(response.data);
        setTotalItems(response.total);
      }
    } catch (error) {
      console.error("Gagal mengambil data pelaporan:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchPelaporan();
  }, [fetchPelaporan]);

  const filteredData = data.filter((item) =>
    item.judul.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <>
      <PageMeta
        title="Pelaporan Dokumen | SIMAK"
        description="Daftar permintaan pelaporan dokumen dari Cadisdik"
      />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pelaporan Dokumen
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Daftar permintaan pelaporan dokumen dari Cadisdik ke sekolah.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
            <div className="w-20">
              <Select
                options={rowsPerPageOptions}
                defaultValue={itemsPerPage.toString()}
                onChange={(value) => setItemsPerPage(parseInt(value))}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm w-full lg:justify-end">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon className="size-5" />
                </span>
                <Input
                  type="text"
                  placeholder="Cari judul pelaporan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] relative">
            <div className="max-w-full overflow-x-auto custom-scrollbar">
              <Table className="min-w-[1000px]">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-transparent">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Judul Pelaporan</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-start text-xs dark:text-gray-400 whitespace-nowrap">Periode</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Dokumen Dikirim</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-semibold text-gray-500 text-center text-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <TableRow key={item.pelaporan_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <TableCell className="px-5 py-3.5 font-medium text-gray-800 dark:text-white/90">
                          {item.judul}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                          {item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString("id-ID") : "-"} s/d{" "}
                          {item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-center">
                          <Badge color={item.jumlah_dokumen > 0 ? "success" : "light"} size="sm">
                            {item.jumlah_dokumen} Dokumen
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-center">
                          {item.aktif ? (
                            <Badge color="success" size="sm">Terbuka</Badge>
                          ) : (
                            <Badge color="error" size="sm">Ditutup</Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-center">
                          <Link to={`/${roleSlug}/pelaporan/detail?id=${item.pelaporan_id}`}>
                            <button className="text-brand-500 hover:text-brand-600 font-medium text-sm">
                              Detail & Upload
                            </button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500">
                        Tidak ada permintaan pelaporan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-white/[0.05]">
              <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
