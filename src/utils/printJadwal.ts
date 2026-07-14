import { getFotoUrl } from "./image";

export interface PrintJadwalParams {
  sekolah: any;
  jenisJadwalNama: string;
  activeDays: { id: number; name: string }[];
  slots: any[];
  schedules: any[]; // all schedules or class schedules
  rombels: { value: string; label: string; tingkat_pendidikan_id?: number | null }[];
}

export const printJadwal = (params: PrintJadwalParams) => {
  const { sekolah, jenisJadwalNama, activeDays, slots, schedules, rombels } = params;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Gagal membuka halaman cetak. Mohon izinkan popup di browser Anda.");
    return;
  }

  const formatTime = (timeStr: any) => {
    if (!timeStr) return "";
    if (typeof timeStr !== 'string') return "";
    if (/^\d{2}:\d{2}/.test(timeStr)) return timeStr.substring(0, 5);
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        const h = date.getUTCHours().toString().padStart(2, '0');
        const m = date.getUTCMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      }
    } catch { }
    return timeStr;
  };

  const getTipeLabel = (tipe: number) => {
    switch (tipe) {
      case 1: return { text: "Pembelajaran", color: "text-brand-600" };
      case 2: return { text: "Istirahat", color: "text-gray-400" };
      case 3: return { text: "Upacara", color: "text-purple-600" };
      case 4: return { text: "Sholat", color: "text-green-600" };
      case 5: return { text: "Ekstrakurikuler", color: "text-indigo-600" };
      case 6: return { text: "Tadarus", color: "text-teal-600" };
      default: return { text: "Lainnya", color: "text-orange-600" };
    }
  };

  const getSlotTimeRangeForDay = (urutan: number, activeJamMasuk: string, daySlots: any[]): string => {
    const jamMasukStr = formatTime(activeJamMasuk);
    if (!jamMasukStr) return "";
    const [h, m] = jamMasukStr.split(':').map(Number);
    let totalMinutes = h * 60 + m;

    const sortedDaySlots = [...daySlots].sort((a, b) => a.urutan - b.urutan);
    const targetIndex = sortedDaySlots.findIndex(s => s.urutan === urutan);
    if (targetIndex === -1) return "";

    for (let i = 0; i < targetIndex; i++) {
      totalMinutes += sortedDaySlots[i]?.durasi_menit || 0;
    }

    const startH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const startM = (totalMinutes % 60).toString().padStart(2, '0');
    const endMinutes = totalMinutes + (sortedDaySlots[targetIndex]?.durasi_menit || 0);
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');

    return `${startH}:${startM} - ${endH}:${endM}`;
  };

  const logoUrl = getFotoUrl(sekolah?.logo, 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png');
  const rawProv = sekolah?.provinsi || 'JAWA BARAT';
  const provUpper = rawProv.toUpperCase();
  const provText = provUpper.includes('PROVINSI') 
    ? `PEMERINTAH ${provUpper}` 
    : `PEMERINTAH PROVINSI ${provUpper}`;

  let pagesHtml = "";
  let thumbnailsHtml = "";
  let globalPageIndex = 1;

  rombels.forEach((rombel) => {
    // Filter schedules for this rombel
    const rombelSchedules = schedules.filter(s => s.rombongan_belajar_id === rombel.value);

    // Calculate slots max urutan for this template
    const activeSlots = slots.filter(s => {
      const daySetting = (sekolah?.pengaturan_hari || []).find((h: any) => h.hari === s.hari) ||
                         (sekolah?.pengaturan_hari_list || []).find((h: any) => h.hari === s.hari);
      return daySetting ? daySetting.aktif !== false : true;
    });
    const maxUrutan = activeSlots.length > 0 ? Math.max(...activeSlots.map(s => s.urutan)) : 0;
    const uniqueSlots = Array.from({ length: maxUrutan }, (_, i) => i + 1);

    const pageContent = `
      <table class="header-table">
          <tr>
              <td style="width: 12%; text-align: left; vertical-align: middle;">
                  ${logoUrl ? `<img src="${logoUrl}" class="logo">` : ''}
              </td>
              <td class="kop-text" style="width: 76%; text-align: center; vertical-align: middle;">
                  <div class="kop-h1">${provText}</div>
                  <div class="kop-h1">DINAS PENDIDIKAN</div>
                  <div class="kop-h2">${(sekolah?.nama || 'NAMA SEKOLAH').toUpperCase()}</div>
                  <div class="kop-address">
                      ${sekolah?.alamat_jalan || 'Alamat Sekolah'}
                      ${sekolah?.kecamatan ? `, ${sekolah?.kecamatan}` : ''}
                      ${sekolah?.kabupaten_kota ? `, ${sekolah?.kabupaten_kota}` : ''}
                      <br>
                      Website: ${sekolah?.website || '-'} | Email: ${sekolah?.email || '-'}
                  </div>
              </td>
              <td style="width: 12%;"></td>
          </tr>
      </table>
      
      <div class="divider"></div>

      <div class="page-title">JADWAL PELAJARAN MINGGUAN</div>
      <div class="meta-container">
        <table class="meta-table">
          <tr>
            <td class="meta-label">Rombongan Belajar / Kelas</td>
            <td class="meta-sep">:</td>
            <td class="meta-val"><b>${rombel.label}</b></td>
          </tr>
          <tr>
            <td class="meta-label">Template Jadwal</td>
            <td class="meta-sep">:</td>
            <td class="meta-val">${jenisJadwalNama}</td>
          </tr>
        </table>
      </div>

      <table class="schedule-grid">
        <thead>
          <tr>
            <th style="width: 80px;">Jam</th>
            ${activeDays.map(day => `<th>${day.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${uniqueSlots.map(urutan => {
            return `
            <tr>
              <td class="time-col">Ke-${urutan}</td>
              ${activeDays.map(day => {
                const daySlots = slots.filter(s => s.hari === day.id);
                const slotConfig = daySlots.find(s => s.urutan === urutan);
                const subjectInfo = rombelSchedules.find(s => s.hari === day.id && s.urutan === urutan);

                if (!slotConfig) {
                  return `<td class="empty-cell">-</td>`;
                }

                const isPembelajaran = slotConfig.tipe === 1;
                const currentDaySetting = (sekolah?.pengaturan_hari || []).find((h: any) => h.hari === day.id) || 
                                          (sekolah?.pengaturan_hari_list || []).find((h: any) => h.hari === day.id);
                const activeJamMasuk = currentDaySetting ? currentDaySetting.jam_masuk : "07:00";
                const timeRange = getSlotTimeRangeForDay(urutan, activeJamMasuk, daySlots);

                if (isPembelajaran) {
                  if (subjectInfo) {
                    const mapelNama = subjectInfo.pembelajaran?.nama_mata_pelajaran || "Mata Pelajaran";
                    const guruNama = subjectInfo.pembelajaran?.gtk?.nama || subjectInfo.pembelajaran?.ptk_id_str || "-";
                    return `
                    <td class="subject-cell">
                      <div class="subject-title">${mapelNama}</div>
                      <div class="teacher-name">${guruNama}</div>
                      <div class="time-range">${timeRange}</div>
                    </td>
                    `;
                  } else {
                    return `
                    <td class="empty-subject-cell">
                      <div class="empty-text">Belum Diisi</div>
                      <div class="time-range">${timeRange}</div>
                    </td>
                    `;
                  }
                } else {
                  const label = getTipeLabel(slotConfig.tipe).text;
                  return `
                  <td class="break-cell">
                    <div class="break-title">${label}</div>
                    <div class="time-range">${timeRange}</div>
                  </td>
                  `;
                }
              }).join('')}
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <table style="width: 100%; border: none; margin-top: 20px; font-size: 10px;">
        <tr>
          <td style="width: 70%; border: none;"></td>
          <td style="width: 30%; text-align: center; border: none; line-height: 1.5;">
            <div>${sekolah?.kabupaten_kota || 'Kota Sekolah'}, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
            <div>Kepala Sekolah,</div>
            <div style="margin-top: 50px; font-weight: bold; text-decoration: underline;">
              ${sekolah?.nama_kepala_sekolah || sekolah?.kepala_sekolah || sekolah?.nama_nomenklatur || '-'}
            </div>
            <div>NIP. ${sekolah?.nip_kepala_sekolah || sekolah?.nip_kepala || '-'}</div>
          </td>
        </tr>
      </table>
    `;

    pagesHtml += `
<div id="page-container-${globalPageIndex}" class="page-container">
    <div class="schedule-page">
        ${pageContent}
    </div>
</div>
    `;

    thumbnailsHtml += `
<div class="thumbnail-wrapper" onclick="goToPage(${globalPageIndex})">
    <div class="thumbnail-container">
        <div class="thumbnail-page">
            <div class="page-container">
                <div class="schedule-page">
                    ${pageContent}
                </div>
            </div>
        </div>
    </div>
    <div class="thumbnail-number">${globalPageIndex}</div>
</div>
    `;

    globalPageIndex++;
  });

  const html = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
      <meta charset="UTF-8">
      <title>Jadwal Pelajaran - ${jenisJadwalNama}</title>
      <style>
          @page {
              size: A4 landscape;
              margin: 0;
          }
          body, table, th, td, strong, span, p, div {
              font-family: Arial, Helvetica, sans-serif !important;
              color: #333;
          }
          body {
              font-size: 10px;
              line-height: 1.4;
              margin: 0;
              padding: 0;
              background-color: #fff;
          }
          .schedule-page {
              width: 100%;
              height: 100%;
              padding: 1.2cm 1.5cm;
              box-sizing: border-box;
              position: relative;
          }
          .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 2px;
          }
          .logo {
              max-height: 50px;
              display: block;
              margin: 0 auto 0 0;
          }
          .kop-text {
              text-align: center;
          }
          .kop-h1 {
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
          }
          .kop-h2 {
              font-size: 14px;
              font-weight: 800;
              margin-bottom: 2px;
              color: #111;
          }
          .kop-address {
              font-size: 8px;
              color: #666;
              line-height: 1.2;
          }
          .divider {
              border-top: 2px solid #000;
              border-bottom: 1px solid #000;
              height: 2px;
              margin-bottom: 8px;
              margin-top: 3px;
          }
          .page-title {
              text-align: center;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 6px;
              letter-spacing: 1px;
          }
          .meta-container {
              margin-bottom: 8px;
              background-color: #f8fafc;
              padding: 6px 10px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
          }
          .meta-table {
              width: 100%;
              border: none !important;
          }
          .meta-table td {
              border: none !important;
              padding: 1px 2px !important;
          }
          .meta-label {
              width: 160px;
              color: #475569;
              font-weight: 500;
          }
          .meta-sep {
              width: 10px;
              text-align: center;
              color: #94a3b8;
          }
          .meta-val {
              color: #1e293b;
          }
          .schedule-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
          }
          .schedule-grid th, .schedule-grid td {
              border: 1px solid #cbd5e1;
              padding: 5px 6px;
              vertical-align: top;
          }
          .schedule-grid th {
              background-color: #f1f5f9;
              font-weight: bold;
              text-align: center;
              color: #334155;
              font-size: 10px;
          }
          .time-col {
              font-weight: bold;
              text-align: center;
              background-color: #f8fafc;
              vertical-align: middle !important;
              color: #475569;
          }
          .empty-cell {
              text-align: center;
              color: #94a3b8;
              background-color: #fafafa;
              vertical-align: middle !important;
          }
          .subject-cell {
              background-color: #f0fdf4;
              border-left: 3px solid #22c55e !important;
          }
          .subject-title {
              font-weight: bold;
              color: #166534;
              font-size: 10px;
              margin-bottom: 1px;
          }
          .teacher-name {
              font-size: 8px;
              color: #3f6212;
              margin-bottom: 2px;
          }
          .time-range {
              font-size: 8px;
              color: #64748b;
              font-family: monospace;
          }
          .empty-subject-cell {
              background-color: #fff;
              color: #94a3b8;
              text-align: center;
              vertical-align: middle !important;
          }
          .empty-text {
              font-size: 8px;
              font-style: italic;
              margin-bottom: 1px;
          }
          .break-cell {
              background-color: #f8fafc;
              text-align: center;
              vertical-align: middle !important;
              border-left: 3px solid #94a3b8 !important;
          }
          .break-title {
              font-weight: bold;
              color: #475569;
              font-size: 9px;
              margin-bottom: 1px;
          }
          
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
                  font-family: Arial, sans-serif;
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
                  width: 240px;
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
                  width: 297mm;
                  height: 210mm;
                  margin-bottom: 24px;
                  background: white;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 12px 24px rgba(0,0,0,0.2);
                  box-sizing: border-box;
                  position: relative;
                  border-radius: 2px;
                  flex-shrink: 0;
                  transform-origin: top center;
                  zoom: var(--pdf-zoom, 1);
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
                  width: 156px;
                  height: 110px;
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
                  width: 297mm;
                  height: 210mm;
                  transform: scale(0.175); /* fits inside 156x110 precisely */
                  transform-origin: top left;
                  pointer-events: none;
                  position: absolute;
                  top: 0;
                  left: 0;
                  background: white;
              }
              .thumbnail-page .page-container {
                  zoom: 1 !important;
                  width: 297mm !important;
                  height: 210mm !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  box-sizing: border-box !important;
              }
              .thumbnail-number {
                  color: #bdc1c6;
                  font-size: 12px;
                  font-family: Arial, sans-serif;
                  font-weight: 500;
              }
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
              }
              .pdf-main-pane {
                  display: block !important;
                  overflow: visible !important;
                  padding: 0 !important;
                  background-color: transparent !important;
              }
              .page-container {
                  width: 297mm !important;
                  height: 210mm !important;
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
              <div class="pdf-title">Jadwal Pelajaran - ${jenisJadwalNama}</div>
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
                  sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
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

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export interface ExportCSVParams {
  jenisJadwalNama: string;
  activeDays: { id: number; name: string }[];
  slots: any[];
  schedules: any[];
  rombels: { value: string; label: string }[];
}

export const exportJadwalToCSV = (params: ExportCSVParams) => {
  const { jenisJadwalNama, activeDays, slots, schedules, rombels } = params;

  // Header column setup
  const headers = ["Rombel/Kelas", "Hari", "Jam Ke", "Waktu", "Tipe", "Mata Pelajaran", "Guru"];
  const rows = [headers];

  const formatTime = (timeStr: any) => {
    if (!timeStr) return "";
    if (typeof timeStr !== 'string') return "";
    if (/^\d{2}:\d{2}/.test(timeStr)) return timeStr.substring(0, 5);
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        const h = date.getUTCHours().toString().padStart(2, '0');
        const m = date.getUTCMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      }
    } catch { }
    return timeStr;
  };

  const getTipeLabel = (tipe: number) => {
    switch (tipe) {
      case 1: return "Pembelajaran";
      case 2: return "Istirahat";
      case 3: return "Upacara";
      case 4: return "Sholat";
      case 5: return "Ekstrakurikuler";
      case 6: return "Tadarus";
      default: return "Lainnya";
    }
  };

  rombels.forEach((rombel) => {
    const rombelSchedules = schedules.filter(s => s.rombongan_belajar_id === rombel.value);

    // Calculate slots max urutan for this template
    const maxUrutan = slots.length > 0 ? Math.max(...slots.map(s => s.urutan)) : 0;
    const uniqueSlots = Array.from({ length: maxUrutan }, (_, i) => i + 1);

    uniqueSlots.forEach((urutan) => {
      activeDays.forEach((day) => {
        const daySlots = slots.filter(s => s.hari === day.id);
        const slotConfig = daySlots.find(s => s.urutan === urutan);
        const subjectInfo = rombelSchedules.find(s => s.hari === day.id && s.urutan === urutan);

        if (!slotConfig) return;

        const isPembelajaran = slotConfig.tipe === 1;
        
        // Find default or custom day settings to compute time range
        const activeJamMasuk = "07:00"; // default fallback
        
        // We will compute time range using simple helper
        const jamMasukStr = formatTime(activeJamMasuk);
        let timeRange = "";
        if (jamMasukStr) {
          const [h, m] = jamMasukStr.split(':').map(Number);
          let totalMinutes = h * 60 + m;
          const sortedDaySlots = [...daySlots].sort((a, b) => a.urutan - b.urutan);
          const targetIndex = sortedDaySlots.findIndex(s => s.urutan === urutan);
          if (targetIndex !== -1) {
            for (let i = 0; i < targetIndex; i++) {
              totalMinutes += sortedDaySlots[i]?.durasi_menit || 0;
            }
            const startH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
            const startM = (totalMinutes % 60).toString().padStart(2, '0');
            const endMinutes = totalMinutes + (sortedDaySlots[targetIndex]?.durasi_menit || 0);
            const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
            const endM = (endMinutes % 60).toString().padStart(2, '0');
            timeRange = `${startH}:${startM} - ${endH}:${endM}`;
          }
        }

        const tipeStr = getTipeLabel(slotConfig.tipe);
        let subjectName = "-";
        let teacherName = "-";

        if (isPembelajaran) {
          if (subjectInfo) {
            subjectName = subjectInfo.pembelajaran?.nama_mata_pelajaran || "Mata Pelajaran";
            teacherName = subjectInfo.pembelajaran?.gtk?.nama || subjectInfo.pembelajaran?.ptk_id_str || "-";
          } else {
            subjectName = "Belum Diisi";
          }
        } else {
          subjectName = tipeStr;
        }

        rows.push([
          rombel.label,
          day.name,
          `Ke-${urutan}`,
          timeRange,
          tipeStr,
          subjectName,
          teacherName
        ]);
      });
    });
  });

  // Generate CSV Content
  const csvContent = rows
    .map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const sanitizedTemplateName = jenisJadwalNama.replace(/\s+/g, '_');
    link.setAttribute("download", `Jadwal_Pelajaran_${sanitizedTemplateName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
