import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon } from "../../icons";
import TahunPelajaranTable from "../../components/academic/TahunPelajaranTable";

export default function TahunPelajaranPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <>
      <PageMeta
        title="SIMAK | Tahun Pelajaran"
        description="Halaman pengelolaan tahun pelajaran sekolah"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Tahun Pelajaran
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola periode akademik, semester, dan status aktif sekolah.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          {/* Filter Section */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
            <div className="w-20">
              <Select
                options={rowsPerPageOptions}
                value={itemsPerPage.toString()}
                onChange={(value) => setItemsPerPage(Number(value))}
              />
            </div>
            
            <div className="relative max-w-sm w-full lg:ml-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="size-5" />
              </span>
              <Input
                type="text"
                placeholder="Cari Tahun atau Semester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table Section */}
          <TahunPelajaranTable 
            searchTerm={searchQuery}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </>
  );
}
