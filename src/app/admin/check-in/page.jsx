'use client';

/**
 * MYTICKETSLIVE - QR Scanner / Check-in Page
 * Gate staff use this to scan QR codes and verify tickets
 * Uses device camera via getUserMedia + jsQR-style scanning
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export default function CheckInPage() {
  const [mode, setMode] = useState('manual'); // 'manual' or 'camera'
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [history, setHistory] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Start scanning frames — uses BarcodeDetector API (Chrome/Safari)
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          if ('BarcodeDetector' in window) {
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code && code.startsWith('MTIX-')) {
                stopCamera();
                setQrInput(code);
                handleVerify(code);
              }
            }
          }
        } catch (e) {
          // BarcodeDetector not available, fall back to manual
        }
      }, 500);
    } catch (err) {
      toast.error('Camera access denied. Use manual mode instead.');
      setMode('manual');
    }
  };

  const handleVerify = async (code) => {
    const qr = code || qrInput.trim();
    if (!qr) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code: qr,
          checked_in_by: staffName || 'gate-staff',
        }),
      });
      const data = await res.json();

      const entry = {
        time: new Date().toLocaleTimeString(),
        code: qr.slice(0, 20) + '...',
        success: data.success,
        message: data.success ? 'APPROVED' : data.error,
        name: data.ticket?.holder_name || '—',
        event: data.event?.name || '—',
        type: data.ticket_type?.name || '—',
      };

      setResult({ ...data, statusCode: res.status });
      setHistory(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50
      setQrInput('');
    } catch (err) {
      setResult({ success: false, error: 'NETWORK ERROR', message: 'Could not reach server.' });
    } finally {
      setLoading(false);
    }
  };

  const resultBg = result?.success ? '#064e3b' : result ? '#450a0a' : 'transparent';
  const resultBorder = result?.success ? '#10b981' : result ? '#ef4444' : 'transparent';
  const resultTextColor = result?.success ? '#34d399' : '#fca5a5';

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e', color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px',
      maxWidth: 600, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Check-In Scanner</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>Scan QR codes at the gate</p>
        </div>
        <a href="/admin/orders" style={{
          padding: '8px 16px', background: '#1e293b', color: '#94a3b8',
          borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600,
        }}>
          Orders
        </a>
      </div>

      {/* Staff Name */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          placeholder="Staff name (for check-in logs)"
          style={{
            width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none',
          }}
        />
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => { setMode('camera'); startCamera(); }}
          style={{
            flex: 1, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            background: mode === 'camera' ? '#3b82f6' : '#1e293b',
            color: mode === 'camera' ? '#fff' : '#94a3b8',
          }}
        >
          Camera Scan
        </button>
        <button
          onClick={() => { setMode('manual'); stopCamera(); }}
          style={{
            flex: 1, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            background: mode === 'manual' ? '#3b82f6' : '#1e293b',
            color: mode === 'manual' ? '#fff' : '#94a3b8',
          }}
        >
          Manual Entry
        </button>
      </div>

      {/* Camera View */}
      {mode === 'camera' && (
        <div style={{
          position: 'relative', marginBottom: 20, borderRadius: 12, overflow: 'hidden',
          background: '#000', aspectRatio: '4/3',
        }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!cameraActive && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#94a3b8', fontSize: 14,
            }}>
              Starting camera...
            </div>
          )}
          {/* Scan guide overlay */}
          <div style={{
            position: 'absolute', inset: '15%',
            border: '2px solid rgba(59, 130, 246, 0.5)', borderRadius: 12,
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* Manual Entry */}
      {mode === 'manual' && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="Scan or type QR code (MTIX-...)"
              autoFocus
              style={{
                flex: 1, padding: '14px 16px', background: '#1e293b', border: '1px solid #334155',
                borderRadius: 8, color: '#fff', fontSize: 16, outline: 'none',
              }}
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading || !qrInput.trim()}
              style={{
                padding: '14px 24px', background: '#3b82f6', color: '#fff', border: 'none',
                borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer',
                opacity: loading || !qrInput.trim() ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Checking...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 20,
          background: resultBg, border: `2px solid ${resultBorder}`,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            fontSize: 32, fontWeight: 900, textAlign: 'center', marginBottom: 8,
            color: resultTextColor,
          }}>
            {result.success ? 'APPROVED' : result.error || 'DENIED'}
          </div>
          <div style={{
            fontSize: 14, textAlign: 'center', color: resultTextColor, marginBottom: 12,
            opacity: 0.8,
          }}>
            {result.message}
          </div>

          {result.ticket && (
            <div style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12,
              fontSize: 14,
            }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Name:</span>{' '}
                <span style={{ color: '#fff', fontWeight: 600 }}>{result.ticket.holder_name}</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Email:</span>{' '}
                <span style={{ color: '#fff' }}>{result.ticket.holder_email}</span>
              </div>
              {result.event && (
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Event:</span>{' '}
                  <span style={{ color: '#fff' }}>{result.event.name}</span>
                </div>
              )}
              {result.ticket_type && (
                <div>
                  <span style={{ color: '#94a3b8' }}>Type:</span>{' '}
                  <span style={{ color: '#fff', fontWeight: 600 }}>{result.ticket_type.name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20,
      }}>
        <div style={{
          background: '#111827', borderRadius: 8, padding: 12, textAlign: 'center',
        }}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Scanned</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{history.length}</div>
        </div>
        <div style={{
          background: '#111827', borderRadius: 8, padding: 12, textAlign: 'center',
        }}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Approved</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
            {history.filter(h => h.success).length}
          </div>
        </div>
        <div style={{
          background: '#111827', borderRadius: 8, padding: 12, textAlign: 'center',
        }}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Denied</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
            {history.filter(h => !h.success).length}
          </div>
        </div>
      </div>

      {/* Scan History */}
      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#94a3b8' }}>
            Recent Scans
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: '#111827', borderRadius: 8,
                borderLeft: `3px solid ${h.success ? '#10b981' : '#ef4444'}`,
                fontSize: 13,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{h.name}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>{h.type} &middot; {h.event}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: 700, fontSize: 11,
                    color: h.success ? '#10b981' : '#ef4444',
                  }}>
                    {h.message}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>{h.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
