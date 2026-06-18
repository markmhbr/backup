import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
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
      <PageBreadcrumb pageTitle="Pelaporan Dokumen" />

      <div className="space-y-6">
        <ComponentCard title="Daftar Permintaan Pelaporan">
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Judul Pelaporan</TableCell>
                  <TableCell isHeader>Periode</TableCell>
                  <TableCell isHeader className="text-center">Dokumen Dikirim</TableCell>
                  <TableCell isHeader className="text-center">Status</TableCell>
                  <TableCell isHeader className="text-center">Aksi</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.pelaporan_id}>
                      <TableCell className="font-medium text-gray-800 dark:text-white/90">
                        {item.judul}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString("id-ID") : "-"} s/d{" "}
                        {item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge color={item.jumlah_dokumen > 0 ? "success" : "light"} size="sm">
                          {item.jumlah_dokumen} Dokumen
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.aktif ? (
                          <Badge color="success" size="sm">Terbuka</Badge>
                        ) : (
                          <Badge color="error" size="sm">Ditutup</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
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
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      Tidak ada permintaan pelaporan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-between items-center">
             <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
             />
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
