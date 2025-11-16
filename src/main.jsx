// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./i18n"; // initialize translations
import { syncQueuedActions } from "./utils/offlineQueue"; // existing file you have
import { schedulePendingNotifications, requestPermission } from "./utils/notifications";
import usageLimiter from "./utils/usageLimiter";

// Register service worker (if available) once on load
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        console.log("✅ Service Worker registered with scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("❌ Service Worker registration failed:", err);
      });
  });
}

// Listen for online event to sync any queued actions
window.addEventListener(
  "online",
  () => {
    console.log("🔁 Back online — syncing queued actions...");
    try {
      syncQueuedActions();
    } catch (err) {
      console.warn("syncQueuedActions failed:", err);
    }
  },
  false
);

// When the page loads, schedule pending notifications for saved meds.
// Also request permission proactively (so user sees a prompt early).
// Additionally, synchronize usage counts and validate premium status.
window.addEventListener("load", () => {
  // Check storage availability and synchronize usage counts
  try {
    if (!usageLimiter.isStorageAvailable()) {
      console.warn("⚠️ localStorage unavailable - using session-only tracking");
    }
    
    usageLimiter.synchronizeUsageCounts();
    console.log("✅ Usage counts synchronized on startup");
    
    // Check for any storage notifications that need user attention
    const storageNotifications = usageLimiter.getStorageNotifications();
    if (storageNotifications.length > 0) {
      const unDismissed = storageNotifications.filter(n => !n.dismissed);
      if (unDismissed.length > 0) {
        console.warn("⚠️ Storage issues detected:", unDismissed.map(n => n.message));
      }
    }
  } catch (err) {
    console.error("❌ Usage synchronization failed:", err);
    // Don't block app startup for usage sync failures
  }

  // schedule notifications for meds in storage
  try {
    schedulePendingNotifications();
  } catch (err) {
    console.warn("schedulePendingNotifications error:", err);
  }

  // optionally request permission quietly (don't spam)
  requestPermission().catch(() => {});
});

// mount app
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);
root.render(<App />);
