import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import { SearchIcon } from "../../icons";
import PDCardTable from "../../components/student/PDCardTable";

export default function PDCardPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <PageMeta
        title="SIMAK | Kartu ID PD"
        description="Halaman cetak kartu identitas Peserta Didik"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Kartu ID Peserta Didik
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cetak kartu identitas resmi siswa berdasarkan Rombongan Belajar.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          {/* Filter Section */}
          <div className="mb-6">
            <div className="max-w-[300px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="h-4 w-4" />
              </span>
              <Input
                type="text"
                placeholder="Cari Nama Rombel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table Section */}
          <PDCardTable 
            searchTerm={searchQuery}
          />
        </div>
      </div>
    </>
  );
}
