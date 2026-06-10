import React from "react";
import { Modal } from "../ui/modal";
import { PrinterIcon } from "../../icons";
import { QRCodeSVG } from "qrcode.react";

interface GTKCardData {
  ptk_id: string;
  nama: string;
  avatar: string;
  nuptk: string;
  jabatan: string;
  jenis: "Guru" | "Tendik";
  qr_token?: string;
}

interface PrintGTKCardPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  person: GTKCardData | null;
}

const PrintGTKCardPreview: React.FC<PrintGTKCardPreviewProps> = ({ isOpen, onClose, person }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!person) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-0 overflow-hidden">
      {/* Header Modal - Hidden during print */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.05] print:hidden bg-white dark:bg-gray-900">
        <div>
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Print Preview Kartu ID GTK
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
            Cetak
          </button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="p-10 flex justify-center bg-gray-50 dark:bg-gray-900/50 print:p-0 print:bg-white">
        <div 
          className="id-card-vertical relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg print:shadow-none print:border print:border-gray-300"
          style={{ 
            width: '5.5cm', 
            height: '8.5cm'
          }}
        >
          {/* Vertical Card Header */}
          <div className="h-24 bg-brand-500 flex flex-col items-center justify-center p-4 text-center">
            <img src="/images/logo/logo-icon.svg" alt="Logo" className="w-10 h-10 brightness-0 invert mb-1" />
            <h5 className="text-[10px] font-bold text-white uppercase leading-tight">Kartu Identitas {person.jenis}</h5>
            <p className="text-[8px] text-white/90 uppercase tracking-tighter">SMK SIMAK INDONESIA</p>
          </div>

          {/* Photo Area */}
          <div className="flex justify-center -mt-8 relative z-10">
            <div className="w-24 h-32 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-full h-full overflow-hidden rounded-md flex items-center justify-center bg-gray-50">
                    <img src={person.avatar} alt={person.nama} className="w-full h-full object-cover" />
                </div>
            </div>
          </div>

          {/* Details Area */}
          <div className="px-4 py-4 space-y-3 text-center">
            <div>
              <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1">Nama Lengkap</p>
              <p className="text-[11px] font-extrabold text-gray-800 dark:text-white leading-tight uppercase line-clamp-2">{person.nama}</p>
            </div>

            <div className="space-y-2 border-t border-gray-100 dark:border-white/[0.05] pt-3">
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">NUPTK</p>
                <p className="text-[10px] font-bold text-gray-800 dark:text-white leading-none">{person.nuptk}</p>
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-bold mb-0.5">Jabatan</p>
                <p className="text-[10px] font-bold text-gray-800 dark:text-white leading-none uppercase">{person.jabatan}</p>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex justify-center pt-2">
              <div className="bg-white p-1 rounded border border-gray-100 shadow-sm">
                {person.qr_token || "" ? (
                  <QRCodeSVG value={person.qr_token || ""} size={42} />
                ) : (
                  <div className="w-[42px] h-[42px] flex items-center justify-center bg-gray-50 text-[6px] text-gray-400 border border-dashed rounded font-bold">
                     NO QR
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Footer Decoration */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500"></div>
          <div className="absolute bottom-2 left-0 w-full text-center">
            <p className="text-[7px] text-gray-300 italic font-medium tracking-tight">SIMAK Admin Panel System</p>
          </div>
        </div>
      </div>

      {/* Global CSS for printing this specific modal content */}
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
          [role="dialog"] {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: auto !important;
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

export default PrintGTKCardPreview;
