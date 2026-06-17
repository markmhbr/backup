import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import TanahTable from "../../components/sarpras/TanahTable";
import BangunanTable from "../../components/sarpras/BangunanTable";
import RuangTable from "../../components/sarpras/RuangTable";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { SearchIcon } from "../../icons";

export default function SarprasData() {
  const [activeTab, setActiveTab] = useState<"tanah" | "bangunan" | "ruang">("tanah");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const tabs = [
    { id: "tanah", label: "Tanah" },
    { id: "bangunan", label: "Bangunan" },
    { id: "ruang", label: "Ruangan" },
  ];

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <>
      <PageMeta
        title="Sarana & Prasarana | SIMAK Admin Panel"
        description="Data Tanah, Bangunan, dan Ruangan Sekolah"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Sarana & Prasarana
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola daftar tanah, gedung, dan ruangan sekolah Anda di sini.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 no-print">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery(""); // Reset search when changing tab
              }}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-brand-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-full"></span>
              )}
            </button>
          ))}
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
                placeholder={`Cari ${activeTab === 'tanah' ? 'Tanah' : activeTab === 'bangunan' ? 'Bangunan' : 'Ruangan'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === "tanah" && (
              <TanahTable searchTerm={searchQuery} itemsPerPage={itemsPerPage} />
            )}

            {activeTab === "bangunan" && (
              <BangunanTable searchTerm={searchQuery} itemsPerPage={itemsPerPage} />
            )}

            {activeTab === "ruang" && (
              <RuangTable searchTerm={searchQuery} itemsPerPage={itemsPerPage} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
