import React, { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import FileInput from "../../components/form/input/FileInput";
import { TrashBinIcon } from "../../icons";
import { dapodikService } from "../../services/dapodikService";
import Swal from "sweetalert2";
import api from "../../services/api";
import { Modal } from "../../components/ui/modal";

export default function Umum() {
  const [sekolahId, setSekolahId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pengaturanData, setPengaturanData] = useState({
    background_gtk: "",
    background_pd: "",
    waktu_mulai_pengajuan: "",
    waktu_sampai_pengajuan: "",
  });

  // Reset 2FA Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCategory, setResetCategory] = useState<"gtk" | "pd" | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Load Classes for PD Category
  useEffect(() => {
    if (isResetModalOpen && resetCategory === "pd" && classes.length === 0) {
      const loadClasses = async () => {
        try {
          const res = await dapodikService.getRombonganBelajar("reguler", 100);
          if (res?.status === "success" && res.data) {
            setClasses(res.data);
          }
        } catch (err) {
          console.error("Gagal memuat kelas:", err);
        }
      };
      loadClasses();
    }
  }, [isResetModalOpen, resetCategory, classes.length]);

  // Load GTKs
  useEffect(() => {
    if (isResetModalOpen && resetCategory === "gtk") {
      const loadGTKs = async () => {
        try {
          setLoadingMembers(true);
          const res = await dapodikService.getGTK(999, "", 1);
          if (res?.status === "success" && res.data) {
            setMembers(res.data);
          } else {
            setMembers([]);
          }
        } catch (err) {
          console.error("Gagal memuat GTK:", err);
          setMembers([]);
        } finally {
          setLoadingMembers(false);
        }
      };
      loadGTKs();
    }
  }, [isResetModalOpen, resetCategory]);

  // Load Students by Class
  useEffect(() => {
    if (isResetModalOpen && resetCategory === "pd" && selectedClass) {
      const loadStudents = async () => {
        try {
          setLoadingMembers(true);
          const res = await dapodikService.getPesertaDidik(999, "", 1, selectedClass, "aktif");
          if (res?.status === "success" && res.data) {
            setMembers(res.data);
          } else {
            setMembers([]);
          }
        } catch (err) {
          console.error("Gagal memuat siswa:", err);
          setMembers([]);
        } finally {
          setLoadingMembers(false);
        }
      };
      loadStudents();
    } else if (isResetModalOpen && resetCategory === "pd" && !selectedClass) {
      setMembers([]);
    }
  }, [isResetModalOpen, resetCategory, selectedClass]);

  const handleReset2FA = async (person: any) => {
    const isGTK = resetCategory === "gtk";
    const payload = isGTK ? { ptk_id: person.ptk_id } : { peserta_didik_id: person.peserta_didik_id };

    const confirm = await Swal.fire({
      title: "Set Ulang Authenticator?",
      text: `Apakah Anda yakin ingin menyetel ulang authenticator (2FA) untuk ${person.nama}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Set Ulang!",
      cancelButtonText: "Batal"
    });

    if (confirm.isConfirmed) {
      try {
        Swal.fire({
          title: "Memproses...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await api.post("/auth/reset-2fa", payload);
        
        Swal.fire("Berhasil", "Authenticator (2FA) berhasil diset ulang.", "success");
      } catch (err: any) {
        console.error(err);
        const errMsg = err.response?.data?.message || "Gagal menyetel ulang authenticator (Pengguna mungkin belum memiliki akun).";
        Swal.fire("Error", errMsg, "error");
      }
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const sch = await dapodikService.getSekolah();
        if (sch?.status === "success" && sch.data?.sekolah_id) {
          setSekolahId(sch.data.sekolah_id);
          const settings = await dapodikService.getPengaturanUmum(sch.data.sekolah_id);
          if (settings?.status === "success" && settings.data) {
            const cfg = settings.data;
            setPengaturanData({
              background_gtk: cfg.background_gtk || "",
              background_pd: cfg.background_pd || "",
              waktu_mulai_pengajuan: cfg.waktu_mulai_pengajuan || "",
              waktu_sampai_pengajuan: cfg.waktu_sampai_pengajuan || "",
            });
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data pengaturan:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);



  const handleBackgroundChange = (type: "gtk" | "pd") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPengaturanData((prev) => ({
          ...prev,
          [type === "gtk" ? "background_gtk" : "background_pd"]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!sekolahId) {
      Swal.fire("Error", "ID Sekolah tidak ditemukan.", "error");
      return;
    }

    setSaving(true);
    Swal.fire({
      title: "Menyimpan...",
      text: "Sedang menyimpan pengaturan umum sekolah",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await dapodikService.updatePengaturanUmum(sekolahId, {
        background_gtk: pengaturanData.background_gtk || null,
        background_pd: pengaturanData.background_pd || null,
        waktu_mulai_pengajuan: pengaturanData.waktu_mulai_pengajuan || null,
        waktu_sampai_pengajuan: pengaturanData.waktu_sampai_pengajuan || null,
      });

      Swal.fire({
        title: "Berhasil!",
        text: "Pengaturan umum berhasil disimpan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: "Gagal Menyimpan!",
        text: err.response?.data?.message || err.message || "Terjadi kesalahan saat menyimpan pengaturan.",
        icon: "error",
        confirmButtonColor: "#465fff",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 font-medium">Memuat data pengaturan...</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="SIMAK | Pengaturan Umum"
        description="Pengaturan Umum Sekolah"
      />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 no-print">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pengaturan Umum Sekolah
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola pengaturan background kartu ID dan batasan waktu pengajuan perbaikan data.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Background GTK */}
            <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01]">
              <Label className="font-bold text-gray-800 dark:text-white/90">Latar Belakang (Background) Kartu GTK</Label>
              <p className="text-xs text-gray-400">Pilih foto yang akan digunakan sebagai background pada cetakan kartu ID GTK.</p>
              
              {pengaturanData.background_gtk && (
                <div className="relative w-[150px] h-[230px] rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-cover bg-center" style={{ backgroundImage: `url(${pengaturanData.background_gtk})` }}>
                  <button
                    type="button"
                    onClick={() => setPengaturanData(prev => ({ ...prev, background_gtk: "" }))}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
              )}
              
              <FileInput onChange={handleBackgroundChange('gtk')} />
            </div>

            {/* Background PD */}
            <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.01]">
              <Label className="font-bold text-gray-800 dark:text-white/90">Latar Belakang (Background) Kartu PD</Label>
              <p className="text-xs text-gray-400">Pilih foto yang akan digunakan sebagai background pada cetakan kartu ID Peserta Didik.</p>
              
              {pengaturanData.background_pd && (
                <div className="relative w-[150px] h-[230px] rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-cover bg-center" style={{ backgroundImage: `url(${pengaturanData.background_pd})` }}>
                  <button
                    type="button"
                    onClick={() => setPengaturanData(prev => ({ ...prev, background_pd: "" }))}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
              )}
              
              <FileInput onChange={handleBackgroundChange('pd')} />
            </div>
          </div>



          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
            <Button variant="outline" type="button" onClick={() => setIsResetModalOpen(true)}>
              Reset 2FA Pengguna
            </Button>
            <Button onClick={handleSave} disabled={saving}>Simpan Perubahan</Button>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isResetModalOpen} 
        onClose={() => {
          setIsResetModalOpen(false);
          setResetCategory(null);
          setSelectedClass("");
          setSearchMemberQuery("");
          setMembers([]);
        }}
        className="max-w-[700px] p-6 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
            Set Ulang Authenticator (2FA) Pengguna
          </h4>
          <button 
            onClick={() => {
              setIsResetModalOpen(false);
              setResetCategory(null);
              setSelectedClass("");
              setSearchMemberQuery("");
              setMembers([]);
            }} 
            className="text-gray-400 hover:text-gray-500 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
          {/* Kategori Selector */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setResetCategory("gtk");
                setSelectedClass("");
                setSearchMemberQuery("");
                setMembers([]);
              }}
              className={`flex-1 py-3 rounded-xl border text-center font-semibold transition-colors ${
                resetCategory === "gtk" 
                  ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
              }`}
            >
              GTK (Guru & Tendik)
            </button>
            <button
              onClick={() => {
                setResetCategory("pd");
                setSelectedClass("");
                setSearchMemberQuery("");
                setMembers([]);
              }}
              className={`flex-1 py-3 rounded-xl border text-center font-semibold transition-colors ${
                resetCategory === "pd" 
                  ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
              }`}
            >
              Peserta Didik (Siswa)
            </button>
          </div>

          {/* If Student chosen, show class selection */}
          {resetCategory === "pd" && (
            <div className="space-y-2">
              <Label>Pilih Rombongan Belajar (Kelas)</Label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSearchMemberQuery("");
                  setMembers([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((cls) => (
                  <option key={cls.rombongan_belajar_id} value={cls.nama}>
                    {cls.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* List Section */}
          {resetCategory && (
            <div className="space-y-3">
              {/* Search Bar */}
              {(resetCategory === "gtk" || (resetCategory === "pd" && selectedClass)) && (
                <div className="space-y-2">
                  <Label>Cari Nama</Label>
                  <Input
                    type="text"
                    placeholder="Masukkan nama untuk menyaring..."
                    value={searchMemberQuery}
                    onChange={(e) => setSearchMemberQuery(e.target.value)}
                  />
                </div>
              )}

              {/* Members List */}
              {loadingMembers ? (
                <p className="text-sm text-gray-500 text-center py-4">Memuat data...</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl p-3 bg-gray-50/50 dark:bg-white/[0.01]">
                  {(() => {
                    const filtered = members.filter((m) =>
                      m.nama.toLowerCase().includes(searchMemberQuery.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {resetCategory === "pd" && !selectedClass
                            ? "Silakan pilih kelas terlebih dahulu."
                            : "Tidak ada data yang ditemukan."}
                        </p>
                      );
                    }

                    return filtered.map((item) => (
                      <div
                        key={resetCategory === "gtk" ? item.ptk_id : item.peserta_didik_id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-white/[0.03] rounded-lg transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.nama}
                          </p>
                          <p className="text-xs text-gray-500">
                            {resetCategory === "gtk"
                              ? (item.nuptk ? `NUPTK: ${item.nuptk}` : `NIK: ${item.nik || "-"}`)
                              : `NISN: ${item.nisn || "-"}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReset2FA(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          Reset 2FA
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
