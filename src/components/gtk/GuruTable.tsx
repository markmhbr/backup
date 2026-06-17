import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../common/Pagination";
import Checkbox from "../form/input/Checkbox";
import Avatar from "../ui/avatar/Avatar";
import { dapodikService } from "../../services/dapodikService";

interface GuruTableProps {
  onSelectionChange: (selectedIds: string[]) => void;
  searchTerm: string;
  completenessFilter: string;
  itemsPerPage: number;
}

export default function GuruTable({ onSelectionChange, searchTerm, completenessFilter, itemsPerPage }: GuruTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const calculateCompleteness = (item: any) => {
    const fields = [
      'nama', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 
      'nuptk', 'nik', 'no_kk', 'alamat_jalan', 'no_hp', 'email',
      'sk_pengangkatan', 'tmt_pengangkatan', 'sumber_gaji', 'pendidikan_terakhir'
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
        const result = await dapodikService.getGTK(itemsPerPage, searchTerm, currentPage, 'guru', 'aktif');
        if (result.status === 'success') {
          let fetchedData = result.data || [];
          
          // Add calculated completeness to each item
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
        console.error("Gagal mengambil data guru:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchTerm, itemsPerPage, completenessFilter]);

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  const handleSelectAll = (checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...new Set([...selectedRows, ...data.map((item) => item.ptk_id)])];
    } else {
      const currentIds = data.map((item) => item.ptk_id);
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

  const isAllSelected = data.length > 0 && data.every((item) => selectedRows.includes(item.ptk_id));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
      )}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1700px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">
                <Checkbox
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Induk</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">JK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Lengkap Data</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tanggal Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Ibu Kandung</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Status Kepegawaian</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jenis GTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jabatan GTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Alamat</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NUPTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Surat Tugas</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.length > 0 ? data.map((item) => (
              <TableRow key={item.ptk_id} className={`${selectedRows.includes(item.ptk_id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                <TableCell className="px-5 py-4 text-start">
                  <Checkbox
                    checked={selectedRows.includes(item.ptk_id)}
                    onChange={(checked) => handleSelectRow(item.ptk_id, checked)}
                  />
                </TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <Badge size="sm" color={item.ptk_induk === "1" || item.ptk_induk === 1 || item.ptk_induk === "Ya" ? "success" : "light"}>
                    {item.ptk_induk === "1" || item.ptk_induk === 1 || item.ptk_induk === "Ya" ? "Ya" : "Tidak"}
                  </Badge>
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
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempat_lahir}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tanggal_lahir ? new Date(item.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nama_ibu_kandung}</TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <Badge size="sm" color={item.status_kepegawaian_id_str === "PNS" ? "success" : item.status_kepegawaian_id_str === "PPPK" ? "warning" : "light"}>
                    {item.status_kepegawaian_id_str || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_ptk_id_str}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jabatan_ptk_id_str}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 min-w-[200px]">{item.alamat_jalan}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nuptk}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tanggal_surat_tugas ? new Date(item.tanggal_surat_tugas).toLocaleDateString('id-ID') : '-'}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={14} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data ditemukan
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
