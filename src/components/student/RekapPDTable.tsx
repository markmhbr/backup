import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface RekapPD {
  id: number;
  tingkat: string;
  lakiLaki: number;
  perempuan: number;
  totalJK: number;
  siswaBaru: number;
  pindahan: number;
  totalStatus: number;
}

const rekapData: RekapPD[] = [
  { id: 1, tingkat: "Tingkat 10", lakiLaki: 85, perempuan: 95, totalJK: 180, siswaBaru: 175, pindahan: 5, totalStatus: 180 },
  { id: 2, tingkat: "Tingkat 11", lakiLaki: 78, perempuan: 82, totalJK: 160, siswaBaru: 155, pindahan: 5, totalStatus: 160 },
  { id: 3, tingkat: "Tingkat 12", lakiLaki: 72, perempuan: 88, totalJK: 160, siswaBaru: 158, pindahan: 2, totalStatus: 160 },
];

interface RekapPDTableProps {
  searchTerm: string;
}

export default function RekapPDTable({ searchTerm }: RekapPDTableProps) {
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
            {filteredData.length > 0 ? (
              <>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
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
