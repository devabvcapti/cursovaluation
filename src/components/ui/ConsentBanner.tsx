"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

type Consent = "accepted" | "rejected";

const STORAGE_KEY = "abvcap-consent";

function readStoredConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    // Private browsing / blocked storage: treat as "not yet decided" rather
    // than crash — the banner just won't remember the choice across visits.
    return null;
  }
}

function storeConsent(value: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore — see readStoredConsent.
  }
}

/**
 * LGPD-style consent banner. Starts as `null` on both server and first
 * client render (matches, no hydration mismatch) and only reads
 * `localStorage` after mount, since it's unavailable during SSR. Vercel
 * Analytics only loads once the visitor accepts — rejecting (or not yet
 * deciding) means no analytics script runs at all.
 */
export function ConsentBanner() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent());
    setHydrated(true);
  }, []);

  const decide = (value: Consent) => {
    storeConsent(value);
    setConsent(value);
  };

  return (
    <>
      {consent === "accepted" ? <Analytics /> : null}
      {hydrated && consent === null ? (
        <div
          role="region"
          aria-label="Aviso de cookies e privacidade"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-brand-navy px-6 py-5 shadow-[0_-4px_24px_rgba(0,0,0,0.25)] sm:px-10"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-sm text-white/85">
              Usamos cookies e dados de navegação para melhorar sua experiência neste site, em conformidade
              com a LGPD. Você pode aceitar ou recusar o uso de dados não essenciais.
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => decide("rejected")}
                className="min-h-11 rounded-md border-2 border-white/40 px-5 py-2 font-heading text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors duration-200 ease-out hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
              >
                Recusar
              </button>
              <button
                type="button"
                onClick={() => decide("accepted")}
                className="min-h-11 rounded-md bg-brand-green px-5 py-2 font-heading text-xs font-bold uppercase tracking-[0.08em] text-brand-navy transition-colors duration-200 ease-out hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
