import PageMeta from "../../components/common/PageMeta";
import SchoolMetrics from "../../components/school/SchoolMetrics";
import AttendanceChart from "../../components/school/AttendanceChart";
import CompletenessProgress from "../../components/school/CompletenessProgress";
import { useSekolah } from "../../context/SekolahContext";

export default function Home() {
  const { sekolah } = useSekolah();

  return (
    <>
      <PageMeta
        title="Dashboard | SIMAK Admin Panel"
        description="This is the main dashboard for SIMAK Admin Panel"
      />
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 md:text-2xl">
            Selamat Datang, {sekolah?.nama || "Admin"}!
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Berikut adalah ringkasan data operasional sekolah Anda hari ini.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6">
            <SchoolMetrics />

            <CompletenessProgress />

            <AttendanceChart />
          </div>
        </div>
      </div>
    </>
  );
}
