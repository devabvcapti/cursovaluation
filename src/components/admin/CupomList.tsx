"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { CupomRow } from "@/lib/supabase/types";
import { CupomForm } from "./CupomForm";

export interface CupomListProps {
  initialCupons: CupomRow[];
}

const TOGGLE_BUTTON_CLASSES = cn(
  "inline-flex min-h-9 items-center justify-center rounded-md px-4 py-2",
  "border-2 border-brand-navy text-brand-navy",
  "font-heading text-xs font-bold uppercase tracking-[0.06em]",
  "transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

/**
 * Client island for `/admin/cupons`: renders `CupomForm` above a table of
 * cupons, tracking the list in local state so a created cupom (from
 * `CupomForm`'s `onCreated`) and an ativar/desativar toggle both show up
 * immediately without a full page reload. The toggle only updates local
 * state after the `PATCH` response confirms success — never optimistically
 * — so the UI never shows a state the server didn't actually persist.
 */
export function CupomList({ initialCupons }: CupomListProps) {
  const [cupons, setCupons] = useState<CupomRow[]>(initialCupons);
  const [togglingCodigo, setTogglingCodigo] = useState<string | null>(null);

  function handleCreated(row: CupomRow) {
    setCupons((current) => [row, ...current]);
  }

  async function handleToggle(row: CupomRow) {
    setTogglingCodigo(row.codigo);
    try {
      const response = await fetch(`/api/admin/cupons/${row.codigo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !row.ativo }),
      });

      if (!response.ok) {
        return;
      }

      const updated = (await response.json()) as CupomRow;
      setCupons((current) =>
        current.map((cupom) => (cupom.codigo === updated.codigo ? updated : cupom)),
      );
    } finally {
      setTogglingCodigo(null);
    }
  }

  return (
    <div>
      <CupomForm onCreated={handleCreated} />

      <table className="mt-10 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-brand-navy/20">
            <th className="py-2 pr-4 font-body text-sm font-semibold uppercase tracking-[0.04em] text-brand-navy">
              Código
            </th>
            <th className="py-2 pr-4 font-body text-sm font-semibold uppercase tracking-[0.04em] text-brand-navy">
              Percentual
            </th>
            <th className="py-2 pr-4 font-body text-sm font-semibold uppercase tracking-[0.04em] text-brand-navy">
              Ativo
            </th>
            <th className="py-2 pr-4 font-body text-sm font-semibold uppercase tracking-[0.04em] text-brand-navy">
              Usos
            </th>
            <th className="py-2 pr-4 font-body text-sm font-semibold uppercase tracking-[0.04em] text-brand-navy">
              Criado por
            </th>
            <th className="py-2 pr-4 font-body text-sm font-semibold uppercase tracking-[0.04em] text-brand-navy">
              Ação
            </th>
          </tr>
        </thead>
        <tbody>
          {cupons.map((cupom) => (
            <tr key={cupom.id} className="border-b border-brand-navy/10">
              <td className="py-2 pr-4 font-body text-sm text-brand-navy">{cupom.codigo}</td>
              <td className="py-2 pr-4 font-body text-sm text-brand-navy">
                {cupom.percentual_desconto}%
              </td>
              <td className="py-2 pr-4 font-body text-sm text-brand-navy">
                {cupom.ativo ? "Sim" : "Não"}
              </td>
              <td className="py-2 pr-4 font-body text-sm text-brand-navy">
                {cupom.usos_atuais}
                {cupom.limite_uso !== null ? ` / ${cupom.limite_uso}` : ""}
              </td>
              <td className="py-2 pr-4 font-body text-sm text-brand-navy">{cupom.criado_por}</td>
              <td className="py-2 pr-4">
                <button
                  type="button"
                  disabled={togglingCodigo === cupom.codigo}
                  onClick={() => handleToggle(cupom)}
                  className={TOGGLE_BUTTON_CLASSES}
                >
                  {cupom.ativo ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
