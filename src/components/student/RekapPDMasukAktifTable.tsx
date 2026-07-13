import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import { useState, useEffect } from "react";
import { dapodikService } from "../../services/dapodikService";

interface RekapPDMasuk {
  statusMasuk: string;
  l: number;
  p: number;
  total: number;
}

interface RekapPDMasukAktifTableProps {
  searchTerm: string;
}

export default function RekapPDMasukAktifTable({ searchTerm }: RekapPDMasukAktifTableProps) {
  const [rekapData, setRekapData] = useState<RekapPDMasuk[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await dapodikService.getPdRekapMasukAktif();
        const dataArray = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : (Array.isArray(response?.data?.data) ? response.data.data : []));
        
        if (dataArray && dataArray.length > 0) {
          const mapped = dataArray.map((item: any) => ({
            statusMasuk: item.statusMasuk || 'Siswa Baru',
            l: item.l || 0,
            p: item.p || 0,
            total: item.total || 0,
          }));
          setRekapData(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch pd rekap masuk aktif:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = rekapData.filter(item => 
    item.statusMasuk.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.statusMasuk.localeCompare(b.statusMasuk));

  // Calculate Grand Totals for filtered data
  const grandTotal = filteredData.reduce((acc, curr) => ({
    l: acc.l + curr.l,
    p: acc.p + curr.p,
    total: acc.total + curr.total,
  }), {
    l: 0,
    p: 0,
    total: 0,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[600px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader rowSpan={2} className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Jenis Pendaftaran</TableCell>
              <TableCell isHeader colSpan={3} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Jumlah Peserta Didik</TableCell>
            </TableRow>
            <TableRow>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">L</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">P</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Total</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">Loading...</TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              <>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.statusMasuk}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.l}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.p}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.total}</TableCell>
                  </TableRow>
                ))}
                {/* Grand Total Row */}
                <TableRow className="bg-gray-50 dark:bg-white/[0.02] font-bold">
                  <TableCell className="px-5 py-4 text-start text-gray-800 dark:text-white/90">Jumlah Total</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.l}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.p}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500 font-bold">{grandTotal.total}</TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada data rekap pendaftaran ditemukan untuk Tahun Ajaran aktif ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
