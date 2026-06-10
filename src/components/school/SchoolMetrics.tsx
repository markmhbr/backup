import { useState, useEffect } from "react";
import {
  GroupIcon,
  GridIcon,
  UserIcon,
  BoxIconLine,
} from "../../icons";
import { dapodikService } from "../../services/dapodikService";

export default function SchoolMetrics() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const result = await dapodikService.getSummary();
        if (result.status === 'success') {
          setSummary(result.data);
        }
      } catch (error) {
        console.error("Error fetching school summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const metrics = [
    {
      label: "Jumlah GTK",
      value: summary?.total_gtk || 0,
      icon: <GroupIcon className="text-blue-600 size-6 dark:text-blue-500" />,
      bgColor: "bg-blue-100 dark:bg-blue-500/10",
    },
    {
      label: "Jumlah PD",
      value: summary?.total_pd || 0,
      icon: <UserIcon className="text-orange-600 size-6 dark:text-orange-500" />,
      bgColor: "bg-orange-100 dark:bg-orange-500/10",
    },
    {
      label: "Jumlah Kelas",
      value: summary?.total_rombel || 0,
      icon: <GridIcon className="text-green-600 size-6 dark:text-green-500" />,
      bgColor: "bg-green-100 dark:bg-green-500/10",
    },
    {
      label: "Jumlah Rombel",
      value: summary?.total_rombel || 0,
      icon: <BoxIconLine className="text-purple-600 size-6 dark:text-purple-500" />,
      bgColor: "bg-purple-100 dark:bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className={`flex items-center justify-center w-12 h-12 ${metric.bgColor} rounded-xl`}>
            {metric.icon}
          </div>

          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {metric.label}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : metric.value}
            </h4>
          </div>
        </div>
      ))}
    </div>
  );
}
