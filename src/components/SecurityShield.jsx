'use client';

import { useEffect } from 'react';

/**
 * MYSTATION SECURITY SHIELD
 * Blocks devtools, right-click, source inspection, console access.
 * Production only — disabled in development for debugging.
 */
export default function SecurityShield() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    // 1. Block right-click context menu
    const blockContext = (e) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('contextmenu', blockContext);

    // 2. Block common devtools shortcuts
    const blockKeys = (e) => {
      // F12
      if (e.key === 'F12') { e.preventDefault(); return false; }
      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') { e.preventDefault(); return false; }
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') { e.preventDefault(); return false; }
      // Ctrl+Shift+C / Cmd+Option+C (Element picker)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') { e.preventDefault(); return false; }
      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); return false; }
      // Ctrl+S / Cmd+S (Save page)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); return false; }
    };
    document.addEventListener('keydown', blockKeys);

    // 3. Wipe console methods so inspectors see nothing useful
    const noop = () => {};
    const originalConsole = { ...console };
    if (typeof window !== 'undefined') {
      console.log = noop;
      console.warn = noop;
      console.info = noop;
      console.debug = noop;
      console.table = noop;
      // Keep console.error for critical errors
    }

    // 4. Devtools detection — debugger trap
    let devtoolsInterval;
    const detectDevtools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:system-ui;text-align:center;padding:2rem"><div><h1 style="font-size:2rem;margin-bottom:1rem">Access Denied</h1><p style="color:#666">Developer tools are not permitted on this site.</p></div></div>';
      }
    };
    devtoolsInterval = setInterval(detectDevtools, 1000);

    // 5. Block drag/drop of images and content
    const blockDrag = (e) => { e.preventDefault(); return false; };
    document.addEventListener('dragstart', blockDrag);

    // 6. Console warning message
    setTimeout(() => {
      if (originalConsole.log) {
        originalConsole.log(
          '%cSTOP!',
          'color:red;font-size:60px;font-weight:bold;text-shadow:2px 2px 0 #000'
        );
        originalConsole.log(
          '%cThis is a protected application. Unauthorized access, copying, or reverse engineering is prohibited.',
          'color:#fff;font-size:16px;background:#1a1a2e;padding:10px;border-radius:8px'
        );
      }
    }, 2000);

    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('dragstart', blockDrag);
      clearInterval(devtoolsInterval);
    };
  }, []);

  return null;
}
