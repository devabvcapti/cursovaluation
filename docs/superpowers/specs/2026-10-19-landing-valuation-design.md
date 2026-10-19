# Landing Page — Curso de Valuation ABVCAP

Status: approved (design) — ready for implementation planning
Date: 2026-10-19

## 1. Objetivo

Landing page de vendas para o curso **Valuation** (avaliação de empresas) com a
chancela institucional da ABVCAP. Objetivo de conversão: **matrícula direta**,
via botão que leva o visitante a uma plataforma externa de vendas/ingressos já
usada pela ABVCAP ("prateleira de compras"). Não há checkout embutido no site.

## 2. Público-alvo

Público nichado e tecnicamente sofisticado, cético a gatilhos de venda
agressivos, que responde a autoridade institucional e prova concreta:

- Profissionais de M&A / Investment Banking
- Profissionais de Private Equity / Venture Capital
- Finanças corporativas (CFOs, controllers)
- Consultores e advogados especializados em transações

## 3. Oferta

- **Nome do curso:** Valuation
- **Modalidade:** Híbrida (presencial + online)
- **Ticket:** acima de R$ 6.000 (posicionamento premium/avançado)
- **Gatilhos de urgência:** vagas limitadas por turma + condição early bird
  (sem contador regressivo nem pressão artificial — destoaria do tom
  institucional da ABVCAP para este público)
- **Diferenciais a comunicar:**
  1. Selo/chancela institucional da ABVCAP
  2. Networking exclusivo com a comunidade ABVCAP (PE/VC)
  3. Metodologia prática com casos reais de M&A/PE

## 4. Conteúdo e dados pendentes

Nenhum dado real do curso existe ainda. A primeira entrega inclui um
**rascunho de copy completo**, com placeholders claros e fáceis de localizar
(ex.: `[PREÇO]`, `[DATA DA PRÓXIMA TURMA]`, `[NOME DO PROFESSOR]`,
`[CARGA HORÁRIA]`) para substituição posterior pelo usuário. Placeholders
nunca devem ser ambíguos com conteúdo real.

Pendências explícitas:
- Preço exato
- Datas e carga horária da turma
- Nomes/credenciais dos professores
- Depoimentos e logos de empresas (prova social)
- Ementa completa (para o PDF do CTA secundário)
- Link real da plataforma de vendas ("prateleira de compras")

## 5. CTAs

- **Primário:** "Matricule-se" → link externo para a prateleira de compras
  (placeholder de URL até receber o link real).
- **Secundário:** "Baixar ementa" → captura de lead (nome + e-mail no mínimo)
  antes da liberação do PDF do programa. O mecanismo de notificação/registro
  desse lead (e-mail para o time de admissões, planilha, CRM etc.) é uma
  decisão de integração em aberto — **não foi escolhido um provedor ainda**;
  deve ser resolvida durante o planejamento técnico, usando o fluxo de
  integrações da Vercel (marketplace) para escolher e provisionar o serviço.

## 6. Arquitetura de seções (ordem final)

1. Header fixo — logo ABVCAP + nome do curso, CTA de matrícula sempre visível.
2. Hero — chancela ABVCAP, headline de posicionamento, subheadline (formato/
   carga horária/modalidade), CTA primário + secundário. Ver seção 8 (Hero).
3. Prova de autoridade imediata — números institucionais da ABVCAP logo após
   o hero, antes de qualquer argumento de venda.
4. Para quem é o curso — 4 perfis de público com a dor específica de cada um.
5. O que você vai dominar — resultados de aprendizagem concretos.
6. Programa/currículo — módulos em acordeão, com placeholder de carga horária.
7. Metodologia e casos reais — como o formato híbrido e os casos de M&A/PE
   são usados nas aulas.
8. Corpo docente — placeholders nítidos por professor (nome/cargo/foto).
9. Rede e comunidade ABVCAP — diferencial de networking pós-curso.
10. Prova social — depoimentos e logos de empresas (placeholders).
11. Investimento e turma — preço, early bird, vagas limitadas, datas, CTA.
12. FAQ — objeções específicas: reconhecimento do certificado, dedicação de
    tempo exigida, diferença vs. MBA/pós tradicional, política de reembolso.
13. CTA final + rodapé institucional — chancela ABVCAP, contato, redes sociais.

## 7. Direção visual

Base: identidade oficial ABVCAP (`Design System/ABVCAP_Identidade_Visual_
Guia_upd_2025.pdf`), aplicada de forma mais ousada que o uso institucional
tradicional — ousadia via **escala, contraste e composição assimétrica**, não
via elementos decorativos genéricos.

- **Cores:** azul `#112468` (Pantone 280C), verde `#80c842` (Pantone 376C),
  preto `#000000`. Alternância dramática entre blocos full-bleed em navy e
  blocos brancos (em vez de manter tudo em branco), criando ritmo visual de
  "sala de reuniões / data room".
- **Tipografia:** Museo (light para títulos grandes, bold para títulos
  pequenos) e Museo Sans (light/regular/bold) para corpo de texto, itálico
  reservado a termos estrangeiros — conforme o guia oficial. Arquivos reais
  disponíveis em `Design System/Fontes/MuseoSans/*.otf`, a converter para
  `.woff2` e carregar via `next/font/local`. Contraste editorial: títulos
  enormes (90–120px desktop) contra corpo pequeno e denso.
- **Grafismo "bandeira":** o elemento diagonal recortado do logo, usado em
  escala grande como divisor estrutural de seções (não como detalhe
  pequeno), sempre parcial/seccionado — nunca o losango inteiro, conforme
  regra do manual (pode mostrar o ângulo agudo ou a curvatura lateral).
- **Números como elemento gráfico:** estatísticas institucionais tratadas em
  escala grande, como peça visual, não apenas texto de apoio.
- **Fotografia:** tratamento duotone azul/verde (não fotos coloridas
  genéricas de stock), até fotos reais chegarem (placeholders nomeados, ex.
  `[Foto: evento ABVCAP]`).
- **CTA:** botão verde `#80c842` sólido, alto contraste contra navy ou
  branco, sem suavizações.
- **Regras de marca a respeitar:** área de proteção do logo (altura da letra
  "V"), redução mínima (60px em digital), "bandeira" nunca mostrada inteira.

## 8. Hero (detalhado — tem movimento)

O hero não é estático:

- **Fundo cinético:** grafismo "bandeira" em SVG animado, corte diagonal
  verde com drift contínuo e sutil sobre o navy (evocando movimento de
  valor/tendência, sem ser um gráfico literal).
- **Parallax no scroll:** grafismo e tipografia se movem em velocidades
  diferentes ao rolar — efeito discreto, não a página inteira "flutuando".
- **Entrada da headline com stagger:** título principal entra em camadas
  (linha por linha) no carregamento.
- **Contagem animada:** estatísticas institucionais contam de 0 até o valor
  final ao entrarem na viewport.
- **Microinteração no CTA:** botão verde reage no hover com leve escala +
  glow.
- Tudo deve respeitar `prefers-reduced-motion` (desativar/reduzir animação
  para quem configurou essa preferência no SO/navegador).

## 9. Abordagem técnica

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS, deploy na
  Vercel. Projeto novo nesta pasta (ainda sem scaffold).
- **Estrutura:** página única (`/`), seções como componentes isolados em
  `components/sections/`, copy centralizado em `content/curso.ts` para
  facilitar edição posterior sem tocar em JSX.
- **Animação:** Framer Motion (scroll-reveal, contagem numérica, grafismo
  animado do hero).
- **Imagens:** `next/image`, placeholders duotone até fotos reais.
- **SEO/compartilhamento:** metadata + Open Graph desde o início (página vai
  circular por e-mail/LinkedIn, público B2B).
- **Analytics:** Vercel Web Analytics como padrão (zero-config), salvo
  indicação de pixel/GA próprio da ABVCAP.
- **Captura de lead (ementa em PDF):** mecanismo de integração (e-mail/
  armazenamento do lead) **não decidido** — resolver no planejamento técnico
  via skill de marketplace da Vercel antes de implementar.

## 10. Fora de escopo (nesta primeira entrega)

- Checkout/pagamento embutido no site (fica na plataforma externa).
- Área logada/portal do aluno.
- Internacionalização (apenas pt-BR).
- CMS para edição de conteúdo por não-desenvolvedores (copy fica em arquivo
  de conteúdo no código por enquanto).
