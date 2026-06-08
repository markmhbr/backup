import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import { GTK } from "../../data/gtkData";

interface EditGTKModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: number[];
  allData: GTK[];
}

const EditGTKModal: React.FC<EditGTKModalProps> = ({ isOpen, onClose, selectedIds, allData }) => {
  const [activeTab, setActiveTab] = useState("Profil");
  const [formData, setFormData] = useState<Partial<GTK>>({});

  const tabs = [
    "Profil",
    "Alamat",
    "Kepegawaian",
    "Pendidikan",
    "Kompetensi",
    "Kontak",
    "Serdik",
    "Dokumen",
  ];

  // Populate data based on selection
  useEffect(() => {
    if (isOpen && selectedIds.length > 0) {
      const selectedRecord = allData.find(item => item.id === selectedIds[0]);
      if (selectedRecord) {
        setFormData(selectedRecord);
      } else {
        setFormData({});
      }
    }
  }, [isOpen, selectedIds, allData]);

  const handleInputChange = (field: keyof GTK, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Logic to save changes
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] p-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Ubah Data Guru {selectedIds.length === 1 ? `- ${formData.nama}` : `(${selectedIds.length} Data)`}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lengkapi informasi detail guru di bawah ini.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-brand-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {activeTab === "Profil" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input 
                value={formData.nama || ""} 
                onChange={(e) => handleInputChange("nama", e.target.value)}
                placeholder="Masukkan nama lengkap" 
              />
            </div>
            <div className="space-y-2">
              <Label>NUPTK</Label>
              <Input 
                value={formData.nuptk || ""} 
                onChange={(e) => handleInputChange("nuptk", e.target.value)}
                placeholder="Masukkan NUPTK" 
              />
            </div>
            <div className="space-y-2">
              <Label>Tempat Lahir</Label>
              <Input 
                value={formData.tempatLahir || ""} 
                onChange={(e) => handleInputChange("tempatLahir", e.target.value)}
                placeholder="Masukkan tempat lahir" 
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Lahir</Label>
              <Input 
                type="date" 
                value={formData.tanggalLahir || ""} 
                onChange={(e) => handleInputChange("tanggalLahir", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>
              <Select 
                value={formData.jk}
                options={[
                    { value: "L", label: "Laki-laki" },
                    { value: "P", label: "Perempuan" }
                ]} 
                onChange={(val) => handleInputChange("jk", val)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ibu Kandung</Label>
              <Input 
                value={formData.ibuKandung || ""} 
                onChange={(e) => handleInputChange("ibuKandung", e.target.value)}
                placeholder="Nama ibu kandung" 
              />
            </div>
          </div>
        )}

        {activeTab === "Alamat" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alamat Jalan</Label>
              <Input 
                value={formData.alamat || ""} 
                onChange={(e) => handleInputChange("alamat", e.target.value)}
                placeholder="Jl. Raya No. XX" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>RT / RW</Label>
                    <Input 
                        value={formData.rtRw || ""} 
                        onChange={(e) => handleInputChange("rtRw", e.target.value)}
                        placeholder="00/00" 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Kode Pos</Label>
                    <Input 
                        value={formData.kodePos || ""} 
                        onChange={(e) => handleInputChange("kodePos", e.target.value)}
                        placeholder="12345" 
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Kecamatan</Label>
                    <Input 
                        value={formData.kecamatan || ""} 
                        onChange={(e) => handleInputChange("kecamatan", e.target.value)}
                        placeholder="Nama kecamatan" 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Kota / Kabupaten</Label>
                    <Input 
                        value={formData.kotaKabupaten || ""} 
                        onChange={(e) => handleInputChange("kotaKabupaten", e.target.value)}
                        placeholder="Nama kota/kabupaten" 
                    />
                </div>
            </div>
          </div>
        )}

        {activeTab === "Kepegawaian" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status Kepegawaian</Label>
              <Select 
                value={formData.statusKepegawaian}
                options={[
                    { value: "PNS", label: "PNS" },
                    { value: "PPPK", label: "PPPK" },
                    { value: "Honorer", label: "Honorer" }
                ]} 
                onChange={(val) => handleInputChange("statusKepegawaian", val)}
              />
            </div>
            <div className="space-y-2">
              <Label>Jenis GTK</Label>
              <Input 
                value={formData.jenisGTK || ""} 
                onChange={(e) => handleInputChange("jenisGTK", e.target.value)}
                placeholder="Contoh: Guru Mapel" 
              />
            </div>
            <div className="space-y-2">
              <Label>Pangkat / Golongan</Label>
              <Input 
                value={formData.pangkatGolongan || ""} 
                onChange={(e) => handleInputChange("pangkatGolongan", e.target.value)}
                placeholder="Contoh: III/a" 
              />
            </div>
            <div className="space-y-2">
              <Label>TMT Pengangkatan</Label>
              <Input 
                type="date" 
                value={formData.tmtPengangkatan || ""} 
                onChange={(e) => handleInputChange("tmtPengangkatan", e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === "Pendidikan" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Pendidikan Terakhir</Label>
                    <Select 
                        value={formData.pendidikanTerakhir}
                        options={[
                            { value: "S2", label: "S2/Pasca Sarjana" },
                            { value: "S1", label: "S1/Sarjana" },
                            { value: "D3", label: "D3/Diploma" }
                        ]} 
                        onChange={(val) => handleInputChange("pendidikanTerakhir", val)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Program Studi</Label>
                    <Input 
                        value={formData.programStudi || ""} 
                        onChange={(e) => handleInputChange("programStudi", e.target.value)}
                        placeholder="Contoh: Pendidikan Informatika" 
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Nama Perguruan Tinggi</Label>
                <Input 
                    value={formData.perguruanTinggi || ""} 
                    onChange={(e) => handleInputChange("perguruanTinggi", e.target.value)}
                    placeholder="Nama Universitas" 
                />
            </div>
          </div>
        )}

        {activeTab === "Kompetensi" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-10">
                Fitur pengelolaan kompetensi sedang dikembangkan.
            </p>
          </div>
        )}

        {activeTab === "Kontak" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor HP / WhatsApp</Label>
              <Input 
                value={formData.noHp || ""} 
                onChange={(e) => handleInputChange("noHp", e.target.value)}
                placeholder="0812XXXXXXXX" 
              />
            </div>
            <div className="space-y-2">
              <Label>Email Pribadi</Label>
              <Input 
                type="email" 
                value={formData.email || ""} 
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="nama@email.com" 
              />
            </div>
          </div>
        )}

        {activeTab === "Serdik" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Sertifikat Pendidik</Label>
              <Input 
                value={formData.noSerdik || ""} 
                onChange={(e) => handleInputChange("noSerdik", e.target.value)}
                placeholder="Masukkan nomor sertifikat" 
              />
            </div>
            <div className="space-y-2">
              <Label>Bidang Studi Sertifikasi</Label>
              <Input 
                value={formData.bidangStudiSerdik || ""} 
                onChange={(e) => handleInputChange("bidangStudiSerdik", e.target.value)}
                placeholder="Masukkan bidang studi" 
              />
            </div>
          </div>
        )}

        {activeTab === "Dokumen" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-10 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Klik untuk unggah dokumen pendukung (KTP, Ijazah, SK)
                </p>
                <Button variant="outline" size="sm" className="mt-4">Pilih File</Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.05] flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          Batal
        </button>
        <Button onClick={handleSave}>Simpan Perubahan</Button>
      </div>
    </Modal>
  );
};

export default EditGTKModal;
