import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CheckCircleFill as CheckCircle2, 
  ArrowRepeat as RefreshCw, 
  Image as ImageIcon,
  CheckLg as Check,
  Laptop,
  Check2Circle
} from 'react-bootstrap-icons';
import { 
  listenToCameraSession, 
  notifyPhoneConnected, 
  submitPhonePhoto, 
  CameraSessionData 
} from '../services/cameraSessionService';
import { compressLocalImageForDatabase } from '../services/productImageService';

interface PhoneCameraCaptureViewProps {
  sessionId: string;
}

export const PhoneCameraCaptureView: React.FC<PhoneCameraCaptureViewProps> = ({ sessionId }) => {
  const [session, setSession] = useState<CameraSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [photosSentCount, setPhotosSentCount] = useState(0);
  const [lastSentPart, setLastSentPart] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Store active item to detect when PC changes to a new part
  const prevItemRef = useRef<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('joydevine_phone_paired_session', sessionId);
    } catch {}

    // 1. Notify PC that phone is connected
    notifyPhoneConnected(sessionId);

    // 2. Real-time listener for continuous pairing
    const unsubscribe = listenToCameraSession(sessionId, (data) => {
      setIsLoading(false);
      if (!data) {
        setErrorMessage('This pairing session is no longer active on the PC. Please scan a new QR code.');
        return;
      }
      setSession(data);

      const currentKey = `${data.ybNo || ''}_${data.itemName || ''}`;
      if (prevItemRef.current && prevItemRef.current !== currentKey) {
        // PC changed to a new part! Clear preview for the new item
        setPreviewImage(null);
      }
      prevItemRef.current = currentKey;
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  const handleCaptureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Client-side canvas compression for instant transfer
      const processed = await compressLocalImageForDatabase(file, 800, 0.82);
      setPreviewImage(processed.url);

      // 2. Submit photo to the active pairing session
      await submitPhonePhoto(sessionId, processed.url);
      setPhotosSentCount((prev) => prev + 1);
      setLastSentPart(session?.itemName || session?.ybNo || 'Current Item');
    } catch (err: any) {
      console.error('Error processing photo on phone:', err);
      setErrorMessage(err?.message || 'Could not process photo. Please try again.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center p-4 text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-3" />
        <p className="text-xs font-mono tracking-wider">Connecting to Counter PC...</p>
      </div>
    );
  }

  if (errorMessage && !session) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 max-w-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Session Disconnected</h2>
          <p className="text-xs text-slate-600">{errorMessage}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-2.5 bg-[#0A192F] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Go to JoyDivine Store
          </button>
        </div>
      </div>
    );
  }

  const currentPartTitle = session?.itemName || 'Auto Spare Part';
  const currentYbNo = session?.ybNo;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      
      {/* Top Header */}
      <header className="bg-[#0A192F] text-white p-3.5 shadow-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img 
            src="/joydevine-logo.png" 
            alt="JoyDivine Logo" 
            className="w-8 h-8 object-contain rounded-full bg-white/10 p-0.5 border border-blue-400/30"
          />
          <div>
            <h1 className="font-black text-xs font-['Chivo'] tracking-tight">JOYDIVINE CAMERA SYNC</h1>
            <p className="text-[10px] text-blue-200 font-mono">Live Counter Pairing Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-[11px] font-bold text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>PC Paired</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-4 max-w-md mx-auto w-full flex flex-col justify-between space-y-3.5">
        
        {/* Active Part Info Card (Updates automatically whenever PC switches items!) */}
        <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-700 text-white text-[9px] font-mono px-2 py-0.5 rounded-bl-lg font-bold">
            LIVE SYNC
          </div>
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
            Ready for Product on PC:
          </span>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {currentPartTitle}
          </div>
          {currentYbNo && (
            <div className="text-xs font-mono text-blue-900 font-bold mt-0.5">
              YB Number: <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{currentYbNo}</span>
            </div>
          )}
        </div>

        {/* Live Photo Area */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 flex-1 min-h-[310px]">
          
          {previewImage ? (
            <div className="space-y-3 w-full flex flex-col items-center">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-md bg-slate-50 p-2">
                <img 
                  src={previewImage} 
                  alt="Captured part" 
                  className="w-full h-full object-contain rounded-xl"
                />
                <div className="absolute top-3 right-3 bg-emerald-600 text-white rounded-full p-1.5 shadow-md">
                  <Check className="w-4 h-4 stroke-[2]" />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div>✓ Transferred to PC in real time!</div>
                  <div className="text-[10px] text-emerald-700 font-normal">
                    When you switch to the next part on your computer, this screen updates automatically. No need to scan again!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <div className="w-18 h-18 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-700 mx-auto">
                <Camera className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">Snap Photo for Current Item</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Take the photo below. It will transfer to your PC immediately.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {errorMessage}
            </div>
          )}

          {/* Camera Buttons */}
          <div className="w-full space-y-2 pt-1">
            
            {/* Primary: Take Photo with Back Camera */}
            <label className={`w-full py-3.5 px-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transferring to PC...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>{previewImage ? 'Retake / Snap Another Photo' : 'Take Photo with Camera'}</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleCaptureFile}
                className="hidden" 
              />
            </label>

            {/* Secondary: Choose from Photo Gallery */}
            <label className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Or Choose from Phone Gallery</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleCaptureFile}
                className="hidden" 
              />
            </label>

          </div>

        </div>

        {/* Counter Session Stats & Guidance */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-slate-600 text-[11px] space-y-1">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>Continuous Pairing Mode Active</span>
            <span className="text-emerald-700 font-bold">{photosSentCount} photos sent</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            💡 <strong>Tip:</strong> Keep this browser tab open. As you enter new spare parts on your laptop, this screen will stay linked so you never have to scan a QR code again!
          </p>
        </div>

      </main>

    </div>
  );
};
