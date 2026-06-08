import {
  GroupIcon,
  GridIcon,
  UserIcon,
  BoxIconLine,
} from "../../icons";

export default function SchoolMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* <!-- Total GTK Aktif Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-500/10">
          <GroupIcon className="text-blue-600 size-6 dark:text-blue-500" />
        </div>

        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Jumlah GTK
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            45
          </h4>
        </div>
      </div>
      {/* <!-- Total GTK Aktif End --> */}

      {/* <!-- Total Peserta Didik Aktif Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-500/10">
          <UserIcon className="text-orange-600 size-6 dark:text-orange-500" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Jumlah PD
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            856
          </h4>
        </div>
      </div>
      {/* <!-- Total Peserta Didik Aktif End --> */}

      {/* <!-- Total Kelas Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-500/10">
          <GridIcon className="text-green-600 size-6 dark:text-green-500" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Jumlah Kelas
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            24
          </h4>
        </div>
      </div>
      {/* <!-- Total Kelas End --> */}

      {/* <!-- Total Rombel Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-500/10">
          <BoxIconLine className="text-purple-600 size-6 dark:text-purple-500" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Jumlah Rombel
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            24
          </h4>
        </div>
      </div>
      {/* <!-- Total Rombel End --> */}
    </div>
  );
}
