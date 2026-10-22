import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Termos de Uso — ABVCAP",
};

export default function TermosDeUsoPage() {
  return (
    <>
      <Header />
      <Section tone="white">
        <div className="mx-auto w-full max-w-3xl px-6 lg:px-10">
          <h1 className="font-heading text-3xl font-light text-brand-navy md:text-4xl">
            Termos de Uso
          </h1>
          <p className="mt-6 font-body text-base leading-relaxed text-brand-navy/80">
            Esta página está em elaboração e será atualizada com os termos de uso completos deste
            site e do programa oferecido pela ABVCAP.
          </p>
          <p className="mt-4 font-body text-base leading-relaxed text-brand-navy/80">
            Em caso de dúvidas, entre em contato pelo WhatsApp disponível neste site.
          </p>
        </div>
      </Section>
      <Footer />
    </>
  );
}
