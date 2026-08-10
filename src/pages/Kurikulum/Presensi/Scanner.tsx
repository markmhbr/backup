import React, { useState, useEffect, useRef } from "react";
import PageMeta from "../../../components/common/PageMeta";
import { presensiService } from "../../../services/presensiService";
import { dapodikService } from "../../../services/dapodikService";
import ComponentCard from "../../../components/common/ComponentCard";
import QrScanner from "./components/QrScanner";
import Swal from "sweetalert2";
import { getFotoUrl } from "../../../utils/image";

const Scanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string, data?: any } | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem("presensi_voice_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Face ID Scanner States
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [faceScanActive, setFaceScanActive] = useState(false);
  const [faceScanStatus, setFaceScanStatus] = useState("");
  const faceVideoRef = useRef<HTMLVideoElement>(null);
  const faceStreamRef = useRef<MediaStream | null>(null);
  const faceIntervalRef = useRef<any>(null);
  const faceScanCooldownRef = useRef(false);
  const faceProcessingRef = useRef(false);

  const startFaceScan = async () => {
    try {
      setFaceScanStatus("Mengaktifkan kamera...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      faceStreamRef.current = stream;
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
      }
      setFaceScanActive(true);
      setFaceScanStatus("Kamera aktif. Sedang mendeteksi wajah...");
      
      const faceApiUrl = `${import.meta.env.VITE_FACE_API_URL || "http://localhost:8000"}/analyze-face`;
      faceIntervalRef.current = setInterval(async () => {
        if (!faceVideoRef.current || loading || faceScanCooldownRef.current || faceProcessingRef.current) return;
        faceProcessingRef.current = true;
        const video = faceVideoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          faceProcessingRef.current = false;
          return;
        }
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            faceProcessingRef.current = false;
            return;
          }
          const formData = new FormData();
          formData.append("file", blob, "face_scan.jpg");

          try {
            const response = await fetch(faceApiUrl, {
              method: "POST",
              body: formData
            });
            const data = await response.json();
            if (data.success && data.embedding) {
              setFaceScanStatus("Wajah terdeteksi! Mengidentifikasi...");
              const identifyRes = await dapodikService.identifyFace(data.embedding);
              if (identifyRes && identifyRes.status === "success" && identifyRes.data && identifyRes.data.type) {
                const matchedUser = identifyRes.data.data;
                const qrToken = matchedUser.qr_token;
                
                if (qrToken) {
                  faceScanCooldownRef.current = true;
                  setFaceScanStatus("Wajah teridentifikasi! Mencatat kehadiran...");
                  await handleScan(qrToken);
                  setTimeout(() => {
                    faceScanCooldownRef.current = false;
                    setFaceScanStatus("Kamera aktif. Sedang mendeteksi wajah...");
                  }, 4000);
                } else {
                  setFaceScanStatus("Pengguna ditemukan tetapi belum memiliki QR Token.");
                }
              } else {
                setFaceScanStatus("Wajah tidak terdaftar atau tidak cocok.");
              }
            } else {
              setFaceScanStatus("Mencari wajah...");
            }
          } catch (err) {
            console.error("Face scan error:", err);
          } finally {
            faceProcessingRef.current = false;
          }
        }, "image/jpeg", 0.9);
      }, 1000);
    } catch (err) {
      console.error(err);
      setFaceScanStatus("Gagal mengakses kamera.");
    }
  };

  const stopFaceScan = () => {
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach(track => track.stop());
      faceStreamRef.current = null;
    }
    setFaceScanActive(false);
    setFaceScanStatus("Kamera dinonaktifkan.");
    faceScanCooldownRef.current = false;
    faceProcessingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (faceStreamRef.current) faceStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);


  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Browser tidak mendukung GPS/Geolocation");
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoError(null);
      },
      (err) => {
        let msg = "Gagal mengambil lokasi.";
        if (err.code === 1) msg = "Izin lokasi dilarang. Aktifkan GPS.";
        else if (err.code === 2) msg = "Lokasi tidak tersedia.";
        else if (err.code === 3) msg = "Waktu GPS habis.";
        setGeoError(msg);
      },
      geoOptions
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Konversi ke lowercase agar browser tidak mengeja nama kapital (ALL CAPS) sebagai singkatan/akronim
      const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
      utterance.lang = 'id-ID';
      
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.toLowerCase().includes('id'));
      if (idVoice) {
        utterance.voice = idVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceToggle = (checked: boolean) => {
    setVoiceEnabled(checked);
    localStorage.setItem("presensi_voice_enabled", String(checked));
  };

  const isProcessingRef = useRef(false);
  const lastScanRef = useRef<{ token: string; time: number } | null>(null);

  const handleScan = async (scannedToken: string) => {
    if (!scannedToken) return;

    const now = Date.now();

    // 1. Cegah pemrosesan scan ganda secara bersamaan
    if (isProcessingRef.current) return;

    // 2. Cegah re-scan token/kartu yang sama dalam rentang 5 detik
    if (
      lastScanRef.current &&
      lastScanRef.current.token === scannedToken &&
      now - lastScanRef.current.time < 5000
    ) {
      return;
    }

    // 3. Jeda/cooldown minimal 2.5 detik untuk scan kartu apapun setelah scan terakhir
    if (
      lastScanRef.current &&
      now - lastScanRef.current.time < 2500
    ) {
      return;
    }

    isProcessingRef.current = true;
    lastScanRef.current = { token: scannedToken, time: now };
    setLoading(true);
    setMessage(null);

    try {
      const response = await presensiService.scanAttendance(
        scannedToken,
        coords?.latitude,
        coords?.longitude
      );
      
      const isPD = !!response.peserta_didik;
      const profile = isPD ? response.peserta_didik : response.gtk;
      const roleName = isPD ? `Peserta Didik (${profile.nama_rombel || 'Tanpa Rombel'})` : `GTK (${profile.jenis_ptk_id_str || 'Staff'})`;
      
      const isCheckOut = !!response.jam_pulang;
      const timeLog = isCheckOut ? response.jam_pulang : response.jam_masuk;
      const timeString = new Date(timeLog).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const statusText = isCheckOut ? 'Pulang' : 'Masuk';
      
      const fotoUrl = getFotoUrl(profile.foto);
      
      // Speak success
      if (voiceEnabled) {
        speak(`${profile.nama}, berhasil presensi ${statusText.toLowerCase()}`);
      }

      // Show beautiful SweetAlert2 modal
      Swal.fire({
        title: isCheckOut ? 'Presensi Pulang Berhasil!' : 'Presensi Masuk Berhasil!',
        html: `
          <div class="flex flex-col items-center gap-4 mt-2">
            <div class="w-28 h-28 rounded-full overflow-hidden border-4 border-green-500 shadow-md">
              <img src="${fotoUrl}" alt="${profile.nama}" class="w-full h-full object-cover" onerror="this.src='/images/default/profile.jpg'" />
            </div>
            <div class="text-center">
              <h4 class="text-lg font-bold text-gray-800 dark:text-white/90">${profile.nama}</h4>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">${roleName}</p>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-3 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                Status: Hadir ${statusText} (${timeString} WIB)
              </div>
            </div>
          </div>
        `,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
      });

      setMessage({ 
        type: 'success', 
        text: `Berhasil mencatat kehadiran: ${profile.nama} (${statusText})`,
        data: response
      });
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Gagal mencatat kehadiran. QR Token tidak dikenal atau sekolah sedang libur.";
      const lowerMsg = errorMsg.toLowerCase();
      
      const isWarning = 
        lowerMsg.includes("belum saatnya presensi pulang") || 
        lowerMsg.includes("belum selesai") || 
        lowerMsg.includes("belum tiba") ||
        lowerMsg.includes("sudah melakukan presensi") ||
        lowerMsg.includes("sudah presensi") ||
        (lowerMsg.includes("presensi pulang") && lowerMsg.includes("belum")) ||
        (lowerMsg.includes("masuk") && lowerMsg.includes("sudah"));

      // Speak feedback
      if (voiceEnabled) {
        if (isWarning) {
          if (lowerMsg.includes("masuk dan pulang")) {
            speak("Anda sudah melakukan presensi masuk dan pulang hari ini");
          } else {
            speak("Anda sudah melakukan presensi masuk. Jam pulang belum selesai");
          }
        } else {
          speak("Presensi gagal");
        }
      }

      if (isWarning) {
        Swal.fire({
          title: 'Peringatan',
          text: errorMsg,
          icon: 'warning',
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true,
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
        });

        setMessage({ 
          type: 'warning', 
          text: errorMsg 
        });
      } else {
        Swal.fire({
          title: 'Presensi Gagal!',
          text: errorMsg,
          icon: 'error',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
        });

        setMessage({ 
          type: 'error', 
          text: errorMsg 
        });
      }
    } finally {
      // Tahan status loading & cooldown selama 2.5 detik sebelum siap menerima scan berikutnya
      setTimeout(() => {
        setLoading(false);
        isProcessingRef.current = false;
      }, 2500);
    }
  };

  return (
    <>
      <PageMeta
        title="Scanner Kehadiran | SIMAK"
        description="Scanner QR Code untuk kehadiran Peserta Didik dan GTK"
      />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Scanner Kehadiran
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gunakan kamera untuk melakukan presensi massal Peserta Didik dan GTK secara otomatis.
          </p>
          
          {/* GPS Status Indicator */}
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            {!coords && !geoError ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Mendeteksi Lokasi GPS...
              </span>
            ) : coords ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                GPS Aktif: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20" title={geoError || ""}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                GPS Error: {geoError}
              </span>
            )}
          </div>
        </div>

        {/* Voice Feedback Toggle */}
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/40 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Suara Presensi
            </span>
            <span className="text-[10px] text-gray-400">
              Sebut nama saat berhasil
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => handleVoiceToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title="Kamera Scanner">
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Pilih metode pencatatan kehadiran (Scan QR Card atau Scan Face ID).
          </p>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setShowFaceScanner(false);
                stopFaceScan();
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${!showFaceScanner
                ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Card (QR) Scanner
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFaceScanner(true);
                setTimeout(() => startFaceScan(), 100);
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${showFaceScanner
                ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Face ID Scanner
            </button>
          </div>
          
          <div className="relative">
            {!showFaceScanner ? (
              <QrScanner onScanSuccess={handleScan} />
            ) : (
              <div className="space-y-4">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-brand-500 bg-gray-900 shadow-md flex items-center justify-center">
                  <video 
                    ref={faceVideoRef} 
                    className={`w-full h-full object-cover transform scale-x-[-1] ${faceScanActive ? "block" : "hidden"}`} 
                    autoPlay 
                    playsInline 
                  />
                  {!faceScanActive && (
                    <div className="text-center p-4 text-xs text-gray-400">
                      Mengaktifkan kamera...
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-450">{faceScanStatus}</p>
                </div>
              </div>
            )}
            
            {loading && (
               <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 flex items-center justify-center backdrop-blur-[2px] rounded-xl z-10">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                  </div>
               </div>
            )}
          </div>
        </ComponentCard>

        <div className="flex flex-col gap-6">
          <ComponentCard title="Status Terakhir">
            <div className="min-h-[120px] flex flex-col justify-center">
              {message ? (
                <div className={`rounded-xl p-5 flex items-start gap-4 animate-fade-in ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-100 dark:border-green-500/20' 
                    : message.type === 'warning'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20'
                    : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20'
                }`}>
                  <div className="mt-0.5">
                    {message.type === 'success' ? (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    ) : message.type === 'warning' ? (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold">
                      {message.type === 'success' ? 'Berhasil' : message.type === 'warning' ? 'Peringatan' : 'Gagal'}
                    </p>
                    <p className="text-sm mt-1 leading-relaxed">{message.text}</p>
                    {message.data && (
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium opacity-70">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Waktu: {new Date(message.data.jam_masuk || message.data.jam_pulang).toLocaleTimeString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                   <p className="text-sm text-gray-400 italic">Menunggu hasil scan kartu...</p>
                </div>
              )}
            </div>
          </ComponentCard>

          <ComponentCard title="Informasi & Instruksi">
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-500 font-bold text-xs">1</span>
                </div>
                <span>Pastikan browser memiliki izin akses kamera. Pilih kamera yang paling jernih jika terdapat lebih dari satu pilihan.</span>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-500 font-bold text-xs">2</span>
                </div>
                <span>Scanner ini otomatis mengenali kartu Peserta Didik maupun GTK. Cukup arahkan barcode ke kotak hijau di layar.</span>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-500 font-bold text-xs">3</span>
                </div>
                <span>Jika belum presensi hari ini, status akan menjadi <b>Masuk</b>. Jika sudah, status otomatis menjadi <b>Pulang</b>.</span>
              </li>
            </ul>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default Scanner;

