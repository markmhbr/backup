import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
  disableFlip?: boolean;
}

const QrScanner: React.FC<QrScannerProps> = ({
  onScanSuccess,
  onScanError,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = "qr-reader";

  useEffect(() => {
    // Inisialisasi scanner
    scannerRef.current = new Html5QrcodeScanner(
      containerId,
      {
        fps,
        qrbox,
        aspectRatio,
        disableFlip,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        if (onScanError) onScanError(errorMessage);
      }
    );

    // Cleanup saat component unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error("Failed to clear html5QrcodeScanner", error);
        });
      }
    };
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div id={containerId} className="w-full"></div>
      <style>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader__scan_region {
          background: #f8fafc;
        }
        .dark #qr-reader__scan_region {
          background: #0f172a;
        }
        #qr-reader__dashboard_section_csr button {
          background-color: #4f46e5;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          margin: 10px 0;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        #qr-reader__dashboard_section_csr button:hover {
          background-color: #4338ca;
        }
        #qr-reader__camera_selection {
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background-color: white;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .dark #qr-reader__camera_selection {
          background-color: #1e293b;
          border-color: #334155;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default QrScanner;
