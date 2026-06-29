import { dapodikService } from "../services/dapodikService";
import { getFotoUrl } from "./image";
import Swal from "sweetalert2";

export const printStudentProfile = async (selectedStudentIds: string[]) => {
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

    // 1. Fetch school info
    const sekolahRes = await dapodikService.getSekolah();
    const sekolah = sekolahRes.data || {};

    // 2. Fetch all selected students details
    const studentsData = await Promise.all(
      selectedStudentIds.map(async (id) => {
        const res = await dapodikService.getPesertaDidikDetail(id);
        return res.data;
      })
    );

    Swal.close();

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      Swal.fire("Gagal", "Popup blocker aktif. Mohon izinkan popup untuk mencetak.", "error");
      return;
    }

    const todayFormatted = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const now = new Date();
    const timeFormatted = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    const nowFormatted = todayFormatted + " " + timeFormatted;

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

    const logoUrl = getFotoUrl(sekolah.logo, 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png');

    // Form province text dynamically
    const rawProv = sekolah.provinsi || 'JAWA BARAT';
    const provUpper = rawProv.toUpperCase();
    const provText = provUpper.includes('PROVINSI') 
      ? `PEMERINTAH ${provUpper}` 
      : `PEMERINTAH PROVINSI ${provUpper}`;

    let pagesHtml = '';
    let thumbnailsHtml = '';
    let globalPageIndex = 1;

    studentsData.forEach((siswa) => {
      if (!siswa) return;

      const formatSex = (jk: string | null | undefined) => {
        if (!jk) return "-";
        return (jk === 'L' || jk.toLowerCase() === 'laki-laki') ? 'Laki-laki' : 'Perempuan';
      };

      const formatWeightHeight = (val: string | number | null | undefined, unit: string) => {
        if (val === undefined || val === null || val === '') return "... " + unit;
        return val + " " + unit;
      };

      const formatAnakKe = (anak: string | number | null | undefined, saudara: string | number | null | undefined) => {
        const a = anak || '-';
        const s = saudara || '-';
        return `${a} (dari ${s} bersaudara)`;
      };

      const fotoUrl = getFotoUrl(siswa.foto);
      const namaKelas = siswa.nama_rombel || 'Belum Masuk Kelas';

      // Page 1: Identitas Pribadi & Transport
      const page1Content = `
      <table class="header-table">
          <tr>
              <td style="width: 15%; text-align: left;">
                  ${logoUrl ? `<img src="${logoUrl}" class="logo">` : ''}
              </td>
              <td class="kop-text" style="width: 70%;">
                  <div class="kop-h1">${provText}</div>
                  <div class="kop-h1">DINAS PENDIDIKAN</div>
                  <div class="kop-h2">${(sekolah.nama || 'NAMA SEKOLAH').toUpperCase()}</div>
                  <div class="kop-address">
                      ${sekolah.alamat_jalan || 'Alamat Sekolah'}
                      ${sekolah.kecamatan ? `, ${sekolah.kecamatan}` : ''}
                      ${sekolah.kabupaten_kota ? `, ${sekolah.kabupaten_kota}` : ''}
                      <br>
                      Website: ${sekolah.website || '-'} | Email: ${sekolah.email || '-'}
                  </div>
              </td>
              <td style="width: 15%;"></td>
          </tr>
      </table>

      <div class="page-title">BIODATA PESERTA DIDIK</div>
      <div class="page-subtitle">Laporan data per tanggal: ${todayFormatted}</div>

      <div class="section-title">A. KETERANGAN PRIBADI</div>
      <table class="data-table" style="width: 100%;">
          <tr>
              <td style="width: 75%; padding-right: 10px; vertical-align: top;">
                  <table class="data-table" style="width: 100%;">
                      <tr><td class="label">Nama Lengkap</td><td class="sep">:</td><td class="val"><b>${siswa.nama || '-'}</b></td></tr>
                      <tr><td class="label">NIPD / NISN</td><td class="sep">:</td><td class="val">${siswa.nipd || '-'} / ${siswa.nisn || '-'}</td></tr>
                      <tr><td class="label">NIK</td><td class="sep">:</td><td class="val">${siswa.nik || '-'}</td></tr>
                      <tr><td class="label">No. KK</td><td class="sep">:</td><td class="val">${siswa.no_kk || '-'}</td></tr>
                      <tr><td class="label">Tempat, Tgl Lahir</td><td class="sep">:</td><td class="val">${siswa.tempat_lahir || '-'}, ${formatIndoDate(siswa.tanggal_lahir)}</td></tr>
                      <tr><td class="label">Jenis Kelamin</td><td class="sep">:</td><td class="val">${formatSex(siswa.jenis_kelamin)}</td></tr>
                      <tr><td class="label">Agama</td><td class="sep">:</td><td class="val">${siswa.agama_id_str || '-'}</td></tr>
                      <tr><td class="label">Kewarganegaraan</td><td class="sep">:</td><td class="val">${siswa.kewarganegaraan || 'Indonesia'}</td></tr>
                      <tr><td class="label">Kebutuhan Khusus</td><td class="sep">:</td><td class="val">${siswa.kebutuhan_khusus || 'Tidak Ada'}</td></tr>
                      <tr><td class="label">Tinggi / Berat Badan</td><td class="sep">:</td><td class="val">${formatWeightHeight(siswa.tinggi_badan, 'cm')} / ${formatWeightHeight(siswa.berat_badan, 'kg')}</td></tr>
                      <tr><td class="label">Lingkar Kepala</td><td class="sep">:</td><td class="val">${formatWeightHeight(siswa.lingkar_kepala, 'cm')}</td></tr>
                      <tr><td class="label">Anak ke</td><td class="sep">:</td><td class="val">${formatAnakKe(siswa.anak_keberapa, siswa.jumlah_saudara_kandung)}</td></tr>
                      <tr>
                          <td class="label">Alamat Rumah</td>
                          <td class="sep">:</td>
                          <td class="val">
                              ${siswa.alamat_jalan || '-'} <br>
                              ${siswa.dusun || siswa.nama_dusun ? 'Dsn. ' + (siswa.dusun || siswa.nama_dusun) : ''}
                              RT ${siswa.rt || '-'} / RW ${siswa.rw || '-'} <br>
                              ${siswa.desa_kelurahan || '-'}, ${siswa.kecamatan || '-'} <br>
                              ${siswa.kabupaten_kota || '-'} - ${siswa.kode_pos || '-'}
                          </td>
                      </tr>
                      <tr><td class="label">No. Handphone</td><td class="sep">:</td><td class="val">${siswa.nomor_telepon_seluler || '-'}</td></tr>
                      <tr><td class="label">No. WA</td><td class="sep">:</td><td class="val">${siswa.no_wa || '-'}</td></tr>
                      <tr><td class="label">Email Akun</td><td class="sep">:</td><td class="val">${siswa.penggunas?.[0]?.email || '-'}</td></tr>
                      <tr><td class="label">Email Aktif</td><td class="sep">:</td><td class="val">${siswa.email || '-'}</td></tr>
                      <tr><td class="label">Hobi</td><td class="sep">:</td><td class="val">${siswa.hobi || '-'}</td></tr>
                      <tr><td class="label">Cita-cita</td><td class="sep">:</td><td class="val">${siswa.cita_cita || '-'}</td></tr>
                  </table>
              </td>
              <td class="photo-wrapper" style="width: 25%; text-align: center; vertical-align: top; padding-top: 5px;">
                  <img src="${fotoUrl}" class="photo-container" style="width: 3cm; height: 4cm; border: 1px solid #000; padding: 2px; object-fit: cover;">
              </td>
          </tr>
      </table>

      <div class="section-title" style="margin-top: 15px;">B. KETERANGAN TEMPAT TINGGAL & TRANSPORT</div>
      <table class="data-table" style="width: 100%;">
          <tr><td class="label">Tempat Tinggal</td><td class="sep">:</td><td class="val">${siswa.jenis_tinggal_id_str || '-'}</td></tr>
          <tr><td class="label">Alat Transportasi</td><td class="sep">:</td><td class="val">${siswa.alat_transportasi_id_str || '-'}</td></tr>
          <tr><td class="label">Jarak ke Sekolah</td><td class="sep">:</td><td class="val">${siswa.jarak_rumah_ke_sekolah_km ? siswa.jarak_rumah_ke_sekolah_km + ' km' : '-'}</td></tr>
          <tr><td class="label">Waktu Tempuh</td><td class="sep">:</td><td class="val">${siswa.waktu_tempuh_menit ? siswa.waktu_tempuh_menit + ' menit' : '-'}</td></tr>
      </table>
      `;

      // Page 2: Orang Tua / Wali & Akademik/Bantuan
      const page2Content = `
      <div class="section-title">C. KETERANGAN ORANG TUA / WALI</div>
      <table class="data-table" style="width: 100%; table-layout: fixed;">
          <tr>
              <td style="width: 50%; padding-right: 15px; vertical-align: top;">
                  <div class="sub-header" style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; text-transform: uppercase;">AYAH KANDUNG</div>
                  <table class="data-table" style="width: 100%;">
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Nama</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.nama_ayah || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">NIK</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.nik_ayah || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Tahun Lahir</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.tahun_lahir_ayah || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Pendidikan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.pendidikan_ayah_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Pekerjaan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.pekerjaan_ayah_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Penghasilan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.penghasilan_ayah_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">No. WA</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.no_wa_ayah || '-'}</td></tr>
                  </table>
              </td>
              <td style="width: 50%; padding-left: 15px; vertical-align: top;">
                  <div class="sub-header" style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; text-transform: uppercase;">IBU KANDUNG</div>
                  <table class="data-table" style="width: 100%;">
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Nama</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.nama_ibu_kandung || siswa.nama_ibu || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">NIK</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.nik_ibu || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Tahun Lahir</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.tahun_lahir_ibu || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Pendidikan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.pendidikan_ibu_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Pekerjaan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.pekerjaan_ibu_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Penghasilan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.penghasilan_ibu_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">No. WA</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.no_wa_ibu || '-'}</td></tr>
                  </table>
              </td>
          </tr>
      </table>

      <table class="data-table" style="margin-top: 15px; width: 100%;">
          <tr>
              <td style="width: 100%;">
                  <div class="sub-header" style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; text-transform: uppercase;">WALI</div>
                  <table class="data-table" style="width: 50%;">
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Nama Wali</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.nama_wali || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">NIK</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.nik_wali || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Tahun Lahir</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.tahun_lahir_wali || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Pendidikan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.pendidikan_wali_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Pekerjaan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.pekerjaan_wali_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">Penghasilan</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.penghasilan_wali_id_str || '-'}</td></tr>
                      <tr><td class="label-half" style="width: 35%; font-weight: bold;">No. WA</td><td class="sep-half" style="width: 5%; text-align: center;">:</td><td class="val-half" style="width: 60%;">${siswa.no_wa_wali || '-'}</td></tr>
                  </table>
              </td>
          </tr>
      </table>

      <div class="section-title" style="margin-top: 15px;">D. DATA AKADEMIK & BANTUAN SOSIAL</div>
      <table class="data-table" style="width: 100%;">
          <tr><td class="label">Sekolah Asal</td><td class="sep">:</td><td class="val">${siswa.sekolah_asal || '-'} (NPSN: ${siswa.npsn_sekolah_asal || '-'})</td></tr>
          <tr><td class="label">No. Ijazah SMP</td><td class="sep">:</td><td class="val">${siswa.no_seri_ijazah || '-'}</td></tr>
          <tr><td class="label">No. SKHUN</td><td class="sep">:</td><td class="val">${siswa.no_seri_skhun || '-'}</td></tr>
          <tr><td class="label">No. Peserta UN</td><td class="sep">:</td><td class="val">${siswa.no_ujian_nasional || '-'}</td></tr>
          <tr><td class="label">Diterima di Kelas</td><td class="sep">:</td><td class="val">${namaKelas}</td></tr>
          <tr><td class="label">Tanggal Masuk</td><td class="sep">:</td><td class="val">${formatIndoDate(siswa.tanggal_masuk_sekolah)}</td></tr>
          <tr><td class="label">Status Siswa</td><td class="sep">:</td><td class="val">${siswa.status || 'Aktif'}</td></tr>
      </table>
      `;

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

    let htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Biodata Peserta Didik</title>
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
        .photo-container {
            width: 3cm;
            height: 4cm;
            border: 1px solid #ddd;
            padding: 3px;
            object-fit: cover;
            display: inline-block;
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
            <div class="pdf-title">Biodata Peserta Didik - ${studentsData.map(s => s?.nama).filter(Boolean).join(', ')}</div>
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
