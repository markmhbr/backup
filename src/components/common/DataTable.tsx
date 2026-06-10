import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "./Pagination";
import Checkbox from "../form/input/Checkbox";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { SearchIcon } from "../../icons";

interface Column {
  header: string;
  render: (row: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  fetchData: (params: {
    limit: number;
    search: string;
    page: number;
    [key: string]: any;
  }) => Promise<any>;
  onSelectionChange?: (selectedIds: any[]) => void;
  searchPlaceholder?: string;
  extraFilters?: Record<string, any>;
  idKey: string;
  extraFilterUI?: React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  fetchData,
  onSelectionChange,
  searchPlaceholder = "Search...",
  extraFilters = {},
  idKey,
  extraFilterUI,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData({
        limit: itemsPerPage,
        search: debouncedSearch,
        page: currentPage,
        ...extraFilters,
      });
      if (result.status === "success") {
        setData(result.data);
        // Backend typically uses result.meta.total or result.meta.total_items
        const meta = result.meta || result.pagination || {};
        const total = meta.total || meta.totalItems || meta.total_items || 0;
        setTotalItems(total);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage, debouncedSearch, currentPage, JSON.stringify(extraFilters)]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const handleSelectAll = (checked: boolean) => {
    let newSelected: any[];
    if (checked) {
      newSelected = [
        ...new Set([...selectedRows, ...data.map((item) => item[idKey])]),
      ];
    } else {
      const currentIds = data.map((item) => item[idKey]);
      newSelected = selectedRows.filter((id) => !currentIds.includes(id));
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleSelectRow = (id: any, checked: boolean) => {
    let newSelected: any[];
    if (checked) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = selectedRows.filter((rowId) => rowId !== id);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(newSelected);
  };

  const isAllSelected =
    data.length > 0 && data.every((item) => selectedRows.includes(item[idKey]));

  return (
    <div className="space-y-6">
      {/* Search and Filters Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
        <div className="w-20">
          <Select
            options={rowsPerPageOptions}
            defaultValue={itemsPerPage.toString()}
            onChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full lg:justify-end">
          <div className="relative max-w-sm w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon className="size-5" />
            </span>
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          {extraFilterUI}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start">
                  <Checkbox checked={isAllSelected} onChange={handleSelectAll} />
                </TableCell>
                {columns.map((col, idx) => (
                  <TableCell
                    key={idx}
                    isHeader
                    className={`px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 ${
                      col.className || ""
                    }`}
                  >
                    {col.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className={`divide-y divide-gray-100 dark:divide-white/[0.05] ${loading && data.length > 0 ? "opacity-50 pointer-events-none transition-opacity duration-200" : ""}`}>
              {loading && data.length === 0 ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <TableRow key={rIdx} className="animate-pulse">
                    <TableCell className="px-5 py-4 text-start">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4"></div>
                    </TableCell>
                    {columns.map((col, cIdx) => (
                      <TableCell key={cIdx} className={`px-5 py-4 ${col.className || ""}`}>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data.map((item) => (
                  <TableRow
                    key={item[idKey]}
                    className={`${
                      selectedRows.includes(item[idKey])
                        ? "bg-gray-50 dark:bg-white/[0.02]"
                        : ""
                    }`}
                  >
                    <TableCell className="px-5 py-4 text-start">
                      <Checkbox
                        checked={selectedRows.includes(item[idKey])}
                        onChange={(checked) =>
                          handleSelectRow(item[idKey], checked)
                        }
                      />
                    </TableCell>
                    {columns.map((col, idx) => (
                      <TableCell
                        key={idx}
                        className={`px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 ${
                          col.className || ""
                        }`}
                      >
                        {col.render(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="px-5 py-10 text-center text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada data ditemukan
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
  );
};

export default DataTable;
