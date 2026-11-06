import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Termos de Uso — ABVCAP",
};

const PARAGRAPH_CLASSES = "mt-4 font-body text-base leading-relaxed text-brand-navy/80";
const HEADING_CLASSES = "mt-8 font-heading text-xl font-medium text-brand-navy";
const LINK_CLASSES = "text-brand-green underline underline-offset-2 hover:text-brand-green/80";

export default function TermosDeUsoPage() {
  return (
    <>
      <Header />
      <Section tone="white">
        <div className="mx-auto w-full max-w-3xl px-6 lg:px-10">
          <h1 className="font-heading text-3xl font-light text-brand-navy md:text-4xl">
            Termos de Uso
          </h1>

          <h2 className={HEADING_CLASSES}>1. Aceitação</h2>
          <p className={PARAGRAPH_CLASSES}>
            Ao acessar este site ou se inscrever no curso, você concorda com estes Termos de Uso.
          </p>

          <h2 className={HEADING_CLASSES}>2. Objeto</h2>
          <p className={PARAGRAPH_CLASSES}>
            Este site é operado pela Associação Brasileira de Private Equity e Venture Capital
            (ABVCAP), CNPJ 03.990.636/0001-16, para divulgação e venda de inscrições do curso
            presencial &ldquo;Valuation&rdquo;.
          </p>

          <h2 className={HEADING_CLASSES}>3. Inscrição</h2>
          <p className={PARAGRAPH_CLASSES}>
            A inscrição exige o fornecimento de dados verdadeiros (nome, e-mail, CPF, telefone).
            CNPJ só é necessário para quem solicita o preço de associado ABVCAP.
          </p>

          <h2 className={HEADING_CLASSES}>4. Preços e pagamento</h2>
          <p className={PARAGRAPH_CLASSES}>
            Os preços, condições de early bird e formas de pagamento são os informados na página
            do curso no momento da inscrição, processados via Mercado Pago.
          </p>

          <h2 className={HEADING_CLASSES}>5. Cancelamento e reembolso</h2>
          <p className={PARAGRAPH_CLASSES}>
            Reembolsos e cancelamentos seguem a{" "}
            <Link href="/politica-de-reembolso" className={LINK_CLASSES}>
              Política de Reembolso
            </Link>
            .
          </p>

          <h2 className={HEADING_CLASSES}>6. Propriedade intelectual</h2>
          <p className={PARAGRAPH_CLASSES}>
            O conteúdo do curso, materiais e a marca ABVCAP são protegidos por direitos
            autorais/marca; o uso é pessoal e intransferível, vedada a reprodução não autorizada.
          </p>

          <h2 className={HEADING_CLASSES}>7. Limitação de responsabilidade</h2>
          <p className={PARAGRAPH_CLASSES}>
            A ABVCAP não garante resultado profissional específico decorrente do curso. O site
            pode apresentar instabilidades eventuais.
          </p>

          <h2 className={HEADING_CLASSES}>8. Alterações</h2>
          <p className={PARAGRAPH_CLASSES}>
            Estes termos podem ser atualizados; a versão vigente é sempre a publicada nesta página.
          </p>

          <h2 className={HEADING_CLASSES}>9. Lei aplicável e foro</h2>
          <p className={PARAGRAPH_CLASSES}>
            Aplica-se a legislação brasileira, com foro eleito na Comarca de São Paulo/SP.
          </p>

          <h2 className={HEADING_CLASSES}>10. Contato</h2>
          <p className={PARAGRAPH_CLASSES}>
            Em caso de dúvidas, entre em contato pelo WhatsApp disponível neste site.
          </p>
        </div>
      </Section>
      <Footer />
    </>
  );
}
