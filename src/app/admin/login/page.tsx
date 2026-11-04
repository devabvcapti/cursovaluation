"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { cn } from "@/lib/cn";

type SubmitStatus = "idle" | "submitting" | "error";

const FIELD_CLASSES = cn(
  "mt-1 block w-full rounded-sm border px-4 py-2.5",
  "font-body text-base text-brand-navy placeholder:text-brand-navy/40",
  "border-brand-navy/20 bg-white",
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

const LABEL_CLASSES = "font-body text-sm font-semibold uppercase tracking-[0.04em] text-brand-navy";

const ERROR_TEXT_CLASSES = "mt-3 font-body text-sm text-red-600";

const SUBMIT_BUTTON_CLASSES = cn(
  "mt-2 inline-flex min-h-11 items-center justify-center rounded-md px-8 py-3.5",
  "bg-brand-green text-brand-navy border-2 border-brand-green",
  "font-heading text-sm font-bold uppercase tracking-[0.08em]",
  "transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
);

/**
 * Admin sign-in form for the `/admin/cupons` area. Middleware (Task 18's
 * `src/proxy.ts`) is the actual access gate; this page's only job is to
 * authenticate the user with Supabase Auth and hand them off.
 */
export default function LoginPage() {
  const router = useRouter();
  const uid = useId();
  const emailId = `${uid}-admin-email`;
  const passwordId = `${uid}-admin-password`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/admin/cupons");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <form noValidate onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="font-heading text-xl font-bold text-brand-navy">Acesso administrativo</h1>

        <div className="mt-6">
          <label htmlFor={emailId} className={LABEL_CLASSES}>
            E-mail
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={FIELD_CLASSES}
          />
        </div>

        <div className="mt-5">
          <label htmlFor={passwordId} className={LABEL_CLASSES}>
            Senha
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={FIELD_CLASSES}
          />
        </div>

        <button type="submit" disabled={status === "submitting"} className={SUBMIT_BUTTON_CLASSES}>
          Entrar
        </button>

        {errorMessage ? <p className={ERROR_TEXT_CLASSES}>{errorMessage}</p> : null}
      </form>
    </main>
  );
}
