import { useState, useEffect } from "react";
import { dapodikService } from "../../services/dapodikService";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface RekapGTK {
  id: number;
  kategori: string;
  lakiLaki: number;
  perempuan: number;
  totalJK: number;
  asn: number;
  nonAsn: number;
  totalStatus: number;
}

export default function RekapGTKTable({ searchTerm = "", rekapType = "all" }: { searchTerm?: string; rekapType?: "all" | "guru" | "tendik" }) {
  const [rekapData, setRekapData] = useState<RekapGTK[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const typeFilter = rekapType === 'all' ? undefined : rekapType;
        const result = await dapodikService.getGTK(10000, "", 1, typeFilter, 'aktif');
        if (result && result.status === "success" && Array.isArray(result.data)) {
          const list = result.data || [];
          const isGuru = (j: string) => (j || '').toLowerCase().includes('guru');
          const isAsn = (s: string) => ['pns', 'pppk'].some(x => (s || '').toLowerCase().includes(x));

          let filteredList = list;
          if (rekapType === 'guru') {
            filteredList = list.filter((i: any) => isGuru(i.jenis_ptk_id_str || i.jenisPtk || ''));
          } else if (rekapType === 'tendik') {
            filteredList = list.filter((i: any) => !isGuru(i.jenis_ptk_id_str || i.jenisPtk || ''));
          }

          const guruList = filteredList.filter((i: any) => isGuru(i.jenis_ptk_id_str || i.jenisPtk || ''));
          const tendikList = filteredList.filter((i: any) => !isGuru(i.jenis_ptk_id_str || i.jenisPtk || ''));

          const calculatedRekap: RekapGTK[] = [];
          
          if (rekapType === 'all' || rekapType === 'guru') {
            calculatedRekap.push({
              id: 1,
              kategori: "Guru",
              lakiLaki: guruList.filter((i: any) => i.jenis_kelamin === 'L').length,
              perempuan: guruList.filter((i: any) => i.jenis_kelamin === 'P').length,
              totalJK: guruList.length,
              asn: guruList.filter((i: any) => isAsn(i.status_kepegawaian_id_str || i.status_kepegawaian || '')).length,
              nonAsn: guruList.filter((i: any) => !isAsn(i.status_kepegawaian_id_str || i.status_kepegawaian || '')).length,
              totalStatus: guruList.length
            });
          }
          
          if (rekapType === 'all' || rekapType === 'tendik') {
            calculatedRekap.push({
              id: 2,
              kategori: "Tendik",
              lakiLaki: tendikList.filter((i: any) => i.jenis_kelamin === 'L').length,
              perempuan: tendikList.filter((i: any) => i.jenis_kelamin === 'P').length,
              totalJK: tendikList.length,
              asn: tendikList.filter((i: any) => isAsn(i.status_kepegawaian_id_str || i.status_kepegawaian || '')).length,
              nonAsn: tendikList.filter((i: any) => !isAsn(i.status_kepegawaian_id_str || i.status_kepegawaian || '')).length,
              totalStatus: tendikList.length
            });
          }

          setRekapData(calculatedRekap);
        }
      } catch (err) {
        console.error("Gagal mengambil rekap GTK:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [rekapType]);

  const safeRekapData = Array.isArray(rekapData) ? rekapData : [];

  const filteredData = safeRekapData.filter(item =>
    (item.kategori || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  ).sort((a, b) => (a.kategori || "").localeCompare(b.kategori || ""));

  // Calculate Grand Totals
  const grandTotal = filteredData.reduce((acc, curr) => ({
    lakiLaki: acc.lakiLaki + (curr.lakiLaki || 0),
    perempuan: acc.perempuan + (curr.perempuan || 0),
    totalJK: acc.totalJK + (curr.totalJK || 0),
    asn: acc.asn + (curr.asn || 0),
    nonAsn: acc.nonAsn + (curr.nonAsn || 0),
    totalStatus: acc.totalStatus + (curr.totalStatus || 0),
  }), {
    lakiLaki: 0,
    perempuan: 0,
    totalJK: 0,
    asn: 0,
    nonAsn: 0,
    totalStatus: 0,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1000px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader rowSpan={2} className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Kategori (Guru/Tendik)</TableCell>
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
            {filteredData.length > 0 ? (
              <>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{item.kategori}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.lakiLaki}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.perempuan}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.totalJK}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.asn}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400 border-l border-gray-100 dark:border-white/[0.05]">{item.nonAsn}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-center text-theme-sm dark:text-white/90 font-semibold border-l border-gray-100 dark:border-white/[0.05]">{item.totalStatus}</TableCell>
                  </TableRow>
                ))}
                {/* Grand Total Row */}
                <TableRow className="bg-gray-50 dark:bg-white/[0.02] font-bold">
                  <TableCell className="px-5 py-4 text-start text-gray-800 dark:text-white/90">Jumlah Total</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.lakiLaki}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.perempuan}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-brand-500 font-bold">{grandTotal.totalJK}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.asn}</TableCell>
                  <TableCell className="px-5 py-4 text-center border-l border-gray-100 dark:border-white/[0.05] text-gray-800 dark:text-white/90">{grandTotal.nonAsn}</TableCell>
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
