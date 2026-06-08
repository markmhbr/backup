import { GroupIcon, UserIcon } from "../../icons";

export default function CompletenessProgress() {
  const metrics = [
    {
      title: "Kelengkapan Data GTK",
      percentage: 85,
      icon: <GroupIcon className="text-blue-600 size-6 dark:text-blue-500" />,
      bgColor: "bg-blue-100 dark:bg-blue-500/10",
      barColor: "bg-blue-600",
    },
    {
      title: "Kelengkapan Data Peserta Didik",
      percentage: 92,
      icon: <UserIcon className="text-orange-600 size-6 dark:text-orange-500" />,
      bgColor: "bg-orange-100 dark:bg-orange-500/10",
      barColor: "bg-orange-600",
    },
  ];

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
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {metric.title}
            </span>
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
