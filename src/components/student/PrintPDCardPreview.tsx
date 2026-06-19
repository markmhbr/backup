import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { PrinterIcon } from "../../icons";
import { dapodikService } from "../../services/dapodikService";
import { QRCodeSVG } from "qrcode.react";
import { getFotoUrl } from "../../utils/image";


interface Student {
  peserta_didik_id: string;
  nama: string;
  foto?: string;
  nisn: string;
  nipd: string;
  jenis_kelamin: "L" | "P";
  qr_token?: string;
}

interface PrintPDCardPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  rombelId: string;
  rombelName: string;
}

const PrintPDCardPreview: React.FC<PrintPDCardPreviewProps> = ({ isOpen, onClose, rombelId, rombelName }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && rombelId) {
      const fetchStudents = async () => {
        try {
          setLoading(true);
          const result = await dapodikService.getRombelAnggota(rombelId);
          if (result && result.data) {
            console.log("Anggota Rombel Loaded. Contoh Siswa:", result.data[0]);
            setStudents(result.data);
          } else {
            setStudents([]);
          }
        } catch (error) {
          console.error("Gagal memuat anggota rombel:", error);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      };

      fetchStudents();
    }
  }, [isOpen, rombelId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1000px] p-0 overflow-hidden">
      {/* Header Modal - Hidden during print */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.05] print:hidden bg-white dark:bg-gray-900">
        <div>
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Print Preview Kartu ID PD - {rombelName}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ukuran Standar 5.5cm x 8.5cm (Vertikal)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            <PrinterIcon className="w-4 h-4" />
            Cetak Sekarang
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="id-card-preview-container id-card-print-area p-8 bg-gray-50 dark:bg-gray-900/50 max-h-[75vh] overflow-y-auto custom-scrollbar print:p-0 print:bg-white print:overflow-visible print:max-h-none">
        {loading ? (
            <div className="flex justify-center py-20">
                <p className="text-gray-500 font-medium">Memuat data siswa...</p>
            </div>
        ) : students.length > 0 ? (
          <div className="flex flex-col gap-8 print:gap-0">
            {(() => {
              const chunks = [];
              for (let i = 0; i < students.length; i += 9) {
                chunks.push(students.slice(i, i + 9));
              }
              return chunks.map((pageStudents, pageIndex) => (
                <div 
                  key={pageIndex}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center print-page print:grid-cols-3"
                >
                  {pageStudents.map((student) => (
                    <div 
                      key={student.peserta_didik_id} 
                      className="id-card-vertical relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl overflow-hidden print:shadow-none print:border print:border-gray-400 flex flex-col items-center justify-center p-3 gap-3"
                      style={{ 
                        width: '5.5cm', 
                        height: '8.5cm',
                        pageBreakInside: 'avoid'
                      }}
                    >
                      {/* Photo Area */}
                      <div className="w-18 h-22 bg-gray-50 dark:bg-gray-800 p-0.5 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                        <img 
                          src={getFotoUrl(student.foto)} 
                          alt={student.nama} 
                          className="w-full h-full object-cover rounded" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/default/profile.jpg";
                          }}
                        />
                      </div>

                      {/* Nama & NISN */}
                      <div className="text-center px-2 w-full">
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase leading-tight mb-1 truncate" title={student.nama}>
                          {student.nama}
                        </p>
                        <p className="text-[12px] font-black text-gray-500 dark:text-gray-400 leading-none">
                          {student.nisn || "-"}
                        </p>
                      </div>
                      
                      {/* QR Code Section */}
                      <div className="bg-white p-1 rounded border border-gray-200 shadow-sm">
                        {student.qr_token ? (
                          <QRCodeSVG 
                            value={student.qr_token} 
                            size={96} 
                            level="M" 
                            includeMargin={false}
                            fgColor="#000000"
                            bgColor="#FFFFFF"
                          />
                        ) : (
                          <div className="w-[96px] h-[96px] flex items-center justify-center bg-gray-50 text-[6px] text-gray-400 border border-dashed rounded font-bold uppercase">
                             No Token
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        ) : (
            <div className="flex justify-center py-20">
                <p className="text-gray-500">Tidak ada data siswa dalam rombel ini.</p>
            </div>
        )}
      </div>

    </Modal>
  );
};

export default PrintPDCardPreview;
