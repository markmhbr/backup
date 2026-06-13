import React from "react";
import { Modal } from "../ui/modal";
import { PrinterIcon } from "../../icons";
import { QRCodeSVG } from "qrcode.react";

interface GTKCardData {
  ptk_id: string;
  nama: string;
  avatar: string;
  nuptk: string;
  nik?: string;
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
      <div className="id-card-print-area p-10 flex justify-center bg-gray-50 dark:bg-gray-900/50 print:p-0 print:bg-white">
        <div 
          className="id-card-vertical relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl overflow-hidden print:shadow-none print:border print:border-gray-400 flex flex-col items-center justify-center p-3 gap-3"
          style={{ 
            width: '5.5cm', 
            height: '8.5cm'
          }}
        >
          {/* Photo Area */}
          <div className="w-18 h-22 bg-gray-50 dark:bg-gray-800 p-0.5 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
            <img 
              src={person.avatar || "/images/default/profile.jpg"} 
              alt={person.nama} 
              className="w-full h-full object-cover rounded" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/default/profile.jpg";
              }}
            />
          </div>

          {/* Nama, Jabatan & NUPTK/NIK */}
          <div className="text-center px-2 w-full">
            <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase leading-tight mb-1 truncate" title={person.nama}>
              {person.nama}
            </p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-none mb-1">
              {person.jabatan || "-"}
            </p>
            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 leading-none">
              {person.nuptk ? `NUPTK: ${person.nuptk}` : `NIK: ${person.nik || "-"}`}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="bg-white p-1 rounded border border-gray-200 shadow-sm">
            {person.qr_token ? (
              <QRCodeSVG 
                value={person.qr_token} 
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
      </div>

      {/* Global CSS for printing this specific modal content */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .id-card-print-area, .id-card-print-area * {
            visibility: visible !important;
          }
          .id-card-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            justify-content: center !important;
          }
          .id-card-vertical {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: 1px solid #d1d5db !important;
          }
        }
      `}} />
    </Modal>
  );
};

export default PrintGTKCardPreview;
