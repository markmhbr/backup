import { useState, useEffect } from "react";
import { formatDateDMY } from "../../utils/formatDate";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Pagination from "../common/Pagination";
import Checkbox from "../form/input/Checkbox";
import Avatar from "../ui/avatar/Avatar";
import { dapodikService } from "../../services/dapodikService";

interface GuruTableProps {
  onSelectionChange: (selectedIds: string[]) => void;
  searchTerm: string;
  completenessFilter: string;
  itemsPerPage: number;
}

export default function GuruTable({ onSelectionChange, searchTerm, completenessFilter, itemsPerPage }: GuruTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [isCompletenessModalOpen, setIsCompletenessModalOpen] = useState(false);
  const [selectedItemForCompleteness, setSelectedItemForCompleteness] = useState<any>(null);

  const handleShowCompleteness = (item: any) => {
    setSelectedItemForCompleteness(item);
    setIsCompletenessModalOpen(true);
  };

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const isFieldFilled = (item: any, key: string) => {
    // Fallback untuk wilayah administratif alamat rumah
    if (key === 'provinsi' || key === 'kabupaten_kota' || key === 'kecamatan') {
      const desa = item['desa_kelurahan'];
      const kodeWilayah = item['kode_wilayah'];
      if ((desa && desa !== '-' && desa !== '') || (kodeWilayah && kodeWilayah !== '-' && kodeWilayah !== '')) {
        return true;
      }
    }
    
    const value = item[key];
    if (value && value !== '-' && value !== '' && value !== 0 && value !== '0') {
      return true;
    }
    
    return false;
  };

  const calculateCompleteness = (item: any) => {
    const allFields = [
      'nama', 'nik', 'no_kk', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
      'nama_ibu_kandung', 'agama_id_str', 'status_perkawinan', 'nama_suami_istri',
      'pekerjaan_suami_istri', 'nm_wp', 'npwp', 'alamat_jalan', 'rt', 'rw',
      'desa_kelurahan', 'provinsi', 'kabupaten_kota', 'kecamatan',
      'kode_pos', 'lintang', 'bujur', 'sumber_gaji', 'id_bank', 'rekening_bank',
      'rekening_atas_nama', 'nama_kcp', 'no_hp', 'no_whatsapp', 'id_telegram',
      'email', 'tanda_tangan',
      'doc_kk', 'doc_ktp', 'doc_akte', 'doc_ijazah_sd', 'doc_ijazah_smp', 'doc_ijazah_sma', 'doc_ijazah_s1'
    ];

    const fields = allFields.filter(key => {
      if (key === 'id_bank' || key === 'rekening_bank' || key === 'rekening_atas_nama' || key === 'nama_kcp') {
        return item['memilikiSertifikasi'] === 'Ya';
      }
      if (key === 'nama_suami_istri' || key === 'pekerjaan_suami_istri') {
        const statusPerkawinan = item['status_perkawinan'];
        return statusPerkawinan === '1' || statusPerkawinan === 1;
      }
      return true;
    });

    let filled = 0;
    fields.forEach(f => {
      if (isFieldFilled(item, f)) {
        filled++;
      }
    });
    return Math.round((filled / fields.length) * 100);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await dapodikService.getGTK(itemsPerPage, searchTerm, currentPage, 'guru', 'aktif', completenessFilter);
        if (result.status === 'success') {
          let fetchedData = result.data || [];
          
          // Add calculated completeness to each item
          fetchedData = fetchedData.map((item: any) => ({
            ...item,
            lengkapData: calculateCompleteness(item)
          }));

          setData(fetchedData);
          setTotal(result.meta?.total || 0);
        }
      } catch (error) {
        console.error("Gagal mengambil data guru:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchTerm, itemsPerPage, completenessFilter]);

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  const handleSelectAll = (checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...new Set([...selectedRows, ...data.map((item) => item.ptk_id)])];
    } else {
      const currentIds = data.map((item) => item.ptk_id);
      newSelected = selectedRows.filter((id) => !currentIds.includes(id));
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = selectedRows.filter((rowId) => rowId !== id);
    }
    setSelectedRows(newSelected);
    onSelectionChange(newSelected);
  };

  const isAllSelected = data.length > 0 && data.every((item) => selectedRows.includes(item.ptk_id));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
      )}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="min-w-[1700px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">
                <Checkbox
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Induk</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">JK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Lengkap Data</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tanggal Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Ibu Kandung</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Status Kepegawaian</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jenis GTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Jabatan GTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Alamat</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NUPTK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Surat Tugas</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.length > 0 ? data.map((item) => (
              <TableRow key={item.ptk_id} className={`${selectedRows.includes(item.ptk_id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                <TableCell className="px-5 py-4 text-start">
                  <Checkbox
                    checked={selectedRows.includes(item.ptk_id)}
                    onChange={(checked) => handleSelectRow(item.ptk_id, checked)}
                  />
                </TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <Badge size="sm" color={item.ptk_induk === "1" || item.ptk_induk === 1 || item.ptk_induk === "Ya" ? "success" : "light"}>
                    {item.ptk_induk === "1" || item.ptk_induk === 1 || item.ptk_induk === "Ya" ? "Ya" : "Tidak"}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-start whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <Avatar src={item.foto} size="small" />
                        <span className="font-medium text-gray-800 dark:text-white/90">{item.nama}</span>
                    </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_kelamin}</TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleShowCompleteness(item)}
                    title="Klik untuk melihat detail kelengkapan data"
                  >
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 max-w-[60px]">
                          <div 
                            className={`h-1.5 rounded-full ${item.lengkapData === 100 ? 'bg-success-500' : item.lengkapData < 50 ? 'bg-error-500' : 'bg-warning-500'}`} 
                            style={{ width: `${item.lengkapData}%` }}
                          ></div>
                      </div>
                      <span className={`text-theme-xs font-medium ${item.lengkapData === 100 ? 'text-success-500' : item.lengkapData < 50 ? 'text-error-500' : 'text-warning-500'}`}>
                          {item.lengkapData}%
                      </span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempat_lahir}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{formatDateDMY(item.tanggal_lahir)}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nama_ibu_kandung}</TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <Badge size="sm" color={item.status_kepegawaian_id_str === "PNS" ? "success" : item.status_kepegawaian_id_str === "PPPK" ? "warning" : "light"}>
                    {item.status_kepegawaian_id_str || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_ptk_id_str}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jabatan_ptk_id_str}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 min-w-[200px]">{item.alamat_jalan}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nuptk}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{formatDateDMY(item.tanggal_surat_tugas)}</TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={14} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
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

      {selectedItemForCompleteness && (
        <Modal
          isOpen={isCompletenessModalOpen}
          onClose={() => setIsCompletenessModalOpen(false)}
          className="max-w-md p-6"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Detail Kelengkapan Data GTK
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedItemForCompleteness.nama}
              </p>
            </div>

            <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-600 dark:text-gray-400">Persentase</span>
                <span className={`${
                  selectedItemForCompleteness.lengkapData === 100 ? 'text-success-500' : selectedItemForCompleteness.lengkapData < 50 ? 'text-error-500' : 'text-warning-500'
                }`}>
                  {selectedItemForCompleteness.lengkapData}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    selectedItemForCompleteness.lengkapData === 100 ? 'bg-success-500' : selectedItemForCompleteness.lengkapData < 50 ? 'bg-error-500' : 'bg-warning-500'
                  }`} 
                  style={{ width: `${selectedItemForCompleteness.lengkapData}%` }}
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {[
                { key: 'nama', label: 'Nama Lengkap' },
                { key: 'nik', label: 'NIK' },
                { key: 'no_kk', label: 'Nomor KK' },
                { key: 'jenis_kelamin', label: 'Jenis Kelamin' },
                { key: 'tempat_lahir', label: 'Tempat Lahir' },
                { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
                { key: 'nama_ibu_kandung', label: 'Nama Ibu Kandung' },
                { key: 'agama_id_str', label: 'Agama' },
                { key: 'status_perkawinan', label: 'Status Perkawinan' },
                { key: 'nama_suami_istri', label: 'Nama Pasangan' },
                { key: 'pekerjaan_suami_istri', label: 'Pekerjaan Pasangan' },
                { key: 'nm_wp', label: 'Nama Wajib Pajak (WP)' },
                { key: 'npwp', label: 'NPWP' },
                { key: 'alamat_jalan', label: 'Alamat Jalan' },
                { key: 'rt', label: 'RT' },
                { key: 'rw', label: 'RW' },
                { key: 'desa_kelurahan', label: 'Desa/Kelurahan' },
                { key: 'provinsi', label: 'Provinsi' },
                { key: 'kabupaten_kota', label: 'Kabupaten/Kota' },
                { key: 'kecamatan', label: 'Kecamatan' },
                { key: 'kode_pos', label: 'Kode Pos' },
                { key: 'lintang', label: 'Lintang' },
                { key: 'bujur', label: 'Bujur' },
                { key: 'sumber_gaji', label: 'Sumber Gaji' },
                { key: 'id_bank', label: 'Nama Bank' },
                { key: 'rekening_bank', label: 'Nomor Rekening' },
                { key: 'rekening_atas_nama', label: 'Rekening Atas Nama' },
                { key: 'nama_kcp', label: 'KCP Bank' },
                { key: 'no_hp', label: 'Nomor HP' },
                { key: 'no_whatsapp', label: 'Nomor WhatsApp' },
                { key: 'id_telegram', label: 'ID Telegram' },
                { key: 'email', label: 'Email' },
                { key: 'tanda_tangan', label: 'Tanda Tangan' },
                { key: 'doc_kk', label: 'Dokumen KK' },
                { key: 'doc_ktp', label: 'Dokumen KTP' },
                { key: 'doc_akte', label: 'Dokumen Akte Kelahiran' },
                { key: 'doc_ijazah_sd', label: 'Dokumen Ijazah SD' },
                { key: 'doc_ijazah_smp', label: 'Dokumen Ijazah SMP' },
                { key: 'doc_ijazah_sma', label: 'Dokumen Ijazah SMA' },
                { key: 'doc_ijazah_s1', label: 'Dokumen Ijazah S1' }
              ].filter((field) => {
                if (field.key === 'id_bank' || field.key === 'rekening_bank' || field.key === 'rekening_atas_nama' || field.key === 'nama_kcp') {
                  return selectedItemForCompleteness.memilikiSertifikasi === 'Ya';
                }
                if (field.key === 'nama_suami_istri' || field.key === 'pekerjaan_suami_istri') {
                  const statusPerkawinan = selectedItemForCompleteness.status_perkawinan;
                  return statusPerkawinan === '1' || statusPerkawinan === 1;
                }
                return true;
              }).map((field) => {
                const isFilled = isFieldFilled(selectedItemForCompleteness, field.key);
                return (
                  <div key={field.key} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-gray-800/40">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{field.label}</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${isFilled ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                      {isFilled ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          Terisi
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Kosong
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setIsCompletenessModalOpen(false)}>
                Tutup
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => {
                  const role = window.location.pathname.split("/")[1];
                  navigate(`/${role}/gtk-data/edit/${selectedItemForCompleteness.ptk_id}?tab=guru`);
                }}
              >
                Lengkapi Data
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
