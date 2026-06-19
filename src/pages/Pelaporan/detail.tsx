import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { pelaporanService, PelaporanSekolahDetail } from "../../services/pelaporanService";
import { DocsIcon, TrashBinIcon } from "../../icons";
import Swal from "sweetalert2";

export default function DetailPelaporanSekolahPage() {
  const [searchParams] = useSearchParams();
  const pelaporanId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PelaporanSekolahDetail | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedSchools] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDetail = useCallback(async () => {
    if (!pelaporanId) return;
    setLoading(true);
    try {
      const response = await pelaporanService.getDetail(pelaporanId);
      if (response.status === "success") {
        setDetail(response.data);
      }
    } catch (error) {
      console.error("Gagal mengambil detail pelaporan:", error);
    } finally {
      setLoading(false);
    }
  }, [pelaporanId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedSchools((prev) => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedSchools((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!pelaporanId || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const response = await pelaporanService.uploadDokumen(pelaporanId, selectedFiles);
      if (response.status === "success") {
        Swal.fire("Berhasil", "Dokumen berhasil diunggah", "success");
        setSelectedSchools([]);
        fetchDetail();
      }
    } catch (error: any) {
      Swal.fire("Gagal", error.response?.data?.message || "Gagal mengunggah dokumen", "error");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedSchools((prev) => [...prev, ...newFiles]);
    }
  };

  if (loading) return <div className="p-10 text-center">Memuat detail...</div>;
  if (!detail) return <div className="p-10 text-center text-error-500">Data tidak ditemukan.</div>;

  return (
    <>
      <PageMeta 
        title={`Detail Pelaporan - ${detail.judul} | SIMAK`} 
        description={`Halaman detail pelaporan ${detail.judul}`}
      />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar
            </button>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
              Detail Pelaporan Dokumen
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola dokumen pelaporan untuk: <span className="font-semibold text-brand-500">{detail.judul}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Document History */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3 mb-6">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Riwayat Dokumen Terkirim
                </h4>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto custom-scrollbar">
                  <Table className="min-w-full">
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Nama File</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Ukuran</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">Tanggal Upload</TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 whitespace-nowrap">Aksi</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {detail.dokumen.length > 0 ? (
                        detail.dokumen.map((doc) => (
                          <TableRow key={doc.pelaporan_dokumen_id}>
                            <TableCell className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                 <DocsIcon className="size-4 text-gray-400" />
                                 <span className="font-medium text-gray-800 dark:text-white/90 truncate max-w-[200px]">{doc.nama_file}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{formatFileSize(doc.ukuran_file)}</TableCell>
                            <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{new Date(doc.created_at).toLocaleString("id-ID")}</TableCell>
                            <TableCell className="px-5 py-4 text-center">
                              <a 
                                href={doc.file_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-brand-500 hover:underline text-xs font-medium"
                              >
                                Buka
                              </a>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="px-5 py-10 text-center text-gray-500 italic">
                            Belum ada dokumen yang dikirim.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Request Info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3 mb-6">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Informasi Permintaan
                </h4>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <Table className="min-w-full">
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    <TableRow>
                      <TableCell className="px-5 py-4 font-semibold text-gray-500 dark:text-gray-400 w-1/3 bg-gray-50/50 dark:bg-white/[0.01]">Judul Pelaporan</TableCell>
                      <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">{detail.judul}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="px-5 py-4 font-semibold text-gray-500 dark:text-gray-400 w-1/3 bg-gray-50/50 dark:bg-white/[0.01]">Tanggal Mulai</TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">{detail.tanggal_mulai ? new Date(detail.tanggal_mulai).toLocaleDateString("id-ID") : "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="px-5 py-4 font-semibold text-gray-500 dark:text-gray-400 w-1/3 bg-gray-50/50 dark:bg-white/[0.01]">Tanggal Selesai</TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">{detail.tanggal_selesai ? new Date(detail.tanggal_selesai).toLocaleDateString("id-ID") : "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="px-5 py-4 font-semibold text-gray-500 dark:text-gray-400 w-1/3 bg-gray-50/50 dark:bg-white/[0.01]">Status</TableCell>
                      <TableCell className="px-5 py-4">
                        {detail.aktif ? <Badge color="success" size="sm">Terbuka</Badge> : <Badge color="error" size="sm">Ditutup</Badge>}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="px-5 py-4 font-semibold text-gray-500 dark:text-gray-400 w-1/3 bg-gray-50/50 dark:bg-white/[0.01]">Deskripsi</TableCell>
                      <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{detail.deskripsi || "Tidak ada deskripsi."}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Upload Area */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="border-b border-gray-100 dark:border-white/[0.05] pb-3 mb-6">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Upload Dokumen Baru
                </h4>
              </div>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  isDragging 
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" 
                    : "border-gray-200 dark:border-gray-700 hover:border-brand-400"
                }`}
              >
                <div className="flex flex-col items-center">
                   <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-full text-brand-500 mb-4">
                      <CloudUploadIcon className="size-8" />
                   </div>
                   <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Klik atau Tarik file ke sini</p>
                   <p className="text-xs text-gray-500 mt-1">PDF, DOCX, XLSX, JPG, PNG, ZIP (Maks 10MB)</p>
                   <input 
                      type="file" 
                      multiple 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                   />
                   <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                   >
                      Pilih File
                   </Button>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                   <h5 className="text-xs font-bold text-gray-400 uppercase">File Terpilih ({selectedFiles.length})</h5>
                   <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {selectedFiles.map((file, idx) => (
                         <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-lg">
                            <div className="flex flex-col min-w-0">
                               <span className="text-xs font-semibold text-gray-800 dark:text-white/90 truncate max-w-[150px]">{file.name}</span>
                               <span className="text-[10px] text-gray-500">{formatFileSize(file.size)}</span>
                            </div>
                            <button onClick={() => removeSelectedFile(idx)} className="text-error-500 hover:text-error-600">
                               <TrashBinIcon className="size-4" />
                            </button>
                         </div>
                      ))}
                   </div>
                   <Button 
                      className="w-full mt-4" 
                      onClick={handleUpload}
                      disabled={uploading || !detail.aktif}
                   >
                      {uploading ? "Mengunggah..." : detail.aktif ? "Mulai Unggah" : "Pelaporan Ditutup"}
                   </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CloudUploadIcon({ className }: { className?: string }) {
   return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
   );
}
