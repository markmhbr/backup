import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

interface SchoolSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SchoolSelectModal: React.FC<SchoolSelectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { getJenjangList, getSekolahByJenjang, switchSekolah } = useAuth();

  const [jenjangList, setJenjangList] = useState<any[]>([]);
  const [sekolahList, setSekolahList] = useState<any[]>([]);
  const [selectedJenjangId, setSelectedJenjangId] = useState<string>("");
  const [selectedSekolahId, setSelectedSekolahId] = useState<string>("");
  const [searchSchoolQuery, setSearchSchoolQuery] = useState<string>("");
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchJenjangAndSchools();
    }
  }, [isOpen]);

  const fetchJenjangAndSchools = async (jenjangId?: string) => {
    setSchoolLoading(true);
    setError(null);
    try {
      if (jenjangList.length === 0) {
        const jList = await getJenjangList();
        setJenjangList(jList || []);
      }
      const sList = await getSekolahByJenjang(
        jenjangId ? Number(jenjangId) : undefined
      );
      setSekolahList(sList || []);
    } catch (err: any) {
      console.error("Gagal mengambil data sekolah/jenjang:", err);
      setError("Gagal memuat daftar sekolah. Coba lagi.");
    } finally {
      setSchoolLoading(false);
    }
  };

  const handleJenjangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedJenjangId(val);
    setSelectedSekolahId("");
    fetchJenjangAndSchools(val);
  };

  const filteredSekolahList = sekolahList.filter((s) => {
    if (!searchSchoolQuery.trim()) return true;
    const q = searchSchoolQuery.toLowerCase();
    const namaMatch = s.nama?.toLowerCase().includes(q);
    const npsnMatch = s.npsn?.toLowerCase().includes(q);
    const alamatMatch = s.alamat_jalan?.toLowerCase().includes(q);
    return namaMatch || npsnMatch || alamatMatch;
  });

  const handleConfirmSchoolSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSekolahId) {
      setError("Silakan pilih sekolah terlebih dahulu");
      return;
    }
    setSwitchLoading(true);
    setError(null);
    try {
      await switchSekolah(selectedSekolahId);
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Gagal berpindah ke sekolah terpilih."
      );
    } finally {
      setSwitchLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] p-6 sm:p-10"
    >
      <div className="text-center">
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
          Pilih Sekolah Target
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Pilih Jenjang Pendidikan dan Sekolah yang ingin Anda kelola.
        </p>

        {error && (
          <div className="p-4 mb-6 text-sm text-error-600 bg-error-50 border border-error-100 rounded-xl dark:bg-error-500/10 dark:border-error-500/20 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirmSchoolSwitch}>
          <div className="space-y-5 text-left">
            <div>
              <Label>1. Pilih Jenjang Pendidikan</Label>
              <select
                value={selectedJenjangId}
                onChange={handleJenjangChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">-- Semua Jenjang --</option>
                {jenjangList.map((j) => (
                  <option key={j.bentuk_pendidikan_id} value={j.bentuk_pendidikan_id}>
                    {j.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>2. Cari & Pilih Sekolah <span className="text-error-500">*</span></Label>
              
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Ketik nama sekolah atau NPSN..."
                  value={searchSchoolQuery}
                  onChange={(e) => setSearchSchoolQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                />
                {searchSchoolQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchSchoolQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 space-y-1 bg-gray-50/50 dark:bg-gray-800/50">
                {schoolLoading ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                    Memuat daftar sekolah...
                  </div>
                ) : filteredSekolahList.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {sekolahList.length === 0
                      ? "Belum ada sekolah pada jenjang ini"
                      : "Tidak ada sekolah yang cocok dengan pencarian"}
                  </div>
                ) : (
                  filteredSekolahList.map((s) => {
                    const isSelected = selectedSekolahId === s.sekolah_id;
                    return (
                      <div
                        key={s.sekolah_id}
                        onClick={() => setSelectedSekolahId(s.sekolah_id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${
                          isSelected
                            ? "bg-brand-50 border-brand-500 text-brand-900 dark:bg-brand-500/20 dark:border-brand-400 dark:text-white font-medium shadow-sm"
                            : "bg-white border-transparent hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/60 dark:text-gray-200"
                        }`}
                      >
                        <div className="flex-1 pr-2 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{s.nama}</span>
                            {s.npsn && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                NPSN: {s.npsn}
                              </span>
                            )}
                          </div>
                          {s.alamat_jalan && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              📍 {s.alamat_jalan}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs shrink-0 font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex justify-between items-center mt-1.5 text-xs text-gray-400 px-1">
                <span>Ditemukan: {filteredSekolahList.length} sekolah</span>
                {selectedSekolahId && (
                  <span className="text-brand-600 dark:text-brand-400 font-semibold">
                    ✓ Sekolah Terpilih
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Batal
              </Button>
              <Button
                disabled={switchLoading || !selectedSekolahId}
                type="submit"
                className="w-full"
              >
                {switchLoading ? "Memproses..." : "Masuk Sekolah"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
