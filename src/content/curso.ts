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
  audienceIntro: string;
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
  }[];
  testimonials: {
    quote: string;
    author: string;
    company: string;
  }[];
  investment: {
    price: string;
    earlyBirdPrice: string;
    earlyBirdDeadline: string;
    /**
     * Exclusive end instant of the early-bird window (pricing uses
     * `now < deadline`). An explicit BRT offset, set to the START of the day
     * after `earlyBirdDeadline`, so early-bird holds through all of that day
     * in Brasília time — a bare "YYYY-MM-DD" would parse as UTC midnight
     * (21:00 BRT the day before).
     */
    earlyBirdDeadlineISO: string;
    associadoPrice: string;
    associadoEarlyBirdPrice: string;
    seatsLimit: string;
    nextCohortDate: string;
    schedule: string;
    workloadHours: string;
    location: string;
    checkoutUrl: string;
  };
  faq: { question: string; answer: string }[];
}

export const courseContent: CourseContent = {
  // Temporary number provided by the client on 2026-10-21.
  whatsappNumber: "5511991480203",
  whatsappMessage:
    "Olá, tenho interesse em saber mais sobre o curso de Modelagem Financeira e Valuation. ABVCAP — Aprenda com quem faz.",
  socialLinks: {
    linkedin: "https://www.linkedin.com/company/abvcap/",
    youtube: "https://www.youtube.com/@ABVCAPVideos",
  },
  hero: {
    eyebrow: "Aprenda com quem faz",
    headlineLines: [
      "Modelagem Financeira e Valuation:",
      "A abordagem de private equity aplicada a um caso real, do valuation ao closing.",
    ],
    subheadline:
      "Da primeira linha de receita à recomendação ao comitê de investimento. Em 13 encontros presenciais, o aluno terá a oportunidade de construir o modelo financeiro de uma companhia real e estruturar a transação sob a ótica de private equity, utilizando a IA como potencializadora da análise.",
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

  audienceIntro:
    "Para profissionais e estudantes que atuam ou desejam atuar no mercado financeiro, em especial em private equity, venture capital, investment banking e M&A. O curso pressupõe base em contabilidade e finanças.",
  audienceProfiles: [
    {
      title: "Private equity e venture capital",
      pain: "Analistas e associados de gestoras que avaliam empresas e estruturam investimentos.",
    },
    {
      title: "Investment banking e M&A",
      pain: "Profissionais que assessoram transações e precisam dominar a modelagem e o valuation.",
    },
    {
      title: "CFOs e controllers",
      pain: "Executivos de finanças que lidam com investidores, captações e processos de venda.",
    },
    {
      title: "Consultores de gestão",
      pain: "Profissionais de consultoria que apoiam decisões de investimento, reestruturações e transações.",
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
      title: "Módulo 2 — Uso de IA para valuation",
      summary: "Aula 10 · 3 horas em sala.",
      lessons: ["Aula 10 — IA aplicada ao trabalho de análise"],
    },
    {
      title: "Módulo 3 — Elaboração da transação e recomendação de investimento",
      summary: "Aulas 11 a 13 · 9 horas em sala.",
      lessons: [
        "Aula 11 — Múltiplos e comparáveis",
        "Aula 12 — O deal: deal table e de onde vem o retorno",
        "Aula 13 — Alavancagem à brasileira, o que destrói valor e a recomendação",
      ],
    },
  ],

  methodology: [
    {
      title: "Do valuation ao deal",
      body: "Valuation, estruturação da transação, cálculo de TIR e MOIC, análise das fontes de valor e recomendação ao comitê de investimento.",
    },
    {
      title: "Caso real",
      body: "Uma companhia aberta brasileira, analisada do início ao fim, com base em fontes primárias.",
    },
    {
      title: "IA aplicada",
      body: "Uso de inteligência artificial como potencializador das análises.",
    },
  ],

  faculty: [
    {
      name: "Pedro Henrique Di Palma, CGA, CGE",
      role: "Diretor e sócio da Unbox Capital",
      bio: "Pedro é diretor da Unbox Capital, gestora de growth equity com cerca de R$ 1 bilhão sob gestão. Em mais de 10 anos de mercado — entre investment banking, crédito, private equity e venture capital — realizou 12 investimentos em empresas privadas, alocando mais de R$ 600 milhões; participou de três IPOs, que somaram mais de R$ 7 bilhões em ofertas; e assessorou M&As que passam de R$ 700 milhões.\n\nNo dia a dia, faz exatamente o que você vai fazer nas 13 aulas: modela a companhia, estrutura o deal e defende a tese no comitê de investimento. E vai além: depois do cheque, senta no conselho das investidas para tirar do papel o plano de criação de valor.\n\nJá ensina valuation na ABVCAP, no programa Aprenda com Quem Faz o Mercado Financeiro. É certificado pela ANBIMA como gestor de recursos (CGA) e de fundos estruturados (CGE).",
      photo: "/brand/pedro-di-palma.png",
      linkedin: "https://www.linkedin.com/in/pedro-henrique-di-palma-cga-cge-bb912930/",
      quote:
        "Valuation não é uma fórmula: é uma tese que precisa resistir ao comitê. Por isso começamos pela construção do modelo, do zero.",
    },
  ],

  testimonials: [
    {
      quote:
        "Minha experiência está sendo ótima. Tenho participado de todas as aulas e acredito que os temas foram escolhidos com muito cuidado, de forma a contribuir para a aplicabilidade dos conhecimentos no nosso dia a dia. Além disso, as aulas têm uma abordagem bastante didática, o que facilita o entendimento dos conteúdos desde o início.",
      author: "Suzana Shiraishi",
      company: "TMF Group",
    },
    {
      quote:
        "A minha primeira impressão do curso foi muito boa. Já fiz alguns outros cursos mais tradicionais sobre Venture Capital e Private Equity, mas o diferencial deste é que aqui temos pessoas que ensinam e que vivem o mercado na prática. Não é só teoria, pelo contrário, é muito mais sobre a experiência de mercado e aquilo que está, e não está, nos livros.",
      author: "Yuri Nico",
      company: "Bbutton Ventures",
    },
  ],

  investment: {
    price: "8500",
    earlyBirdPrice: "7650",
    earlyBirdDeadline: "04 de dezembro de 2026",
    earlyBirdDeadlineISO: "2026-12-05T00:00:00-03:00",
    associadoPrice: "6800",
    associadoEarlyBirdPrice: "6120",
    seatsLimit: "Cerca de 20 vagas",
    nextCohortDate: "16 de fevereiro de 2027",
    schedule: "Segundas e quintas, às 19h",
    workloadHours: "39h em sala + 23h em casa",
    location: "São Paulo",
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
        "O curso soma cerca de 62 horas: 39 horas em sala (13 aulas de 3 horas, às segundas e quintas, 19h, ao longo de cerca de 7 semanas) e mais 23 horas em 8 entregas para fazer em casa. O apoio para essas entregas vai sendo retirado ao longo do curso — é uma dedicação intensa, mas compatível com uma rotina profissional ativa.",
    },
    {
      question: "Qual a diferença entre este curso e um MBA ou uma pós-graduação tradicional em finanças?",
      answer:
        "O curso tem foco exclusivo em valuation aplicado a M&A e PE/VC, com carga horária concentrada e professores atuantes no mercado — não um programa generalista de finanças. É uma formação complementar e mais rápida do que um MBA, voltada a quem já atua ou pretende atuar diretamente com avaliação de empresas e transações.",
    },
    {
      question: "Qual a política de reembolso?",
      answer:
        "O cancelamento pode ser solicitado em até 7 dias corridos após a confirmação do pagamento, com reembolso integral, conforme o direito de arrependimento previsto no Código de Defesa do Consumidor. Após esse prazo e até o início da turma, o reembolso é parcial (retenção de 10% a título de taxa administrativa); após o início, não há reembolso em dinheiro, mas é possível transferir a inscrição para a turma seguinte. Veja os detalhes completos na Política de Reembolso, disponível no rodapé deste site.",
    },
    {
      question: "Preciso ter conhecimento prévio de finanças para acompanhar o curso?",
      answer:
        "O curso pressupõe familiaridade básica com conceitos financeiros e contábeis. Não é necessário ter experiência prévia específica em valuation — o programa constrói o conhecimento técnico a partir dos fundamentos até os casos aplicados de M&A e PE/VC.",
    },
    {
      question: "O curso é presencial ou online?",
      answer:
        "O curso é 100% presencial: 13 aulas de 3 horas cada, às segundas e quintas, 19h. Antes do início, uma Aula Zero online, gravada e gratuita, apresenta boas práticas de modelagem no Excel e o resultado final esperado — útil também para quem ainda está decidindo se vai se inscrever.",
    },
  ],
};

export default courseContent;
