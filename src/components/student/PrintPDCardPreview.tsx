import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  rombelId?: string;
  rombelName?: string;
  student?: Student;
}

const PrintPDCardPreview: React.FC<PrintPDCardPreviewProps> = ({ isOpen, onClose, rombelId, student }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1.2);
  const [backgroundPd, setBackgroundPd] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1.2);
      setPosition({ x: 0, y: 0 });
      const fetchSettings = async () => {
        try {
          const sch = await dapodikService.getSekolah();
          if (sch?.status === "success" && sch.data?.sekolah_id) {
            const settings = await dapodikService.getPengaturanUmum(sch.data.sekolah_id);
            if (settings?.status === "success" && settings.data?.background_pd) {
              setBackgroundPd(settings.data.background_pd);
            }
          }
        } catch (e) {
          console.error("Gagal memuat background kartu PD:", e);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (student) {
        setStudents([student]);
      } else if (rombelId) {
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
    }
  }, [isOpen, rombelId, student]);

  useEffect(() => {
    // Only auto-print for batch print (rombelId is active, student is not passed)
    if (!loading && students.length > 0 && isOpen && !student) {
      const timer = setTimeout(() => {
        window.print();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, students, isOpen, onClose, student]);

  if (!isOpen) return null;

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 0.08;
    if (e.deltaY < 0) {
      setScale(s => Math.min(3.5, s + zoomFactor));
    } else {
      setScale(s => Math.max(0.5, s - zoomFactor));
    }
  };

  // Touch handlers for mobile pan & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      setScale(s => Math.max(0.5, Math.min(3.5, s * (factor > 1 ? 1.03 : 0.97))));
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  // Single student mode: Render interactive modal on screen, print block hidden on screen
  if (student && students.length === 1) {
    const singleStudent = students[0];
    return createPortal(
      <>
        {/* On-screen Preview Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 no-print select-none">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-955 dark:text-white">
                Preview Kartu ID - {singleStudent.nama}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Zoom & Action Controls */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-650 transition-colors text-xs font-bold"
                >
                  -
                </button>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button 
                  onClick={() => setScale(s => Math.min(3.5, s + 0.2))}
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-650 transition-colors text-xs font-bold"
                >
                  +
                </button>
                <button 
                  onClick={() => { setScale(1.2); setPosition({ x: 0, y: 0 }); }}
                  className="px-2 py-1.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-650 transition-colors text-xs"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak
              </button>
            </div>

            {/* Interactive Preview Canvas */}
            <div 
              className="flex-1 overflow-hidden p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-950 relative cursor-grab active:cursor-grabbing min-h-[480px]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
                  transformOrigin: 'center', 
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out' 
                }}
                className="shadow-2xl rounded-2xl overflow-hidden pointer-events-none"
              >
                {/* Larger on-screen base card width/height */}
                <div 
                  className="relative bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 gap-6"
                  style={{ 
                    width: '320px', 
                    height: '490px',
                    backgroundImage: backgroundPd ? `url(${backgroundPd})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Photo Area */}
                  <div 
                    className="w-28 h-28 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden"
                    style={{
                      backgroundImage: `url(${getFotoUrl(singleStudent.foto)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />

                  {/* Nama & NISN */}
                  <div className="text-center px-2 w-full">
                    <p className="text-[17px] font-bold text-gray-900 dark:text-white uppercase leading-tight mb-2 line-clamp-2" title={singleStudent.nama}>
                      {singleStudent.nama}
                    </p>
                    <p className="text-[14px] font-black text-gray-550 dark:text-gray-400 leading-none">
                      {singleStudent.nisn || "-"}
                    </p>
                  </div>
                  
                  {/* QR Code Section */}
                  <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-md">
                    {singleStudent.qr_token ? (
                      <QRCodeSVG 
                        value={singleStudent.qr_token} 
                        size={120} 
                        level="M" 
                        includeMargin={false}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                      />
                    ) : (
                      <div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-50 text-[10px] text-gray-400 border border-dashed rounded-lg font-bold uppercase">
                         No Token
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Micro hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full pointer-events-none">
                Gunakan scroll / pinch untuk zoom. Seret untuk menggeser.
              </div>
            </div>
          </div>
        </div>

        {/* Printable Area (Only visible during print) */}
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[99999]">
          <div className="id-card-print-area print:p-0 print:bg-white flex justify-center items-center h-full">
            <div 
              className="id-card-vertical relative bg-white border border-gray-400 rounded-xl overflow-hidden flex flex-col items-center justify-center p-3 gap-3"
              style={{ 
                width: '5.5cm', 
                height: '8.5cm',
                backgroundImage: backgroundPd ? `url(${backgroundPd})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Photo Area */}
              <div 
                className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-full overflow-hidden print-avatar"
                style={{
                  backgroundImage: `url(${getFotoUrl(singleStudent.foto)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />

              {/* Nama & NISN */}
              <div className="text-center px-2 w-full">
                <p className="text-[11px] font-bold text-gray-900 uppercase leading-tight mb-1 line-clamp-2" title={singleStudent.nama}>
                  {singleStudent.nama}
                </p>
                <p className="text-[12px] font-black text-gray-500 leading-none">
                  {singleStudent.nisn || "-"}
                </p>
              </div>

              {/* QR Code Section */}
              <div className="bg-white p-1 rounded border border-gray-200 shadow-sm">
                {singleStudent.qr_token ? (
                  <QRCodeSVG 
                    value={singleStudent.qr_token} 
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
        </div>
      </>,
      document.body
    );
  }

  // Batch / Class Print Mode (Classic portal implementation)
  return createPortal(
    <div className="modal fixed left-[-9999px] top-0 opacity-0 pointer-events-none print:opacity-100 print:left-0 print:relative print:w-full print:h-auto print:block">
      <div className="id-card-preview-container id-card-print-area print:p-0 print:bg-white print:overflow-visible print:max-h-none">
        {students.length > 0 && (
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
                        pageBreakInside: 'avoid',
                        backgroundImage: backgroundPd ? `url(${backgroundPd})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {/* Photo Area */}
                      <div 
                        className="w-20 h-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full overflow-hidden print-avatar"
                        style={{
                          backgroundImage: `url(${getFotoUrl(student.foto)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />

                      {/* Nama & NISN */}
                      <div className="text-center px-2 w-full">
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase leading-tight mb-1 line-clamp-2" title={student.nama}>
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
        )}
      </div>
    </div>,
    document.body
  );
};

export default PrintPDCardPreview;
