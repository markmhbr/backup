import { useState, useEffect } from "react";
import { dapodikService } from "../../services/dapodikService";
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

export default function RekapGTKUsiaTable({ rekapType = "all" }: { rekapType?: "all" | "guru" | "tendik" }) {
  const [rekapData, setRekapData] = useState<RekapGTKUsia[]>([]);
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
          const calculateAge = (birthDateStr: string | null) => {
            if (!birthDateStr) return 0;
            const birthDate = new Date(birthDateStr);
            if (isNaN(birthDate.getTime())) return 0;
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            return age;
          };

          let filteredList = list;
          if (rekapType === 'guru') {
            filteredList = list.filter((i: any) => isGuru(i.jenis_ptk_id_str || i.jenisPtk || ''));
          } else if (rekapType === 'tendik') {
            filteredList = list.filter((i: any) => !isGuru(i.jenis_ptk_id_str || i.jenisPtk || ''));
          }

          const ageRanges = [
            { label: "< 30 Tahun", min: 0, max: 30 },
            { label: "31 - 40 Tahun", min: 31, max: 40 },
            { label: "41 - 50 Tahun", min: 41, max: 50 },
            { label: "> 50 Tahun", min: 51, max: 150 },
          ];

          const calculatedRekap = ageRanges.map((range, idx) => {
            const subset = filteredList.filter((i: any) => {
              const age = calculateAge(i.tanggal_lahir);
              return age >= range.min && age <= range.max;
            });

            return {
              id: idx + 1,
              rentangUsia: range.label,
              lakiLaki: subset.filter((i: any) => i.jenis_kelamin === 'L').length,
              perempuan: subset.filter((i: any) => i.jenis_kelamin === 'P').length,
              totalJK: subset.length,
              asn: subset.filter((i: any) => isAsn(i.status_kepegawaian_id_str || i.status_kepegawaian || '')).length,
              nonAsn: subset.filter((i: any) => !isAsn(i.status_kepegawaian_id_str || i.status_kepegawaian || '')).length,
              totalStatus: subset.length
            };
          });

          setRekapData(calculatedRekap);
        }
      } catch (err) {
        console.error("Gagal mengambil rekap usia GTK:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [rekapType]);

  const safeRekapData = Array.isArray(rekapData) ? rekapData : [];

  // Calculate Grand Totals
  const totals = safeRekapData.reduce((acc, curr) => ({
    lakiLaki: acc.lakiLaki + (curr.lakiLaki || 0),
    perempuan: acc.perempuan + (curr.perempuan || 0),
    totalJK: acc.totalJK + (curr.totalJK || 0),
    asn: acc.asn + (curr.asn || 0),
    nonAsn: acc.nonAsn + (curr.nonAsn || 0),
    totalStatus: acc.totalStatus + (curr.totalStatus || 0),
  }), {
    lakiLaki: 0, perempuan: 0, totalJK: 0,
    asn: 0, nonAsn: 0, totalStatus: 0,
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
            {safeRekapData.map((item) => (
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
