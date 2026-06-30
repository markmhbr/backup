import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { dapodikService } from "../../services/dapodikService";
import { QRCodeSVG } from "qrcode.react";

interface GTKCardData {
  ptk_id: string;
  nama: string;
  foto?: string;
  nuptk: string;
  nik?: string;
  jabatan_ptk_id_str?: string;
  jenis_ptk_id_str?: string;
  qr_token?: string;
}

interface PrintAllGTKCardsProps {
  isOpen: boolean;
  onClose: () => void;
  type: "guru" | "tendik";
}

const PrintAllGTKCards: React.FC<PrintAllGTKCardsProps> = ({ isOpen, onClose, type }) => {
  const [personList, setPersonList] = useState<GTKCardData[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (isOpen) {
      const fetchAllGTK = async () => {
        try {
          setLoading(true);
          const result = await dapodikService.getGTK(999, "", 1, type);
          if (result && result.status === "success" && result.data) {
            setPersonList(result.data);
          } else {
            setPersonList([]);
          }
        } catch (error) {
          console.error("Gagal memuat data GTK untuk cetak masal:", error);
          setPersonList([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAllGTK();
    }
  }, [isOpen, type]);

  useEffect(() => {
    if (!loading && personList.length > 0 && isOpen) {
      const timer = setTimeout(() => {
        window.print();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, personList, isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal fixed left-[-9999px] top-0 opacity-0 pointer-events-none print:opacity-100 print:left-0 print:relative print:w-full print:h-auto print:block">
      <div className="id-card-preview-container id-card-print-area print:p-0 print:bg-white print:overflow-visible print:max-h-none">
        {personList.length > 0 && (
          <div className="flex flex-col gap-8 print:gap-0">
            {(() => {
              const chunks = [];
              for (let i = 0; i < personList.length; i += 9) {
                chunks.push(personList.slice(i, i + 9));
              }
              return chunks.map((pagePersons, pageIndex) => (
                <div 
                  key={pageIndex}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center print-page print:grid-cols-3"
                >
                  {pagePersons.map((person) => {
                    const avatarUrl = person.foto 
                      ? (person.foto.startsWith("http") || person.foto.startsWith("data:")
                          ? person.foto 
                          : `${import.meta.env.VITE_API_URL || ""}/uploads/foto/${person.foto}`)
                      : "/images/default/profile.jpg";

                    return (
                      <div 
                        key={person.ptk_id} 
                        className="id-card-vertical relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl overflow-hidden print:shadow-none print:border print:border-gray-400 flex flex-col items-center justify-center p-3 gap-3"
                        style={{ 
                          width: '5.5cm', 
                          height: '8.5cm',
                          pageBreakInside: 'avoid',
                          backgroundImage: backgroundGtk ? `url(${backgroundGtk})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Photo Area */}
                        <div 
                          className="w-20 h-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden print-avatar"
                          style={{
                            backgroundImage: `url(${avatarUrl})`,
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
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PrintAllGTKCards;
