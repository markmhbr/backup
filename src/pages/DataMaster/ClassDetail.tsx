import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Pagination from "../../components/common/Pagination";
import Avatar from "../../components/ui/avatar/Avatar";
import Button from "../../components/ui/button/Button";
import { dapodikService } from "../../services/dapodikService";
import { getFotoUrl } from "../../utils/image";

const getTabFromJenisRombel = (jenisRombel: number) => {
  switch (jenisRombel) {
    case 1: return "reguler";
    case 2: return "praktik";
    case 51: return "ekskul";
    case 16: return "pilihan";
    case 18: return "wali";
    default: return "reguler";
  }
};

export default function ClassDetail() {
  const { role, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRombelName, setSelectedRombelName] = useState(location.state?.name || "");
  const [selectedRombelDetails, setSelectedRombelDetails] = useState<any>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!id) return;

    const fetchAnggota = async () => {
      setIsLoading(true);
      try {
        const response = await dapodikService.getRombelAnggota(id);
        if (response && response.data) {
          setStudents(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch class members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRombelInfo = async () => {
      try {
        const types: Array<"reguler" | "praktik" | "ekskul" | "pilihan" | "wali"> = ["reguler", "praktik", "ekskul", "pilihan", "wali"];
        for (const t of types) {
          const res = await dapodikService.getRombonganBelajar(t, 1000);
          const found = res.data?.find((item: any) => item.rombongan_belajar_id === id);
          if (found) {
            setSelectedRombelDetails(found);
            if (!selectedRombelName) {
              setSelectedRombelName(found.nama);
            }
            break;
          }
        }
      } catch (err) {
        console.error("Failed to fetch rombel info:", err);
      }
    };

    fetchAnggota();
    fetchRombelInfo();
  }, [id]);

  const totalPages = Math.ceil(students.length / itemsPerPage) || 1;
  const currentData = students.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <PageMeta
        title={`Siswa - ${selectedRombelName || "Detail Rombel"} | SIMAK Admin Panel`}
        description="Detail Rombongan Belajar dan daftar siswa"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Daftar Siswa - {selectedRombelName || "Loading..."}
            </h3>
            {selectedRombelDetails && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Wali Kelas: {selectedRombelDetails.ptk_id_str || "-"} | Ruang: {selectedRombelDetails.id_ruang_str || "-"} | Tingkat: {selectedRombelDetails.tingkat_pendidikan_id_str || "-"}
              </p>
            )}
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const tab = selectedRombelDetails && selectedRombelDetails.jenis_rombel !== undefined 
                  ? getTabFromJenisRombel(selectedRombelDetails.jenis_rombel) 
                  : "reguler";
                navigate(`/${role}/class-data?tab=${tab}`);
              }}
            >
              Kembali ke Daftar Rombel
            </Button>
          </div>
        </div>

        {/* Student Table */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nama</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NISN</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">NIPD</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">JK</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : currentData.length > 0 ? (
                    currentData.map((student) => (
                      <TableRow key={student.peserta_didik_id}>
                        <TableCell className="px-5 py-4 text-start whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar src={getFotoUrl(student.foto, "/images/user/user-01.jpg")} size="small" />
                            <span className="font-medium text-gray-800 dark:text-white/90">{student.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{student.nisn || "-"}</TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{student.nipd || "-"}</TableCell>
                        <TableCell className="px-5 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400">{student.jenis_kelamin || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada siswa terdaftar di rombel ini
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
        </div>
      </div>
    </>
  );
}
