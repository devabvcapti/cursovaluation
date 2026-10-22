import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Política de Privacidade — ABVCAP",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <>
      <Header />
      <Section tone="white">
        <div className="mx-auto w-full max-w-3xl px-6 lg:px-10">
          <h1 className="font-heading text-3xl font-light text-brand-navy md:text-4xl">
            Política de Privacidade
          </h1>
          <p className="mt-6 font-body text-base leading-relaxed text-brand-navy/80">
            Esta página está em elaboração e será atualizada com a política de privacidade
            completa da ABVCAP, incluindo como seus dados são coletados, usados e protegidos, em
            conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </p>
          <p className="mt-4 font-body text-base leading-relaxed text-brand-navy/80">
            Em caso de dúvidas sobre o tratamento de dados, entre em contato pelo WhatsApp
            disponível neste site.
          </p>
        </div>
      </Section>
      <Footer />
    </>
  );
}
