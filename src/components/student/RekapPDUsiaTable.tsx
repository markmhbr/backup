import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface RekapPDUsia {
  id: number;
  rentangUsia: string;
  lakiLaki: number;
  perempuan: number;
  totalJK: number;
  siswaBaru: number;
  pindahan: number;
  totalStatus: number;
}

const rekapData: RekapPDUsia[] = [
  { id: 1, rentangUsia: "< 15 Tahun", lakiLaki: 20, perempuan: 25, totalJK: 45, siswaBaru: 45, pindahan: 0, totalStatus: 45 },
  { id: 2, rentangUsia: "16 Tahun", lakiLaki: 80, perempuan: 85, totalJK: 165, siswaBaru: 160, pindahan: 5, totalStatus: 165 },
  { id: 3, rentangUsia: "17 Tahun", lakiLaki: 75, perempuan: 75, totalJK: 150, siswaBaru: 145, pindahan: 5, totalStatus: 150 },
  { id: 4, rentangUsia: "18 Tahun", lakiLaki: 55, perempuan: 60, totalJK: 115, siswaBaru: 113, pindahan: 2, totalStatus: 115 },
  { id: 5, rentangUsia: "> 18 Tahun", lakiLaki: 5, perempuan: 20, totalJK: 25, siswaBaru: 25, pindahan: 0, totalStatus: 25 },
];

export default function RekapPDUsiaTable() {
  // Calculate Grand Totals
  const totals = rekapData.reduce((acc, curr) => ({
    lakiLaki: acc.lakiLaki + curr.lakiLaki,
    perempuan: acc.perempuan + curr.perempuan,
    totalJK: acc.totalJK + curr.totalJK,
    siswaBaru: acc.siswaBaru + curr.siswaBaru,
    pindahan: acc.pindahan + curr.pindahan,
    totalStatus: acc.totalStatus + curr.totalStatus,
  }), {
    lakiLaki: 0, perempuan: 0, totalJK: 0,
    siswaBaru: 0, pindahan: 0, totalStatus: 0,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1000px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader rowSpan={2} className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Rentang Usia</TableCell>
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
            {rekapData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.rentangUsia}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.lakiLaki}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.perempuan}</TableCell>
                <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.totalJK}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.siswaBaru}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.pindahan}</TableCell>
                <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.totalStatus}</TableCell>
              </TableRow>
            ))}
            {/* Grand Total Row */}
            <TableRow className="bg-gray-50 dark:bg-white/[0.02] font-bold text-gray-800 dark:text-white/90">
              <TableCell className="px-5 py-4 text-start">Jumlah Total</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.lakiLaki}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.perempuan}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500">{totals.totalJK}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.siswaBaru}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.pindahan}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500 font-extrabold">{totals.totalStatus}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
