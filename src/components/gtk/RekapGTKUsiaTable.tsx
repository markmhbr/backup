import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface RekapGTKUsia {
  id: number;
  rentangUsia: string;
  lakiLaki: number;
  perempuan: number;
  totalJK: number;
  asn: number;
  nonAsn: number;
  totalStatus: number;
}

const rekapData: RekapGTKUsia[] = [
  { id: 1, rentangUsia: "< 30 Tahun", lakiLaki: 5, perempuan: 10, totalJK: 15, asn: 2, nonAsn: 13, totalStatus: 15 },
  { id: 2, rentangUsia: "31 - 40 Tahun", lakiLaki: 8, perempuan: 12, totalJK: 20, asn: 5, nonAsn: 15, totalStatus: 20 },
  { id: 3, rentangUsia: "41 - 50 Tahun", lakiLaki: 4, perempuan: 6, totalJK: 10, asn: 6, nonAsn: 4, totalStatus: 10 },
  { id: 4, rentangUsia: "> 50 Tahun", lakiLaki: 4, perempuan: 1, totalJK: 5, asn: 4, nonAsn: 1, totalStatus: 5 },
];

export default function RekapGTKUsiaTable() {
  // Calculate Grand Totals
  const totals = rekapData.reduce((acc, curr) => ({
    lakiLaki: acc.lakiLaki + curr.lakiLaki,
    perempuan: acc.perempuan + curr.perempuan,
    totalJK: acc.totalJK + curr.totalJK,
    asn: acc.asn + curr.asn,
    nonAsn: acc.nonAsn + curr.nonAsn,
    totalStatus: acc.totalStatus + curr.totalStatus,
  }), {
    lakiLaki: 0, perempuan: 0, totalJK: 0,
    asn: 0, nonAsn: 0, totalStatus: 0,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1000px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader rowSpan={2} className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Rentang Usia</TableCell>
              <TableCell isHeader colSpan={3} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Jenis Kelamin</TableCell>
              <TableCell isHeader colSpan={3} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Status Kepegawaian</TableCell>
            </TableRow>
            <TableRow>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">L</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">P</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Total</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">ASN</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Non ASN</TableCell>
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
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.asn}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.nonAsn}</TableCell>
                <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.totalStatus}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-50 dark:bg-white/[0.02] font-bold text-gray-800 dark:text-white/90">
              <TableCell className="px-5 py-4 text-start">Jumlah Total</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.lakiLaki}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.perempuan}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500">{totals.totalJK}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.asn}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.nonAsn}</TableCell>
              <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500 font-extrabold">{totals.totalStatus}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
