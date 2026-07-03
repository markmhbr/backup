import { useState, useEffect } from "react";
import { formatDateDMY as globalFormatDateDMY, formatDateObjDMY } from "../../utils/formatDate";
import { useSearchParams, useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { DownloadIcon, PrinterIcon, UserCircleIcon, CheckCircleIcon, SearchIcon, PencilIcon } from "../../icons";

import Swal from "sweetalert2";
import GuruTable from "../../components/gtk/GuruTable";
import TendikTable from "../../components/gtk/TendikTable";
import NonAktifTable from "../../components/gtk/NonAktifTable";
import RekapGTKTable from "../../components/gtk/RekapGTKTable";
import RekapGTKPendidikanTable from "../../components/gtk/RekapGTKPendidikanTable";
import RekapGTKUsiaTable from "../../components/gtk/RekapGTKUsiaTable";
import { dapodikService } from "../../services/dapodikService";
import { getFotoUrl } from "../../utils/image";



export default function GTKData() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "guru" | "tendik" | "rekap" | "nonaktif";

  const [activeTab, setActiveTab] = useState<"guru" | "tendik" | "rekap" | "nonaktif">(
    tabParam || "guru"
  );

  // Sync state with URL parameter
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedGTKIds, setSelectedGTKIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [completenessFilter, setCompletenessFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);



  const completenessOptions = [
    { value: "all", label: "Semua Kelengkapan" },
    { value: "100", label: "Lengkap Data 100%" },
    { value: "99", label: "Lengkap Data < 100%" },
    { value: "50", label: "Lengkap Data < 50%" },
  ];

  const rowsPerPageOptions = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedGTKIds(selectedIds);
  };

  const handleEditData = () => {
    if (selectedGTKIds.length === 1) {
      navigate(`/${role}/gtk-data/edit/${selectedGTKIds[0]}`);
    }
  };

  const handleRegister = () => {
    Swal.fire({
      title: "Registrasi GTK?",
      text: `Anda akan meregistrasi ${selectedGTKIds.length} item yang dipilih.`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#465fff",
      confirmButtonText: "Ya, Registrasi!",
    });
  };

  const handleShowProfile = async () => {
    if (selectedGTKIds.length === 0) return;
    const { printGTKProfile } = await import("../../utils/printGTKProfile");
    await printGTKProfile(selectedGTKIds);
  };

  const old_handleShowProfile = async () => {
    if (Math.random() > 10) {
      const printWindow: any = null;
      if (printWindow) console.log(printWindow);
      try {
      Swal.fire({
        title: 'Mempersiapkan Profil...',
        text: 'Mohon tunggu sementara data sedang dimuat.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // 1. Fetch school info
      const sekolahRes = await dapodikService.getSekolah();
      const sekolah = sekolahRes.data || {};

      // 2. Fetch all selected GTKs details
      const gtksData = await Promise.all(
        selectedGTKIds.map(async (id) => {
          const res = await dapodikService.getGtkDetail(id);
          return res.data;
        })
      );

      Swal.close();

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        Swal.fire("Gagal", "Popup blocker aktif. Mohon izinkan popup untuk mencetak.", "error");
        return;
      }

      // Formatted dates
      const todayFormatted = formatDateObjDMY(new Date());
      const now = new Date();
      const timeFormatted = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
      const nowFormatted = todayFormatted + " " + timeFormatted;

      // 3. Construct HTML
      let htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Biodata GTK</title>
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
        
        /* screen mode styles */
        @media screen {
            html, body {
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: #323639;
            }
            body {
                display: flex;
                flex-direction: column;
            }
            .pdf-toolbar {
                height: 56px;
                background-color: #323639;
                color: #f1f1f1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                box-sizing: border-box;
                border-bottom: 1px solid #1c1f21;
                z-index: 100;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
            }
            .pdf-title-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .pdf-hamburger {
                background: none;
                border: none;
                color: #f1f1f1;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px;
                border-radius: 50%;
                outline: none;
            }
            .pdf-hamburger:hover {
                background-color: rgba(255,255,255,0.1);
            }
            .pdf-title {
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 300px;
            }
            .pdf-controls {
                display: flex;
                align-items: center;
                gap: 12px;
                background-color: #202124;
                padding: 4px 16px;
                border-radius: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            .pdf-control-btn {
                background: none;
                border: none;
                color: #bdc1c6;
                cursor: pointer;
                font-size: 20px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                outline: none;
                transition: background-color 0.2s, color 0.2s;
            }
            .pdf-control-btn:hover {
                background-color: rgba(255,255,255,0.1);
                color: #fff;
            }
            .pdf-page-indicator {
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #bdc1c6;
            }
            .pdf-page-input {
                width: 36px;
                background-color: #35363a;
                border: 1px solid #5f6368;
                color: white;
                text-align: center;
                font-size: 13px;
                padding: 3px 0;
                border-radius: 4px;
                outline: none;
            }
            .pdf-page-input:focus {
                border-color: #8ab4f8;
            }
            .pdf-zoom-text {
                font-size: 13px;
                min-width: 48px;
                text-align: center;
                color: #bdc1c6;
            }
            .pdf-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .pdf-btn {
                background: none;
                border: none;
                color: #f1f1f1;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                outline: none;
                transition: background-color 0.2s;
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
                flex: 1;
                overflow: hidden;
                position: relative;
            }
            .pdf-sidebar {
                width: 200px;
                background-color: #323639;
                border-right: 1px solid #1c1f21;
                overflow-y: auto;
                padding: 20px 10px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                transition: width 0.2s;
            }
            .pdf-main-pane {
                flex: 1;
                background-color: #525659;
                overflow-y: auto;
                padding: 24px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                scroll-behavior: smooth;
            }
            .page-container {
                width: 210mm;
                height: 297mm;
                margin-bottom: 24px;
                background: white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 12px 24px rgba(0,0,0,0.2);
                padding: 1.2cm 2cm;
                box-sizing: border-box;
                position: relative;
                border-radius: 2px;
                flex-shrink: 0;
                transform-origin: top center;
            }
            .thumbnail-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                width: 100%;
            }
            .thumbnail-container {
                width: 110px;
                height: 156px;
                border: 3px solid transparent;
                border-radius: 4px;
                background-color: #fff;
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                transition: border-color 0.2s, transform 0.2s;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .thumbnail-container:hover {
                transform: translateY(-2px);
                border-color: rgba(255,255,255,0.2);
            }
            .thumbnail-container.active {
                border-color: #8ab4f8;
                box-shadow: 0 0 0 1px #8ab4f8, 0 4px 12px rgba(0,0,0,0.4);
            }
            .thumbnail-page {
                width: 210mm;
                height: 297mm;
                transform: scale(0.138); /* fits inside 110x156 precisely */
                transform-origin: top left;
                pointer-events: none;
                position: absolute;
                top: 0;
                left: 0;
                background: white;
            }
            .thumbnail-page .page-container {
                zoom: 1 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                box-sizing: border-box !important;
                padding: 1.2cm 2cm !important;
            }
            .thumbnail-number {
                color: #bdc1c6;
                font-size: 12px;
                font-family: Arial, sans-serif;
                font-weight: 500;
            }
        }

        /* print mode styles */
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
            }
            .pdf-main-pane {
                display: block !important;
                overflow: visible !important;
                padding: 0 !important;
                background-color: transparent !important;
            }
            .page-container {
                width: 210mm !important;
                height: 297mm !important;
                padding: 1.2cm 2cm !important;
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

        .header-table {
            width: 100%;
            border-bottom: 2px solid #000;
            margin-bottom: 15px;
            padding-bottom: 5px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo {
            width: 75px;
            height: auto;
        }
        .kop-text {
            text-align: center;
        }
        .kop-h1 {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
        }
        .kop-h2 {
            font-size: 14px;
            font-weight: bold;
            margin: 2px 0;
            text-transform: uppercase;
        }
        .kop-address {
            font-size: 10px;
            font-style: italic;
        }
        .page-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .page-subtitle {
            text-align: center;
            font-size: 10px;
            margin-bottom: 20px;
            color: #555;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            margin: 15px 0 5px 0;
            background-color: #f0f0f0;
            padding: 5px;
            border-left: 4px solid #333;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .data-table td,
        .data-table th {
            padding: 4px 6px;
            vertical-align: top;
        }
        .table-clean td {
            border: none;
        }
        .label {
            width: 160px;
            font-weight: bold;
            color: #444;
        }
        .sep {
            width: 10px;
            text-align: center;
        }
        .table-bordered th,
        .table-bordered td {
            border: 1px solid #999;
        }
        .table-bordered th {
            background-color: #e9e9e9;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
        }
        .table-bordered td {
            font-size: 10px;
        }
        .table-footer td {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        .photo-container {
            width: 3cm;
            height: 4cm;
            border: 1px solid #ddd;
            padding: 3px;
            object-fit: cover;
            display: inline-block;
        }
        .signature-wrapper {
            margin-top: 30px;
            page-break-inside: avoid;
        }
        .signature-box {
            text-align: center;
            width: 250px;
            float: right;
        }
        .text-center {
            text-align: center;
        }
        .text-left {
            text-align: left;
        }
        .text-right {
            text-align: right;
        }
        .bold {
            font-weight: bold;
        }
        .page-break {
            page-break-after: always;
        }
        .text-muted {
            color: #777;
            font-style: italic;
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
        .qr-validation {
            position: absolute;
            bottom: 1.8cm;
            left: 2cm;
            font-size: 8px;
            text-align: left;
        }
    </style>
</head>
<body>

`;

      const logoUrl = getFotoUrl(sekolah.logo, '');

      let pagesHtml = '';
      let thumbnailsHtml = '';
      let globalPageIndex = 1;

      gtksData.forEach((gtk) => {
        if (!gtk) return;

        // Formatted dates
        const formatIndoDate = (dateStr: string | null | undefined) => {
          if (!dateStr) return "-";
          return globalFormatDateDMY(dateStr);
        };

        const formatDateDMY = (dateStr: string | null | undefined) => {
          return globalFormatDateDMY(dateStr);
        };

        const todayFormatted = formatDateObjDMY(new Date());

        // Foto URL
        const fotoUrl = getFotoUrl(gtk.foto);

        // Tanda tangan URL
        const ttdUrl = getFotoUrl(gtk.tandatangan, '');

        // SK Pengangkatan priority logic
        let skPdf = gtk.sk_pengangkatan || "";
        let tmtPdf = gtk.tmt_pengangkatan || "";

        if (!skPdf && gtk.rwy_kepangkatan) {
          try {
            const hist = typeof gtk.rwy_kepangkatan === 'string' ? JSON.parse(gtk.rwy_kepangkatan) : gtk.rwy_kepangkatan;
            if (Array.isArray(hist) && hist.length > 0) {
              skPdf = hist[0].nomor_sk || "-";
              tmtPdf = hist[0].tmt_pangkat || hist[0].tmt_golongan || "";
            }
          } catch (e) {
            console.error("Gagal parse rwy_kepangkatan", e);
          }
        }

        // Education history parsing
        let educationList: any[] = [];
        if (gtk.riwayat_pendidikan_formal) {
          educationList = gtk.riwayat_pendidikan_formal;
        } else if (gtk.rwy_pend_formal) {
          try {
            educationList = typeof gtk.rwy_pend_formal === 'string' ? JSON.parse(gtk.rwy_pend_formal) : gtk.rwy_pend_formal;
          } catch (e) {
            console.error("Gagal parse rwy_pend_formal", e);
          }
        }

        // Certification records
        const certList = gtk.rwy_sertifikasi || [];
        const hasSertifikasi = certList.length > 0 || !!gtk.rekening_bank;

        // Teaching records (Pembelajaran)
        const pembelajaranList = gtk.pembelajaran || [];
        let totalJam = 0;

        // Form province text dynamically
        const rawProv = sekolah.provinsi || 'JAWA BARAT';
        const provUpper = rawProv.toUpperCase();
        const provText = provUpper.includes('PROVINSI')
          ? `PEMERINTAH ${provUpper}`
          : `PEMERINTAH PROVINSI ${provUpper}`;

        const page1Content = `
    <!-- KOP SURAT -->
    <table class="header-table">
        <tr>
            <td style="width: 15%;">
                ${logoUrl ? `<img src="${logoUrl}" class="logo">` : ''}
            </td>
            <td class="kop-text">
                <div class="kop-h1">${provText}</div>
                <div class="kop-h1">DINAS PENDIDIKAN</div>
                <div class="kop-h2">${(sekolah.nama || 'NAMA SEKOLAH').toUpperCase()}</div>
                <div class="kop-address">
                    ${sekolah.alamat_jalan || 'Alamat Sekolah'}
                    ${sekolah.nomor_telepon ? `| Telp: ${sekolah.nomor_telepon}` : ''}
                    ${sekolah.email ? `| Email: ${sekolah.email}` : ''}
                </div>
            </td>
            <td style="width: 15%;"></td>
        </tr>
    </table>

    <div class="page-title">BIODATA PENDIDIK DAN TENAGA KEPENDIDIKAN</div>
    <div class="page-subtitle">Laporan data per tanggal: ${todayFormatted}</div>

    <div class="section-title">A. IDENTITAS DIRI</div>
    <table class="data-table table-clean" style="width: 100%;">
        <tr>
            <!-- KOLOM DATA (KIRI) -->
            <td style="width: 70%; padding: 0; vertical-align: top;">
                <table class="data-table table-clean" style="width: 100%; margin: 0;">
                    <tr>
                        <td class="label">Nama Lengkap</td>
                        <td class="sep">:</td>
                        <td class="val bold">${gtk.nama}</td>
                    </tr>
                    <tr>
                        <td class="label">NIK</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.nik || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">No. KK</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.no_kk || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">NUPTK</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.nuptk || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Tempat, Tanggal Lahir</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.tempat_lahir || '-'}, ${formatIndoDate(gtk.tanggal_lahir)}</td>
                    </tr>
                    <tr>
                        <td class="label">Jenis Kelamin</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    </tr>
                    <tr>
                        <td class="label">Agama</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.agama_id_str || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Nama Ibu Kandung</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.nama_ibu_kandung || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Status Perkawinan</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.status_perkawinan || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Nama Pasangan</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.nama_suami_istri || '-'}</td>
                    </tr>
                </table>
            </td>

            <!-- KOLOM FOTO (KANAN) -->
            <td style="width: 30%; text-align: center; vertical-align: top; padding-top: 5px;">
                <div style="border: 1px solid #ccc; padding: 5px; display: inline-block;">
                    <img src="${fotoUrl}" style="width: 3cm; height: 4cm; object-fit: cover;">
                </div>
            </td>
        </tr>
    </table>

    <div class="section-title">B. ALAMAT & KONTAK</div>
    <table class="data-table table-clean">
        <tr>
            <td class="label">Alamat Rumah</td>
            <td class="sep">:</td>
            <td class="val">${gtk.alamat_jalan || '-'}</td>
        </tr>
        <tr>
            <td class="label">RT / RW</td>
            <td class="sep">:</td>
            <td class="val">${gtk.rt || '-'} / ${gtk.rw || '-'}</td>
        </tr>
        <tr>
            <td class="label">Desa/Kelurahan</td>
            <td class="sep">:</td>
            <td class="val">${gtk.desa_kelurahan || '-'}</td>
        </tr>
        <tr>
            <td class="label">Kecamatan</td>
            <td class="sep">:</td>
            <td class="val">${gtk.kecamatan || '-'}</td>
        </tr>
        <tr>
            <td class="label">Nomor HP</td>
            <td class="sep">:</td>
            <td class="val">${gtk.no_hp || '-'}</td>
        </tr>
        <tr>
            <td class="label">No. Whatsapp</td>
            <td class="sep">:</td>
            <td class="val">${gtk.no_wa || '-'}</td>
        </tr>
        <tr>
            <td class="label">Email</td>
            <td class="sep">:</td>
            <td class="val">${gtk.email || '-'}</td>
        </tr>
    </table>

    <div class="section-title">C. DATA KEPEGAWAIAN</div>
    <table class="data-table table-clean">
        <tr>
            <td width="50%" style="padding:0; vertical-align: top;">
                <table class="data-table table-clean">
                    <tr>
                        <td class="label" style="width:130px;">Status Kepegawaian</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.status_kepegawaian_id_str || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">NIP</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.nip || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">NIY / NIGK</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.niy_nigk || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Jenis PTK</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.jenis_ptk_id_str || '-'}</td>
                    </tr>
                </table>
            </td>
            <td width="50%" style="padding:0; vertical-align: top;">
                <table class="data-table table-clean">
                    <tr>
                        <td class="label" style="width:130px;">SK Pengangkatan</td>
                        <td class="sep">:</td>
                        <td class="val">${skPdf || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">TMT Pengangkatan</td>
                        <td class="sep">:</td>
                        <td class="val">${formatIndoDate(tmtPdf)}</td>
                    </tr>
                    <tr>
                        <td class="label">Lembaga Pengangkat</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.lembaga_pengangkat || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Sumber Gaji</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.sumber_gaji || '-'}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="section-title">D. KOMPETENSI & KEAHLIAN</div>
    <table class="data-table table-clean">
        <tr>
            <td width="50%" style="padding:0; vertical-align: top;">
                <table class="data-table table-clean">
                    <tr>
                        <td class="label" style="width:130px;">Lisensi Kepala Sekolah</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.lisensi_kepsek ? 'Ya' : 'Tidak'}</td>
                    </tr>
                    <tr>
                        <td class="label">Nomor Registrasi (NUKS)</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.nuks || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Keahlian Laboratorium</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.keahlian_laboratorium || '-'}</td>
                    </tr>
                </table>
            </td>
            <td width="50%" style="padding:0; vertical-align: top;">
                <table class="data-table table-clean">
                    <tr>
                        <td class="label" style="width:130px;">Mampu Menangani Keb. Khusus</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.mampu_menangani_kebutuhan_khusus || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Keahlian Braille</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.keahlian_braille ? 'Ya' : 'Tidak'}</td>
                    </tr>
                    <tr>
                        <td class="label">Bahasa Isyarat</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.keahlian_bahasa_isyarat ? 'Ya' : 'Tidak'}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
        `;

        const page2Content = `
    <div class="section-title">E. RIWAYAT PENDIDIKAN FORMAL</div>
    <table class="data-table table-bordered" style="margin-top: 15px;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="40%">Jenjang & Institusi</th>
                <th width="20%" class="text-center">Thn Lulus</th>
                <th width="15%" class="text-center">IPK</th>
            </tr>
        </thead>
        <tbody>
            ${educationList.length > 0
            ? educationList.map((rw, i) => `
                <tr>
                    <td class="text-center">${i + 1}</td>
                    <td>
                        <strong>${rw.jenjang_pendidikan_id_str || '-'}</strong><br>
                        <span class="text-muted" style="font-size: 9px;">
                            ${rw.satuan_pendidikan_formal || '-'}
                        </span>
                    </td>
                    <td class="text-center">${rw.tahun_lulus || '-'}</td>
                    <td class="text-center">${rw.ipk || '-'}</td>
                </tr>
              `).join('')
            : `
                <tr>
                    <td colspan="4" class="text-center text-muted" style="padding: 10px;">
                        Tidak ada data riwayat pendidikan.
                    </td>
                </tr>
              `
          }
        </tbody>
        <tfoot class="table-footer">
            <tr>
                <td colspan="4" class="text-right" style="font-size: 9px; color: gray;">
                    * Data berdasarkan riwayat pendidikan formal terakhir yang tercatat.
                </td>
            </tr>
        </tfoot>
    </table>

    <div class="section-title">F. RIWAYAT SERTIFIKASI</div>
    <table class="data-table table-bordered" style="margin-top: 15px;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="25%" class="text-left">Lembaga / Jenis Sertifikasi</th>
                <th width="25%" class="text-left">Bidang Studi</th>
                <th width="20%">Masa Berlaku</th>
                <th width="25%" class="text-left">Detail Sertifikat</th>
            </tr>
        </thead>
        <tbody>
            ${certList.length > 0
            ? certList.map((sert: any, i: number) => `
                <tr>
                    <td class="text-center">${i + 1}</td>
                    <td>
                        <strong>${sert.lemb_sertifikasi?.nama || sert.lemb_sertifikasi?.nm_lemb_sert || '-'}</strong><br>
                        <span class="text-muted" style="font-size: 9px;">${sert.id_jenis_sertifikasi_str || '-'}</span>
                    </td>
                    <td>${sert.bidang_studi?.bidang_studi || sert.bidang_studi_id_str || '-'}</td>
                    <td class="text-center">
                        ${formatDateDMY(sert.tgl_sert)} <br> s.d. <br>
                        ${formatDateDMY(sert.tgl_exp_sert)}
                    </td>
                    <td>
                        <span class="text-muted" style="font-size: 9px;">No. Sertifikat:</span><br> ${sert.nomor_sertifikat || '-'}<br>
                        <span class="text-muted" style="font-size: 9px;">No. Registrasi:</span><br> ${sert.nomer_registrasi || '-'}<br>
                        <span class="text-muted" style="font-size: 9px;">No. Peserta:</span><br> ${sert.nomor_peserta || '-'}
                    </td>
                </tr>
              `).join('')
            : `
                <tr>
                    <td colspan="5" class="text-center text-muted" style="padding: 10px;">
                        Tidak ada data riwayat sertifikasi ditemukan dalam database Dapodik.
                    </td>
                </tr>
              `
          }
        </tbody>
    </table>

    ${hasSertifikasi ? `
    <div class="section-title">G. DATA BANK</div>
    <table class="data-table table-clean">
        <tr>
            <td width="50%" style="padding:0; vertical-align: top;">
                <table class="data-table table-clean">
                    <tr>
                        <td class="label">Nama Bank</td>
                        <td class="sep">:</td>
                        <td class="val"><strong>${gtk.id_bank || '-'}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Cabang Bank</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.nama_kcp || '-'}</td>
                    </tr>
                </table>
            </td>
            <td width="50%" style="padding:0; vertical-align: top;">
                <table class="data-table table-clean">
                    <tr>
                        <td class="label">Nomor Rekening</td>
                        <td class="sep">:</td>
                        <td class="val"><strong>${gtk.rekening_bank || '-'}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Atas Nama (A.N)</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.rekening_atas_nama || '-'}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    ` : ''}

    <div class="section-title">H. REKAPITULASI PEMBELAJARAN</div>
    <table class="data-table table-bordered" style="margin-top: 15px;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="40%" class="text-left">Mata Pelajaran</th>
                <th class="text-left">Kelas / Rombel</th>
                <th width="15%">Jml Jam/Minggu</th>
            </tr>
        </thead>
        <tbody>
            ${pembelajaranList.length > 0
            ? pembelajaranList.map((tugas: any, idx: number) => {
              const jam = parseInt(tugas.jam_mengajar_per_minggu || "0");
              totalJam += jam;
              return `
                    <tr>
                        <td class="text-center">${idx + 1}</td>
                        <td>
                            <strong>${tugas.nama_mata_pelajaran || tugas.mata_pelajaran_id_str || '-'}</strong>
                        </td>
                        <td>${tugas.rombongan_belajar?.nama || '-'}</td>
                        <td class="text-center">${jam}</td>
                    </tr>
                  `;
            }).join('')
            : `
                <tr>
                    <td colspan="4" class="text-center text-muted" style="padding: 10px;">Tidak ada data pembelajaran (tugas pokok) ditemukan.</td>
                </tr>
              `
          }
        </tbody>
        <tfoot class="table-footer">
            <tr>
                <td colspan="3" class="text-right">Total Jam Mengajar</td>
                <td class="text-center">${totalJam}</td>
            </tr>
        </tfoot>
    </table>

    <div class="section-title">I. TUGAS TAMBAHAN</div>
    <table class="data-table table-bordered" style="margin-top: 15px;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="80%" class="text-left">Tugas Tambahan</th>
                <th width="15%">Jml Jam/Minggu</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td colspan="3" class="text-center text-muted" style="padding: 10px;">
                    Tidak ada data tugas tambahan.
                </td>
            </tr>
        </tbody>
        <tfoot class="table-footer">
            <tr>
                <td colspan="2" class="text-right"><strong>Total Jam Tugas Tambahan</strong></td>
                <td class="text-center"><strong>0</strong></td>
            </tr>
        </tfoot>
    </table>

    <!-- TANDA TANGAN (RIGHT) -->
    <div class="signature-box">
        <p style="margin: 0 0 5px 0;">Cianjur, ${todayFormatted}</p>
        <p style="margin: 0 0 10px 0;">Yang Bersangkutan,</p>

        <div style="height: 60px; margin: 10px auto; display: flex; align-items: center; justify-content: center;">
            ${ttdUrl ? `<img src="${ttdUrl}" style="max-height: 60px; max-width: 150px;">` : ''}
        </div>

        <p style="font-weight: bold; text-decoration: underline; margin: 10px 0 2px 0;">${gtk.nama.toUpperCase()}</p>
        <p style="margin: 0;">NIP/NIY. ${gtk.nip || gtk.niy_nigk || '-'}</p>
    </div>

    <!-- QR VALIDATION (LEFT) -->
    <div class="qr-validation">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=Validasi Data: ${encodeURIComponent(gtk.nama)} - ${encodeURIComponent(gtk.nik || '')}" style="width: 70px; height: 70px;">
        <div style="font-size: 8px; margin-top: 5px;">Dokumen ini digenerate otomatis.</div>
    </div>
        `;

        // Accumulate full-size HTML pages
        pagesHtml += `
<div id="page-container-${globalPageIndex}" class="page-container">
    ${page1Content}
    <div class="page-footer">
        Dicetak melalui Sistem Informasi Sekolah pada ${nowFormatted} | Hal <span class="page-number"></span>
    </div>
</div>
        `;

        // Accumulate scaled-down thumbnails
        thumbnailsHtml += `
<div class="thumbnail-wrapper" onclick="goToPage(${globalPageIndex})">
    <div class="thumbnail-container ${globalPageIndex === 1 ? 'active' : ''}">
        <div class="thumbnail-page">
            <div class="page-container">
                ${page1Content}
            </div>
        </div>
    </div>
    <div class="thumbnail-number">${globalPageIndex}</div>
</div>
        `;

        globalPageIndex++;

        pagesHtml += `
<div id="page-container-${globalPageIndex}" class="page-container">
    ${page2Content}
    <div class="page-footer">
        Dicetak melalui Sistem Informasi Sekolah pada ${nowFormatted} | Hal <span class="page-number"></span>
    </div>
</div>
        `;

        thumbnailsHtml += `
<div class="thumbnail-wrapper" onclick="goToPage(${globalPageIndex})">
    <div class="thumbnail-container">
        <div class="thumbnail-page">
            <div class="page-container">
                ${page2Content}
            </div>
        </div>
    </div>
    <div class="thumbnail-number">${globalPageIndex}</div>
</div>
        `;

        globalPageIndex++;
      });

      // Construct final HTML wrapping everything in a PDF reader chrome
      htmlContent += `
    <div class="pdf-toolbar">
        <div class="pdf-title-container">
            <button class="pdf-hamburger" onclick="toggleSidebar()" title="Toggle Sidebar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            </button>
            <div class="pdf-title">Biodata GTK - ${gtksData.map(g => g?.nama).filter(Boolean).join(', ')}</div>
        </div>
        <div class="pdf-controls">
            <div class="pdf-page-indicator">
                <input type="text" id="current-page-num" class="pdf-page-input" value="1" onchange="goToPage(this.value)">
                <span>/</span>
                <span id="total-pages-num">${globalPageIndex - 1}</span>
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
        
        function goToPage(pageNum) {
            pageNum = parseInt(pageNum);
            const total = parseInt(document.getElementById('total-pages-num').innerText);
            if (pageNum >= 1 && pageNum <= total) {
                const target = document.getElementById('page-container-' + pageNum);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }

        window.addEventListener('load', () => {
            const pane = document.querySelector('.pdf-main-pane');
            const containers = document.querySelectorAll('.pdf-main-pane .page-container');
            const thumbs = document.querySelectorAll('.thumbnail-container');
            
            const updateActiveThumb = () => {
                if (!pane) return;
                let activeIndex = 0;
                let minDiff = Infinity;
                const paneTop = pane.getBoundingClientRect().top;
                
                containers.forEach((el, idx) => {
                    const rect = el.getBoundingClientRect();
                    const diff = Math.abs(rect.top - paneTop);
                    if (diff < minDiff) {
                        minDiff = diff;
                        activeIndex = idx;
                    }
                });
                
                thumbs.forEach((th, idx) => {
                    if (idx === activeIndex) {
                        th.classList.add('active');
                        th.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        th.classList.remove('active');
                    }
                });
                
                const pageNumEl = document.getElementById('current-page-num');
                if (pageNumEl) {
                    pageNumEl.value = activeIndex + 1;
                }
            };
            
            if (pane) {
                pane.addEventListener('scroll', updateActiveThumb);
                updateActiveThumb();
            }
            
            // Set up page input listener
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

      // Auto-trigger printing when images/styles are loaded
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      } catch (error) {
        Swal.close();
        Swal.fire("Error", "Gagal memuat profil untuk dicetak", "error");
      }
    }
  };

  const handleExport = async () => {
    if (activeTab === "rekap") {
      Swal.fire({
        title: "Export Rekapitulasi GTK?",
        text: "Seluruh tabel rekapitulasi GTK akan diunduh dalam format CSV.",
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

            const [resKategori, resPendidikan, resUsia] = await Promise.all([
              dapodikService.getGtkRekapKategori(),
              dapodikService.getGtkRekapPendidikan(),
              dapodikService.getGtkRekapUsia()
            ]);

            Swal.close();

            const dataKategori = resKategori.data || [];
            const dataPendidikan = resPendidikan.data || [];
            const dataUsia = resUsia.data || [];

            const rows: string[][] = [];

            // 1. Kategori
            rows.push(["REKAP GTK BERDASARKAN KATEGORI"]);
            rows.push(["Kategori (Guru/Tendik)", "Jenis Kelamin (L)", "Jenis Kelamin (P)", "Total Jenis Kelamin", "Status Kepegawaian (ASN)", "Status Kepegawaian (Non ASN)", "Total Status"]);
            dataKategori.forEach((item: any) => {
              rows.push([
                item.kategori || "",
                String(item.lakiLaki || 0),
                String(item.perempuan || 0),
                String(item.totalJK || 0),
                String(item.asn || 0),
                String(item.nonAsn || 0),
                String(item.totalStatus || 0)
              ]);
            });
            rows.push([]); // blank separator

            // 2. Pendidikan
            rows.push(["REKAP GTK BERDASARKAN PENDIDIKAN"]);
            rows.push(["Pendidikan", "Jenis Kelamin (L)", "Jenis Kelamin (P)", "Total Jenis Kelamin", "Status Kepegawaian (ASN)", "Status Kepegawaian (Non ASN)", "Total Status"]);
            dataPendidikan.forEach((item: any) => {
              rows.push([
                item.pendidikan || "",
                String(item.lakiLaki || 0),
                String(item.perempuan || 0),
                String(item.totalJK || 0),
                String(item.asn || 0),
                String(item.nonAsn || 0),
                String(item.totalStatus || 0)
              ]);
            });
            rows.push([]); // blank separator

            // 3. Usia
            rows.push(["REKAP GTK BERDASARKAN USIA"]);
            rows.push(["Rentang Usia", "Jenis Kelamin (L)", "Jenis Kelamin (P)", "Total Jenis Kelamin", "Status Kepegawaian (ASN)", "Status Kepegawaian (Non ASN)", "Total Status"]);
            dataUsia.forEach((item: any) => {
              rows.push([
                item.rentangUsia || "",
                String(item.lakiLaki || 0),
                String(item.perempuan || 0),
                String(item.totalJK || 0),
                String(item.asn || 0),
                String(item.nonAsn || 0),
                String(item.totalStatus || 0)
              ]);
            });

            const csvContent = "\uFEFF" + rows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Rekap_GTK_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Swal.fire({
              title: "Berhasil!",
              text: "Rekap GTK berhasil diunduh.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
          } catch (err) {
            console.error(err);
            Swal.fire("Error", "Gagal memproses ekspor rekap GTK", "error");
          }
        }
      });
      return;
    }

    Swal.fire({
      title: "Export Data GTK?",
      text: `Data ${activeTab === 'nonaktif' ? 'GTK Non Aktif' : activeTab === 'guru' ? 'Guru' : activeTab === 'tendik' ? 'Tendik' : 'GTK'} akan diunduh dalam format CSV.`,
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
            text: "Sedang mengambil data untuk diekspor",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          // Fetch list from API
          const type = activeTab === 'guru' ? 'guru' : activeTab === 'tendik' ? 'tendik' : undefined;
          const status = activeTab === 'nonaktif' ? 'non-aktif' : 'aktif';

          const resultData = await dapodikService.getGTK(10000, searchQuery, 1, type, status);
          const list = resultData.data || [];

          Swal.close();

          if (list.length === 0) {
            Swal.fire("Info", "Tidak ada data untuk diekspor", "info");
            return;
          }

          // Headers (Only columns shown in the table)
          const headers = [
            "Induk", "Nama", "JK", "Lengkap Data", "Tempat Lahir", "Tanggal Lahir",
            "Ibu Kandung", "Status Kepegawaian", "Jenis GTK", "Jabatan GTK",
            "Alamat", "NUPTK", "Tgl Surat Tugas"
          ];

          // Rows
          const rows = list.map((item: any) => {
            // Calculate completeness
            const completenessFields = [
              'nama', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
              'nuptk', 'nik', 'no_kk', 'alamat_jalan', 'no_hp', 'email',
              'sk_pengangkatan', 'tmt_pengangkatan', 'sumber_gaji', 'pendidikan_terakhir'
            ];
            let filled = 0;
            completenessFields.forEach(f => {
              if (item[f] && item[f] !== '-' && item[f] !== '') {
                filled++;
              }
            });
            const lengkapData = Math.round((filled / completenessFields.length) * 100);

            // Construct Alamat
            const rtRw = item.rt || item.rw ? ` RT ${item.rt || 0}/RW ${item.rw || 0}` : "";
            const desa = item.desa_kelurahan ? `, Desa ${item.desa_kelurahan}` : "";
            const kec = item.kecamatan ? `, Kec. ${item.kecamatan}` : "";
            const alamat = `${item.alamat_jalan || ""}${rtRw}${desa}${kec}`;

            const isInduk = item.ptk_induk === "1" || item.ptk_induk === 1 || item.ptk_induk === "Ya" ? "Ya" : "Tidak";

            return [
              isInduk,
              item.nama || "",
              item.jenis_kelamin || "",
              `${lengkapData}%`,
              item.tempat_lahir || "",
              item.tanggal_lahir && !isNaN(new Date(item.tanggal_lahir).getTime()) ? globalFormatDateDMY(item.tanggal_lahir) : "",
              item.nama_ibu_kandung || "",
              item.status_kepegawaian_id_str || "",
              item.jenis_ptk_id_str || "",
              item.jabatan_ptk_id_str || "",
              alamat,
              item.nuptk || "",
              item.tmt_tugas && !isNaN(new Date(item.tmt_tugas).getTime()) ? globalFormatDateDMY(item.tmt_tugas) : ""
            ];
          });

          const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map((val: any) => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `Data_GTK_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          Swal.fire({
            title: "Berhasil!",
            text: "Data GTK berhasil diunduh.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Gagal memproses ekspor data GTK", "error");
        }
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (false as any) {
    old_handleShowProfile();
  }

  return (
    <>
      <PageMeta
        title="GTK | SIMAK Admin Panel"
        description="GTK management page"
      />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Data Guru dan Tenaga Kependidikan (GTK)
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola dan lihat informasi GTK di sini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedGTKIds.length > 0 && (
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
                  variant="warning-outline"
                  size="sm"
                  className="min-w-[110px]"
                  startIcon={<PencilIcon className="size-4" />}
                  onClick={handleEditData}
                >
                  Ubah
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
                    placeholder="Cari Nama atau NUPTK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full sm:w-56">
                  <Select
                    options={completenessOptions}
                    defaultValue={completenessFilter}
                    onChange={(value) => setCompletenessFilter(value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "guru" && (
            <div className="space-y-4">
              <GuruTable
                onSelectionChange={handleSelectionChange}
                searchTerm={searchQuery}
                completenessFilter={completenessFilter}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}

          {activeTab === "tendik" && (
            <div className="space-y-4">
              <TendikTable
                onSelectionChange={handleSelectionChange}
                searchTerm={searchQuery}
                completenessFilter={completenessFilter}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}

          {activeTab === "rekap" && (
            <div className="space-y-8">
              <div>
                <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                  Rekap GTK berdasarkan Kategori
                </h4>
                <RekapGTKTable
                  searchTerm={searchQuery}
                />
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                  Rekap GTK berdasarkan Pendidikan
                </h4>
                <RekapGTKPendidikanTable />
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                <h4 className="mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
                  Rekap GTK berdasarkan Usia
                </h4>
                <RekapGTKUsiaTable />
              </div>
            </div>
          )}

          {activeTab === "nonaktif" && (
            <div className="space-y-4">
              <NonAktifTable
                onSelectionChange={handleSelectionChange}
                searchTerm={searchQuery}
                completenessFilter={completenessFilter}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>

    </>
  );
}
