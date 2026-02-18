"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isDev) {
      // Unregister any existing SW so cached assets don't interfere with dev server
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
    });
  }, []);

  return null;
}
