import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { dapodikService } from "../../services/dapodikService";

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
  const [backgroundGtk, setBackgroundGtk] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const sch = await dapodikService.getSekolah();
          if (sch?.status === "success" && sch.data?.sekolah_id) {
            const settings = await dapodikService.getPengaturanUmum(sch.data.sekolah_id);
            if (settings?.status === "success" && settings.data?.background_gtk) {
              setBackgroundGtk(settings.data.background_gtk);
            }
          }
        } catch (e) {
          console.error("Gagal memuat background kartu GTK:", e);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && person) {
      const timer = setTimeout(() => {
        window.print();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, person, onClose]);

  if (!person) return null;

  if (!isOpen) return null;

  return createPortal(
    <div className="modal fixed left-[-9999px] top-0 opacity-0 pointer-events-none print:opacity-100 print:left-0 print:relative print:w-full print:h-auto print:block">
      <div className="id-card-print-area print:p-0 print:bg-white flex justify-center">
        <div 
          className="id-card-vertical relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl overflow-hidden print:shadow-none print:border print:border-gray-400 flex flex-col items-center justify-center p-3 gap-3"
          style={{ 
            width: '5.5cm', 
            height: '8.5cm',
            backgroundImage: backgroundGtk ? `url(${backgroundGtk})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Photo Area */}
          <div 
            className="w-20 h-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden print-avatar"
            style={{
              backgroundImage: `url(${person.avatar || "/images/default/profile.jpg"})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />

          {/* Nama & NUPTK/NIK */}
          <div className="text-center px-2 w-full">
            <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase leading-tight mb-1 line-clamp-2" title={person.nama}>
              {person.nama}
            </p>
            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 leading-none">
              {person.nuptk ? person.nuptk : (person.nik || "-")}
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
    </div>,
    document.body
  );
};

export default PrintGTKCardPreview;
