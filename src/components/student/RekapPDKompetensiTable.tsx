import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface RekapPDKompetensi {
  id: number;
  kompetensi: string;
  xL: number;
  xP: number;
  xJml: number;
  xiL: number;
  xiP: number;
  xiJml: number;
  xiiL: number;
  xiiP: number;
  xiiJml: number;
  grandTotal: number;
}

const rekapData: RekapPDKompetensi[] = [
  { id: 1, kompetensi: "Rekayasa Perangkat Lunak (RPL)", xL: 15, xP: 10, xJml: 25, xiL: 12, xiP: 13, xiJml: 25, xiiL: 18, xiiP: 2, xiiJml: 20, grandTotal: 70 },
  { id: 2, kompetensi: "Teknik Komputer Jaringan (TKJ)", xL: 20, xP: 5, xJml: 25, xiL: 18, xiP: 7, xiJml: 25, xiiL: 12, xiiP: 8, xiiJml: 20, grandTotal: 70 },
  { id: 3, kompetensi: "Multimedia (MM)", xL: 12, xP: 13, xJml: 25, xiL: 10, xiP: 15, xiJml: 25, xiiL: 8, xiiP: 12, xiiJml: 20, grandTotal: 70 },
  { id: 4, kompetensi: "Akuntansi (AK)", xL: 5, xP: 20, xJml: 25, xiL: 3, xiP: 22, xiJml: 25, xiiL: 2, xiiP: 18, xiiJml: 20, grandTotal: 70 },
];

interface RekapPDKompetensiTableProps {
  searchTerm: string;
}

export default function RekapPDKompetensiTable({ searchTerm }: RekapPDKompetensiTableProps) {
  const filteredData = rekapData.filter(item => 
    item.kompetensi.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.kompetensi.localeCompare(b.kompetensi));

  // Calculate Grand Totals for filtered data
  const totals = filteredData.reduce((acc, curr) => ({
    xL: acc.xL + curr.xL,
    xP: acc.xP + curr.xP,
    xJml: acc.xJml + curr.xJml,
    xiL: acc.xiL + curr.xiL,
    xiP: acc.xiP + curr.xiP,
    xiJml: acc.xiJml + curr.xiJml,
    xiiL: acc.xiiL + curr.xiiL,
    xiiP: acc.xiiP + curr.xiiP,
    xiiJml: acc.xiiJml + curr.xiiJml,
    grandTotal: acc.grandTotal + curr.grandTotal,
  }), {
    xL: 0, xP: 0, xJml: 0,
    xiL: 0, xiP: 0, xiJml: 0,
    xiiL: 0, xiiP: 0, xiiJml: 0,
    grandTotal: 0,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1200px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader rowSpan={2} className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kompetensi Keahlian</TableCell>
              <TableCell isHeader colSpan={3} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Tingkat X</TableCell>
              <TableCell isHeader colSpan={3} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Tingkat XI</TableCell>
              <TableCell isHeader colSpan={3} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Tingkat XII</TableCell>
              <TableCell isHeader rowSpan={2} className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">Total</TableCell>
            </TableRow>
            <TableRow>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">L</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">P</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">JML</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">L</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">P</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">JML</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">L</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">P</TableCell>
              <TableCell isHeader className="px-5 py-2 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">JML</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filteredData.length > 0 ? (
              <>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.kompetensi}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.xL}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.xP}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.xJml}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.xiL}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.xiP}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.xiJml}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.xiiL}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.xiiP}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.xiiJml}</TableCell>
                    <TableCell className="px-5 py-4 text-brand-500 text-center text-theme-sm font-bold border-l border-gray-100 dark:border-white/[0.05]">{item.grandTotal}</TableCell>
                  </TableRow>
                ))}
                {/* Grand Total Row */}
                <TableRow className="bg-gray-50 dark:bg-white/[0.02] font-bold text-gray-800 dark:text-white/90">
                  <TableCell className="px-5 py-4 text-start">Jumlah Total</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.xL}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.xP}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500">{totals.xJml}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.xiL}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.xiP}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500">{totals.xiJml}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.xiiL}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05]">{totals.xiiP}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500">{totals.xiiJml}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-600 dark:text-brand-400 font-extrabold">{totals.grandTotal}</TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
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
