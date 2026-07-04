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

  let contentHtml = "";

  rombels.forEach((rombel, rIndex) => {
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

    contentHtml += `
    <div class="schedule-page">
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
    </div>
    ${rIndex < rombels.length - 1 ? '<div class="page-break"></div>' : ''}
    `;
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
              margin: 10mm;
          }
          body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              font-size: 10px;
              color: #333;
              line-height: 1.4;
              margin: 0;
              padding: 0;
              background-color: #fff;
          }
          .schedule-page {
              page-break-inside: avoid;
          }
          .page-break {
              page-break-after: always;
              height: 0;
              margin: 0;
              padding: 0;
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
          @media print {
              body {
                  margin: 0;
                  padding: 0;
              }
              .no-print {
                  display: none;
              }
          }
      </style>
  </head>
  <body onload="window.print();">
      ${contentHtml}
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
