import React, { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import { presensiService } from "../../../services/presensiService";
import { dapodikService } from "../../../services/dapodikService";
import ComponentCard from "../../../components/common/ComponentCard";
import { useSekolah } from "../../../context/SekolahContext";
import Swal from "sweetalert2";
import QrScanner from "./components/QrScanner";

const IzinSakit: React.FC = () => {
  const { sekolah } = useSekolah();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jenis: 1, // Default: Izin Terlambat (1=Terlambat, 2=Keluar, 3=Pulang Awal)
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: "",
    jam_keluar: "",
    jam_kembali_estimasi: "",
  });

  // Search Mode & Subject States
  const [subjectType, setSubjectType] = useState<'pd' | 'gtk' | ''>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rombels, setRombels] = useState<any[]>([]);
  const [selectedRombel, setSelectedRombel] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [gtks, setGtks] = useState<any[]>([]);
  const [studentSearchText, setStudentSearchText] = useState("");
  const [gtkSearchText, setGtkSearchText] = useState("");

  // Scanner States
  const [showScanner, setShowScanner] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [scannedSubjects, setScannedSubjects] = useState<Record<string, any>>({});
  const [activeIzins, setActiveIzins] = useState<any[]>([]);

  const getCurrentTimeStr = (offsetHours = 0) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Load classes (rombels) and GTK list on mount/school load
  useEffect(() => {
    const loadInitialData = async () => {
      if (!sekolah?.sekolah_id) return;
      try {
        const rombelRes = await dapodikService.getRombonganBelajar('reguler', 100);
        setRombels(rombelRes.data || []);
        
        const gtkRes = await dapodikService.getGTK(200, '', 1);
        setGtks(gtkRes.data || []);
      } catch (err) {
        console.error("Failed to load search data for permission:", err);
      }
    };
    
    loadInitialData();
  }, [sekolah?.sekolah_id]);

  // Load students when selected rombel changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedRombel) {
        setStudents([]);
        return;
      }
      try {
        const studentRes = await dapodikService.getPesertaDidik(100, '', 1, selectedRombel);
        setStudents(studentRes.data || []);
      } catch (err) {
        console.error("Failed to load students for rombel:", err);
      }
    };
    
    loadStudents();
    setSelectedIds([]); // Clear selection when rombel changes
  }, [selectedRombel]);

  // Load today's leave permissions
  const loadActiveIzins = async () => {
    if (!sekolah?.sekolah_id) return;
    try {
      const res = await presensiService.getIzinKeluarHariIni(sekolah.sekolah_id);
      setActiveIzins(res || []);
    } catch (err) {
      console.error("Failed to load active leave permissions:", err);
    }
  };

  useEffect(() => {
    loadActiveIzins();
  }, [sekolah?.sekolah_id]);

  const handleScan = async (token: string) => {
    if (!token || !sekolah) return;
    try {
      const res = await presensiService.lookupUser(token);
      if (res && res.data) {
        const id = res.type === 'pd' ? res.data.peserta_didik_id : res.data.ptk_id;
        const name = res.data.nama;
        
        // Add to scanned subjects lookup map to render name later
        setScannedSubjects(prev => ({ ...prev, [id]: res.data }));
        
        // Set type and check checkbox
        setSubjectType(res.type);
        setSelectedIds(prev => prev.includes(id) ? prev : [...prev, id]);

        Swal.fire({
          title: 'Terdeteksi!',
          text: `${res.type === 'pd' ? 'Siswa' : 'GTK'}: ${name} berhasil ditambahkan.`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Token tidak terdaftar atau tidak valid.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
      });
    }
  };

  const handleManualLookup = () => {
    if (!manualToken.trim()) return;
    handleScan(manualToken.trim());
    setManualToken("");
  };

  const handleCatatKembali = async (izinId: string) => {
    if (!sekolah) return;
    try {
      await presensiService.catatKembaliIzin(sekolah.sekolah_id, izinId);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Waktu kembali telah dicatat.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      loadActiveIzins();
    } catch (err: any) {
      Swal.fire('Gagal!', err.response?.data?.message || 'Gagal mencatat kembali', 'error');
    }
  };

  const handleSetujuiIzin = async (izinId: string) => {
    if (!sekolah) return;
    try {
      await presensiService.setujuiIzinKeluar(sekolah.sekolah_id, izinId);
      Swal.fire({
        title: 'Disetujui!',
        text: 'Siswa diperbolehkan melakukan presensi pulang.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      loadActiveIzins();
    } catch (err: any) {
      Swal.fire('Gagal!', err.response?.data?.message || 'Gagal menyetujui', 'error');
    }
  };

  const handleDeleteIzin = async (izinId: string) => {
    if (!sekolah) return;
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Data izin ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await presensiService.deleteIzinKeluar(sekolah.sekolah_id, izinId);
        Swal.fire('Terhapus!', 'Data izin telah berhasil dihapus.', 'success');
        loadActiveIzins();
      } catch (err: any) {
        Swal.fire('Gagal!', err.response?.data?.message || 'Gagal menghapus izin', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !sekolah) return;
    
    setLoading(true);
    try {
      // Loop through all checked IDs and trigger createIzin in parallel
      const promises = selectedIds.map(id => {
        const payload = {
          ...formData,
          peserta_didik_id: subjectType === 'pd' ? id : undefined,
          ptk_id: subjectType === 'gtk' ? id : undefined,
        };
        return presensiService.createIzin(sekolah.sekolah_id, payload);
      });

      await Promise.all(promises);
      
      loadActiveIzins(); // Refresh exit permissions list

      Swal.fire({
        title: 'Izin Tersimpan!',
        text: `Berhasil menyimpan data izin untuk ${selectedIds.length} subjek terpilih.`,
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
      });
      
      // Clear selection and reset
      setSelectedIds([]);
      setFormData({
        jenis: 1,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: "",
        jam_keluar: "",
        jam_kembali_estimasi: "",
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Menyimpan!',
        text: err.response?.data?.message || 'Gagal menyimpan data izin',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Input Izin | SIMAK"
        description="Halaman input izin peserta didik dan GTK"
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Input Izin
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Catat keterangan izin terlambat, izin keluar, atau izin pulang awal untuk Peserta Didik dan GTK.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <ComponentCard title="Cari Subjek">
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Pilih kategori subjek (Peserta Didik atau GTK) untuk mencatat izin.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Kategori Subjek
                </label>
                <div className="relative">
                  <select
                    value={subjectType}
                    onChange={(e) => {
                      setSubjectType(e.target.value as 'pd' | 'gtk' | '');
                      setSelectedIds([]);
                      setSelectedRombel('');
                    }}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  >
                    <option value="" className="text-gray-500 dark:bg-gray-800">-- Pilih Kategori Subjek --</option>
                    <option value="pd" className="dark:bg-gray-800">Peserta Didik</option>
                    <option value="gtk" className="dark:bg-gray-800">GTK</option>
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg border py-2.5 px-4 text-sm font-semibold transition-colors cursor-pointer ${
                    showScanner
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h2M16 8h2m-2 4h2m-6-8h2M6 20h2M6 16h2M6 12h2M6 8h2m-2-4h2" />
                  </svg>
                  {showScanner ? "Tutup Scanner" : "Scan Kartu QR/Barcode"}
                </button>
              </div>

              {showScanner && (
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <QrScanner onScanSuccess={handleScan} />
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Input Kode Manual
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Masukkan kode..."
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleManualLookup();
                          }
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                      />
                      <button
                        type="button"
                        onClick={handleManualLookup}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 cursor-pointer"
                      >
                        Cari
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {subjectType === 'pd' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Pilih Kelas (Rombel)
                    </label>
                    <div className="relative">
                      <select
                        value={selectedRombel}
                        onChange={(e) => {
                          setSelectedRombel(e.target.value);
                        }}
                        className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                      >
                        <option value="" className="text-gray-500 dark:bg-gray-800">-- Pilih Kelas --</option>
                        {rombels.map((r) => (
                          <option key={r.rombongan_belajar_id} value={r.nama} className="dark:bg-gray-800">
                            {r.nama}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </div>
                  </div>

                  {selectedRombel && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pilih Siswa ({selectedIds.length} Terpilih)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedIds.length === students.length) {
                              setSelectedIds([]);
                            } else {
                              setSelectedIds(students.map(s => s.peserta_didik_id));
                            }
                          }}
                          className="text-xs text-brand-500 hover:text-brand-600 font-medium cursor-pointer"
                        >
                          {selectedIds.length === students.length ? "Hapus Semua" : "Pilih Semua"}
                        </button>
                      </div>

                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Cari nama siswa..."
                          value={studentSearchText}
                          onChange={(e) => setStudentSearchText(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-850 rounded-lg p-2.5 space-y-1.5 custom-scrollbar">
                        {students.filter(s => s.nama.toLowerCase().includes(studentSearchText.toLowerCase())).length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">Siswa tidak ditemukan</p>
                        ) : (
                          students
                            .filter(s => s.nama.toLowerCase().includes(studentSearchText.toLowerCase()))
                            .map((s) => {
                              const isChecked = selectedIds.includes(s.peserta_didik_id);
                              return (
                                <label key={s.peserta_didik_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedIds(selectedIds.filter(id => id !== s.peserta_didik_id));
                                      } else {
                                        setSelectedIds([...selectedIds, s.peserta_didik_id]);
                                      }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                  />
                                  <div className="text-sm">
                                    <p className="font-medium text-gray-800 dark:text-white/90">{s.nama}</p>
                                    <p className="text-xs text-gray-500">{s.nisn || "-"}</p>
                                  </div>
                                </label>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {subjectType === 'gtk' && (
                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pilih GTK ({selectedIds.length} Terpilih)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedIds.length === gtks.length) {
                            setSelectedIds([]);
                          } else {
                            setSelectedIds(gtks.map(g => g.ptk_id));
                          }
                        }}
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium cursor-pointer"
                      >
                        {selectedIds.length === gtks.length ? "Hapus Semua" : "Pilih Semua"}
                      </button>
                    </div>

                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Cari nama GTK..."
                        value={gtkSearchText}
                        onChange={(e) => setGtkSearchText(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-850 rounded-lg p-2.5 space-y-1.5 custom-scrollbar">
                      {gtks.filter(g => g.nama.toLowerCase().includes(gtkSearchText.toLowerCase())).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">GTK tidak ditemukan</p>
                      ) : (
                        gtks
                          .filter(g => g.nama.toLowerCase().includes(gtkSearchText.toLowerCase()))
                          .map((g) => {
                            const isChecked = selectedIds.includes(g.ptk_id);
                            return (
                              <label key={g.ptk_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedIds(selectedIds.filter(id => id !== g.ptk_id));
                                    } else {
                                      setSelectedIds([...selectedIds, g.ptk_id]);
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                <div className="text-sm">
                                  <p className="font-medium text-gray-800 dark:text-white/90">{g.nama}</p>
                                  <p className="text-xs text-gray-500">{g.nuptk || "-"}</p>
                                </div>
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        <div className="lg:col-span-2">
          <ComponentCard title="Formulir Izin">
            {selectedIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-30">
                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <p className="mt-6 text-gray-500 font-medium">Pilih Kategori dan Subjek di sebelah kiri untuk memulai</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10">
                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 block mb-2">Subjek Terpilih ({selectedIds.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedIds.map(id => {
                      const name = subjectType === 'pd' 
                        ? students.find(s => s.peserta_didik_id === id)?.nama || scannedSubjects[id]?.nama || "Siswa tidak dikenal"
                        : gtks.find(g => g.ptk_id === id)?.nama || scannedSubjects[id]?.nama || "GTK tidak dikenal";
                      return (
                        <span key={id} className="text-xs bg-brand-500/15 text-brand-600 dark:text-brand-400 font-medium px-2.5 py-1 rounded-full">
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                      Jenis Izin
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.jenis}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setFormData({ 
                            ...formData, 
                            jenis: val,
                            jam_keluar: val === 2 ? getCurrentTimeStr() : "",
                            jam_kembali_estimasi: val === 2 ? getCurrentTimeStr(1) : "",
                          });
                        }}
                        className="w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                      >
                        <option value={1}>Izin Terlambat</option>
                        <option value={2}>Izin Keluar</option>
                        <option value={3}>Izin Pulang Awal</option>
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={formData.tanggal}
                      readOnly
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 dark:bg-gray-800/20 py-3 px-4 text-gray-500 outline-none cursor-not-allowed dark:border-gray-700"
                    />
                  </div>
                </div>

                {formData.jenis === 2 && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                        Jam Keluar
                      </label>
                      <input
                        type="time"
                        value={formData.jam_keluar}
                        onChange={(e) => setFormData({ ...formData, jam_keluar: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                      />
                    </div>
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                        Estimasi Jam Kembali
                      </label>
                      <input
                        type="time"
                        value={formData.jam_kembali_estimasi}
                        onChange={(e) => setFormData({ ...formData, jam_kembali_estimasi: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                    Keterangan / Alasan
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Contoh: Mewakili sekolah untuk perlombaan di luar..."
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  />
                </div>

                <div className="flex justify-end gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                  <button
                    type="button"
                    onClick={() => { setSelectedIds([]); setSelectedRombel(''); }}
                    className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-brand-500 px-8 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 shadow-lg shadow-brand-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Data Izin'}
                  </button>
                </div>
              </form>
            )}
          </ComponentCard>
        </div>
      </div>

      <div className="mt-6">
        <ComponentCard title="Daftar Izin Keluar Hari Ini">
          {activeIzins.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              Tidak ada data izin keluar untuk hari ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-white/[0.02] text-xs font-medium text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Subjek</th>
                    <th className="px-6 py-4 font-medium">Tipe</th>
                    <th className="px-6 py-4 font-medium">Jam Keluar</th>
                    <th className="px-6 py-4 font-medium">Jam Kembali (Estimasi)</th>
                    <th className="px-6 py-4 font-medium">Jam Kembali (Aktual)</th>
                    <th className="px-6 py-4 font-medium">Keterangan</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {activeIzins.map((iz) => {
                    const isPD = !!iz.peserta_didik_id;
                    const nama = isPD ? iz.peserta_didik?.nama : iz.gtk?.nama;
                    const identitas = isPD ? iz.peserta_didik?.nama_rombel : iz.gtk?.nuptk || "-";
                    const tipeLabel = isPD ? "Siswa" : "GTK";

                    // Format timestamps
                    const formatTime = (timeStr?: string) => {
                      if (!timeStr) return "-";
                      const date = new Date(timeStr);
                      return date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) + " WIB";
                    };

                    const jamKeluar = formatTime(iz.jam_keluar);
                    const jamEstimasi = formatTime(iz.jam_kembali_estimasi);
                    const jamKembali = formatTime(iz.jam_kembali);

                    // Determine Status and Badge Color
                    let statusLabel = "Belum Kembali";
                    let badgeClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400";

                    const now = new Date();
                    const isReturned = iz.jam_kembali !== null;
                    const actualReturn = isReturned ? new Date(iz.jam_kembali) : null;
                    const estimatedReturn = iz.jam_kembali_estimasi ? new Date(iz.jam_kembali_estimasi) : null;

                    const isLate = estimatedReturn && (
                      isReturned
                        ? actualReturn! > estimatedReturn
                        : now > estimatedReturn
                    );

                    if (isReturned) {
                      if (isLate) {
                        if (iz.disetujui) {
                          statusLabel = "Terlambat (Disetujui)";
                          badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400";
                        } else {
                          statusLabel = "Terlambat Kembali";
                          badgeClass = "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400";
                        }
                      } else {
                        statusLabel = "Kembali Tepat Waktu";
                        badgeClass = "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400";
                      }
                    } else {
                      if (isLate) {
                        if (iz.disetujui) {
                          statusLabel = "Terlambat (Disetujui)";
                          badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400";
                        } else {
                          statusLabel = "Terlambat (Belum Kembali)";
                          badgeClass = "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400";
                        }
                      }
                    }

                    return (
                      <tr key={iz.izin_id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-800 dark:text-white/90 block mb-0.5">{nama}</span>
                          <span className="text-xs text-gray-500 block">{identitas}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            isPD ? "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400" : "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-400"
                          }`}>
                            {tipeLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{jamKeluar}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{jamEstimasi}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{jamKembali}</td>
                        <td className="px-6 py-4 max-w-xs truncate">{iz.keterangan || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {!isReturned && (
                              <button
                                type="button"
                                onClick={() => handleCatatKembali(iz.izin_id)}
                                className="text-xs text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-semibold px-2 py-1 border border-green-500/30 rounded-lg bg-green-500/5 hover:bg-green-500/10 cursor-pointer"
                              >
                                Catat Kembali
                              </button>
                            )}
                            {isLate && !iz.disetujui && (
                              <button
                                type="button"
                                onClick={() => handleSetujuiIzin(iz.izin_id)}
                                className="text-xs text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 font-semibold px-2 py-1 border border-brand-500/30 rounded-lg bg-brand-500/5 hover:bg-brand-500/10 cursor-pointer"
                              >
                                Setujui Pulang
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteIzin(iz.izin_id)}
                              className="text-xs text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-semibold px-2 py-1 border border-red-500/30 rounded-lg bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default IzinSakit;
