import { placeholder } from "@/lib/placeholder";

export interface CourseContent {
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
  faculty: { name: string; role: string; bio: string; photo: string }[];
  community: { title: string; body: string };
  testimonials: {
    quote: string;
    author: string;
    role: string;
    company: string;
    photo: string;
  }[];
  investment: {
    price: string;
    earlyBirdPrice: string;
    earlyBirdDeadline: string;
    seatsLimit: string;
    nextCohortDate: string;
    workloadHours: string;
    checkoutUrl: string;
  };
  faq: { question: string; answer: string }[];
}

export const courseContent: CourseContent = {
  hero: {
    eyebrow: "Aprenda com quem faz",
    headlineLines: ["Valuation:", "o método por trás", "das decisões que movem capital."],
    subheadline:
      "Programa híbrido de avaliação de empresas para profissionais de M&A, Private Equity, Venture Capital e finanças corporativas — aulas presenciais e online, construídas a partir de casos reais de transações do mercado brasileiro.",
    checkoutUrl: placeholder("URL DA PLATAFORMA DE VENDAS"),
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
    "Construir e sustentar um modelo de fluxo de caixa descontado (DCF) completo, com premissas defensáveis.",
    "Aplicar múltiplos de mercado e de transações comparáveis com critério, evitando armadilhas de comparabilidade.",
    "Avaliar cenários de M&A, incluindo sinergias, estrutura de capital e seu impacto no valuation.",
    "Conduzir e interpretar due diligence financeira sob a ótica de quem avalia, não apenas de quem auditoria.",
    "Negociar valuation e cláusulas contratuais — earn-out, múltiplos de ajuste, garantias — com base técnica.",
    "Identificar os principais vieses e armadilhas metodológicas que distorcem laudos e pareceres de avaliação.",
  ],

  curriculumModules: [
    {
      title: "Fundamentos de Valuation",
      summary:
        "Base conceitual e os princípios que sustentam qualquer avaliação, antes de abrir uma planilha.",
      lessons: [
        "Valor x preço: a distinção que todo investidor profissional precisa dominar",
        "Panorama das metodologias de avaliação e quando aplicar cada uma",
        "Estrutura de capital, custo de capital e taxa de desconto",
        "Fontes de dados e qualidade da informação em mercados emergentes",
      ],
    },
    {
      title: "Fluxo de Caixa Descontado (DCF)",
      summary: "Construção completa de um modelo de DCF, da projeção operacional ao valor presente.",
      lessons: [
        "Projeção de receita, margens e capital de giro",
        "WACC: construção e sensibilidade das premissas",
        "Valor terminal: métodos e armadilhas comuns",
        "Stress test e análise de sensibilidade do modelo",
      ],
    },
    {
      title: "Múltiplos e Transações Comparáveis",
      summary: "Avaliação relativa com rigor: como escolher, ajustar e defender comparáveis.",
      lessons: [
        "Critérios de seleção de empresas e transações comparáveis",
        "Múltiplos de receita, EBITDA e lucro: quando cada um se aplica",
        "Ajustes de comparabilidade e prêmios de controle",
        "Combinando DCF e múltiplos em um valuation defensável",
      ],
    },
    {
      title: "Valuation em M&A",
      summary: "Como a avaliação muda quando a transação está na mesa.",
      lessons: [
        "Sinergias operacionais e financeiras: quantificação e alocação",
        "Estrutura de capital pós-transação e seu efeito no valuation",
        "Earn-outs, múltiplos de ajuste e mecanismos de preço",
        "Estudos de caso reais de M&A no mercado brasileiro",
      ],
    },
    {
      title: "Due Diligence Financeira",
      summary: "A avaliação não termina no modelo — ela é testada na due diligence.",
      lessons: [
        "Qualidade de lucros (quality of earnings) e normalizações",
        "Capital de giro normalizado e ajustes de caixa e dívida",
        "Red flags financeiros que mudam o valuation",
        "Integração entre due diligence e revisão do modelo de avaliação",
      ],
    },
    {
      title: "Negociação e Defesa do Valuation",
      summary: "Levar a avaliação da planilha para a mesa de negociação.",
      lessons: [
        "Como apresentar e defender premissas de valuation a comitês e contrapartes",
        "Negociação de cláusulas ligadas a valuation (earn-out, claw-back, garantias)",
        "Comunicação de valuation para investidores e conselhos",
        "Estudo de caso integrado: da avaliação ao fechamento da transação",
      ],
    },
  ],

  methodology: [
    {
      title: "Formato híbrido, pensado para quem está no mercado",
      body: "Aulas presenciais concentram discussão de casos e networking; o ambiente online aprofunda a construção técnica dos modelos — sem exigir que você se afaste da rotina profissional por semanas.",
    },
    {
      title: "Casos reais de M&A e Private Equity",
      body: "Cada módulo parte de transações e situações reais do mercado brasileiro de M&A e PE/VC, discutidas com as mesmas restrições de informação e tempo enfrentadas pelos profissionais envolvidos.",
    },
    {
      title: "Chancela e curadoria ABVCAP",
      body: "Conteúdo, corpo docente e casos são curados sob a supervisão institucional da ABVCAP, associação de referência do mercado de Private Equity e Venture Capital no Brasil.",
    },
  ],

  faculty: [
    {
      name: placeholder("NOME DO PROFESSOR 1"),
      role: placeholder("CARGO E EMPRESA DO PROFESSOR 1"),
      bio: placeholder("BIO DO PROFESSOR 1"),
      photo: placeholder("FOTO DO PROFESSOR 1"),
    },
    {
      name: placeholder("NOME DO PROFESSOR 2"),
      role: placeholder("CARGO E EMPRESA DO PROFESSOR 2"),
      bio: placeholder("BIO DO PROFESSOR 2"),
      photo: placeholder("FOTO DO PROFESSOR 2"),
    },
    {
      name: placeholder("NOME DO PROFESSOR 3"),
      role: placeholder("CARGO E EMPRESA DO PROFESSOR 3"),
      bio: placeholder("BIO DO PROFESSOR 3"),
      photo: placeholder("FOTO DO PROFESSOR 3"),
    },
  ],

  community: {
    title: "Rede e comunidade ABVCAP",
    body: "Ao concluir o curso, você passa a integrar a rede de relacionamento da ABVCAP — acesso a eventos, grupos de discussão e à comunidade de gestoras, investidores e profissionais de PE/VC que sustentam o ecossistema de M&A no Brasil.",
  },

  testimonials: [
    {
      quote: placeholder("DEPOIMENTO 1"),
      author: placeholder("NOME DO DEPOENTE 1"),
      role: placeholder("CARGO DO DEPOENTE 1"),
      company: placeholder("EMPRESA DO DEPOENTE 1"),
      photo: placeholder("FOTO DO DEPOENTE 1"),
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
    price: placeholder("PREÇO"),
    earlyBirdPrice: placeholder("PREÇO EARLY BIRD"),
    earlyBirdDeadline: placeholder("DATA LIMITE EARLY BIRD"),
    seatsLimit: placeholder("NÚMERO DE VAGAS"),
    nextCohortDate: placeholder("DATA DA PRÓXIMA TURMA"),
    workloadHours: placeholder("CARGA HORÁRIA"),
    checkoutUrl: placeholder("URL DA PLATAFORMA DE VENDAS"),
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
        "O formato híbrido foi desenhado para profissionais em atividade: encontros presenciais concentrados e módulos online com flexibilidade de horário. É possível conciliar o curso com uma rotina profissional intensa, sem abrir mão da profundidade técnica.",
    },
    {
      question: "Qual a diferença entre este curso e um MBA ou uma pós-graduação tradicional em finanças?",
      answer:
        "O curso tem foco exclusivo em valuation aplicado a M&A e PE/VC, com carga horária concentrada e professores atuantes no mercado — não um programa generalista de finanças. É uma formação complementar e mais rápida do que um MBA, voltada a quem já atua ou pretende atuar diretamente com avaliação de empresas e transações.",
    },
    {
      question: "Qual a política de reembolso?",
      answer:
        "Solicitações de cancelamento e reembolso seguem a política comercial da plataforma de matrícula, informada no momento da inscrição. Consulte os termos completos antes de confirmar a matrícula.",
    },
    {
      question: "Preciso ter conhecimento prévio de finanças para acompanhar o curso?",
      answer:
        "O curso pressupõe familiaridade básica com conceitos financeiros e contábeis. Não é necessário ter experiência prévia específica em valuation — o programa constrói o conhecimento técnico a partir dos fundamentos até os casos aplicados de M&A e PE/VC.",
    },
    {
      question: "Como funciona o formato híbrido (presencial e online)?",
      answer:
        "As aulas presenciais concentram discussão de casos, networking e sessões práticas; os módulos online aprofundam a construção dos modelos de avaliação, com flexibilidade para assistir no seu ritmo dentro do cronograma da turma.",
    },
  ],
};

export default courseContent;
