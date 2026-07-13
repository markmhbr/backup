import { useState, useEffect } from "react";
import { GroupIcon, UserIcon } from "../../icons";
import { dapodikService } from "../../services/dapodikService";

export default function CompletenessProgress() {
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
        console.error("Error fetching completeness summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const metrics = [
    {
      title: "Kelengkapan Data GTK",
      percentage: summary?.avg_gtk_completeness ?? 0,
      completedCount: summary?.completed_gtk ?? 0,
      totalCount: summary?.total_gtk ?? 0,
      entityLabel: "GTK",
      icon: <GroupIcon className="text-blue-600 size-6 dark:text-blue-500" />,
      bgColor: "bg-blue-100 dark:bg-blue-500/10",
      barColor: "bg-blue-600",
    },
    {
      title: "Kelengkapan Data Peserta Didik",
      percentage: summary?.avg_pd_completeness ?? 0,
      completedCount: summary?.completed_pd ?? 0,
      totalCount: summary?.total_siswa ?? 0,
      entityLabel: "Siswa",
      icon: <UserIcon className="text-orange-600 size-6 dark:text-orange-500" />,
      bgColor: "bg-orange-100 dark:bg-orange-500/10",
      barColor: "bg-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
              <div className="h-6 w-12 bg-gray-100 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-between">
            <div className={`flex items-center justify-center w-12 h-12 ${metric.bgColor} rounded-xl`}>
              {metric.icon}
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white/90">
              {metric.percentage}%
            </span>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {metric.title}
              </span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {metric.completedCount} dari {metric.totalCount} {metric.entityLabel} ({metric.percentage}% Lengkap)
              </span>
            </div>
            <div className="relative w-full h-2 mt-3 bg-gray-100 rounded-full dark:bg-gray-800">
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${metric.barColor} transition-all duration-500`}
                style={{ width: `${metric.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
