import { openBiodataPrintWindow } from "../../utils/printStudent";
import { useState, useEffect } from "react";
import { formatDateDMY, formatDateObjDMY } from "../../utils/formatDate";
import { useSearchParams, useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { DownloadIcon, PrinterIcon, UserCircleIcon, CheckCircleIcon, SearchIcon, PencilIcon } from "../../icons";

import Swal from "sweetalert2";
import StudentTable from "../../components/student/StudentTable";
import { dapodikService } from "../../services/dapodikService";
import { getFotoUrl } from "../../utils/image";
import PDKeluarTable from "../../components/student/PDKeluarTable";
import * as XLSX from "xlsx";
import RekapPDTable from "../../components/student/RekapPDTable";
import RekapPDKompetensiTable from "../../components/student/RekapPDKompetensiTable";
import RekapPDUsiaTable from "../../components/student/RekapPDUsiaTable";
import RekapPDAgamaTable from "../../components/student/RekapPDAgamaTable";
import RekapPDMasukAktifTable from "../../components/student/RekapPDMasukAktifTable";
import { Modal } from "../../components/ui/modal";


export default function StudentData() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "aktif" | "rekap" | "keluar";
  
  const [activeTab, setActiveTab] = useState<"aktif" | "rekap" | "keluar">(
    tabParam || "aktif"
  );

  // Sync state with URL parameter
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  const [completenessFilter, setCompletenessFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [rombelFilter, setRombelFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // States for student mutation (PD Keluar) registration
  const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
  const [jenisKeluarRefList, setJenisKeluarRefList] = useState<any[]>([]);
  const [selectedJenisKeluar, setSelectedJenisKeluar] = useState("");
  const [alasanMutasi, setAlasanMutasi] = useState("");
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [submittingMutasi, setSubmittingMutasi] = useState(false);
  const [printType, setPrintType] = useState<"all" | "rombel">("all");
  const [selectedPrintRombel, setSelectedPrintRombel] = useState("");

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"all" | "rombel">("all");
  const [selectedExportRombel, setSelectedExportRombel] = useState("");
  const [rombels, setRombels] = useState<any[]>([]);

  useEffect(() => {
    const fetchRombels = async () => {
      try {
        const res = await dapodikService.getRombonganBelajar('reguler', 1000);
        if (res.status === 'success') {
          setRombels(res.data || []);
        }
      } catch (e) {
        console.error("Gagal mengambil daftar rombel:", e);
      }
    };
    fetchRombels();
  }, []);



  const completenessOptions = [
    { value: "all", label: "Semua Kelengkapan" },
    { value: "100", label: "Lengkap Data 100%" },
    { value: "99", label: "Lengkap Data < 100%" },
    { value: "50", label: "Lengkap Data < 50%" },
  ];

  const gradeOptions = [
    { value: "all", label: "Semua Tingkat" },
    { value: "10", label: "Tingkat 10" },
    { value: "11", label: "Tingkat 11" },
    { value: "12", label: "Tingkat 12" },
  ];

  const rombelOptions = [
    { value: "all", label: "Semua Rombel" },
    ...[...rombels]
      .sort((a, b) => a.nama.localeCompare(b.nama))
      .map((r: any) => ({ value: r.nama, label: r.nama }))
  ];

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedStudentIds(selectedIds);
  };

  const handleEditData = () => {
    if (selectedStudentIds.length === 1) {
      navigate(`/${role}/student-data/edit/${selectedStudentIds[0]}`);
    }
  };

  const handleRegister = async () => {
    if (selectedStudentIds.length !== 1) {
      Swal.fire("Info", "Silakan pilih tepat 1 siswa untuk registrasi mutasi/keluar.", "info");
      return;
    }
    
    try {
      Swal.fire({
        title: "Memuat...",
        text: "Memuat referensi jenis keluar.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      const res = await dapodikService.getJenisKeluarRef();
      Swal.close();
      setJenisKeluarRefList(res || []);
      setSelectedJenisKeluar("");
      setAlasanMutasi("");
      setBuktiFile(null);
      setIsMutasiModalOpen(true);
    } catch (err) {
      Swal.close();
      console.error("Gagal memuat jenis keluar:", err);
      Swal.fire("Error", "Gagal memuat referensi jenis keluar.", "error");
    }
  };

  const handleSubmitMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJenisKeluar) {
      Swal.fire("Info", "Silakan pilih jenis keluar.", "info");
      return;
    }
    if (!buktiFile) {
      Swal.fire("Info", "Silakan unggah berkas bukti PDF.", "info");
      return;
    }
    if (buktiFile.size > 200 * 1024) {
      Swal.fire("Peringatan", "Ukuran berkas PDF maksimal 200KB.", "warning");
      return;
    }

    try {
      setSubmittingMutasi(true);
      Swal.fire({
        title: "Menyimpan...",
        text: "Sedang mengunggah berkas bukti dan menyimpan pengajuan mutasi.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await dapodikService.createMutasiPd(
        {
          peserta_didik_id: selectedStudentIds[0],
          jenis_keluar_id: selectedJenisKeluar,
          alasan: alasanMutasi,
        },
        buktiFile
      );

      Swal.close();
      setIsMutasiModalOpen(false);
      setSelectedStudentIds([]); // Clear checkboxes
      Swal.fire({
        title: "Berhasil!",
        text: "Pengajuan mutasi berhasil dibuat dan menunggu persetujuan operator di menu Pengajuan Mutasi.",
        icon: "success",
        confirmButtonColor: "#465fff",
      });
    } catch (err: any) {
      Swal.close();
      console.error(err);
      const errMsg = err.response?.data?.message || "Gagal membuat pengajuan mutasi.";
      Swal.fire("Gagal", errMsg, "error");
    } finally {
      setSubmittingMutasi(false);
    }
  };

  // openBiodataPrintWindow is imported from ../../utils/printStudent;

  const openRekapPrintWindow = async () => {
    try {
      Swal.fire({
        title: 'Mempersiapkan Rekapitulasi...',
        text: 'Mohon tunggu sementara data sedang dimuat.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const [sekolahRes, resTingkat, resKompetensi, resUsia, resAgama, resMasukAktif] = await Promise.all([
        dapodikService.getSekolah(),
        dapodikService.getPdRekapTingkat(),
        dapodikService.getPdRekapKompetensi(),
        dapodikService.getPdRekapUsia(),
        dapodikService.getPdRekapAgama(),
        dapodikService.getPdRekapMasukAktif()
      ]);

      const sekolah = sekolahRes.data || {};
      const dataTingkat = resTingkat.data || [];
      const dataKompetensi = resKompetensi.data || [];
      const dataUsia = resUsia.data || [];
      const dataAgama = resAgama.data || [];
      const dataMasukAktif = resMasukAktif.data || [];

      Swal.close();

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        Swal.fire("Gagal", "Popup blocker aktif. Mohon izinkan popup untuk mencetak.", "error");
        return;
      }

      const todayFormatted = formatDateObjDMY(new Date());
      const now = new Date();
      const timeFormatted = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
      const nowFormatted = todayFormatted + " " + timeFormatted;

      const logoUrl = getFotoUrl(sekolah.logo, 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png');

      const rawProv = sekolah.provinsi || 'JAWA BARAT';
      const provUpper = rawProv.toUpperCase();
      const provText = provUpper.includes('PROVINSI') 
        ? `PEMERINTAH ${provUpper}` 
        : `PEMERINTAH PROVINSI ${provUpper}`;

      const totalTingkat = dataTingkat.reduce((acc: any, curr: any) => ({
        l: acc.l + (curr.l || 0),
        p: acc.p + (curr.p || 0),
        total: acc.total + (curr.total || 0),
        siswaBaru: acc.siswaBaru + (curr.siswaBaru || 0),
        pindahan: acc.pindahan + (curr.pindahan || 0) + (curr.mengulang || 0),
      }), { l: 0, p: 0, total: 0, siswaBaru: 0, pindahan: 0 });

      const totalKompetensi = dataKompetensi.reduce((acc: any, curr: any) => ({
        xL: acc.xL + (curr.xL || 0),
        xP: acc.xP + (curr.xP || 0),
        xJml: acc.xJml + (curr.xJml || 0),
        xiL: acc.xiL + (curr.xiL || 0),
        xiP: acc.xiP + (curr.xiP || 0),
        xiJml: acc.xiJml + (curr.xiJml || 0),
        xiiL: acc.xiiL + (curr.xiiL || 0),
        xiiP: acc.xiiP + (curr.xiiP || 0),
        xiiJml: acc.xiiJml + (curr.xiiJml || 0),
        grandTotal: acc.grandTotal + (curr.grandTotal || 0),
      }), { xL: 0, xP: 0, xJml: 0, xiL: 0, xiP: 0, xiJml: 0, xiiL: 0, xiiP: 0, xiiJml: 0, grandTotal: 0 });

      const totalUsia = dataUsia.reduce((acc: any, curr: any) => ({
        l: acc.l + (curr.l || 0),
        p: acc.p + (curr.p || 0),
        total: acc.total + (curr.total || 0),
      }), { l: 0, p: 0, total: 0 });

      const totalAgama = dataAgama.reduce((acc: any, curr: any) => ({
        l: acc.l + (curr.l || 0),
        p: acc.p + (curr.p || 0),
        total: acc.total + (curr.total || 0),
        siswaBaru: acc.siswaBaru + (curr.siswaBaru || 0),
        pindahan: acc.pindahan + (curr.pindahan || 0) + (curr.mengulang || 0),
      }), { l: 0, p: 0, total: 0, siswaBaru: 0, pindahan: 0 });

      const totalMasukAktif = dataMasukAktif.reduce((acc: any, curr: any) => ({
        l: acc.l + (curr.l || 0),
        p: acc.p + (curr.p || 0),
        total: acc.total + (curr.total || 0),
      }), { l: 0, p: 0, total: 0 });

      const headerHtml = `
        <table class="header-table" style="width: 100%; border-bottom: 2px solid #000; margin-bottom: 15px; padding-bottom: 5px;">
            <tr>
                <td style="width: 15%; text-align: center;">
                    <img src="${logoUrl}" style="width: 70px; height: auto;" alt="Logo">
                </td>
                <td style="width: 70%; text-align: center;">
                    <div class="kop-text">
                        <div class="kop-h1" style="font-size: 13px; font-weight: bold; margin: 0; text-transform: uppercase;">${provText}</div>
                        <div class="kop-h1" style="font-size: 13px; font-weight: bold; margin: 0; text-transform: uppercase;">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
                        <div class="kop-h2" style="font-size: 15px; font-weight: bold; margin: 2px 0; text-transform: uppercase;">${sekolah.nama || 'SEKOLAH MENENGAH KEJURUAN'}</div>
                        <div class="kop-address" style="font-size: 9px; font-style: italic;">
                            ${sekolah.alamat_jalan || ''} RT ${sekolah.rt || ''}/RW ${sekolah.rw || ''} Desa ${sekolah.desa_kelurahan || ''} Kec. ${sekolah.kecamatan || ''} Kab. ${sekolah.kabupaten_kota || ''}
                        </div>
                    </div>
                </td>
                <td style="width: 15%;"></td>
            </tr>
        </table>
      `;

      const page1Content = `
        ${headerHtml}
        <div class="page-title" style="text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; text-transform: uppercase;">REKAPITULASI DATA PESERTA DIDIK</div>
        <div class="page-subtitle" style="text-align: center; font-size: 10px; margin-bottom: 20px; color: #555;">Dicetak pada: ${nowFormatted}</div>

        <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase;">A. REKAP PESERTA DIDIK BERDASARKAN TINGKAT</div>
        <table class="rekap-table">
            <thead>
                <tr>
                    <th rowspan="2">Tingkat Kelas</th>
                    <th colspan="3">Jenis Kelamin</th>
                    <th colspan="3">Status Pendaftaran</th>
                </tr>
                <tr>
                    <th>L</th>
                    <th>P</th>
                    <th>Total</th>
                    <th>Baru</th>
                    <th>Pindahan</th>
                    <th>JML</th>
                </tr>
            </thead>
            <tbody>
                ${dataTingkat.map((item: any) => `
                    <tr>
                        <td style="text-align: left; font-weight: bold;">Tingkat ${item.tingkat || ''}</td>
                        <td>${item.l || 0}</td>
                        <td>${item.p || 0}</td>
                        <td style="font-weight: bold;">${item.total || 0}</td>
                        <td>${item.siswaBaru || 0}</td>
                        <td>${(item.pindahan || 0) + (item.mengulang || 0)}</td>
                        <td style="font-weight: bold;">${item.total || 0}</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                    <td style="text-align: left;">Jumlah Total</td>
                    <td>${totalTingkat.l}</td>
                    <td>${totalTingkat.p}</td>
                    <td>${totalTingkat.total}</td>
                    <td>${totalTingkat.siswaBaru}</td>
                    <td>${totalTingkat.pindahan}</td>
                    <td>${totalTingkat.total}</td>
                </tr>
            </tbody>
        </table>

        <div style="font-weight: bold; font-size: 11px; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;">B. REKAP PESERTA DIDIK BERDASARKAN KOMPETENSI KEAHLIAN</div>
        <table class="rekap-table">
            <thead>
                <tr>
                    <th rowspan="2">Kompetensi Keahlian</th>
                    <th colspan="3">Tingkat X</th>
                    <th colspan="3">Tingkat XI</th>
                    <th colspan="3">Tingkat XII</th>
                    <th rowspan="2">Grand Total</th>
                </tr>
                <tr>
                    <th>L</th>
                    <th>P</th>
                    <th>JML</th>
                    <th>L</th>
                    <th>P</th>
                    <th>JML</th>
                    <th>L</th>
                    <th>P</th>
                    <th>JML</th>
                </tr>
            </thead>
            <tbody>
                ${dataKompetensi.map((item: any) => `
                    <tr>
                        <td style="text-align: left; font-weight: bold;">${item.kompetensi || ''}</td>
                        <td>${item.xL || 0}</td>
                        <td>${item.xP || 0}</td>
                        <td>${item.xJml || 0}</td>
                        <td>${item.xiL || 0}</td>
                        <td>${item.xiP || 0}</td>
                        <td>${item.xiJml || 0}</td>
                        <td>${item.xiiL || 0}</td>
                        <td>${item.xiiP || 0}</td>
                        <td>${item.xiiJml || 0}</td>
                        <td style="font-weight: bold;">${item.grandTotal || 0}</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                    <td style="text-align: left;">Jumlah Total</td>
                    <td>${totalKompetensi.xL}</td>
                    <td>${totalKompetensi.xP}</td>
                    <td>${totalKompetensi.xJml}</td>
                    <td>${totalKompetensi.xiL}</td>
                    <td>${totalKompetensi.xiP}</td>
                    <td>${totalKompetensi.xiJml}</td>
                    <td>${totalKompetensi.xiiL}</td>
                    <td>${totalKompetensi.xiiP}</td>
                    <td>${totalKompetensi.xiiJml}</td>
                    <td>${totalKompetensi.grandTotal}</td>
                </tr>
        </table>
      `;

      const page2Content = `
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase;">C. REKAP PESERTA DIDIK BERDASARKAN USIA</div>
        <table class="rekap-table" style="width: 100%;">
            <thead>
                <tr>
                    <th>Rentang Usia</th>
                    <th>Jenis Kelamin (L)</th>
                    <th>Jenis Kelamin (P)</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${dataUsia.map((item: any) => `
                    <tr>
                        <td style="text-align: left; font-weight: bold;">${item.usia || ''}</td>
                        <td>${item.l || 0}</td>
                        <td>${item.p || 0}</td>
                        <td style="font-weight: bold;">${item.total || 0}</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                    <td style="text-align: left;">Jumlah Total</td>
                    <td>${totalUsia.l}</td>
                    <td>${totalUsia.p}</td>
                    <td>${totalUsia.total}</td>
                </tr>
            </tbody>
        </table>

        <div style="font-weight: bold; font-size: 11px; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;">D. REKAP PESERTA DIDIK BERDASARKAN AGAMA</div>
        <table class="rekap-table">
            <thead>
                <tr>
                    <th rowspan="2">Agama</th>
                    <th colspan="3">Jenis Kelamin</th>
                    <th colspan="3">Status Pendaftaran</th>
                </tr>
                <tr>
                    <th>L</th>
                    <th>P</th>
                    <th>Total</th>
                    <th>Baru</th>
                    <th>Pindahan</th>
                    <th>JML</th>
                </tr>
            </thead>
            <tbody>
                ${dataAgama.map((item: any) => `
                    <tr>
                        <td style="text-align: left; font-weight: bold;">${item.agama || ''}</td>
                        <td>${item.l || 0}</td>
                        <td>${item.p || 0}</td>
                        <td style="font-weight: bold;">${item.total || 0}</td>
                        <td>${item.siswaBaru || 0}</td>
                        <td>${(item.pindahan || 0) + (item.mengulang || 0)}</td>
                        <td style="font-weight: bold;">${item.total || 0}</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                    <td style="text-align: left;">Jumlah Total</td>
                    <td>${totalAgama.l}</td>
                    <td>${totalAgama.p}</td>
                    <td>${totalAgama.total}</td>
                    <td>${totalAgama.siswaBaru}</td>
                    <td>${totalAgama.pindahan}</td>
                    <td>${totalAgama.total}</td>
                </tr>
            </tbody>
        </table>
      `;

      const page3Content = `
        <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase;">E. REKAP PESERTA DIDIK MASUK TAHUN AJARAN AKTIF</div>
        <table class="rekap-table" style="width: 100%;">
            <thead>
                <tr>
                    <th>Jenis Pendaftaran</th>
                    <th>Jenis Kelamin (L)</th>
                    <th>Jenis Kelamin (P)</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${dataMasukAktif.map((item: any) => `
                    <tr>
                        <td style="text-align: left; font-weight: bold;">${item.statusMasuk || ''}</td>
                        <td>${item.l || 0}</td>
                        <td>${item.p || 0}</td>
                        <td style="font-weight: bold;">${item.total || 0}</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                    <td style="text-align: left;">Jumlah Total</td>
                    <td>${totalMasukAktif.l}</td>
                    <td>${totalMasukAktif.p}</td>
                    <td>${totalMasukAktif.total}</td>
                </tr>
            </tbody>
        </table>

        <div class="signature-wrapper" style="margin-top: 40px; position: absolute; bottom: 2cm; right: 2cm; left: 2cm;">
            <div class="signature-box" style="text-align: center; width: 250px; float: right;">
                <p style="margin: 0 0 5px 0;">${sekolah.kabupaten_kota || 'Bandung'}, ${todayFormatted}</p>
                <p style="margin: 0 0 50px 0;">Kepala Sekolah,</p>
                <p style="font-weight: bold; text-decoration: underline; margin: 0 0 2px 0;">${sekolah.nama_kepala_sekolah || '................................'}</p>
                <p style="margin: 0;">NIP: ${sekolah.nip_kepala_sekolah || '................................'}</p>
            </div>
            <div style="clear: both;"></div>
        </div>
      `;

      let pagesHtml = `
<div id="page-container-1" class="page-container">
    ${page1Content}
    <div class="page-footer">
        Dicetak melalui Sistem Informasi Sekolah pada ${nowFormatted} | Hal <span class="page-number"></span>
    </div>
</div>
<div id="page-container-2" class="page-container">
    ${page2Content}
    <div class="page-footer">
        Dicetak melalui Sistem Informasi Sekolah pada ${nowFormatted} | Hal <span class="page-number"></span>
    </div>
</div>
<div id="page-container-3" class="page-container">
    ${page3Content}
    <div class="page-footer">
        Dicetak melalui Sistem Informasi Sekolah pada ${nowFormatted} | Hal <span class="page-number"></span>
    </div>
</div>
      `;

      let thumbnailsHtml = `
<div class="thumbnail-wrapper" onclick="goToPage(1)">
    <div class="thumbnail-container active">
        <div class="thumbnail-page">
            <div class="page-container">
                ${page1Content}
            </div>
        </div>
    </div>
    <div class="thumbnail-number">1</div>
</div>
<div class="thumbnail-wrapper" onclick="goToPage(2)">
    <div class="thumbnail-container">
        <div class="thumbnail-page">
            <div class="page-container">
                ${page2Content}
            </div>
        </div>
    </div>
    <div class="thumbnail-number">2</div>
</div>
<div class="thumbnail-wrapper" onclick="goToPage(3)">
    <div class="thumbnail-container">
        <div class="thumbnail-page">
            <div class="page-container">
                ${page3Content}
            </div>
        </div>
    </div>
    <div class="thumbnail-number">3</div>
</div>
      `;

      let htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rekapitulasi Data Peserta Didik</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            counter-reset: page;
        }
        .page-number::after {
            counter-increment: page;
            content: counter(page);
        }
        .pdf-toolbar {
            background-color: #323639;
            color: white;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }
        .pdf-title-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .pdf-hamburger {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
        }
        .pdf-hamburger:hover {
            background-color: rgba(255,255,255,0.1);
        }
        .pdf-title {
            font-weight: 500;
            font-size: 14px;
        }
        .pdf-controls {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .pdf-page-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
        }
        .pdf-page-input {
            width: 36px;
            height: 24px;
            background-color: #202124;
            border: 1px solid #5f6368;
            color: white;
            text-align: center;
            border-radius: 4px;
            font-size: 13px;
        }
        .pdf-control-btn {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .pdf-control-btn:hover {
            background-color: rgba(255,255,255,0.1);
        }
        .pdf-zoom-text {
            font-size: 13px;
            min-width: 40px;
            text-align: center;
        }
        .pdf-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .pdf-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 6px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .pdf-btn:hover {
            background-color: rgba(255,255,255,0.1);
        }
        .pdf-btn svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
        }
        .pdf-content-wrapper {
            display: flex;
            margin-top: 48px;
            height: calc(100vh - 48px);
            background-color: #525659;
            overflow: hidden;
        }
        .pdf-sidebar {
            width: 240px;
            background-color: #323639;
            border-right: 1px solid #1a1c1e;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
        }
        .thumbnail-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            cursor: pointer;
        }
        .thumbnail-container {
            width: 140px;
            height: 198px;
            background-color: white;
            border: 2px solid transparent;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }
        .thumbnail-container.active {
            border-color: #8ab4f8;
        }
        .thumbnail-page {
            transform: scale(0.18);
            transform-origin: top left;
            width: 210mm;
            height: 297mm;
            pointer-events: none;
            background-color: white;
        }
        .thumbnail-number {
            color: #bdc1c6;
            font-size: 11px;
        }
        .pdf-main-pane {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
            box-sizing: border-box;
            --pdf-zoom: 1.0;
        }
        
        .page-container {
            width: 210mm;
            height: 297mm;
            background-color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            box-sizing: border-box;
            padding: 1.0cm 1.5cm;
            position: relative;
            zoom: var(--pdf-zoom, 1);
            transform-origin: top center;
            transition: transform 0.1s ease;
        }

        @media print {
            html, body {
                background-color: white !important;
                overflow: visible !important;
                height: auto !important;
            }
            .pdf-toolbar, .pdf-sidebar {
                display: none !important;
            }
            .pdf-content-wrapper {
                display: block !important;
                overflow: visible !important;
                height: auto !important;
            }
            .pdf-main-pane {
                display: block !important;
                overflow: visible !important;
                padding: 0 !important;
                background-color: transparent !important;
                height: auto !important;
            }
            .page-container {
                width: 210mm !important;
                height: 297mm !important;
                padding: 1.0cm 1.5cm !important;
                box-sizing: border-box !important;
                position: relative !important;
                page-break-after: always !important;
                background: transparent !important;
                box-shadow: none !important;
                margin: 0 auto !important;
                transform: none !important;
                zoom: 1 !important;
            }
            .page-container:last-of-type {
                page-break-after: avoid !important;
            }
        }

        .rekap-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 10px;
        }
        .rekap-table th, .rekap-table td {
            border: 1px solid #000;
            padding: 4px 5px;
            text-align: center;
        }
        .rekap-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        
        .signature-box {
            text-align: center;
            width: 250px;
            float: right;
        }
        .page-footer {
            position: absolute;
            bottom: 1cm;
            left: 2cm;
            right: 2cm;
            font-size: 9px;
            text-align: right;
            border-top: 1px solid #ddd;
            padding-top: 5px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="pdf-toolbar">
        <div class="pdf-title-container">
            <button class="pdf-hamburger" onclick="toggleSidebar()" title="Toggle Sidebar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            </button>
            <div class="pdf-title">Rekapitulasi Data Peserta Didik</div>
        </div>
        <div class="pdf-controls">
            <div class="pdf-page-indicator">
                <input type="text" id="current-page-num" class="pdf-page-input" value="1" onchange="goToPage(this.value)">
                <span>/</span>
                <span id="total-pages-num">3</span>
            </div>
            <div style="border-left: 1px solid #555; height: 18px; margin: 0 4px;"></div>
            <button class="pdf-control-btn" onclick="changeZoom(-0.1)" title="Zoom Out">−</button>
            <span class="pdf-zoom-text" id="zoom-val">100%</span>
            <button class="pdf-control-btn" onclick="changeZoom(0.1)" title="Zoom In">+</button>
        </div>
        <div class="pdf-actions">
            <button class="pdf-btn" onclick="window.print()" title="Cetak">
                <svg viewBox="0 0 24 24">
                    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
            </button>
        </div>
    </div>
    <div class="pdf-content-wrapper">
        <div class="pdf-sidebar">
            ${thumbnailsHtml}
        </div>
        <div class="pdf-main-pane">
            ${pagesHtml}
        </div>
    </div>

    <script>
        let currentZoom = 1.0;
        
        function changeZoom(delta) {
            currentZoom = Math.min(2.0, Math.max(0.5, currentZoom + delta));
            const pane = document.querySelector('.pdf-main-pane');
            if (pane) {
                pane.style.setProperty('--pdf-zoom', currentZoom);
            }
            const zoomVal = document.getElementById('zoom-val');
            if (zoomVal) {
                zoomVal.innerText = Math.round(currentZoom * 100) + '%';
            }
        }
        
        function toggleSidebar() {
            const sidebar = document.querySelector('.pdf-sidebar');
            if (sidebar) {
                if (sidebar.style.display === 'none') {
                    sidebar.style.display = 'flex';
                } else {
                    sidebar.style.display = 'none';
                }
            }
        }

        function goToPage(num) {
            const targetPage = document.getElementById('page-container-' + num);
            if (targetPage) {
                targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.getElementById('current-page-num').value = num;
                
                const thumbs = document.querySelectorAll('.thumbnail-container');
                thumbs.forEach((t, i) => {
                    if (i + 1 === parseInt(num)) {
                        t.classList.add('active');
                    } else {
                        t.classList.remove('active');
                    }
                });
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            const pane = document.querySelector('.pdf-main-pane');

            // Auto-fit zoom to fill viewport width
            const pageWidthPx = 210 * 3.7795275591; // 210mm in px
            const paneWidth = pane.clientWidth - 48; // minus padding
            currentZoom = Math.min(1.5, Math.max(0.8, paneWidth / pageWidthPx));
            pane.style.setProperty('--pdf-zoom', currentZoom);
            const zoomVal = document.getElementById('zoom-val');
            if (zoomVal) zoomVal.innerText = Math.round(currentZoom * 100) + '%';

            pane.addEventListener('scroll', () => {
                const paneScrollTop = pane.scrollTop;
                const pageHeight = document.getElementById('page-container-1').offsetHeight * currentZoom + 24;
                const pageNum = Math.min(3, Math.floor(paneScrollTop / pageHeight) + 1);
                document.getElementById('current-page-num').value = pageNum;
                
                const thumbs = document.querySelectorAll('.thumbnail-container');
                thumbs.forEach((t, i) => {
                    if (i + 1 === pageNum) {
                        t.classList.add('active');
                    } else {
                        t.classList.remove('active');
                    }
                });
            });

            const pageInput = document.getElementById('current-page-num');
            if (pageInput) {
                pageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        goToPage(e.target.value);
                    }
                });
            }
        });
    </script>
</body>
</html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (error: any) {
      console.error("Gagal memproses cetak data rekap:", error);
      Swal.fire("Error", "Gagal memproses cetak data rekap", "error");
    }
  };

  const handleShowProfile = async () => {
    if (selectedStudentIds.length === 0) return;

    try {
      Swal.fire({
        title: 'Mempersiapkan Profil...',
        text: 'Mohon tunggu sementara data sedang dimuat.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const sekolahRes = await dapodikService.getSekolah();
      const sekolah = sekolahRes.data || {};

      const studentsData = await Promise.all(
        selectedStudentIds.map(async (id) => {
          const res = await dapodikService.getPesertaDidikDetail(id);
          return res.data;
        })
      );

      Swal.close();

      openBiodataPrintWindow(studentsData, sekolah);
    } catch (error: any) {
      Swal.close();
      console.error("Gagal memuat profil untuk dicetak:", error);
      Swal.fire("Error", "Gagal memuat profil untuk dicetak: " + (error?.message || error), "error");
    }
  };

  const handleExport = async () => {
    if (activeTab === "rekap") {
      Swal.fire({
        title: "Export Rekapitulasi Peserta Didik?",
        text: "Seluruh tabel rekapitulasi Peserta Didik akan diunduh dalam format Excel.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ya, Export!",
        cancelButtonText: "Batal"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            Swal.fire({
              title: "Mengekspor...",
              text: "Sedang mengambil data rekap untuk diekspor",
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });

            const [resTingkat, resKompetensi, resUsia, resAgama, resMasukAktif] = await Promise.all([
              dapodikService.getPdRekapTingkat(),
              dapodikService.getPdRekapKompetensi(),
              dapodikService.getPdRekapUsia(),
              dapodikService.getPdRekapAgama(),
              dapodikService.getPdRekapMasukAktif()
            ]);

            Swal.close();

            const dataTingkat = resTingkat.data || [];
            const dataKompetensi = resKompetensi.data || [];
            const dataUsia = resUsia.data || [];
            const dataAgama = resAgama.data || [];
            const dataMasukAktif = resMasukAktif.data || [];

            const rows: string[][] = [];

            // 1. Tingkat
            rows.push(["REKAP PESERTA DIDIK BERDASARKAN TINGKAT"]);
            rows.push(["Tingkat Kelas", "Jenis Kelamin (L)", "Jenis Kelamin (P)", "Total Jenis Kelamin", "Status Masuk (Baru)", "Status Masuk (Pindahan)", "JML"]);
            dataTingkat.forEach((item: any) => {
              rows.push([
                item.tingkat ? `Tingkat ${item.tingkat}` : "",
                String(item.l || 0),
                String(item.p || 0),
                String(item.total || 0),
                String(item.siswaBaru || 0),
                String((item.pindahan || 0) + (item.mengulang || 0)),
                String(item.total || 0)
              ]);
            });
            rows.push([]); // blank separator

            // 2. Kompetensi
            rows.push(["REKAP PESERTA DIDIK BERDASARKAN KOMPETENSI KEAHLIAN"]);
            rows.push([
              "Kompetensi Keahlian", 
              "Tingkat X (L)", "Tingkat X (P)", "Tingkat X (JML)", 
              "Tingkat XI (L)", "Tingkat XI (P)", "Tingkat XI (JML)", 
              "Tingkat XII (L)", "Tingkat XII (P)", "Tingkat XII (JML)", 
              "Total"
            ]);
            dataKompetensi.forEach((item: any) => {
              rows.push([
                item.kompetensi || "",
                String(item.xL || 0),
                String(item.xP || 0),
                String(item.xJml || 0),
                String(item.xiL || 0),
                String(item.xiP || 0),
                String(item.xiJml || 0),
                String(item.xiiL || 0),
                String(item.xiiP || 0),
                String(item.xiiJml || 0),
                String(item.grandTotal || 0)
              ]);
            });
            rows.push([]); // blank separator

            // 3. Usia
            rows.push(["REKAP PESERTA DIDIK BERDASARKAN USIA"]);
            rows.push(["Rentang Usia", "Jenis Kelamin (L)", "Jenis Kelamin (P)", "Total"]);
            dataUsia.forEach((item: any) => {
              rows.push([
                item.usia || "",
                String(item.l || 0),
                String(item.p || 0),
                String(item.total || 0)
              ]);
            });
            rows.push([]); // blank separator

            // 4. Agama
            rows.push(["REKAP PESERTA DIDIK BERDASARKAN AGAMA"]);
            rows.push(["Agama", "Jenis Kelamin (L)", "Jenis Kelamin (P)", "Total Jenis Kelamin", "Status Masuk (Baru)", "Status Masuk (Pindahan)", "JML"]);
            dataAgama.forEach((item: any) => {
              rows.push([
                item.agama || "",
                String(item.l || 0),
                String(item.p || 0),
                String(item.total || 0),
                String(item.siswaBaru || 0),
                String((item.pindahan || 0) + (item.mengulang || 0)),
                String(item.total || 0)
              ]);
            });
            rows.push([]); // blank separator

            // 5. Masuk Aktif
            rows.push(["REKAP PESERTA DIDIK MASUK TAHUN AJARAN AKTIF"]);
            rows.push(["Jenis Pendaftaran", "Jenis Kelamin (L)", "Jenis Kelamin (P)", "Total"]);
            dataMasukAktif.forEach((item: any) => {
              rows.push([
                item.statusMasuk || "",
                String(item.l || 0),
                String(item.p || 0),
                String(item.total || 0)
              ]);
            });

            // Generate Excel XLSX
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Siswa");
            XLSX.writeFile(workbook, `Rekap_Peserta_Didik_${new Date().toISOString().split('T')[0]}.xlsx`);

            Swal.fire({
              title: "Berhasil!",
              text: "Rekap Peserta Didik berhasil diunduh.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
          } catch (err) {
            console.error(err);
            Swal.fire("Error", "Gagal memproses ekspor rekap peserta didik", "error");
          }
        }
      });
      return;
    }
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = async () => {
    setIsExportModalOpen(false);
    if (exportType === "rombel" && !selectedExportRombel) {
      Swal.fire("Info", "Pilih rombongan belajar terlebih dahulu", "info");
      return;
    }

    try {
      Swal.fire({
        title: "Mengekspor...",
        text: "Sedang mengambil data untuk diekspor",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const isNonAktif = activeTab === 'keluar';
      const statusParam = isNonAktif ? 'non-aktif' : 'aktif';
      const rombelParam = exportType === "rombel" ? selectedExportRombel : undefined;

      const resultData = await dapodikService.getPesertaDidik(10000, searchQuery, 1, rombelParam, statusParam);
      const list = resultData.data || [];

      Swal.close();

      if (list.length === 0) {
        Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
        return;
      }

      // Headers (Only columns shown in the table)
      const headers = [
        "Nama", "JK", "Lengkap Data", "NISN", "NIPD", "NIK", "No. KK",
        "Tingkat", "Rombel", "Tgl Masuk", "Terdaftar Sebagai", "Tempat Lahir", "Tgl Lahir"
      ];

      // Rows
      const rows = list.map((item: any) => {
        const isFieldFilled = (valItem: any, key: string) => {
          const value = valItem[key];
          if (value && value !== '-' && value !== '' && value !== 0 && value !== '0') {
            return true;
          }
          if (key === 'provinsi' || key === 'kabupaten_kota' || key === 'kecamatan') {
            const desa = valItem['desa_kelurahan'];
            const kodeWilayah = valItem['kode_wilayah'];
            return !!((desa && desa !== '-' && desa !== '') || (kodeWilayah && kodeWilayah !== '-' && kodeWilayah !== ''));
          }
          return false;
        };

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
        const lengkapData = Math.round((filled / fields.length) * 100);

        const rombel = item.rombongan_belajar || item.anggota_rombel?.[0]?.rombongan_belajar;
        const jenisPendaftaran = item.jenis_pendaftaran_id === 1 || String(item.jenis_pendaftaran_id) === "1" ? "Siswa Baru" : "Pindahan";

        return [
          item.nama || "",
          item.jenis_kelamin || "",
          `${lengkapData}%`,
          item.nisn || "",
          item.nipd || "",
          item.nik || "",
          item.no_kk || "",
          rombel?.tingkat_pendidikan_id ? String(rombel.tingkat_pendidikan_id) : "",
          rombel?.nama || "",
          item.tanggal_masuk_sekolah ? formatDateDMY(item.tanggal_masuk_sekolah) : "",
          jenisPendaftaran,
          item.tempat_lahir || "",
          item.tanggal_lahir && !isNaN(new Date(item.tanggal_lahir).getTime()) ? formatDateDMY(item.tanggal_lahir) : ""
        ];
      });

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");
      XLSX.writeFile(workbook, `Data_Peserta_Didik_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);

      Swal.fire({
        title: "Berhasil!",
        text: "Data Peserta Didik berhasil diunduh.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal memproses ekspor data peserta didik", "error");
    }
  };

  const handlePrint = () => {
    if (activeTab === "rekap") {
      openRekapPrintWindow();
    } else {
      setIsPrintModalOpen(true);
    }
  };

  const handleConfirmPrint = async () => {
    setIsPrintModalOpen(false);
    if (printType === "rombel" && !selectedPrintRombel) {
      Swal.fire("Info", "Pilih rombongan belajar terlebih dahulu", "info");
      return;
    }

    try {
      Swal.fire({
        title: 'Mengambil Data...',
        text: 'Mohon tunggu sementara data sedang dimuat.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const sekolahRes = await dapodikService.getSekolah();
      const sekolah = sekolahRes.data || {};

      const isNonAktif = activeTab === 'keluar';
      const statusParam = isNonAktif ? 'non-aktif' : 'aktif';
      const rombelParam = printType === "rombel" ? selectedPrintRombel : undefined;

      const resultData = await dapodikService.getPesertaDidik(10000, searchQuery, 1, rombelParam, statusParam);
      const list = resultData.data || [];

      if (list.length === 0) {
        Swal.close();
        Swal.fire("Info", "Tidak ada data untuk dicetak", "info");
        return;
      }

      const studentsData: any[] = [];
      const batchSize = 10;
      for (let i = 0; i < list.length; i += batchSize) {
        const batch = list.slice(i, i + batchSize);
        const batchData = await Promise.all(
          batch.map(async (item: any) => {
            try {
              const res = await dapodikService.getPesertaDidikDetail(item.peserta_didik_id);
              return res.data;
            } catch (e) {
              console.error("Gagal mengambil detail siswa:", item.nama, e);
              return null;
            }
          })
        );
        studentsData.push(...batchData.filter(Boolean));
      }

      Swal.close();

      if (studentsData.length === 0) {
        Swal.fire("Info", "Gagal memuat detail profil siswa", "info");
        return;
      }

      openBiodataPrintWindow(studentsData, sekolah);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal memproses cetak data peserta didik", "error");
    }
  };

  return (
    <>
      <PageMeta
        title="Peserta Didik | SIMAK Admin Panel"
        description="Student data management page"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Data Peserta Didik (PD)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola informasi profil sekolah Anda di sini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedStudentIds.length > 0 && (
              <>
                <Button
                  variant="error-outline"
                  size="sm"
                  className="min-w-[110px]"
                  startIcon={<CheckCircleIcon className="size-4" />}
                  onClick={handleRegister}
                >
                  Register
                </Button>
                <Button
                  variant="primary-outline"
                  size="sm"
                  className="min-w-[110px]"
                  startIcon={<UserCircleIcon className="size-4" />}
                  onClick={handleShowProfile}
                >
                  Profil
                </Button>
                <Button
                  variant="warning-outline"
                  size="sm"
                  className="min-w-[110px]"
                  startIcon={<PencilIcon className="size-4" />}
                  onClick={handleEditData}
                >
                  Ubah
                </Button>
              </>
            )}
            <Button
              variant="success-outline"
              size="sm"
              className="min-w-[110px]"
              startIcon={<DownloadIcon className="size-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[110px]"
              startIcon={<PrinterIcon className="size-4" />}
              onClick={handlePrint}
            >
              Cetak
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 print-area">
          {activeTab !== "rekap" && (
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
              <div className="w-20">
                <Select
                  options={rowsPerPageOptions}
                  defaultValue={itemsPerPage.toString()}
                  onChange={(value) => setItemsPerPage(parseInt(value))}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full lg:justify-end">
                <div className="relative max-w-sm w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon className="size-5" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Cari Nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {activeTab === "aktif" && (
                  <>
                    <div className="w-full sm:w-56">
                        <Select
                            options={gradeOptions}
                            defaultValue={gradeFilter}
                            onChange={(value) => setGradeFilter(value)}
                        />
                    </div>
                    <div className="w-full sm:w-56">
                        <Select
                            options={completenessOptions}
                            defaultValue={completenessFilter}
                            onChange={(value) => setCompletenessFilter(value)}
                        />
                    </div>
                    <div className="w-full sm:w-56">
                        <Select
                             options={rombelOptions}
                             defaultValue={rombelFilter}
                             onChange={(value) => setRombelFilter(value)}
                        />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "aktif" && (
            <StudentTable 
                type="aktif" 
                onSelectionChange={handleSelectionChange} 
                searchTerm={debouncedSearchQuery}
                completenessFilter={completenessFilter}
                gradeFilter={gradeFilter}
                itemsPerPage={itemsPerPage}
                rombelFilter={rombelFilter === 'all' ? undefined : rombelFilter}
            />
          )}

          {activeTab === "rekap" && (
            <div className="space-y-8">
                <div>
                    <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                        Rekap PD berdasarkan Tingkat
                    </h4>
                    <RekapPDTable 
                        searchTerm={debouncedSearchQuery}
                    />
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                    <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                        Rekap PD berdasarkan Kompetensi Keahlian
                    </h4>
                    <RekapPDKompetensiTable 
                        searchTerm={debouncedSearchQuery}
                    />
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                    <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                        Rekap PD berdasarkan Usia
                    </h4>
                    <RekapPDUsiaTable />
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                    <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                        Rekap PD berdasarkan Agama
                    </h4>
                    <RekapPDAgamaTable 
                        searchTerm={debouncedSearchQuery}
                    />
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                    <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                        Rekap PD Masuk Tahun Ajaran Aktif
                    </h4>
                    <RekapPDMasukAktifTable 
                        searchTerm={debouncedSearchQuery}
                    />
                </div>
            </div>
          )}

          {activeTab === "keluar" && (
            <div className="space-y-4">
              <PDKeluarTable 
                onSelectionChange={handleSelectionChange} 
                searchTerm={debouncedSearchQuery}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        className="max-w-md p-6"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Pilih Cetak Biodata Peserta Didik
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cetak laporan biodata lengkap A4 untuk peserta didik.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label 
              onClick={() => setPrintType("all")}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                printType === "all"
                  ? "border-brand-500 bg-brand-50/30 dark:bg-brand-500/10"
                  : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              }`}
            >
              <input 
                type="radio" 
                name="print-pd-type" 
                value="all" 
                checked={printType === "all"} 
                onChange={() => setPrintType("all")}
                className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 accent-brand-500"
              />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Semua Peserta Didik</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Cetak data biodata seluruh siswa di tab saat ini</div>
              </div>
            </label>

            <label 
              onClick={() => setPrintType("rombel")}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                printType === "rombel"
                  ? "border-brand-500 bg-brand-50/30 dark:bg-brand-500/10"
                  : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              }`}
            >
              <input 
                type="radio" 
                name="print-pd-type" 
                value="rombel" 
                checked={printType === "rombel"} 
                onChange={() => setPrintType("rombel")}
                className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 accent-brand-500"
              />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Per Rombongan Belajar (Rombel)</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Cetak data biodata siswa dari rombel tertentu</div>
              </div>
            </label>

            {printType === "rombel" && (
              <div className="mt-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Pilih Rombongan Belajar</label>
                <Select
                  options={[
                    { value: "", label: "Pilih Rombel..." },
                    ...rombels.map(r => ({ value: r.nama, label: r.nama }))
                  ]}
                  defaultValue={selectedPrintRombel}
                  onChange={(val) => setSelectedPrintRombel(val)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <Button variant="primary" onClick={handleConfirmPrint}>
              Cetak
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        className="max-w-md p-6"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Pilih Ekspor Data Peserta Didik
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ekspor data peserta didik ke format Excel (.xlsx).
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label 
              onClick={() => setExportType("all")}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                exportType === "all"
                  ? "border-brand-500 bg-brand-50/30 dark:bg-brand-500/10"
                  : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              }`}
            >
              <input 
                type="radio" 
                name="export-pd-type" 
                value="all" 
                checked={exportType === "all"} 
                onChange={() => setExportType("all")}
                className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 accent-brand-500"
              />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Semua Peserta Didik</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Ekspor seluruh siswa di tab saat ini</div>
              </div>
            </label>

            <label 
              onClick={() => setExportType("rombel")}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                exportType === "rombel"
                  ? "border-brand-500 bg-brand-50/30 dark:bg-brand-500/10"
                  : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              }`}
            >
              <input 
                type="radio" 
                name="export-pd-type" 
                value="rombel" 
                checked={exportType === "rombel"} 
                onChange={() => setExportType("rombel")}
                className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 accent-brand-500"
              />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white/90">Per Rombongan Belajar (Rombel)</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Ekspor data siswa dari rombel tertentu</div>
              </div>
            </label>

            {exportType === "rombel" && (
              <div className="mt-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Pilih Rombongan Belajar</label>
                <Select
                  options={[
                    { value: "", label: "Pilih Rombel..." },
                    ...rombels.map(r => ({ value: r.nama, label: r.nama }))
                  ]}
                  defaultValue={selectedExportRombel}
                  onChange={(val) => setSelectedExportRombel(val)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <Button variant="primary" onClick={handleConfirmExport}>
              Ekspor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Registrasi Keluar/Mutasi */}
      <Modal
        isOpen={isMutasiModalOpen}
        onClose={() => setIsMutasiModalOpen(false)}
        className="max-w-[500px] p-6 flex flex-col"
      >
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            Registrasi Mutasi / PD Keluar
          </h4>
          <button
            onClick={() => setIsMutasiModalOpen(false)}
            className="text-gray-400 hover:text-gray-500 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmitMutasi} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Jenis Keluar
            </label>
            <select
              value={selectedJenisKeluar}
              onChange={(e) => setSelectedJenisKeluar(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            >
              <option value="">-- Pilih Jenis Keluar --</option>
              {jenisKeluarRefList.map((item) => (
                <option key={item.jenis_keluar_id} value={item.jenis_keluar_id}>
                  {item.ket_keluar}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Alasan Keluar
            </label>
            <textarea
              value={alasanMutasi}
              onChange={(e) => setAlasanMutasi(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[80px]"
              placeholder="Masukkan alasan mutasi atau keluar siswa..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Unggah Bukti Dokumen (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setBuktiFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-700"
              required
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Hanya menerima file berformat PDF dengan ukuran maksimal 200KB.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsMutasiModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={submittingMutasi}
            >
              Batal
            </button>
            <Button type="submit" variant="primary" disabled={submittingMutasi}>
              Kirim Pengajuan
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
