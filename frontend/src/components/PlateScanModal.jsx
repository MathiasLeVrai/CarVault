import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ScanLine, RotateCcw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

// Extract French license plate from OCR text
function extractPlate(raw) {
  const text = raw.toUpperCase().replace(/[^A-Z0-9\-\s]/g, '');
  // New format: AB-123-CD (since 2009)
  const newFmt = text.match(/[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}/);
  if (newFmt) {
    const p = newFmt[0].replace(/\s/g, '-').replace(/-{2,}/g, '-');
    const parts = p.replace(/-/g, '').match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
    if (parts) return `${parts[1]}-${parts[2]}-${parts[3]}`;
  }
  // Old format: 123 ABC 75
  const oldFmt = text.match(/\d{1,4}[-\s]?[A-Z]{2,3}[-\s]?\d{2}/);
  if (oldFmt) return oldFmt[0].replace(/\s/g, ' ').trim();
  return null;
}

const SCAN_STATES = {
  IDLE: 'idle',         // camera on, waiting for scan
  SCANNING: 'scanning', // Tesseract running
  FOUND: 'found',       // plate detected
  NOT_FOUND: 'notfound', // no plate in image
};

export default function PlateScanModal({ onPlateFound, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [state, setState] = useState(SCAN_STATES.IDLE);
  const [plate, setPlate] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
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
      if (err.name === 'NotAllowedError') {
        setCameraError("Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur.");
      } else if (err.name === 'NotFoundError') {
        setCameraError("Aucune caméra détectée sur cet appareil.");
      } else {
        setCameraError("Impossible d'accéder à la caméra.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
    setState(SCAN_STATES.SCANNING);
    setScanProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Crop to the scan zone (center 80% width, middle 30% height)
    const zoneW = canvas.width * 0.8;
    const zoneH = canvas.height * 0.35;
    const zoneX = (canvas.width - zoneW) / 2;
    const zoneY = (canvas.height - zoneH) / 2;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = zoneW;
    cropCanvas.height = zoneH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, zoneX, zoneY, zoneW, zoneH, 0, 0, zoneW, zoneH);

    // Enhance contrast for better OCR
    const imageData = cropCtx.getImageData(0, 0, zoneW, zoneH);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale + increase contrast
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
      data[i] = enhanced; data[i+1] = enhanced; data[i+2] = enhanced;
    }
    cropCtx.putImageData(imageData, 0, 0);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('fra', 1, {
        logger: m => {
          if (m.status === 'recognizing text') setScanProgress(Math.round(m.progress * 100));
        },
      });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
        tessedit_pageseg_mode: '6',
      });
      const { data: { text } } = await worker.recognize(cropCanvas);
      await worker.terminate();

      const found = extractPlate(text);
      if (found) {
        setPlate(found);
        setState(SCAN_STATES.FOUND);
      } else {
        setState(SCAN_STATES.NOT_FOUND);
      }
    } catch {
      setState(SCAN_STATES.NOT_FOUND);
    }
  }, [cameraReady]);

  const reset = () => {
    setState(SCAN_STATES.IDLE);
    setPlate('');
    setScanProgress(0);
  };

  const confirm = () => {
    stopCamera();
    onPlateFound(plate);
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
        <div className="flex items-center justify-between px-4 pt-safe py-4 z-10 relative">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent" />
            <span className="text-sm font-bold text-white">Scanner une plaque</span>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Camera view */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline muted autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Dark overlay with hole */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.5) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.4) 100%)',
          }} />

          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-white font-semibold text-sm">{cameraError}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Scan zone frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative" style={{ width: '80%', height: '22%' }}>
                  {/* Corner markers */}
                  {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'],
                    ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, border]) => (
                    <div key={pos} className={`absolute ${pos} w-6 h-6 ${border} border-accent`} />
                  ))}

                  {/* Scanning line animation */}
                  {state === SCAN_STATES.SCANNING && (
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_8px_rgba(255,42,63,0.8)]"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  )}

                  {/* State overlay inside scan zone */}
                  {state === SCAN_STATES.FOUND && (
                    <div className="absolute inset-0 flex items-center justify-center bg-lime/20 border border-lime/40 rounded-sm">
                      <span className="text-xl font-black font-mono text-white tracking-widest">{plate}</span>
                    </div>
                  )}
                  {state === SCAN_STATES.NOT_FOUND && (
                    <div className="absolute inset-0 flex items-center justify-center bg-accent/10 border border-accent/30 rounded-sm">
                      <span className="text-xs font-semibold text-accent">Plaque non détectée</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hint */}
              {state === SCAN_STATES.IDLE && cameraReady && (
                <div className="absolute top-[68%] left-0 right-0 text-center">
                  <p className="text-xs text-white/60 font-medium">Centrez la plaque dans le cadre</p>
                </div>
              )}

              {/* Loading state */}
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom controls */}
        <div className="px-6 py-6 flex flex-col items-center gap-4 relative z-10">
          {state === SCAN_STATES.SCANNING && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-accent animate-pulse" />
                  <span className="text-xs font-semibold text-white/70">Analyse en cours…</span>
                </div>
                <span className="text-xs font-bold text-accent">{scanProgress}%</span>
              </div>
              <div className="cv-progress-track">
                <div className="cv-progress-fill bg-accent transition-all duration-300" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          )}

          {state === SCAN_STATES.FOUND && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-center gap-3 py-3 rounded-xl bg-lime/10 border border-lime/20">
                <CheckCircle2 className="w-5 h-5 text-lime" />
                <span className="text-lg font-black font-mono text-white tracking-widest">{plate}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={reset}
                  className="flex-1 py-3 rounded-xl cv-btn-dark text-sm font-semibold flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Rescanner
                </button>
                <button onClick={confirm}
                  className="flex-1 py-3 rounded-xl cv-btn-accent text-sm font-bold flex items-center justify-center gap-2">
                  Utiliser cette plaque
                </button>
              </div>
            </div>
          )}

          {state === SCAN_STATES.NOT_FOUND && (
            <div className="w-full space-y-3">
              <p className="text-center text-sm text-white/50 font-medium">
                Plaque non détectée — repositionnez et réessayez
              </p>
              <button onClick={reset}
                className="w-full py-3 rounded-xl cv-btn-accent text-sm font-bold flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Réessayer
              </button>
            </div>
          )}

          {state === SCAN_STATES.IDLE && (
            <button
              onClick={captureAndScan}
              disabled={!cameraReady || !!cameraError}
              className="w-16 h-16 rounded-full bg-accent shadow-[0_0_32px_rgba(255,42,63,0.5)] flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              <Camera className="w-7 h-7 text-white" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
