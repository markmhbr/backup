import { useState, useEffect, useCallback, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import Select from "../../components/form/Select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Swal from "sweetalert2";
import { jadwalService, type JenisJadwal, type PengaturanJadwalSlot, type JadwalEntry } from "../../services/jadwalService";
import { dapodikService } from "../../services/dapodikService";
import { SearchIcon, TrashBinIcon, PlusIcon, InfoIcon } from "../../icons";
import Input from "../../components/form/input/InputField";

interface RombelOption {
  value: string;
  label: string;
}

interface MapelOption {
  pembelajaran_id: string;
  nama_mata_pelajaran: string;
  ptk_id: string | null;
  ptk_nama: string | null;
  jam_mengajar_per_minggu: string | null;
}

export default function JadwalPelajaran() {
  const [jenisJadwalList, setJenisJadwalList] = useState<JenisJadwal[]>([]);
  const [selectedJenis, setSelectedJenis] = useState<string>("");
  const [rombelList, setRombelList] = useState<RombelOption[]>([]);
  const [selectedRombel, setSelectedRombel] = useState<string>("");
  const [slots, setSlots] = useState<PengaturanJadwalSlot[]>([]);
  const [schedules, setSchedules] = useState<JadwalEntry[]>([]);
  const [mapelList, setMapelList] = useState<MapelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [mapelSearch, setMapelSearch] = useState("");
  const selectedJenisData = jenisJadwalList.find(j => j.jenis_jadwal_id === selectedJenis);
  const isCustom = !!selectedJenisData?.custom_mapel;

  const allDays = useMemo(() => [
    { id: 1, name: "Senin" },
    { id: 2, name: "Selasa" },
    { id: 3, name: "Rabu" },
    { id: 4, name: "Kamis" },
    { id: 5, name: "Jumat" },
    { id: 6, name: "Sabtu" },
    { id: 7, name: "Minggu" },
  ], []);

  const days = useMemo(() => {
    return allDays.filter(day => {
      const setting = selectedJenisData?.pengaturan_hari?.find(h => h.hari === day.id);
      return setting ? setting.aktif !== false : true;
    });
  }, [allDays, selectedJenisData]);

  const getTipeLabel = (tipe: number) => {
    switch (tipe) {
      case 1: return { text: "Pembelajaran", color: "text-brand-600", badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-600" };
      case 2: return { text: "Istirahat", color: "text-gray-400", badge: "bg-gray-50 dark:bg-gray-500/10 text-gray-400" };
      case 3: return { text: "Upacara", color: "text-purple-600", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600" };
      case 4: return { text: "Sholat", color: "text-green-600", badge: "bg-green-50 dark:bg-green-500/10 text-green-600" };
      case 5: return { text: "Ekstrakurikuler", color: "text-indigo-600", badge: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600" };
      case 6: return { text: "Tadarus", color: "text-teal-600", badge: "bg-teal-50 dark:bg-teal-500/10 text-teal-600" };
      default: return { text: "Lainnya", color: "text-orange-600", badge: "bg-orange-50 dark:bg-orange-500/10 text-orange-600" };
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

  // Calculate time for each slot on a specific day
  const getSlotTimeRangeForDay = (dayId: number, urutan: number): string => {
    if (!selectedJenisData) return "";
    const currentDaySetting = selectedJenisData?.pengaturan_hari?.find(h => h.hari === dayId);
    const activeJamMasuk = currentDaySetting ? currentDaySetting.jam_masuk : "07:00";
    const jamMasukStr = formatTime(activeJamMasuk);
    if (!jamMasukStr) return "";
    const [h, m] = jamMasukStr.split(':').map(Number);
    let totalMinutes = h * 60 + m;

    // Filter and sort active slots for this day
    const daySlots = slots.filter(s => s.hari === dayId).sort((a, b) => a.urutan - b.urutan);
    const targetIndex = daySlots.findIndex(s => s.urutan === urutan);
    if (targetIndex === -1) return "";

    for (let i = 0; i < targetIndex; i++) {
      totalMinutes += daySlots[i]?.durasi_menit || 0;
    }

    const startH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const startM = (totalMinutes % 60).toString().padStart(2, '0');
    const endMinutes = totalMinutes + (daySlots[targetIndex]?.durasi_menit || 0);
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');

    return `${startH}:${startM} - ${endH}:${endM}`;
  };


  // Load initial data: Jenis Jadwal & Rombel list (both reguler & pilihan)
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [jenisRes, rombelRegulerRes, rombelPilihanRes] = await Promise.all([
          jadwalService.getJenisJadwal(),
          dapodikService.getRombonganBelajar('reguler', 200, 1, ''),
          dapodikService.getRombonganBelajar('pilihan', 200, 1, ''),
        ]);

        const jenisData = jenisRes.data || [];
        setJenisJadwalList(jenisData);
        if (jenisData.length > 0) {
          setSelectedJenis(jenisData[0].jenis_jadwal_id);
        }

        const rombels = [
          ...(rombelRegulerRes.data || []),
          ...(rombelPilihanRes.data || [])
        ].map((r: any) => ({
          value: r.rombongan_belajar_id,
          label: r.nama,
        }));
        setRombelList(rombels);
        if (rombels.length > 0) {
          setSelectedRombel(rombels[0].value);
        }
      } catch (error) {
        console.error("Gagal memuat data awal:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Ensure selectedRombel is set and valid
  useEffect(() => {
    if (rombelList.length > 0) {
      const exists = rombelList.some(r => r.value === selectedRombel);
      if (!exists || !selectedRombel) {
        setSelectedRombel(rombelList[0].value);
      }
    }
  }, [rombelList, selectedRombel]);

  // Fetch slots and schedules and mapel options
  const fetchScheduleDetails = useCallback(async () => {
    if (!selectedJenis || !selectedRombel) {
      setSlots([]);
      setSchedules([]);
      setMapelList([]);
      return;
    }
    setLoadingSchedule(true);
    try {
      const [slotsRes, scheduleRes, mapelRes] = await Promise.all([
        jadwalService.getPengaturanJadwal(selectedJenis),
        jadwalService.getJadwalPelajaran(selectedJenis, selectedRombel),
        isCustom
          ? dapodikService.getAllPembelajaran()
          : dapodikService.getRombelPembelajaran(selectedRombel),
      ]);

      setSlots((slotsRes.data || []).filter((s: PengaturanJadwalSlot) => s.aktif).sort((a: any, b: any) => a.urutan - b.urutan));
      setSchedules(scheduleRes.data || []);
      setMapelList((mapelRes.data || []).map((m: any) => ({
        pembelajaran_id: m.pembelajaran_id,
        nama_mata_pelajaran: m.nama_mata_pelajaran + (isCustom && m.rombongan_belajar ? ` (${m.rombongan_belajar.nama})` : ""),
        ptk_id: m.ptk_id,
        ptk_nama: m.gtk?.nama || m.ptk_id_str || "Tanpa Guru",
        jam_mengajar_per_minggu: m.jam_mengajar_per_minggu,
      })));
    } catch (error) {
      console.error("Gagal memuat detail jadwal:", error);
      setSlots([]);
      setSchedules([]);
      setMapelList([]);
    } finally {
      setLoadingSchedule(false);
    }
  }, [selectedJenis, selectedRombel, isCustom]);

  useEffect(() => {
    fetchScheduleDetails();
  }, [fetchScheduleDetails]);

  // Group unique slots by urutan (represented by number arrays up to the max urutan)
  const uniqueSlots = useMemo(() => {
    const activeSlots = slots.filter(s => {
      const daySetting = selectedJenisData?.pengaturan_hari?.find(h => h.hari === s.hari);
      return daySetting ? daySetting.aktif !== false : true;
    });
    const maxUrutan = activeSlots.length > 0 ? Math.max(...activeSlots.map(s => s.urutan)) : 0;
    return Array.from({ length: maxUrutan }, (_, i) => i + 1);
  }, [slots, selectedJenisData]);

  const getSlotSubject = (hariId: number, urutan: number): JadwalEntry | undefined => {
    return schedules.find((s) => s.hari === hariId && s.urutan === urutan);
  };

  // Calculate usage for each mapel
  const mapelUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    schedules.forEach(s => {
      if (s.pembelajaran_id) {
        usage[s.pembelajaran_id] = (usage[s.pembelajaran_id] || 0) + 1;
      }
    });
    return usage;
  }, [schedules]);

  const filteredMapel = mapelList.filter(m =>
    m.nama_mata_pelajaran.toLowerCase().includes(mapelSearch.toLowerCase()) ||
    (m.ptk_nama || '').toLowerCase().includes(mapelSearch.toLowerCase())
  );

  // DnD Handlers
  const handleDragStart = (e: React.DragEvent, mapel: MapelOption) => {
    e.dataTransfer.setData("mapel", JSON.stringify(mapel));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, hari: number, urutan: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("mapel");
    if (!data || !selectedRombel || !selectedJenis) return;

    const mapel = JSON.parse(data) as MapelOption;

    try {
      await jadwalService.upsertJadwalPelajaran({
        jenis_jadwal_id: selectedJenis,
        rombongan_belajar_id: selectedRombel,
        pembelajaran_id: mapel.pembelajaran_id,
        hari,
        urutan,
      });
      fetchScheduleDetails();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Gagal menyimpan jadwal";
      Swal.fire("Gagal", msg, "error");
    }
  };

  const handleDeleteJadwal = async (jadwalId: string) => {
    const result = await Swal.fire({
      title: "Hapus Jadwal?",
      text: "Yakin ingin menghapus mata pelajaran dari slot ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      confirmButtonColor: "#E11D48",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await jadwalService.deleteJadwalPelajaran(jadwalId);
        fetchScheduleDetails();
        Swal.fire("Berhasil", "Jadwal berhasil dihapus", "success");
      } catch {
        Swal.fire("Gagal", "Gagal menghapus jadwal", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <span className="ml-3 text-sm text-gray-500">Memuat data awal...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="SIMAK | Jadwal Pelajaran"
        description="Kelola dan susun jadwal pelajaran mingguan per kelas sekolah"
      />

      <div className="space-y-6">
        {/* Header Card */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Penyusunan Jadwal Pelajaran
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Drag & drop mata pelajaran dari list kiri ke slot waktu di sebelah kanan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="w-full sm:w-60">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Template Jadwal</label>
              <Select
                options={jenisJadwalList.map(j => ({ value: j.jenis_jadwal_id, label: j.nama }))}
                value={selectedJenis}
                onChange={(value) => setSelectedJenis(value)}
                placeholder="Pilih Template Jadwal..."
              />
            </div>
            <div className="w-full sm:w-60">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Rombongan Belajar</label>
              <Select
                options={rombelList}
                value={selectedRombel}
                onChange={(value) => setSelectedRombel(value)}
                placeholder="Pilih Kelas..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Column: Subject List */}
          <div className="xl:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white/90 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5 text-brand-500" />
                    Daftar Mapel
                  </h4>
                </div>

                {/* Mode status badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold w-full justify-center border ${
                    isCustom
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                  }`}>
                    {isCustom ? "Mode Custom: Semua Mapel/Guru" : "Mode Sesuai Rombongan Belajar (Filter per Kelas)"}
                  </span>
                </div>

                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon className="size-4" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Cari mapel/guru..."
                    value={mapelSearch}
                    onChange={(e) => setMapelSearch(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingSchedule ? (
                    <div className="py-10 text-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent mx-auto"></div></div>
                  ) : filteredMapel.length > 0 ? (
                    filteredMapel.map((m) => {
                      const used = mapelUsage[m.pembelajaran_id] || 0;
                      const quota = parseInt(m.jam_mengajar_per_minggu || "0");
                      const isOver = used > quota;
                      const isComplete = used === quota && quota > 0;

                      return (
                        <div
                          key={m.pembelajaran_id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, m)}
                          className={`group p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
                            isComplete
                              ? "border-green-200 bg-green-50/30 dark:border-green-500/20 dark:bg-green-500/5"
                              : isOver
                              ? "border-red-200 bg-red-50/30 dark:border-red-500/20 dark:bg-red-500/5"
                              : "border-gray-100 bg-gray-50/50 hover:bg-white dark:border-gray-700/50 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="text-sm font-bold text-gray-800 dark:text-white/90 truncate leading-tight">
                            {m.nama_mata_pelajaran}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-1">
                            {m.ptk_nama || "Tanpa Guru"}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
                            <div className="flex items-center gap-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                isOver ? "bg-red-100 text-red-600" : isComplete ? "bg-green-100 text-green-600" : "bg-brand-100 text-brand-600"
                              }`}>
                                {used} / {quota || "-"} Jam
                              </span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlusIcon className="w-4 h-4 text-brand-500" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-gray-400 text-sm italic">
                      Tidak ada mapel ditemukan
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 flex gap-2">
                  <InfoIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-normal">
                    Drag mapel ke slot jam pelajaran. Gunakan filter cari jika daftar terlalu panjang.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Schedule Grid */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 overflow-hidden">
              {loadingSchedule ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                  <span className="text-sm text-gray-500">Menyusun grid jadwal...</span>
                </div>
              ) : uniqueSlots.length === 0 ? (
                <div className="py-32 text-center text-gray-400">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <PlusIcon className="w-10 h-10" />
                  </div>
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Belum ada slot pembelajaran</p>
                  <p className="mt-2 text-sm max-w-xs mx-auto">Silakan atur Pengaturan Jam terlebih dahulu di menu Kurikulum → Pengaturan Jam</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <Table className="border-collapse border-hidden">
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader className="w-32 border border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-white/[0.02]">
                          Jam / Waktu
                        </TableCell>
                        {days.map((day) => (
                          <TableCell key={day.id} isHeader className="border border-gray-100 dark:border-gray-800 text-center min-w-[160px] bg-gray-50/50 dark:bg-white/[0.02] py-4">
                            {day.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueSlots.map((urutan) => (
                        <TableRow key={urutan} className="group/row">
                          <TableCell className="border border-gray-100 dark:border-gray-800 text-center bg-gray-50/30 dark:bg-white/[0.01] font-bold text-gray-800 dark:text-white/90">
                            Ke-{urutan}
                          </TableCell>
                          {days.map((day) => {
                            const daySlots = slots.filter(s => s.hari === day.id);
                            const slotConfig = daySlots.find(s => s.urutan === urutan);
                            const subjectInfo = getSlotSubject(day.id, urutan);

                            if (!slotConfig) {
                              return (
                                <TableCell
                                  key={day.id}
                                  className="border border-gray-100 dark:border-gray-800 p-1 bg-gray-50/10 dark:bg-white/[0.005]"
                                >
                                  <div className="min-h-[75px] flex items-center justify-center text-xs text-gray-300 dark:text-gray-700 italic">
                                    -
                                  </div>
                                </TableCell>
                              );
                            }

                            const isPembelajaran = slotConfig.tipe === 1;
                            const timeRange = getSlotTimeRangeForDay(day.id, urutan);

                            return (
                              <TableCell
                                key={day.id}
                                className="border border-gray-100 dark:border-gray-800 p-1 relative"
                              >
                                <div
                                  onDragOver={isPembelajaran ? handleDragOver : undefined}
                                  onDrop={isPembelajaran ? (e) => handleDrop(e, day.id, urutan) : undefined}
                                  className={`min-h-[75px] flex flex-col items-center justify-center text-center rounded-xl transition-all duration-200 group/cell relative overflow-hidden p-2 ${
                                    isPembelajaran
                                      ? subjectInfo
                                        ? "bg-brand-500/[0.04] border-brand-500/10 dark:bg-brand-500/10 border shadow-sm"
                                        : "border-2 border-dashed border-gray-50 dark:border-gray-800/50 hover:border-brand-500/30 hover:bg-brand-500/[0.02]"
                                      : "bg-gray-50/50 dark:bg-white/[0.01] border border-transparent"
                                  }`}
                                >
                                  {isPembelajaran ? (
                                    subjectInfo ? (
                                      <>
                                        <div className="w-full">
                                          <div className="text-[11px] font-bold text-brand-600 dark:text-brand-400 leading-tight mb-1">
                                            {subjectInfo.pembelajaran?.nama_mata_pelajaran || "Tidak Diketahui"}
                                          </div>
                                          <div className="text-[9px] text-gray-500 dark:text-gray-400 truncate font-medium mb-1">
                                            {subjectInfo.pembelajaran?.gtk?.nama || subjectInfo.pembelajaran?.ptk_id_str || "-"}
                                          </div>
                                          <div className="text-[9px] text-gray-400 font-mono">
                                            {timeRange}
                                          </div>
                                        </div>

                                        {/* Hover Action Overlay */}
                                        <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                                          <button
                                            onClick={() => subjectInfo.jadwal_pelajaran_id && handleDeleteJadwal(subjectInfo.jadwal_pelajaran_id)}
                                            className="p-1.5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
                                            title="Hapus Jadwal"
                                          >
                                            <TrashBinIcon className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center">
                                        <div className="opacity-20 group-hover/cell:opacity-100 transition-opacity">
                                           <PlusIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover/cell:text-brand-400" />
                                        </div>
                                        <div className="text-[9px] text-gray-400 font-mono mt-1">
                                          {timeRange}
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <div className="flex flex-col items-center justify-center">
                                      <div className={`text-[10px] font-bold uppercase tracking-wider ${getTipeLabel(slotConfig.tipe).color}`}>
                                        {getTipeLabel(slotConfig.tipe).text}
                                      </div>
                                      <div className="text-[9px] text-gray-400 font-mono mt-1">
                                        {timeRange}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 bg-white/50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div>
                <span>Selesai (Pas Kuota)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-brand-100 border border-brand-200"></div>
                <span>Dalam Proses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
                <span>Melebihi Kuota</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
