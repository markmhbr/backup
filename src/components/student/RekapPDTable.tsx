import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import { useState, useEffect } from "react";
import { dapodikService } from "../../services/dapodikService";

interface RekapPD {
  tingkat: string;
  lakiLaki: number;
  perempuan: number;
  totalJK: number;
  siswaBaru: number;
  pindahan: number;
  totalStatus: number;
}

interface RekapPDTableProps {
  searchTerm: string;
}

export default function RekapPDTable({ searchTerm }: RekapPDTableProps) {
  const [rekapData, setRekapData] = useState<RekapPD[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await dapodikService.getPdRekapTingkat();
        const dataArray = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : (Array.isArray(response?.data?.data) ? response.data.data : []));
        
        if (dataArray && dataArray.length > 0) {
          const mapped = dataArray.map((item: any) => ({
            tingkat: `Tingkat ${item.tingkat}`,
            lakiLaki: item.l || 0,
            perempuan: item.p || 0,
            totalJK: item.total || 0,
            siswaBaru: item.siswaBaru || 0,
            pindahan: (item.pindahan || 0) + (item.mengulang || 0),
            totalStatus: item.total || 0,
          }));
          setRekapData(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch pd rekap tingkat:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = rekapData.filter(item => 
    item.tingkat.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.tingkat.localeCompare(b.tingkat));

  // Calculate Grand Totals for filtered data
  const grandTotal = filteredData.reduce((acc, curr) => ({
    lakiLaki: acc.lakiLaki + curr.lakiLaki,
    perempuan: acc.perempuan + curr.perempuan,
    totalJK: acc.totalJK + curr.totalJK,
    siswaBaru: acc.siswaBaru + curr.siswaBaru,
    pindahan: acc.pindahan + curr.pindahan,
    totalStatus: acc.totalStatus + curr.totalStatus,
  }), {
    lakiLaki: 0,
    perempuan: 0,
    totalJK: 0,
    siswaBaru: 0,
    pindahan: 0,
    totalStatus: 0,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1000px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader rowSpan={2} className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Tingkat</TableCell>
              <TableCell isHeader colSpan={3} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Jenis Kelamin</TableCell>
              <TableCell isHeader colSpan={3} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Status Masuk</TableCell>
            </TableRow>
            <TableRow>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">L</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">P</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Total</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Baru</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Pindahan</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">JML</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">Loading...</TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              <>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.tingkat}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.lakiLaki}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.perempuan}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.totalJK}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.siswaBaru}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.pindahan}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.totalStatus}</TableCell>
                  </TableRow>
                ))}
                {/* Grand Total Row */}
                <TableRow className="bg-gray-50 dark:bg-white/[0.02] font-bold">
                  <TableCell className="px-5 py-4 text-start text-gray-800 dark:text-white/90">Jumlah Total</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.lakiLaki}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.perempuan}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500 font-bold">{grandTotal.totalJK}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.siswaBaru}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.pindahan}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500 font-bold">{grandTotal.totalStatus}</TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada data rekap ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
