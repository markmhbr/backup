import { dapodikService } from "../services/dapodikService";
import { getFotoUrl } from "./image";
import Swal from "sweetalert2";

export const printGTKProfile = async (selectedGTKIds: string[]) => {
  if (selectedGTKIds.length === 0) return;

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
    const todayFormatted = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const now = new Date();
    const timeFormatted = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    const nowFormatted = todayFormatted + " " + timeFormatted;

    const formatDateDMY = (dateStr: string | null | undefined) => {
      if (!dateStr) return "-";
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "-";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return "-";
      }
    };

    const formatIndoDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return "-";
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      } catch (e) {
        return "-";
      }
    };

    const formatStatusKawin = (val: string | number | null | undefined) => {
      const str = String(val || '').trim();
      if (str === '1' || str === 'Kawin') return 'Kawin';
      if (str === '2' || str === 'Belum Kawin') return 'Belum Kawin';
      if (str === '3' || str === 'Janda/Duda') return 'Janda/Duda';
      return str || '-';
    };

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
        body, table, th, td, strong, span, p, div {
            font-family: Arial, Helvetica, sans-serif !important;
            color: #333;
        }
        body {
            font-size: 11px;
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
                height: auto !important;
                min-height: 297mm !important;
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
            margin-top: 20px;
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

      // Foto URL
      const fotoUrl = getFotoUrl(gtk.foto);

      // Tanda tangan URL
      const ttdUrl = getFotoUrl(gtk.tandatangan, '');

      // SK Pengangkatan priority logic
      const rankList = gtk.rwy_kepangkatan || [];
      let skPdf = gtk.sk_pengangkatan || "";
      let tmtPdf = gtk.tmt_pengangkatan || "";

      if (!skPdf && rankList.length > 0) {
        skPdf = rankList[0].nomor_sk || "-";
        tmtPdf = rankList[0].tmt_pangkat || rankList[0].tmt_golongan || "";
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
      const totalJam = pembelajaranList.reduce((sum: number, p: any) => sum + parseInt(p.jam_mengajar_per_minggu || "0"), 0);

      // Tugas Tambahan records
      const tugasTambahanList = gtk.tugas_tambahan || [];
      const totalJamTugasTambahan = tugasTambahanList.reduce((sum: number, t: any) => sum + parseInt(t.jumlah_jam_diakui || "0"), 0);

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
                        <td class="val">${gtk.jenis_kelamin === 'L' ? 'Laki-laki' : gtk.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Agama</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.agama_nama || gtk.agama_id_str || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Nama Ibu Kandung</td>
                        <td class="sep">:</td>
                        <td class="val">${gtk.nama_ibu_kandung || '-'}</td>
                    </tr>
                    <tr>
                        <td class="label">Status Perkawinan</td>
                        <td class="sep">:</td>
                        <td class="val">${formatStatusKawin(gtk.status_perkawinan)}</td>
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
            <td class="label">Kabupaten / Kota</td>
            <td class="sep">:</td>
            <td class="val">${gtk.kabupaten || gtk.kabupaten_kota || '-'}</td>
        </tr>
        <tr>
            <td class="label">Provinsi</td>
            <td class="sep">:</td>
            <td class="val">${gtk.provinsi || '-'}</td>
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
                        <td class="val">${gtk.sumber_gaji_nama || gtk.sumber_gaji_id_str || gtk.sumber_gaji || '-'}</td>
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

      const sectionE_Html = `
    <div class="section-title" style="margin-top: 0;">E. RIWAYAT PENDIDIKAN FORMAL</div>
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
      `;

      const sectionF_Html = `
    <div class="section-title">F. RIWAYAT GOLONGAN / KEPANGKATAN</div>
    <table class="data-table table-bordered" style="margin-top: 15px;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="35%" class="text-left">Pangkat / Golongan</th>
                <th width="35%" class="text-left">Nomor SK / TMT</th>
                <th width="25%">Masa Kerja Golongan</th>
            </tr>
        </thead>
        <tbody>
            ${rankList.length > 0 
              ? rankList.map((rank: any, i: number) => `
                <tr>
                    <td class="text-center">${i + 1}</td>
                    <td><strong>${rank.pangkat_golongan_nama || rank.pangkat || '-'}</strong></td>
                    <td>
                        No. SK: ${rank.nomor_sk || '-'}<br>
                        TMT: ${formatIndoDate(rank.tmt_pangkat || rank.tmt_golongan)}
                    </td>
                    <td class="text-center">
                        ${rank.masa_kerja_gol_tahun !== undefined 
                          ? `${rank.masa_kerja_gol_tahun || 0}th ${rank.masa_kerja_gol_bulan || 0}bln` 
                          : '-'}
                    </td>
                </tr>
              `).join('')
              : `
                <tr>
                    <td colspan="4" class="text-center text-muted" style="padding: 10px;">
                        Tidak ada riwayat golongan/kepangkatan.
                    </td>
                </tr>
              `
            }
        </tbody>
    </table>
      `;

      const sectionG_Html = `
    <div class="section-title">G. RIWAYAT SERTIFIKASI</div>
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
              ? certList.map((s: any, i: number) => {
                  const tglBerlaku = s.tgl_sert ? formatDateDMY(s.tgl_sert) : "-";
                  const tglHabis = s.tgl_exp_sert ? formatDateDMY(s.tgl_exp_sert) : "-";
                  const lembSert = s.lembaga_sertifikasi_nama || s.kode_lemb_sert || "-";
                  const bdStudi = s.bidang_studi_nama || s.bidang_studi_id_str || "-";
                  const jnsSert = s.jenis_sertifikasi_nama || s.id_jenis_sertifikasi_str || s.id_jenis_sertifikasi || "Sertifikasi Pendidik";
                  return `
                    <tr>
                        <td class="text-center">${i + 1}</td>
                        <td>
                            <strong>${lembSert}</strong><br>
                            <span style="font-size: 8px;" class="text-muted">${jnsSert}</span>
                        </td>
                        <td>${bdStudi}</td>
                        <td class="text-center">
                            ${tglBerlaku} s.d. ${tglHabis}
                        </td>
                        <td>
                            <span class="text-muted" style="font-size: 9px;">No. Sertifikat:</span><br> ${s.nomor_sertifikat || '-'}<br>
                            <span class="text-muted" style="font-size: 9px;">No. Registrasi:</span><br> ${s.nomer_registrasi || '-'}<br>
                            <span class="text-muted" style="font-size: 9px;">No. Peserta:</span><br> ${s.nomor_peserta || '-'}
                        </td>
                    </tr>
                  `;
                }).join('')
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
      `;

      const sectionH_Html = hasSertifikasi ? `
    <div class="section-title">H. DATA BANK</div>
    <table class="data-table table-clean">
        <tr>
            <td width="50%" style="padding:0; vertical-align: top;">
                <table class="data-table table-clean">
                    <tr>
                        <td class="label">Nama Bank</td>
                        <td class="sep">:</td>
                        <td class="val"><strong>${gtk.bank_nama || gtk.id_bank || '-'}</strong></td>
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
      ` : '';

      const sectionI_Html = `
    <div class="section-title">I. REKAPITULASI PEMBELAJARAN</div>
    <table class="data-table table-bordered" style="margin-top: 15px;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="35%" class="text-left">Mata Pelajaran</th>
                <th width="25%" class="text-left">Kelas / Rombel</th>
                <th width="20%" class="text-left">Status Kurikulum</th>
                <th width="15%">Jml Jam/Minggu</th>
            </tr>
        </thead>
        <tbody>
            ${pembelajaranList.length > 0 
              ? pembelajaranList.map((tugas: any, idx: number) => {
                  const jam = parseInt(tugas.jam_mengajar_per_minggu || "0");
                  return `
                    <tr>
                        <td class="text-center">${idx + 1}</td>
                        <td>
                            <strong>${tugas.nama_mata_pelajaran || tugas.rombongan_belajar?.nama || '-'}</strong>
                        </td>
                        <td>${tugas.rombongan_belajar?.nama || '-'}</td>
                        <td>${tugas.status_kurikulum_id_str || '-'}</td>
                        <td class="text-center">${jam}</td>
                    </tr>
                  `;
                }).join('')
              : `
                <tr>
                    <td colspan="5" class="text-center text-muted" style="padding: 10px;">Tidak ada data pembelajaran (tugas pokok) ditemukan.</td>
                </tr>
              `
            }
        </tbody>
        <tfoot class="table-footer">
            <tr>
                <td colspan="4" class="text-right">Total Jam Mengajar</td>
                <td class="text-center">${totalJam}</td>
            </tr>
        </tfoot>
    </table>
      `;

      const sectionJ_Html = `
    <div class="section-title">J. TUGAS TAMBAHAN</div>
    <table class="data-table table-bordered" style="margin-top: 15px;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="80%" class="text-left">Tugas Tambahan</th>
                <th width="15%">Jml Jam/Minggu</th>
            </tr>
        </thead>
        <tbody>
            ${tugasTambahanList.length > 0 ? tugasTambahanList.map((t: any, idx: number) => `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td class="text-left">${t.jabatan_tugas_nama || t.jabatan_ptk_id || '-'} ${t.nomor_sk ? `(SK: ${t.nomor_sk})` : ''}</td>
                    <td class="text-center">${t.jumlah_jam_diakui || 0}</td>
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="3" class="text-center text-muted" style="padding: 10px;">
                        Tidak ada data tugas tambahan.
                    </td>
                </tr>
            `}
        </tbody>
        <tfoot class="table-footer">
            <tr>
                <td colspan="2" class="text-right">Total Jam Tugas Tambahan</td>
                <td class="text-center">${totalJamTugasTambahan}</td>
            </tr>
            <tr>
                <td colspan="2" class="text-right">Total Jam Mengajar + Tugas Tambahan</td>
                <td class="text-center">${totalJam + totalJamTugasTambahan}</td>
            </tr>
        </tfoot>
    </table>
      `;

      const signature_Html = `
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

      // Decide page containers dynamically based on data length
      const totalRows = educationList.length + rankList.length + certList.length + pembelajaranList.length + tugasTambahanList.length;
      const hasPage3 = totalRows > 7 || certList.length > 0;

      let p2Content = sectionE_Html + sectionF_Html;
      let p3Content = '';

      if (hasPage3) {
        p3Content = sectionG_Html + sectionH_Html + sectionI_Html + sectionJ_Html + signature_Html;
      } else {
        p2Content += sectionG_Html + sectionH_Html + sectionI_Html + sectionJ_Html + signature_Html;
      }

      pagesHtml += `
<div id="page-container-${globalPageIndex}" class="page-container">
    ${page1Content}
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
    ${p2Content}
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
                ${p2Content}
            </div>
        </div>
    </div>
    <div class="thumbnail-number">${globalPageIndex}</div>
</div>
      `;

      globalPageIndex++;

      if (hasPage3) {
        pagesHtml += `
<div id="page-container-${globalPageIndex}" class="page-container">
    ${p3Content}
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
                ${p3Content}
            </div>
        </div>
    </div>
    <div class="thumbnail-number">${globalPageIndex}</div>
</div>
        `;

        globalPageIndex++;
      }
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
};
