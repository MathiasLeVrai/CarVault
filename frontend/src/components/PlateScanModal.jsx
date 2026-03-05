import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, CheckCircle2, Loader2, AlertCircle, ScanLine } from 'lucide-react';

// Extract French license plate from raw OCR text
function extractPlate(raw) {
  const text = raw.toUpperCase().replace(/[^A-Z0-9\-\s]/g, ' ');
  const newFmt = text.match(/[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}/);
  if (newFmt) {
    const clean = newFmt[0].replace(/[\s-]/g, '');
    const m = clean.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const oldFmt = text.match(/\d{1,4}[-\s]?[A-Z]{2,3}[-\s]?\d{2}/);
  if (oldFmt) return oldFmt[0].trim();
  return null;
}

function enhanceFrame(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  // Crop center 80% × 35%
  const zW = Math.round(w * 0.8);
  const zH = Math.round(h * 0.35);
  const zX = Math.round((w - zW) / 2);
  const zY = Math.round((h - zH) / 2);
  const crop = document.createElement('canvas');
  crop.width = zW; crop.height = zH;
  const cctx = crop.getContext('2d');
  cctx.drawImage(canvas, zX, zY, zW, zH, 0, 0, zW, zH);
  // Grayscale + contrast boost
  const img = cctx.getImageData(0, 0, zW, zH);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    const e = Math.min(255, Math.max(0, (g - 128) * 1.9 + 128));
    d[i] = e; d[i + 1] = e; d[i + 2] = e;
  }
  cctx.putImageData(img, 0, 0);
  return crop;
}

export default function PlateScanModal({ onPlateFound, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const scanningRef = useRef(false); // prevent overlapping scans
  const intervalRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [foundPlate, setFoundPlate] = useState(null); // null = scanning, string = found
  const [scanTick, setScanTick] = useState(0); // triggers the line animation

  // Init Tesseract worker once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { createWorker } = await import('tesseract.js');
      const w = await createWorker('fra', 1, { logger: () => {} });
      await w.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
        tessedit_pageseg_mode: '7', // single text line — faster
      });
      if (!cancelled) workerRef.current = w;
    })();
    return () => {
      cancelled = true;
      workerRef.current?.terminate();
    };
  }, []);

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraReady(true);
          };
        }
      } catch (err) {
        if (err.name === 'NotAllowedError') setCameraError("Accès caméra refusé.");
        else if (err.name === 'NotFoundError') setCameraError("Aucune caméra trouvée.");
        else setCameraError("Impossible d'accéder à la caméra.");
      }
    })();
    return () => stopCamera();
  }, [stopCamera]);

  // Continuous scan loop — fires every 1.5s once camera + worker are ready
  useEffect(() => {
    if (!cameraReady || foundPlate) return;

    intervalRef.current = setInterval(async () => {
      if (scanningRef.current || !workerRef.current || !videoRef.current || !canvasRef.current) return;
      if (foundPlate) return;

      scanningRef.current = true;
      setScanTick(t => t + 1); // pulse the scan line

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const crop = enhanceFrame(canvas);

      try {
        const { data: { text } } = await workerRef.current.recognize(crop);
        const plate = extractPlate(text);
        if (plate) {
          setFoundPlate(plate);
          clearInterval(intervalRef.current);
        }
      } catch { /* silent */ } finally {
        scanningRef.current = false;
      }
    }, 1500);

    return () => clearInterval(intervalRef.current);
  }, [cameraReady, foundPlate]);

  const reset = () => {
    setFoundPlate(null);
    scanningRef.current = false;
  };

  const confirm = () => {
    stopCamera();
    onPlateFound(foundPlate);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 z-10 relative">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-accent" />
            <span className="text-sm font-bold text-white">Scanner une plaque</span>
            {cameraReady && !foundPlate && !cameraError && (
              <span className="flex items-center gap-1.5 text-xs text-accent font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                En cours…
              </span>
            )}
          </div>
          <button onClick={() => { stopCamera(); onClose(); }}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Camera view */}
        <div className="flex-1 relative overflow-hidden">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
          <canvas ref={canvasRef} className="hidden" />

          {/* Vignette overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)',
          }} />

          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-white font-semibold text-sm">{cameraError}</p>
              </div>
            </div>
          ) : !cameraReady ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            /* Scan zone */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: '80%', height: '22%' }}>
                {/* Corner markers */}
                {[['top-0 left-0', 'border-t-2 border-l-2'],
                  ['top-0 right-0', 'border-t-2 border-r-2'],
                  ['bottom-0 left-0', 'border-b-2 border-l-2'],
                  ['bottom-0 right-0', 'border-b-2 border-r-2'],
                ].map(([pos, cls]) => (
                  <div key={pos} className={`absolute ${pos} w-7 h-7 ${cls} ${foundPlate ? 'border-lime' : 'border-accent'} transition-colors duration-300`} />
                ))}

                {/* Animated scan line — moves on each tick */}
                {!foundPlate && (
                  <motion.div
                    key={scanTick}
                    className="absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_10px_rgba(255,42,63,0.9)]"
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.4, ease: 'linear' }}
                  />
                )}

                {/* Found overlay */}
                {foundPlate && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-lime/20 border border-lime/50 rounded-sm backdrop-blur-sm"
                  >
                    <span className="text-2xl font-black font-mono text-white tracking-widest drop-shadow-lg">
                      {foundPlate}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Hint */}
              {!foundPlate && (
                <div className="absolute" style={{ top: 'calc(50% + 13%)' }}>
                  <p className="text-xs text-white/50 font-medium text-center">
                    Centrez la plaque dans le cadre
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          {foundPlate ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-3"
            >
              <div className="flex items-center justify-center gap-3 py-3.5 rounded-xl bg-lime/10 border border-lime/25">
                <CheckCircle2 className="w-5 h-5 text-lime flex-shrink-0" />
                <span className="text-xl font-black font-mono text-white tracking-widest">{foundPlate}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={reset}
                  className="flex-1 py-3.5 rounded-xl cv-btn-dark text-sm font-semibold flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Rescanner
                </button>
                <button onClick={confirm}
                  className="flex-1 py-3.5 rounded-xl cv-btn-accent text-sm font-bold flex items-center justify-center gap-2">
                  Utiliser cette plaque
                </button>
              </div>
            </motion.div>
          ) : (
            <p className="text-xs text-white/30 font-medium">
              Scan automatique actif — aucune action requise
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
