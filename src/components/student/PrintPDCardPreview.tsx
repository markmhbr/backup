import React from "react";
import { Modal } from "../ui/modal";
import { PrinterIcon } from "../../icons";

interface Student {
  id: number;
  nama: string;
  avatar: string;
  nisn: string;
  nipd: string;
  jk: "L" | "P";
}

const dummyStudents: Student[] = [
  { id: 1, nama: "Aditya Pratama", avatar: "/images/user/user-01.jpg", nisn: "0012345678", nipd: "1001", jk: "L" },
  { id: 2, nama: "Bella Safira", avatar: "/images/user/user-02.jpg", nisn: "0012345679", nipd: "1002", jk: "P" },
  { id: 3, nama: "Candra Wijaya", avatar: "/images/user/user-03.jpg", nisn: "0012345680", nipd: "1003", jk: "L" },
  { id: 4, nama: "Dian Pelangi", avatar: "/images/user/user-04.jpg", nisn: "0012345681", nipd: "1004", jk: "P" },
  { id: 5, nama: "Erlangga Putra", avatar: "/images/user/user-05.jpg", nisn: "0012345682", nipd: "1005", jk: "L" },
  { id: 6, nama: "Fania Rahma", avatar: "/images/user/user-06.jpg", nisn: "0012345683", nipd: "1006", jk: "P" },
  { id: 7, nama: "Gilang Dirga", avatar: "/images/user/user-07.jpg", nisn: "0012345684", nipd: "1007", jk: "L" },
  { id: 8, nama: "Hana Hanifah", avatar: "/images/user/user-08.jpg", nisn: "0012345685", nipd: "1008", jk: "P" },
];

interface PrintPDCardPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  rombelName: string;
}

const PrintPDCardPreview: React.FC<PrintPDCardPreviewProps> = ({ isOpen, onClose, rombelName }) => {
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            <PrinterIcon className="w-4 h-4" />
            Cetak Sekarang
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="p-8 bg-gray-50 dark:bg-gray-900/50 max-h-[75vh] overflow-y-auto custom-scrollbar print:p-0 print:bg-white print:overflow-visible print:max-h-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center print:grid-cols-3 print:gap-4">
          {dummyStudents.map((student) => (
            <div 
              key={student.id} 
              className="id-card-vertical relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-md print:shadow-none print:border print:border-gray-300"
              style={{ 
                width: '5.5cm', 
                height: '8.5cm',
                pageBreakInside: 'avoid'
              }}
            >
              {/* Vertical Card Header */}
              <div className="h-20 bg-brand-500 flex flex-col items-center justify-center p-2 text-center">
                <img src="/images/logo/logo-icon.svg" alt="Logo" className="w-8 h-8 brightness-0 invert mb-1" />
                <h5 className="text-[10px] font-bold text-white uppercase leading-tight">Kartu Pelajar</h5>
                <p className="text-[7px] text-white/90 uppercase tracking-tighter">SMK SIMAK INDONESIA</p>
              </div>

              {/* Photo Area */}
              <div className="flex justify-center -mt-6 relative z-10">
                <div className="w-20 h-24 bg-white dark:bg-gray-800 p-0.5 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="w-full h-full overflow-hidden rounded flex items-center justify-center bg-gray-50">
                        <img src={student.avatar} alt={student.nama} className="w-full h-full object-cover" />
                    </div>
                </div>
              </div>

              {/* Class Badge */}
              <div className="flex justify-center mt-2">
                <span className="px-2 py-0 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-[8px] font-bold uppercase border border-brand-100 dark:border-brand-500/20">
                    {rombelName}
                </span>
              </div>

              {/* Details Area */}
              <div className="px-3 py-3 space-y-2 text-center">
                <div>
                  <p className="text-[7px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1">Nama Lengkap</p>
                  <p className="text-[10px] font-extrabold text-gray-800 dark:text-white leading-tight uppercase line-clamp-2">{student.nama}</p>
                </div>

                <div className="grid grid-cols-2 border-t border-gray-100 dark:border-white/[0.05] pt-2 gap-2">
                  <div>
                    <p className="text-[7px] text-gray-400 uppercase font-bold mb-0.5">NISN</p>
                    <p className="text-[9px] font-bold text-gray-800 dark:text-white leading-none">{student.nisn}</p>
                  </div>
                  <div>
                    <p className="text-[7px] text-gray-400 uppercase font-bold mb-0.5">NIPD</p>
                    <p className="text-[9px] font-bold text-gray-800 dark:text-white leading-none">{student.nipd}</p>
                  </div>
                </div>
                
                <div className="pt-1">
                    <p className="text-[7px] text-gray-400 uppercase font-bold mb-0.5">Jenis Kelamin</p>
                    <p className="text-[9px] font-bold text-gray-800 dark:text-white leading-none">{student.jk === "L" ? "Laki-laki" : "Perempuan"}</p>
                </div>
              </div>

              {/* Card Footer Decoration */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500"></div>
              <div className="absolute bottom-1.5 left-0 w-full text-center">
                <p className="text-[6px] text-gray-300 italic font-medium tracking-tight">Berlaku selama menjadi siswa aktif</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .modal-backdrop {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .modal-content, .print-content, .print-content * {
            visibility: visible !important;
          }
          .print-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          [role="dialog"] {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />
    </Modal>
  );
};

export default PrintPDCardPreview;
