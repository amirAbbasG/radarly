"use client";

import { useState, useCallback } from "react";

export function useShare() {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (opts: { title: string; url?: string }) => {
    const url =
      opts.url ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (navigator.share) {
        await navigator.share({ title: opts.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user dismissed */
    }
  }, []);

  return { copied, share };
}
