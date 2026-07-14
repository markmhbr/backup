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
import Pagination from "../common/Pagination";
import Checkbox from "../form/input/Checkbox";
import Avatar from "../ui/avatar/Avatar";
import { dapodikService } from "../../services/dapodikService";

interface StudentTableProps {
  type?: "aktif" | "alumni";
  onSelectionChange: (selectedIds: string[]) => void;
  searchTerm: string;
  completenessFilter: string;
  gradeFilter: string;
  itemsPerPage: number;
  rombelFilter?: string;
}

export default function StudentTable({ onSelectionChange, searchTerm, completenessFilter, gradeFilter, itemsPerPage, rombelFilter }: StudentTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [isCompletenessModalOpen, setIsCompletenessModalOpen] = useState(false);
  const [selectedItemForCompleteness, setSelectedItemForCompleteness] = useState<any>(null);

  const handleShowCompleteness = (item: any) => {
    setSelectedItemForCompleteness(item);
    setIsCompletenessModalOpen(true);
  };

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const isFieldFilled = (item: any, key: string) => {
    if (key.startsWith('doc_')) {
      const docKey = key === 'doc_ijazah' ? 'ijazah_sekolah_asal'
                   : key === 'doc_kk' ? 'kartu_keluarga'
                   : key === 'doc_akta' ? 'akta_kelahiran'
                   : key === 'doc_ktp_ayah' ? 'ktp_ayah'
                   : 'ktp_ibu';
      const uploadedList = item.uploaded_docs || [];
      return uploadedList.some((f: string) => f.startsWith(docKey));
    }

    const value = item[key];
    if (value && value !== '-' && value !== '' && value !== 0 && value !== '0') {
      return true;
    }
    // Fallback: jika desa_kelurahan atau kode_wilayah terisi, maka provinsi, kabupaten_kota, dan kecamatan juga dianggap terisi
    if (key === 'provinsi' || key === 'kabupaten_kota' || key === 'kecamatan') {
      const desa = item['desa_kelurahan'];
      const kodeWilayah = item['kode_wilayah'];
      return !!((desa && desa !== '-' && desa !== '') || (kodeWilayah && kodeWilayah !== '-' && kodeWilayah !== ''));
    }
    return false;
  };

  const calculateCompleteness = (item: any) => {
    const allFields = [
      'nama', 'jenis_kelamin', 'nik', 'tempat_lahir', 'tanggal_lahir',
      'agama_id_str', 'no_kk', 'reg_akta_lahir', 'anak_keberapa',
      'nomor_telepon_seluler', 'no_whatsapp', 'email_aktif',
      'alamat_jalan', 'rt', 'rw', 'nama_dusun', 'desa_kelurahan', 'provinsi', 'kabupaten_kota', 'kecamatan',
      'kode_pos', 'jenis_tinggal_id', 'alat_transportasi_id', 'lintang', 'bujur',
      'tinggi_badan', 'berat_badan', 'lingkar_kepala', 'jarak_rumah_ke_sekolah', 'waktu_tempuh_ke_sekolah',
      'menit_tempuh_ke_sekolah', 'jumlah_saudara_kandung',
      'nama_ayah', 'nik_ayah', 'tahun_lahir_ayah', 'jenjang_pendidikan_ayah', 'pekerjaan_id_ayah', 'penghasilan_id_ayah',
      'nama_ibu', 'nik_ibu', 'tahun_lahir_ibu', 'jenjang_pendidikan_ibu', 'pekerjaan_id_ibu', 'penghasilan_id_ibu',
      'nama_wali', 'nik_wali', 'tahun_lahir_wali', 'jenjang_pendidikan_wali', 'pekerjaan_id_wali', 'penghasilan_id_wali'
    ];

    const fields = allFields.filter(key => {
      if (key.endsWith('_wali')) {
        return item['is_wali'] === true || item['is_wali'] === 1 || item['is_wali'] === '1' || !!(item['nama_wali'] || item['nik_wali']);
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
        const result = await dapodikService.getPesertaDidik(
          itemsPerPage, 
          searchTerm, 
          currentPage, 
          rombelFilter || undefined, 
          'aktif', 
          gradeFilter === 'all' ? undefined : gradeFilter,
          completenessFilter
        );
        if (result.status === 'success') {
          let fetchedData = result.data || [];
          
          // Add completeness data
          fetchedData = fetchedData.map((item: any) => ({
            ...item,
            lengkapData: item.lengkapData !== undefined && item.lengkapData !== null ? item.lengkapData : calculateCompleteness(item)
          }));

          setData(fetchedData);
          setTotal(result.meta?.total || 0);
        }
      } catch (error) {
        console.error("Gagal mengambil data peserta didik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemsPerPage, searchTerm, currentPage, gradeFilter, completenessFilter, rombelFilter]);
  
  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  const handleSelectAll = (checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...new Set([...selectedRows, ...data.map((item) => item.peserta_didik_id)])];
    } else {
      const currentIds = data.map((item) => item.peserta_didik_id);
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

  const isAllSelected = data.length > 0 && data.every((item) => selectedRows.includes(item.peserta_didik_id));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        )}
        <Table className="min-w-[1700px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">
                <Checkbox
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">JK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Lengkap Data</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NISN</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NIPD</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">NIK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">No. KK</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tingkat</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Rombel</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Masuk</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Terdaftar Sebagai</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tempat Lahir</TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tgl Lahir</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.length > 0 ? data.map((item) => (
              <TableRow key={item.peserta_didik_id} className={`${selectedRows.includes(item.peserta_didik_id) ? "bg-gray-50 dark:bg-white/[0.02]" : ""}`}>
                <TableCell className="px-5 py-4 text-start">
                  <Checkbox
                    checked={selectedRows.includes(item.peserta_didik_id)}
                    onChange={(checked) => handleSelectRow(item.peserta_didik_id, checked)}
                  />
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
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nisn || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nipd || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.nik || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.no_kk || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 text-center">{item.tingkat_pendidikan_id || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 whitespace-nowrap">{item.nama_rombel || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {formatDateDMY(item.tanggal_masuk_sekolah)}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.jenis_pendaftaran_id_str || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">{item.tempat_lahir || "-"}</TableCell>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {formatDateDMY(item.tanggal_lahir)}
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={14} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data ditemukan untuk "{searchTerm}"
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
                Detail Kelengkapan Data Peserta Didik
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
                { key: 'jenis_kelamin', label: 'Jenis Kelamin' },
                { key: 'nik', label: 'NIK' },
                { key: 'tempat_lahir', label: 'Tempat Lahir' },
                { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
                { key: 'agama_id_str', label: 'Agama' },
                { key: 'no_kk', label: 'No. Kartu Keluarga' },
                { key: 'reg_akta_lahir', label: 'Register Akta Lahir' },
                { key: 'anak_keberapa', label: 'Anak ke-' },
                { key: 'nomor_telepon_seluler', label: 'Nomor HP' },
                { key: 'no_whatsapp', label: 'Nomor WhatsApp' },
                { key: 'email_aktif', label: 'Email Aktif' },
                { key: 'alamat_jalan', label: 'Alamat Jalan' },
                { key: 'rt', label: 'RT' },
                { key: 'rw', label: 'RW' },
                { key: 'nama_dusun', label: 'Nama Dusun' },
                { key: 'desa_kelurahan', label: 'Desa/Kelurahan' },
                { key: 'provinsi', label: 'Provinsi' },
                { key: 'kabupaten_kota', label: 'Kabupaten/Kota' },
                { key: 'kecamatan', label: 'Kecamatan' },
                { key: 'kode_pos', label: 'Kode Pos' },
                { key: 'jenis_tinggal_id', label: 'Jenis Tinggal' },
                { key: 'alat_transportasi_id', label: 'Alat Transportasi' },
                { key: 'lintang', label: 'Lintang' },
                { key: 'bujur', label: 'Bujur' },
                { key: 'tinggi_badan', label: 'Tinggi Badan' },
                { key: 'berat_badan', label: 'Berat Badan' },
                { key: 'lingkar_kepala', label: 'Lingkar Kepala' },
                { key: 'jarak_rumah_ke_sekolah', label: 'Jarak Rumah' },
                { key: 'waktu_tempuh_ke_sekolah', label: 'Waktu Tempuh' },
                { key: 'menit_tempuh_ke_sekolah', label: 'Menit Tempuh' },
                { key: 'jumlah_saudara_kandung', label: 'Jumlah Saudara' },
                { key: 'nama_ayah', label: 'Nama Ayah' },
                { key: 'nik_ayah', label: 'NIK Ayah' },
                { key: 'tahun_lahir_ayah', label: 'Tahun Lahir Ayah' },
                { key: 'jenjang_pendidikan_ayah', label: 'Pendidikan Ayah' },
                { key: 'pekerjaan_id_ayah', label: 'Pekerjaan Ayah' },
                { key: 'penghasilan_id_ayah', label: 'Penghasilan Ayah' },
                { key: 'nama_ibu', label: 'Nama Ibu' },
                { key: 'nik_ibu', label: 'NIK Ibu' },
                { key: 'tahun_lahir_ibu', label: 'Tahun Lahir Ibu' },
                { key: 'jenjang_pendidikan_ibu', label: 'Pendidikan Ibu' },
                { key: 'pekerjaan_id_ibu', label: 'Pekerjaan Ibu' },
                { key: 'penghasilan_id_ibu', label: 'Penghasilan Ibu' },
                { key: 'nama_wali', label: 'Nama Wali' },
                { key: 'nik_wali', label: 'NIK Wali' },
                { key: 'tahun_lahir_wali', label: 'Tahun Lahir Wali' },
                { key: 'jenjang_pendidikan_wali', label: 'Pendidikan Wali' },
                { key: 'pekerjaan_id_wali', label: 'Pekerjaan Wali' },
                { key: 'penghasilan_id_wali', label: 'Penghasilan Wali' },
                { key: 'doc_ijazah', label: 'Dokumen Ijazah Sekolah Asal' },
                { key: 'doc_kk', label: 'Dokumen Kartu Keluarga' },
                { key: 'doc_akta', label: 'Dokumen Akta Kelahiran' },
                { key: 'doc_ktp_ayah', label: 'Dokumen KTP Ayah' },
                { key: 'doc_ktp_ibu', label: 'Dokumen KTP Ibu' }
              ].filter((field) => {
                if (field.key.endsWith('_wali')) {
                  const item = selectedItemForCompleteness;
                  return item.is_wali === true || item.is_wali === 1 || item.is_wali === '1' || !!(item.nama_wali || item.nik_wali);
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
                  navigate(`/${role}/student-data/edit/${selectedItemForCompleteness.peserta_didik_id}`);
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
