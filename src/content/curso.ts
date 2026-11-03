import { placeholder } from "@/lib/placeholder";

export interface CourseContent {
  /** ABVCAP's WhatsApp Business number (digits only, with country+area code), used by the floating widget. Marked temporary by the client — swap when a permanent number is confirmed. */
  whatsappNumber: string;
  /** Pre-filled message the floating widget opens the WhatsApp chat with. */
  whatsappMessage: string;
  /** ABVCAP's official social profiles, linked from the footer's "Siga a ABVCAP" block. */
  socialLinks: { linkedin: string; youtube: string };
  hero: {
    eyebrow: string;
    headlineLines: string[];
    subheadline: string;
    checkoutUrl: string;
    syllabusCtaLabel: string;
  };
  authorityStats: { value: number; suffix: string; label: string; verified: boolean }[];
  audienceProfiles: { title: string; pain: string }[];
  learningOutcomes: string[];
  curriculumModules: { title: string; summary: string; lessons: string[] }[];
  methodology: { title: string; body: string }[];
  faculty: {
    name: string;
    role: string;
    bio: string;
    photo: string;
    linkedin: string;
    quote: string;
    /** Names of companies he's worked at — rendered as grayscale logo placeholders until real logo files exist. */
    companies: string[];
  }[];
  testimonials: {
    quote: string;
    author: string;
    role: string;
    company: string;
    photo: string;
    /** Optional video testimonial; when set, the card plays this instead of showing quote/photo. */
    videoUrl?: string;
  }[];
  investment: {
    price: string;
    earlyBirdPrice: string;
    earlyBirdDeadline: string;
    earlyBirdDeadlineISO: string;
    associadoPrice: string;
    associadoEarlyBirdPrice: string;
    seatsLimit: string;
    nextCohortDate: string;
    workloadHours: string;
    checkoutUrl: string;
  };
  faq: { question: string; answer: string }[];
}

export const courseContent: CourseContent = {
  // Temporary number provided by the client on 2026-10-21.
  whatsappNumber: "5511991480203",
  whatsappMessage:
    "Olá, tenho interesse em saber mais sobre o curso de Valuation. ABVCAP — Aprenda com quem faz.",
  socialLinks: {
    linkedin: "https://www.linkedin.com/company/abvcap/",
    youtube: "https://www.youtube.com/@ABVCAPVideos",
  },
  hero: {
    eyebrow: "Aprenda com quem faz",
    headlineLines: ["Valuation:", "o método por trás", "das decisões que movem capital."],
    subheadline:
      "Programa presencial de avaliação de empresas para profissionais de M&A, Private Equity, Venture Capital e finanças corporativas — 13 aulas construídas a partir de uma companhia aberta real, do histórico até o fechamento do modelo e a estruturação do deal.",
    checkoutUrl: "/inscricao",
    syllabusCtaLabel: "Baixar ementa completa",
  },

  authorityStats: [
    {
      value: 20,
      suffix: "+",
      label: "anos de atuação institucional da ABVCAP no ecossistema de Private Equity e Venture Capital",
      verified: false,
    },
    {
      value: 200,
      suffix: "+",
      label: "gestoras e investidores que compõem a comunidade ABVCAP",
      verified: false,
    },
    {
      value: 1000,
      suffix: "+",
      label: "profissionais de M&A, PE/VC e finanças corporativas na rede ABVCAP",
      verified: false,
    },
  ],

  audienceProfiles: [
    {
      title: "Profissionais de M&A e Investment Banking",
      pain: "Você estrutura e negocia transações sob pressão de tempo e precisa defender premissas de valuation diante de clientes, comitês e contrapartes — com rigor técnico que resista a questionamento.",
    },
    {
      title: "Investidores de Private Equity e Venture Capital",
      pain: "Sua tese de investimento depende de uma avaliação defensável do ativo, da entrada à saída — e o retorno do fundo começa no preço que você paga.",
    },
    {
      title: "CFOs e Controllers",
      pain: "Você precisa avaliar aquisições, cisões, aportes e laudos societários internamente, sem depender exclusivamente de consultorias externas para decisões estratégicas.",
    },
    {
      title: "Consultores e advogados especializados em transações",
      pain: "Você assessora clientes em M&A e precisa compreender a lógica financeira por trás do valuation para negociar cláusulas, earn-outs e garantias com propriedade.",
    },
  ],

  learningOutcomes: [
    "Montar uma base histórica limpa e diagnosticar a saúde de uma empresa antes de projetá-la.",
    "Construir um modelo de três demonstrações do zero, fechado e auditável.",
    "Projetar receita e custos a partir dos drivers do negócio.",
    "Projetar investimentos, endividamento, tributos, patrimônio líquido e capital de giro.",
    "Montar o fluxo de caixa e fechar um balanço que não bate.",
    "Calcular o custo de capital (WACC) com os ajustes do mercado brasileiro.",
    "Chegar ao valor intrínseco da empresa pelo fluxo de caixa descontado (DCF).",
    "Selecionar e ajustar empresas e transações comparáveis, e defender cada escolha.",
    "Construir tabelas de sensibilidade e o football field.",
    "Usar IA para acelerar a análise — e saber onde ela erra.",
    "Estruturar um deal: preço por ação, oferta primária e secundária, diluição, prêmio de controle.",
    "Modelar alavancagem viável no Brasil via seller's finance.",
    "Calcular TIR e MOIC do fundo e decompor de onde vem o retorno.",
    "Estruturar e defender uma recomendação de investimento ao comitê.",
  ],

  curriculumModules: [
    {
      title: "Aula Zero — Boas práticas de modelagem no Excel",
      summary: "Gravada e gratuita, disponível antes do início do curso.",
      lessons: [
        "Organização do modelo, convenções e checks embutidos",
        "Atalhos e os erros mais comuns que quebram um modelo",
        "O resultado final esperado ao final do curso, e a companhia usada como caso",
      ],
    },
    {
      title: "Módulo 1 — Construção do modelo financeiro",
      summary: "Aulas 1 a 9 · 27 horas em sala.",
      lessons: [
        "Aula 1 — Por que se avalia, e a arquitetura do modelo",
        "Aula 2 — Build-up de receita",
        "Aula 3 — Build-up de custos e despesas",
        "Aula 4 — D&A, imobilizado e capex",
        "Aula 5 — Endividamento, impostos e patrimônio líquido",
        "Aula 6 — Capital de giro",
        "Aula 7 — Fluxo de caixa, revolver e caixa mínimo",
        "Aula 8 — Fechamento do modelo e custo de capital",
        "Aula 9 — FCFF, FCFE e o valor intrínseco",
      ],
    },
    {
      title: "Módulo 2 — Depois da unha",
      summary: "Aula 10 · 3 horas · com professor convidado do mercado.",
      lessons: ["Aula 10 — IA aplicada ao trabalho de análise"],
    },
    {
      title: "Módulo 3 — Do valor ao deal",
      summary: "Aulas 11 a 13 · 9 horas.",
      lessons: [
        "Aula 11 — Múltiplos e comparáveis",
        "Aula 12 — O deal: deal table e de onde vem o retorno",
        "Aula 13 — Alavancagem à brasileira, o que destrói valor e a recomendação",
      ],
    },
  ],

  methodology: [
    {
      title: "Você constrói o modelo inteiro, do zero",
      body: "Nos cursos de referência do mercado, a planilha é pré-requisito ou fica de fora. Aqui ela é o centro do trabalho.",
    },
    {
      title: "Não para no valor da empresa",
      body: "Você monta o deal, calcula TIR e MOIC, decompõe de onde vem o retorno e defende uma recomendação ao comitê — etapa que nenhum curso comparável cobre.",
    },
    {
      title: "Alavancagem à brasileira",
      body: "Em vez do LBO americano, o instrumento que de fato viabiliza alavancagem em deal no Brasil: o seller's finance.",
    },
    {
      title: "Uma companhia aberta real como caso",
      body: "Com fonte primária de verdade — RI, planilha interativa, prospecto, calls de resultado. Você consegue conferir, aprofundar e continuar sozinho depois do curso.",
    },
    {
      title: "Primeiro na unha, depois a ferramenta",
      body: "A aula de IA vem logo depois de fechar o valuation com as próprias mãos — você aplica a IA a um modelo que você mesmo construiu e entende.",
    },
    {
      title: "Chancela e curadoria ABVCAP",
      body: "Conteúdo, corpo docente e caso são curados sob a supervisão institucional da ABVCAP, associação de referência do mercado de Private Equity e Venture Capital no Brasil.",
    },
  ],

  faculty: [
    {
      name: "Pedro Henrique Di Palma, CGA, CGE",
      role: "Diretor e sócio da Unbox Capital",
      bio: "Pedro é diretor e sócio da Unbox Capital, gestora de investimentos de growth com cerca de R$ 1 bilhão sob gestão. No dia a dia, avalia companhias, estrutura investimentos e defende teses no comitê: exatamente o percurso que você vai fazer nas 13 aulas do programa. É certificado pela ANBIMA como gestor de recursos (CGA) e de fundos estruturados (CGE).",
      photo: "/brand/pedro-di-palma.png",
      linkedin: "https://www.linkedin.com/in/pedro-henrique-di-palma-cga-cge-bb912930/",
      quote:
        "Valuation não é uma fórmula: é uma tese que precisa resistir ao comitê. Por isso começamos na unha.",
      companies: [placeholder("LOGO EMPRESA 1"), placeholder("LOGO EMPRESA 2")],
    },
  ],

  testimonials: [
    {
      quote: placeholder("DEPOIMENTO 1"),
      author: placeholder("NOME DO DEPOENTE 1"),
      role: placeholder("CARGO DO DEPOENTE 1"),
      company: placeholder("EMPRESA DO DEPOENTE 1"),
      photo: placeholder("FOTO DO DEPOENTE 1"),
      // Temporary public-domain sample clip to preview the video-testimonial
      // layout — swap for a real recorded testimonial before launch.
      videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    {
      quote: placeholder("DEPOIMENTO 2"),
      author: placeholder("NOME DO DEPOENTE 2"),
      role: placeholder("CARGO DO DEPOENTE 2"),
      company: placeholder("EMPRESA DO DEPOENTE 2"),
      photo: placeholder("FOTO DO DEPOENTE 2"),
    },
    {
      quote: placeholder("DEPOIMENTO 3"),
      author: placeholder("NOME DO DEPOENTE 3"),
      role: placeholder("CARGO DO DEPOENTE 3"),
      company: placeholder("EMPRESA DO DEPOENTE 3"),
      photo: placeholder("FOTO DO DEPOENTE 3"),
    },
  ],

  investment: {
    price: "10000",
    earlyBirdPrice: "9000",
    earlyBirdDeadline: "20 de dezembro de 2026",
    earlyBirdDeadlineISO: "2026-12-20",
    associadoPrice: placeholder("PREÇO ASSOCIADO"),
    associadoEarlyBirdPrice: placeholder("PREÇO ASSOCIADO EARLY BIRD"),
    seatsLimit: "Cerca de 20 vagas",
    nextCohortDate: "16 de fevereiro de 2027",
    workloadHours: "39h em sala + 23h em casa",
    checkoutUrl: "/inscricao",
  },

  faq: [
    {
      question: "O certificado do curso tem reconhecimento no mercado?",
      answer:
        "Sim. O certificado é emitido com a chancela institucional da ABVCAP, reconhecida pelo mercado de Private Equity e Venture Capital no Brasil, e detalha a carga horária e o conteúdo programático do curso.",
    },
    {
      question: "Qual a dedicação de tempo exigida durante o curso?",
      answer:
        "O curso soma cerca de 62 horas: 39 horas em sala (13 aulas de 3 horas, duas vezes por semana, ao longo de cerca de 7 semanas) e mais 23 horas em 8 entregas para fazer em casa. O apoio para essas entregas vai sendo retirado ao longo do curso — é uma dedicação intensa, mas compatível com uma rotina profissional ativa.",
    },
    {
      question: "Qual a diferença entre este curso e um MBA ou uma pós-graduação tradicional em finanças?",
      answer:
        "O curso tem foco exclusivo em valuation aplicado a M&A e PE/VC, com carga horária concentrada e professores atuantes no mercado — não um programa generalista de finanças. É uma formação complementar e mais rápida do que um MBA, voltada a quem já atua ou pretende atuar diretamente com avaliação de empresas e transações.",
    },
    {
      question: "Qual a política de reembolso?",
      answer:
        "O cancelamento pode ser solicitado em até 7 dias corridos após a confirmação do pagamento, com reembolso integral, conforme o direito de arrependimento previsto no Código de Defesa do Consumidor para compras realizadas fora do estabelecimento comercial. Após esse prazo, consulte a equipe da ABVCAP pelo WhatsApp disponível neste site.",
    },
    {
      question: "Preciso ter conhecimento prévio de finanças para acompanhar o curso?",
      answer:
        "O curso pressupõe familiaridade básica com conceitos financeiros e contábeis. Não é necessário ter experiência prévia específica em valuation — o programa constrói o conhecimento técnico a partir dos fundamentos até os casos aplicados de M&A e PE/VC.",
    },
    {
      question: "O curso é presencial ou online?",
      answer:
        "O curso é 100% presencial: 13 aulas de 3 horas cada. Antes do início, uma Aula Zero gravada e gratuita apresenta boas práticas de modelagem no Excel e o resultado final esperado — útil também para quem ainda está decidindo se vai se inscrever.",
    },
  ],
};

export default courseContent;
