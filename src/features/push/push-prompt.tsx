"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  savePushSubscription,
  removePushSubscription,
} from "@/app/actions/push";

const STORAGE_KEY = "radarly-push-dismissed";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
function shouldShowPrompt() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  if (Notification.permission !== "default") return false;
  if (localStorage.getItem(STORAGE_KEY)) return false;
  return true;
}

async function registerAndSubscribe(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  return sub;
}

export function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ponytail: delay to avoid competing with page load
    if (!shouldShowPrompt()) return;
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback((permanent: boolean) => {
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
    if (permanent) localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss(true);
        return;
      }
      const sub = await registerAndSubscribe();
      if (!sub) {
        dismiss(true);
        return;
      }
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys) {
        dismiss(true);
        return;
      }
      await savePushSubscription({
        endpoint: json.endpoint,
        keys: json.keys as { p256dh: string; auth: string },
      });
      dismiss(true);
    } catch {
      dismiss(true);
    } finally {
      setLoading(false);
    }
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card p-5 shadow-lg transition-all duration-300",
        closing ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      <button
        type="button"
        onClick={() => dismiss(false)}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
          <Bell className="size-5 text-secondary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Stay in the loop
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Get notified when the top AI tools of the week drop. No spam, once a
            week.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => dismiss(false)}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface"
        >
          Maybe later
        </button>
        <button
          type="button"
          onClick={subscribe}
          disabled={loading}
          className="flex-1 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
        >
          {loading ? "Enabling…" : "Notify me"}
        </button>
      </div>
    </div>
  );
}
