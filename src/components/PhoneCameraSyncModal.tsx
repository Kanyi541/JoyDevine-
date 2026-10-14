import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { notify, confirmAction } from './AppNotifications';
import { 
  XLg as X, 
  Camera, 
  CheckCircleFill as CheckCircle2, 
  Copy, 
  CheckLg as Check, 
  ArrowRepeat as RefreshCw,
  QrCodeScan,
  Phone
} from 'react-bootstrap-icons';
import { 
  getOrCreatePersistentSession, 
  listenToCameraSession, 
  disconnectCameraSession, 
  updateActiveProductInSession,
  CameraSessionData 
} from '../services/cameraSessionService';

interface PhoneCameraSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoReceived: (imageUrl: string) => void;
  partName?: string;
  ybNo?: string;
}

export const PhoneCameraSyncModal: React.FC<PhoneCameraSyncModalProps> = ({
  isOpen,
  onClose,
  onPhotoReceived,
  partName,
  ybNo
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<CameraSessionData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showQrForced, setShowQrForced] = useState(false);

  // Initialize or re-use persistent pairing session
  useEffect(() => {
    if (!isOpen) return;

    let unsubscribe: (() => void) | null = null;

    const setupSession = async () => {
      setIsInitializing(true);
      try {
        const { sessionId: id } = await getOrCreatePersistentSession({ 
          itemName: partName, 
          ybNo 
        });
        setSessionId(id);

        unsubscribe = listenToCameraSession(id, (updated) => {
          if (!updated) return;
          setSessionData(updated);

          // If a new photo timestamp was recorded, pass image to POS
          if (updated.imageUrl && updated.photoTimestamp) {
            onPhotoReceived(updated.imageUrl);
          }
        });
      } catch (err) {
        console.error('Failed to initialize persistent pairing session:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    setupSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  // When partName or ybNo changes while session is active, update in session
  useEffect(() => {
    if (sessionId && isOpen) {
      updateActiveProductInSession(sessionId, partName || '', ybNo);
    }
  }, [sessionId, partName, ybNo, isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://joydevineautospares.vercel.app';
  const phoneCaptureUrl = sessionId ? `${currentOrigin}/?snap=${sessionId}` : '';

  const handleCopyLink = () => {
    if (!phoneCaptureUrl) return;
    navigator.clipboard?.writeText(phoneCaptureUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDisconnect = async () => {
    if (!sessionId) return;
    const confirmed = await confirmAction({
      title: 'Disconnect phone camera?',
      message: 'Do you want to unpair this phone? You will need to scan the QR code again to reconnect.',
      variant: 'warning',
      confirmText: 'Yes, Disconnect',
    });
    if (!confirmed) return;
    await disconnectCameraSession(sessionId);
    setSessionId(null);
    setSessionData(null);
    onClose();
    notify.info('The phone camera was disconnected.', { title: 'Phone Disconnected' });
  };

  const isConnected = sessionData?.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 bg-[#0A192F]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0A192F] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-['Chivo'] tracking-tight">Snap Photo from Phone</h3>
              <p className="text-[11px] text-slate-300">Continuous Counter Pairing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col items-center text-center space-y-4">
          
          {isInitializing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-700 animate-spin" />
              <p className="text-xs font-mono text-slate-500">Checking continuous phone pairing...</p>
            </div>
          ) : isConnected && !showQrForced ? (
            /* Already Paired State: NO NEED TO SCAN AGAIN! */
            <div className="py-2 flex flex-col items-center justify-center space-y-4 w-full">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Phone is Already Paired & Connected!</span>
                </div>
                <h4 className="font-bold text-base text-slate-900 pt-1">No Need to Scan Again!</h4>
                <p className="text-xs text-slate-600 max-w-sm">
                  Your phone is already linked to this computer. Just open your phone and tap <strong>"Take Photo"</strong>—it will automatically attach to this product.
                </p>
              </div>

              {/* Active Product Preview */}
              <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-blue-700 font-bold tracking-wider">
                  Target Product on PC:
                </span>
                <div className="font-bold text-slate-900 truncate">
                  {partName || 'Auto Spare Part'}
                </div>
                {ybNo && (
                  <div className="text-[11px] font-mono text-blue-800">
                    YB Number: <strong>{ybNo}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Got It (Listening for Photos)
                </button>
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQrForced(true)}
                    className="text-slate-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <QrCodeScan className="w-3.5 h-3.5" />
                    <span>Show QR Code (Pair New Phone)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                  >
                    Disconnect Phone
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* First Time Pairing: Show QR Code */
            <>
              <div className="space-y-1">
                <p className="text-xs text-slate-700 font-medium">
                  Scan this QR code with your phone camera <strong>once</strong>:
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ✓ It will stay paired for all subsequent products you enter today!
                </p>
                {partName && (
                  <p className="text-[11px] font-mono font-bold text-blue-900 truncate max-w-xs mt-1">
                    {ybNo ? `[${ybNo}] ` : ''}{partName}
                  </p>
                )}
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm relative">
                {phoneCaptureUrl && (
                  <QRCodeSVG 
                    value={phoneCaptureUrl} 
                    size={180} 
                    level="M"
                    includeMargin={false}
                    imageSettings={{
                      src: "/joydevine-logo.png",
                      x: undefined,
                      y: undefined,
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                )}
              </div>

              {/* Live Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Waiting for phone scan...</span>
              </div>

              {/* Continuous pairing explanation */}
              <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="w-4 h-4 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                  <span>Scan once with your phone camera</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="w-4 h-4 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                  <span>Keep the phone tab open on your counter</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="w-4 h-4 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                  <span>Every photo you snap automatically fills whatever part is open on this PC!</span>
                </div>
              </div>

              {/* Copy URL fallback */}
              <div className="w-full pt-1 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px]">Or open on phone browser:</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold cursor-pointer transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
