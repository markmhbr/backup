import { useState } from "react";
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
import { allGTKData } from "../../data/gtkData";

interface GuruTableProps {
  onSelectionChange: (selectedIds: number[]) => void;
  searchTerm: string;
  completenessFilter: string;
  itemsPerPage: number;
}

export default function GuruTable({ onSelectionChange, searchTerm, completenessFilter, itemsPerPage }: GuruTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  
  // Filter for only 'Guru' (id 1-100 in our dummy range)
  const filteredData = allGTKData.filter(item => {
    const isGuru = item.id < 100;
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.nuptk.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCompleteness = true;
    if (completenessFilter === "100") {
      matchesCompleteness = item.lengkapData === 100;
    } else if (completenessFilter === "99") {
      matchesCompleteness = item.lengkapData < 100;
    } else if (completenessFilter === "50") {
      matchesCompleteness = item.lengkapData < 50;
    }
    
    return isGuru && matchesSearch && matchesCompleteness;
  }).sort((a, b) => a.nama.localeCompare(b.nama));

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    let newSelected: number[];
    if (checked) {
      newSelected = [...new Set([...selectedRows, ...currentData.map((item) => item.id)])];
    } else {
      const currentIds = currentData.map((item) => item.id);
      newSelected = selectedRows.filter((id) => !currentIds.includes(id));
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    let newSelected: number[];
    if (checked) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = selectedRows.filter((rowId) => rowId !== id);
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const isAllSelected = currentData.length > 0 && currentData.every((item) => selectedRows.includes(item.id));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Induk</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">JK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Lengkap Data</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tanggal Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ibu Kandung</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status Kepegawaian</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jenis GTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jabatan GTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Alamat</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NUPTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tgl Surat Tugas</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {currentData.length > 0 ? currentData.map((item) => (
              <TableRow key={item.id} className={`${selectedRows.includes(item.id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                <TableCell className="px-5 py-4 text-start">
                  <Checkbox
                    checked={selectedRows.includes(item.id)}
                    onChange={(checked) => handleSelectRow(item.id, checked)}
                  />
                </TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <Badge size="sm" color={item.induk === "Ya" ? "success" : "light"}>
                    {item.induk}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-start whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <Avatar src={item.avatar} size="small" />
                        <span className="font-medium text-gray-800 dark:text-white/90">{item.nama}</span>
                    </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jk}</TableCell>
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
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempatLahir}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tanggalLahir}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.ibuKandung}</TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <Badge size="sm" color={item.statusKepegawaian === "PNS" ? "success" : item.statusKepegawaian === "PPPK" ? "warning" : "light"}>
                    {item.statusKepegawaian}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenisGTK}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jabatanGTK}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 min-w-[200px]">{item.alamat}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nuptk}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tglSuratTugas}</TableCell>
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
