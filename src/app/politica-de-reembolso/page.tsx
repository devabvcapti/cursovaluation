import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Política de Reembolso — ABVCAP",
};

const PARAGRAPH_CLASSES = "mt-4 font-body text-base leading-relaxed text-brand-navy/80";
const HEADING_CLASSES = "mt-8 font-heading text-xl font-medium text-brand-navy";

export default function PoliticaDeReembolsoPage() {
  return (
    <>
      <Header />
      <Section tone="white">
        <div className="mx-auto w-full max-w-3xl px-6 lg:px-10">
          <h1 className="font-heading text-3xl font-light text-brand-navy md:text-4xl">
            Política de Reembolso e Cancelamento
          </h1>

          <h2 className={HEADING_CLASSES}>1. Direito de arrependimento (até 7 dias)</h2>
          <p className={PARAGRAPH_CLASSES}>
            O cancelamento pode ser solicitado em até 7 (sete) dias corridos após a confirmação do
            pagamento, com reembolso integral do valor pago, conforme o direito de arrependimento
            previsto no art. 49 do Código de Defesa do Consumidor para compras realizadas fora do
            estabelecimento comercial.
          </p>

          <h2 className={HEADING_CLASSES}>2. Cancelamento após 7 dias e antes do início do curso</h2>
          <p className={PARAGRAPH_CLASSES}>
            Após o prazo de arrependimento e até a data de início da turma, o cancelamento pode ser
            solicitado com reembolso parcial: será retido o equivalente a 10% do valor pago, a
            título de taxa administrativa, e os 90% restantes serão devolvidos.
          </p>

          <h2 className={HEADING_CLASSES}>3. Cancelamento após o início do curso</h2>
          <p className={PARAGRAPH_CLASSES}>
            Uma vez iniciada a turma, não há reembolso em dinheiro. Mediante disponibilidade de
            vagas, o aluno pode solicitar a transferência de sua inscrição para a turma seguinte,
            uma única vez e sem custo adicional.
          </p>

          <h2 className={HEADING_CLASSES}>4. Como solicitar</h2>
          <p className={PARAGRAPH_CLASSES}>
            As solicitações de cancelamento, reembolso ou transferência devem ser feitas pelo
            WhatsApp da ABVCAP, disponível neste site, ou pelo e-mail{" "}
            <a href="mailto:financeiro@abvcap.com.br" className="text-brand-green underline underline-offset-2 hover:text-brand-green/80">
              financeiro@abvcap.com.br
            </a>
            .
          </p>

          <h2 className={HEADING_CLASSES}>5. Prazo e forma de devolução</h2>
          <p className={PARAGRAPH_CLASSES}>
            O valor será estornado pelo mesmo meio de pagamento utilizado na compra (cartão de
            crédito ou Pix, via Mercado Pago), em até 10 dias úteis após a aprovação da
            solicitação, observado ainda o prazo da operadora do cartão para o estorno aparecer na
            fatura.
          </p>

          <h2 className={HEADING_CLASSES}>6. Cancelamento do curso pela ABVCAP</h2>
          <p className={PARAGRAPH_CLASSES}>
            Caso a ABVCAP cancele a turma por qualquer motivo, será garantido reembolso integral a
            todos os inscritos, independentemente dos prazos acima.
          </p>

          <h2 className={HEADING_CLASSES}>7. Valor base do reembolso</h2>
          <p className={PARAGRAPH_CLASSES}>
            Quando houver cupom de desconto ou preço de associado ABVCAP aplicado, o reembolso
            (integral ou parcial) incide sobre o valor efetivamente pago, não sobre o valor cheio
            do curso.
          </p>

          <p className={PARAGRAPH_CLASSES}>
            Em caso de dúvidas, entre em contato pelo WhatsApp disponível neste site.
          </p>
        </div>
      </Section>
      <Footer />
    </>
  );
}
