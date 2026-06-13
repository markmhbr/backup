import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import Switch from "../../components/form/switch/Switch";
import Button from "../../components/ui/button/Button";
import { PlusIcon, TrashBinIcon, PencilIcon, InfoIcon } from "../../icons";
import Swal from "sweetalert2";
import { jadwalService, type JenisJadwal, type PengaturanJadwalSlot } from "../../services/jadwalService";

export default function PengaturanJam() {
  const [jenisJadwalList, setJenisJadwalList] = useState<JenisJadwal[]>([]);
  const [selectedJenis, setSelectedJenis] = useState<string | null>(null);
  const [slots, setSlots] = useState<PengaturanJadwalSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedHari, setSelectedHari] = useState<number>(1);

  const getTipeLabel = (tipe: number) => {
    switch (tipe) {
      case 1: return { text: "Pembelajaran", badge: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400" };
      case 2: return { text: "Istirahat", badge: "bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400" };
      case 3: return { text: "Upacara", badge: "bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400" };
      case 4: return { text: "Sholat", badge: "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400" };
      case 5: return { text: "Ekstrakurikuler", badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400" };
      case 6: return { text: "Tadarus", badge: "bg-teal-100 text-teal-800 dark:bg-teal-500/10 dark:text-teal-400" };
      default: return { text: "Kegiatan Lainnya", badge: "bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400" };
    }
  };

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
    } catch { /* fallback */ }
    return timeStr;
  };


  // Load jenis jadwal
  const fetchJenisJadwal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jadwalService.getJenisJadwal();
      const list = res.data || [];
      setJenisJadwalList(list);
      if (list.length > 0 && !selectedJenis) {
        setSelectedJenis(list[0].jenis_jadwal_id);
      }
    } catch { /* silently handle */ }
    finally { setLoading(false); }
  }, [selectedJenis]);

  useEffect(() => { fetchJenisJadwal(); }, [fetchJenisJadwal]);

  // Load slots when jenis jadwal or day selected
  const fetchSlots = useCallback(async () => {
    if (!selectedJenis) { setSlots([]); return; }
    setLoadingSlots(true);
    try {
      const res = await jadwalService.getPengaturanJadwal(selectedJenis, selectedHari);
      setSlots((res.data || []).sort((a: any, b: any) => a.urutan - b.urutan));
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  }, [selectedJenis, selectedHari]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const selectedJenisData = jenisJadwalList.find(j => j.jenis_jadwal_id === selectedJenis);
  const currentDaySetting = selectedJenisData?.pengaturan_hari?.find(h => h.hari === selectedHari);
  const activeJamMasuk = currentDaySetting ? currentDaySetting.jam_masuk : "07:00";
  const activeJamPulang = currentDaySetting ? currentDaySetting.jam_pulang : "15:00";

  // =====================
  // JENIS JADWAL CRUD
  // =====================

  const handleAddJenisJadwal = () => {
    Swal.fire({
      title: "Tambah Jenis Jadwal",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Jenis Jadwal</label>
            <input id="swal-nama" type="text" class="w-full px-3 py-2 border rounded-lg" placeholder="Contoh: Jadwal Reguler">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sistem Mata Pelajaran</label>
            <select id="swal-custom" class="w-full px-3 py-2 border rounded-lg">
              <option value="false">Sesuai Rombongan Belajar (Filter per Kelas)</option>
              <option value="true">Custom Mapel (Tampilkan Semua Mapel/Guru)</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label>
              <input id="swal-masuk" type="time" class="w-full px-3 py-2 border rounded-lg" value="07:00">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jam Pulang</label>
              <input id="swal-pulang" type="time" class="w-full px-3 py-2 border rounded-lg" value="15:00">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#465FFF",
      preConfirm: () => {
        const nama = (document.getElementById("swal-nama") as HTMLInputElement).value;
        const custom_mapel = (document.getElementById("swal-custom") as HTMLSelectElement).value === "true";
        const jam_masuk = (document.getElementById("swal-masuk") as HTMLInputElement).value;
        const jam_pulang = (document.getElementById("swal-pulang") as HTMLInputElement).value;
        if (!nama) { Swal.showValidationMessage("Nama wajib diisi"); return false; }
        if (!jam_masuk || !jam_pulang) { Swal.showValidationMessage("Jam masuk dan pulang wajib diisi"); return false; }
        if (jam_masuk >= jam_pulang) { Swal.showValidationMessage("Jam masuk harus sebelum jam pulang"); return false; }
        return { nama, custom_mapel, jam_masuk, jam_pulang };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const res = await jadwalService.createJenisJadwal(result.value);
          await fetchJenisJadwal();
          setSelectedJenis(res.data?.jenis_jadwal_id || selectedJenis);
          Swal.fire("Berhasil", "Jenis jadwal berhasil ditambahkan", "success");
        } catch (err: any) {
          Swal.fire("Gagal", err?.response?.data?.message || "Gagal menyimpan", "error");
        }
      }
    });
  };

  const handleEditJenisJadwal = (jenis: JenisJadwal) => {
    Swal.fire({
      title: "Edit Jenis Jadwal",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Jenis Jadwal</label>
            <input id="swal-nama" type="text" class="w-full px-3 py-2 border rounded-lg" value="${jenis.nama}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sistem Mata Pelajaran</label>
            <select id="swal-custom" class="w-full px-3 py-2 border rounded-lg">
              <option value="false" ${!jenis.custom_mapel ? 'selected' : ''}>Sesuai Rombongan Belajar (Filter per Kelas)</option>
              <option value="true" ${jenis.custom_mapel ? 'selected' : ''}>Custom Mapel (Tampilkan Semua Mapel/Guru)</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#465FFF",
      preConfirm: () => {
        const nama = (document.getElementById("swal-nama") as HTMLInputElement).value;
        const custom_mapel = (document.getElementById("swal-custom") as HTMLSelectElement).value === "true";
        if (!nama) { Swal.showValidationMessage("Nama wajib diisi"); return false; }
        return { nama, custom_mapel };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await jadwalService.updateJenisJadwal(jenis.jenis_jadwal_id, result.value);
          fetchJenisJadwal();
          Swal.fire("Berhasil", "Jenis jadwal berhasil diperbarui", "success");
        } catch (err: any) {
          Swal.fire("Gagal", err?.response?.data?.message || "Gagal memperbarui", "error");
        }
      }
    });
  };

  const handleDeleteJenisJadwal = async (jenis: JenisJadwal) => {
    const result = await Swal.fire({
      title: "Hapus Jenis Jadwal?",
      text: `Yakin hapus "${jenis.nama}"? Semua pengaturan dan jadwal pelajaran terkait akan ikut terhapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      confirmButtonColor: "#E11D48",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        await jadwalService.deleteJenisJadwal(jenis.jenis_jadwal_id);
        if (selectedJenis === jenis.jenis_jadwal_id) setSelectedJenis(null);
        fetchJenisJadwal();
        Swal.fire("Berhasil", "Jenis jadwal berhasil dihapus", "success");
      } catch { Swal.fire("Gagal", "Gagal menghapus jenis jadwal", "error"); }
    }
  };

  const handleToggleJenisJadwal = async (jenis: JenisJadwal, checked: boolean) => {
    try {
      await jadwalService.toggleJenisJadwal(jenis.jenis_jadwal_id, checked);
      fetchJenisJadwal();
    } catch { Swal.fire("Gagal", "Gagal mengubah status", "error"); }
  };

  const handleEditJamKerjaHariIni = () => {
    if (!selectedJenis || !selectedJenisData) return;
    const currentSetting = selectedJenisData?.pengaturan_hari?.find(h => h.hari === selectedHari);
    const activeIn = currentSetting ? currentSetting.jam_masuk : "07:00";
    const activeOut = currentSetting ? currentSetting.jam_pulang : "15:00";
    const dayName = [ "", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu" ][selectedHari];

    Swal.fire({
      title: `Ubah Jam Kerja Hari ${dayName}`,
      html: `
        <div class="text-left space-y-4">
          <p class="text-xs text-gray-500">
            Mengubah jam operasional untuk hari ${dayName} pada template "${selectedJenisData.nama}".
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label>
              <input id="swal-hari-masuk" type="time" class="w-full px-3 py-2 border rounded-lg" value="${formatTime(activeIn)}">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jam Pulang</label>
              <input id="swal-hari-pulang" type="time" class="w-full px-3 py-2 border rounded-lg" value="${formatTime(activeOut)}">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#465FFF",
      preConfirm: () => {
        const jam_masuk = (document.getElementById("swal-hari-masuk") as HTMLInputElement).value;
        const jam_pulang = (document.getElementById("swal-hari-pulang") as HTMLInputElement).value;
        if (!jam_masuk || !jam_pulang) { Swal.showValidationMessage("Jam masuk dan pulang wajib diisi"); return false; }
        if (jam_masuk >= jam_pulang) { Swal.showValidationMessage("Jam masuk harus sebelum jam pulang"); return false; }
        return { jenis_jadwal_id: selectedJenis, hari: selectedHari, jam_masuk, jam_pulang };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await jadwalService.updatePengaturanHari(result.value);
          await fetchJenisJadwal();
          Swal.fire("Berhasil", "Jam kerja hari ini berhasil diperbarui", "success");
        } catch (err: any) {
          Swal.fire("Gagal", err?.response?.data?.message || "Gagal memperbarui jam kerja", "error");
        }
      }
    });
  };

  // =====================
  // PENGATURAN JADWAL SLOT CRUD
  // =====================

  const handleAddSlot = () => {
    if (!selectedJenis) return;
    const nextUrutan = slots.length > 0 ? Math.max(...slots.map(s => s.urutan)) + 1 : 1;

    Swal.fire({
      title: "Tambah Slot Waktu",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
            <input id="swal-urutan" type="number" class="w-full px-3 py-2 border rounded-lg" value="${nextUrutan}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Kegiatan</label>
            <select id="swal-tipe" class="w-full px-3 py-2 border rounded-lg">
              <option value="1">Pembelajaran</option>
              <option value="2">Istirahat</option>
              <option value="3">Upacara</option>
              <option value="4">Sholat</option>
              <option value="5">Ekstrakurikuler</option>
              <option value="6">Tadarus</option>
              <option value="7">Kegiatan Lainnya</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
            <input id="swal-durasi" type="number" class="w-full px-3 py-2 border rounded-lg" value="45" min="1">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#465FFF",
      preConfirm: () => {
        const urutan = parseInt((document.getElementById("swal-urutan") as HTMLInputElement).value, 10);
        const tipe = parseInt((document.getElementById("swal-tipe") as HTMLSelectElement).value, 10);
        const durasi_menit = parseInt((document.getElementById("swal-durasi") as HTMLInputElement).value, 10);
        if (!urutan || urutan < 1) { Swal.showValidationMessage("Urutan harus minimal 1"); return false; }
        if (!durasi_menit || durasi_menit < 1) { Swal.showValidationMessage("Durasi harus minimal 1 menit"); return false; }

        if (selectedJenisData) {
          const currentDaySetting = selectedJenisData?.pengaturan_hari?.find(h => h.hari === selectedHari);
          const activeJamMasuk = currentDaySetting ? currentDaySetting.jam_masuk : "07:00";
          const activeJamPulang = currentDaySetting ? currentDaySetting.jam_pulang : "15:00";
          const jamMasukStr = formatTime(activeJamMasuk);
          const jamPulangStr = formatTime(activeJamPulang);
          if (jamMasukStr && jamPulangStr) {
            const [inH, inM] = jamMasukStr.split(':').map(Number);
            const [outH, outM] = jamPulangStr.split(':').map(Number);
            const availableMinutes = (outH * 60 + outM) - (inH * 60 + inM);

            const existingDuration = slots
              .filter(s => s.urutan !== urutan && s.aktif)
              .reduce((sum, s) => sum + s.durasi_menit, 0);

            if (existingDuration + durasi_menit > availableMinutes) {
              Swal.showValidationMessage(
                `Total durasi (${existingDuration + durasi_menit} menit) melebihi batas jam pulang (${availableMinutes} menit dari jam masuk)`
              );
              return false;
            }
          }
        }

        return { jenis_jadwal_id: selectedJenis, hari: selectedHari, urutan, tipe, durasi_menit, aktif: true };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await jadwalService.upsertPengaturanJadwal(result.value);
          fetchSlots();
          Swal.fire("Berhasil", "Slot berhasil ditambahkan", "success");
        } catch (err: any) {
          Swal.fire("Gagal", err?.response?.data?.message || "Gagal menyimpan", "error");
        }
      }
    });
  };

  const handleEditSlot = (slot: PengaturanJadwalSlot) => {
    Swal.fire({
      title: "Edit Slot Waktu",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
            <input id="swal-urutan" type="number" class="w-full px-3 py-2 border rounded-lg" value="${slot.urutan}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Kegiatan</label>
            <select id="swal-tipe" class="w-full px-3 py-2 border rounded-lg">
              ${[1,2,3,4,5,6,7].map(t => `<option value="${t}" ${slot.tipe === t ? 'selected' : ''}>${getTipeLabel(t).text}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
            <input id="swal-durasi" type="number" class="w-full px-3 py-2 border rounded-lg" value="${slot.durasi_menit}" min="1">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#465FFF",
      preConfirm: () => {
        const urutan = parseInt((document.getElementById("swal-urutan") as HTMLInputElement).value, 10);
        const tipe = parseInt((document.getElementById("swal-tipe") as HTMLSelectElement).value, 10);
        const durasi_menit = parseInt((document.getElementById("swal-durasi") as HTMLInputElement).value, 10);
        if (!durasi_menit || durasi_menit < 1) { Swal.showValidationMessage("Durasi harus minimal 1 menit"); return false; }

        if (selectedJenisData) {
          const currentDaySetting = selectedJenisData?.pengaturan_hari?.find(h => h.hari === slot.hari);
          const activeJamMasuk = currentDaySetting ? currentDaySetting.jam_masuk : "07:00";
          const activeJamPulang = currentDaySetting ? currentDaySetting.jam_pulang : "15:00";
          const jamMasukStr = formatTime(activeJamMasuk);
          const jamPulangStr = formatTime(activeJamPulang);
          if (jamMasukStr && jamPulangStr) {
            const [inH, inM] = jamMasukStr.split(':').map(Number);
            const [outH, outM] = jamPulangStr.split(':').map(Number);
            const availableMinutes = (outH * 60 + outM) - (inH * 60 + inM);

            const existingDuration = slots
              .filter(s => s.urutan !== slot.urutan && s.aktif)
              .reduce((sum, s) => sum + s.durasi_menit, 0);

            if (existingDuration + durasi_menit > availableMinutes) {
              Swal.showValidationMessage(
                `Total durasi (${existingDuration + durasi_menit} menit) melebihi batas jam pulang (${availableMinutes} menit dari jam masuk)`
              );
              return false;
            }
          }
        }

        return { jenis_jadwal_id: selectedJenis, hari: slot.hari, urutan, tipe, durasi_menit, aktif: slot.aktif };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await jadwalService.upsertPengaturanJadwal(result.value);
          fetchSlots();
          Swal.fire("Berhasil", "Slot berhasil diperbarui", "success");
        } catch (err: any) {
          Swal.fire("Gagal", err?.response?.data?.message || "Gagal memperbarui", "error");
        }
      }
    });
  };

  const handleDeleteSlot = async (slot: PengaturanJadwalSlot) => {
    const result = await Swal.fire({
      title: "Hapus Slot?",
      text: `Yakin hapus slot ke-${slot.urutan}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      confirmButtonColor: "#E11D48",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      try {
        await jadwalService.deletePengaturanJadwal(slot.pengaturan_jadwal_id);
        fetchSlots();
        Swal.fire("Berhasil", "Slot berhasil dihapus", "success");
      } catch { Swal.fire("Gagal", "Gagal menghapus slot", "error"); }
    }
  };

  // Calculate time for each slot based on jam_masuk + accumulated durasi
  const getSlotTimeRange = (index: number): string => {
    if (!selectedJenisData) return "";
    const currentDaySetting = selectedJenisData?.pengaturan_hari?.find(h => h.hari === selectedHari);
    const activeJamMasuk = currentDaySetting ? currentDaySetting.jam_masuk : "07:00";
    const jamMasukStr = formatTime(activeJamMasuk);
    if (!jamMasukStr) return "";
    const [h, m] = jamMasukStr.split(':').map(Number);
    let totalMinutes = h * 60 + m;

    for (let i = 0; i < index; i++) {
      totalMinutes += slots[i]?.durasi_menit || 0;
    }

    const startH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const startM = (totalMinutes % 60).toString().padStart(2, '0');
    const endMinutes = totalMinutes + (slots[index]?.durasi_menit || 0);
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');

    return `${startH}:${startM} - ${endH}:${endM}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <span className="ml-3 text-sm text-gray-500">Memuat data...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="SIMAK | Pengaturan Jadwal"
        description="Kelola jenis jadwal dan pengaturan slot waktu kegiatan sekolah"
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pengaturan Jadwal
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola template jadwal (jenis jadwal) dan atur slot waktu kegiatan untuk setiap template.
            </p>
          </div>
          <Button variant="outline" onClick={handleAddJenisJadwal} startIcon={<PlusIcon className="size-4 fill-current" />}>
            Tambah Jenis Jadwal
          </Button>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left: Jenis Jadwal List */}
          <div className="xl:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h4 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Jenis Jadwal</h4>
                {jenisJadwalList.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm italic">
                    Belum ada jenis jadwal. Klik tombol "Tambah" di atas.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {jenisJadwalList.map((jenis) => (
                      <div
                        key={jenis.jenis_jadwal_id}
                        onClick={() => setSelectedJenis(jenis.jenis_jadwal_id)}
                        className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedJenis === jenis.jenis_jadwal_id
                            ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/30 dark:bg-brand-500/10 shadow-sm"
                            : "border-gray-100 bg-gray-50/50 hover:bg-white dark:border-gray-700/50 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                        } ${!jenis.aktif ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-800 dark:text-white/90 truncate">
                              {jenis.nama}
                            </div>
                            <div className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
                              Sistem: {jenis.custom_mapel ? "Custom Mapel" : "Sesuai Rombel"}
                            </div>
                             <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
                              {(() => {
                                const senin = jenis.pengaturan_hari?.find(h => h.hari === 1);
                                return senin ? `${formatTime(senin.jam_masuk)} - ${formatTime(senin.jam_pulang)}` : "-";
                              })()}
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                              {jenis.pengaturan_jadwal?.length || 0} slot
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditJenisJadwal(jenis); }}
                              className="p-1 rounded-md text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteJenisJadwal(jenis); }}
                              className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              title="Hapus"
                            >
                              <TrashBinIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Switch
                            label=""
                            checked={jenis.aktif}
                            onChange={(checked) => { handleToggleJenisJadwal(jenis, checked); }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Pengaturan Slot */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              {!selectedJenis ? (
                <div className="py-20 text-center text-gray-400">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <PlusIcon className="w-8 h-8" />
                  </div>
                  <p className="text-base font-medium text-gray-500 dark:text-gray-300">Pilih jenis jadwal</p>
                  <p className="mt-2 text-sm">Pilih atau buat jenis jadwal terlebih dahulu di panel kiri.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white/90">
                        Slot Waktu: {selectedJenisData?.nama}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400 font-mono">
                          Jam Kerja ({[ "", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu" ][selectedHari]}): {formatTime(activeJamMasuk)} - {formatTime(activeJamPulang)}
                        </p>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          currentDaySetting?.aktif !== false
                            ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                        }`}>
                          {currentDaySetting?.aktif !== false ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.01] px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-semibold text-gray-500">Aktif:</span>
                        <Switch
                          label=""
                          checked={currentDaySetting?.aktif !== false}
                          onChange={async (checked) => {
                            if (!selectedJenis) return;
                            try {
                              await jadwalService.updatePengaturanHari({
                                jenis_jadwal_id: selectedJenis,
                                hari: selectedHari,
                                aktif: checked,
                              });
                              await fetchJenisJadwal();
                              Swal.fire("Berhasil", `Status hari ${[ "", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu" ][selectedHari]} berhasil diperbarui`, "success");
                            } catch {
                              Swal.fire("Gagal", "Gagal mengubah status hari", "error");
                            }
                          }}
                        />
                      </div>
                      <Button size="sm" variant="outline" onClick={handleEditJamKerjaHariIni} startIcon={<PencilIcon className="size-4 fill-current" />}>
                        Ubah Jam Kerja Hari Ini
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleAddSlot} startIcon={<PlusIcon className="size-4 fill-current" />}>
                        Tambah Slot
                      </Button>
                    </div>
                  </div>

                  {/* Selector Hari */}
                  <div className="flex flex-wrap gap-1.5 border-b border-gray-100 dark:border-gray-800/80 pb-4 mb-4">
                    {[
                      { id: 1, name: "Senin" },
                      { id: 2, name: "Selasa" },
                      { id: 3, name: "Rabu" },
                      { id: 4, name: "Kamis" },
                      { id: 5, name: "Jumat" },
                      { id: 6, name: "Sabtu" },
                      { id: 7, name: "Minggu" }
                    ].map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setSelectedHari(day.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          selectedHari === day.id
                            ? "bg-brand-500 text-white shadow-sm"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] dark:text-gray-400"
                        }`}
                      >
                        {day.name}
                      </button>
                    ))}
                  </div>

                  {currentDaySetting?.aktif === false && (
                    <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 flex gap-2">
                      <InfoIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400 leading-normal">
                        Hari <strong>{[ "", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu" ][selectedHari]}</strong> saat ini dinonaktifkan untuk template ini. Semua kegiatan/slot pada hari ini tidak akan ditampilkan pada Jadwal Pelajaran kelas.
                      </p>
                    </div>
                  )}

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-sm italic">
                      Belum ada slot waktu. Klik tombol "Tambah Slot" di atas.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot, index) => {
                        const tipeInfo = getTipeLabel(slot.tipe);
                        return (
                          <div
                            key={slot.pengaturan_jadwal_id}
                            className="group flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white dark:border-gray-700/50 dark:bg-white/[0.01] dark:hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{slot.urutan}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${tipeInfo.badge}`}>
                                  {tipeInfo.text}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">
                                  {slot.durasi_menit} menit
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                {getSlotTimeRange(index)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditSlot(slot)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                title="Hapus"
                              >
                                <TrashBinIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
