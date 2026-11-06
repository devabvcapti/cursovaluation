import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Política de Privacidade — ABVCAP",
};

const PARAGRAPH_CLASSES = "mt-4 font-body text-base leading-relaxed text-brand-navy/80";
const HEADING_CLASSES = "mt-8 font-heading text-xl font-medium text-brand-navy";

export default function PoliticaDePrivacidadePage() {
  return (
    <>
      <Header />
      <Section tone="white">
        <div className="mx-auto w-full max-w-3xl px-6 lg:px-10">
          <h1 className="font-heading text-3xl font-light text-brand-navy md:text-4xl">
            Política de Privacidade
          </h1>

          <h2 className={HEADING_CLASSES}>1. Controlador dos dados</h2>
          <p className={PARAGRAPH_CLASSES}>
            Esta política se aplica ao site e ao processo de inscrição do curso &ldquo;Valuation&rdquo;,
            operado pela Associação Brasileira de Private Equity e Venture Capital (ABVCAP), CNPJ
            03.990.636/0001-16.
          </p>

          <h2 className={HEADING_CLASSES}>2. Dados que coletamos</h2>
          <p className={PARAGRAPH_CLASSES}>
            Na inscrição/checkout: nome, e-mail, CPF, telefone e, quando aplicável, CNPJ (para
            verificação de associado) e código de cupom. No download da ementa do curso: nome e
            e-mail. Também coletamos dados de navegação (cookies de analytics), apenas mediante seu
            consentimento no banner exibido no site.
          </p>

          <h2 className={HEADING_CLASSES}>3. Para que usamos esses dados</h2>
          <p className={PARAGRAPH_CLASSES}>
            Processar sua inscrição e o pagamento junto ao Mercado Pago; enviar confirmações, a
            ementa do curso e comunicações relacionadas ao programa; verificar condição de
            associado ABVCAP para aplicação do preço correspondente; e, apenas quando você aceita
            cookies de analytics, melhorar o site.
          </p>

          <h2 className={HEADING_CLASSES}>4. Com quem compartilhamos</h2>
          <p className={PARAGRAPH_CLASSES}>
            Compartilhamos seus dados com o Mercado Pago, para processar o pagamento, e com a
            equipe de recepção do evento, para controle de presença. Não vendemos nem
            compartilhamos seus dados para fins de marketing de terceiros.
          </p>

          <h2 className={HEADING_CLASSES}>5. Armazenamento e segurança</h2>
          <p className={PARAGRAPH_CLASSES}>
            Os dados ficam armazenados em banco de dados com acesso restrito, e o acesso
            administrativo é protegido por login.
          </p>

          <h2 className={HEADING_CLASSES}>6. Seus direitos (LGPD)</h2>
          <p className={PARAGRAPH_CLASSES}>
            Você pode solicitar confirmação, acesso, correção, eliminação ou portabilidade dos seus
            dados pelo WhatsApp disponível neste site. Para revogação de consentimento e
            eliminação de dados, você também pode enviar um e-mail para{" "}
            <a href="mailto:lgpd@abvcap.com.br" className="text-brand-green underline underline-offset-2 hover:text-brand-green/80">
              lgpd@abvcap.com.br
            </a>
            .
          </p>

          <h2 className={HEADING_CLASSES}>7. Cookies</h2>
          <p className={PARAGRAPH_CLASSES}>
            Usamos um banner de consentimento: você pode aceitar ou recusar cookies não essenciais
            a qualquer momento; recusar não afeta o funcionamento do site.
          </p>

          <h2 className={HEADING_CLASSES}>8. Retenção</h2>
          <p className={PARAGRAPH_CLASSES}>
            Dados de pedidos são mantidos pelo prazo necessário para fins fiscais e contratuais.
            Dados de quem baixou a ementa são mantidos para fins de contato comercial, podendo ser
            excluídos mediante solicitação.
          </p>

          <h2 className={HEADING_CLASSES}>9. Alterações</h2>
          <p className={PARAGRAPH_CLASSES}>
            Esta política pode ser atualizada; a versão vigente é sempre a publicada nesta página.
          </p>

          <h2 className={HEADING_CLASSES}>10. Contato</h2>
          <p className={PARAGRAPH_CLASSES}>
            Dúvidas sobre o tratamento dos seus dados, entre em contato pelo WhatsApp disponível
            neste site.
          </p>
        </div>
      </Section>
      <Footer />
    </>
  );
}
