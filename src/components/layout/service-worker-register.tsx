"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js, the service worker that makes Cadence installable
 * and gives it an offline fallback page. Only in production: in development a
 * service worker would cache files and hide your latest changes.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Not critical: the app works the same without it
    });
  }, []);

  return null;
}
