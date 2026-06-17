import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../common/Pagination";
import Checkbox from "../form/input/Checkbox";
import Avatar from "../ui/avatar/Avatar";
import { dapodikService } from "../../services/dapodikService";

interface StudentTableProps {
  type?: "aktif" | "alumni";
  onSelectionChange: (selectedIds: string[]) => void;
  searchTerm: string;
  completenessFilter: string;
  gradeFilter: string;
  itemsPerPage: number;
}

export default function StudentTable({ onSelectionChange, searchTerm, completenessFilter, gradeFilter, itemsPerPage }: StudentTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const calculateCompleteness = (item: any) => {
    const fields = [
      'nama', 'jenis_kelamin', 'nisn', 'nik', 'tempat_lahir', 'tanggal_lahir',
      'agama_id_str', 'alamat_jalan', 'rt', 'rw', 'provinsi', 'kabupaten_kota',
      'kecamatan', 'desa_kelurahan', 'nomor_telepon_seluler', 'email',
      'nama_ayah', 'nama_ibu', 'tinggi_badan', 'berat_badan'
    ];
    let filled = 0;
    fields.forEach(f => {
      if (item[f] && item[f] !== '-' && item[f] !== '') {
        filled++;
      }
    });
    return Math.round((filled / fields.length) * 100);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await dapodikService.getPesertaDidik(
          itemsPerPage, 
          searchTerm, 
          currentPage, 
          undefined, 
          'aktif', 
          gradeFilter === 'all' ? undefined : gradeFilter
        );
        if (result.status === 'success') {
          let fetchedData = result.data || [];
          
          // Add completeness data
          fetchedData = fetchedData.map((item: any) => ({
            ...item,
            lengkapData: calculateCompleteness(item)
          }));

          // Filter by completeness if active
          if (completenessFilter !== "all") {
            if (completenessFilter === "100") {
              fetchedData = fetchedData.filter((item: any) => item.lengkapData === 100);
            } else if (completenessFilter === "99") {
              fetchedData = fetchedData.filter((item: any) => item.lengkapData < 100);
            } else if (completenessFilter === "50") {
              fetchedData = fetchedData.filter((item: any) => item.lengkapData < 50);
            }
          }

          setData(fetchedData);
          setTotal(result.meta?.total || 0);
        }
      } catch (error) {
        console.error("Gagal mengambil data peserta didik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemsPerPage, searchTerm, currentPage, gradeFilter, completenessFilter]);
  
  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  const handleSelectAll = (checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...new Set([...selectedRows, ...data.map((item) => item.peserta_didik_id)])];
    } else {
      const currentIds = data.map((item) => item.peserta_didik_id);
      newSelected = selectedRows.filter((id) => !currentIds.includes(id));
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = selectedRows.filter((rowId) => rowId !== id);
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const isAllSelected = data.length > 0 && data.every((item) => selectedRows.includes(item.peserta_didik_id));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        )}
        <Table className="min-w-[1700px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">
                <Checkbox
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">JK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Lengkap Data</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NISN</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NIPD</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NIK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No. KK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tingkat</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Rombel</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Masuk</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Terdaftar Sebagai</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Lahir</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.length > 0 ? data.map((item) => (
              <TableRow key={item.peserta_didik_id} className={`${selectedRows.includes(item.peserta_didik_id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                <TableCell className="px-5 py-4 text-start">
                  <Checkbox
                    checked={selectedRows.includes(item.peserta_didik_id)}
                    onChange={(checked) => handleSelectRow(item.peserta_didik_id, checked)}
                  />
                </TableCell>
                <TableCell className="px-5 py-4 text-start whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <Avatar src={item.foto} size="small" />
                        <span className="font-medium text-gray-800 dark:text-white/90">{item.nama}</span>
                    </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_kelamin}</TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <div className="flex items-center gap-1.5">
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 max-w-[60px]">
                          <div 
                            className={`h-1.5 rounded-full ${item.lengkapData === 100 ? 'bg-success-500' : item.lengkapData < 50 ? 'bg-error-500' : 'bg-warning-500'}`} 
                            style={{ width: `${item.lengkapData}%` }}
                          ></div>
                      </div>
                      <span className={`text-theme-xs font-medium ${item.lengkapData === 100 ? 'text-success-500' : item.lengkapData < 50 ? 'text-error-500' : 'text-warning-500'}`}>
                          {item.lengkapData}%
                      </span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nisn || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nipd || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nik || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.no_kk || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 text-center">{item.tingkat_pendidikan_id || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.nama_rombel || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {item.tanggal_masuk_sekolah ? new Date(item.tanggal_masuk_sekolah).toLocaleDateString('id-ID') : "-"}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_pendaftaran_id_str || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempat_lahir || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : "-"}
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={14} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data ditemukan untuk "{searchTerm}"
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
  );
}
