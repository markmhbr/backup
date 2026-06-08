import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface RekapRombelKompetensi {
  id: number;
  kompetensi: string;
  tingkat10: number;
  tingkat11: number;
  tingkat12: number;
  total: number;
}

const rekapData: RekapRombelKompetensi[] = [
  { id: 1, kompetensi: "Rekayasa Perangkat Lunak (RPL)", tingkat10: 3, tingkat11: 3, tingkat12: 2, total: 8 },
  { id: 2, kompetensi: "Teknik Komputer Jaringan (TKJ)", tingkat10: 3, tingkat11: 3, tingkat12: 2, total: 8 },
  { id: 3, kompetensi: "Multimedia (MM)", tingkat10: 2, tingkat11: 2, tingkat12: 2, total: 6 },
  { id: 4, kompetensi: "Akuntansi (AK)", tingkat10: 2, tingkat11: 2, tingkat12: 2, total: 6 },
];

export default function RekapRombelKompetensiTable() {
  // Calculate Grand Totals
  const totals = rekapData.reduce((acc, curr) => ({
    tingkat10: acc.tingkat10 + curr.tingkat10,
    tingkat11: acc.tingkat11 + curr.tingkat11,
    tingkat12: acc.tingkat12 + curr.tingkat12,
    total: acc.total + curr.total,
  }), {
    tingkat10: 0,
    tingkat11: 0,
    tingkat12: 0,
    total: 0,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[800px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kompetensi Keahlian</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Tingkat 10</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Tingkat 11</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Tingkat 12</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Total</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {rekapData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.kompetensi}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.tingkat10}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.tingkat11}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.tingkat12}</TableCell>
                <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.total}</TableCell>
              </TableRow>
            ))}
            {/* Grand Total Row */}
            <TableRow className="bg-gray-50 dark:bg-white/[0.02] font-bold text-gray-800 dark:text-white/90">
              <TableCell className="px-5 py-4 text-start">Jumlah Total</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.tingkat10}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.tingkat11}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.tingkat12}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500 font-extrabold">{totals.total}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
