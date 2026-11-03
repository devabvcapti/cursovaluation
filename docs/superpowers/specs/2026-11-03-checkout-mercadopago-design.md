# Checkout Mercado Pago — Venda Direta do Curso Valuation

## Contexto e objetivo

Hoje a landing page do Curso Valuation (ABVCAP) não vende nada diretamente: o CTA principal ("Quero me matricular") redireciona o visitante para uma página de inscrição em uma plataforma de eventos de terceiros (Glueup — `https://abvcap.glueup.com/event/199072/register/`), onde o pagamento de fato acontece. O spec original do site (`2026-10-19-landing-valuation-design.md`) excluiu explicitamente checkout embutido ("Não há checkout embutido no site").

Este documento reverte essa decisão: o site passa a vender o curso diretamente, com checkout do **Mercado Pago embutido na própria página** (Checkout Bricks), substituindo completamente o link da Glueup no fluxo de venda.

Fora isso, surgiu um requisito de negócio importante durante o desenho: o curso tem **preço diferenciado para empresas associadas à ABVCAP** (valor menor) vs. não associadas (valor cheio), identificado pelo CNPJ informado no checkout contra uma base de associados mantida no Supabase. Também foi incluído suporte a **cupons de desconto percentuais**, geridos por uma área de admin própria no site.

O formulário de captura de lead existente (baixar ementa por e-mail, `LeadCaptureForm` → `/api/lead`) **continua existindo em paralelo**, sem alterações — ele não faz parte deste trabalho.

## Decisões de escopo (confirmadas com o usuário)

- Modelo de cobrança: **pagamento único** (à vista ou parcelado no cartão). Sem assinatura/recorrência.
- Meios de pagamento: **cartão de crédito + Pix**. Sem boleto.
- Checkout **substitui completamente** o link da Glueup — Glueup sai do fluxo de venda.
- Abordagem técnica: **Mercado Pago Checkout Bricks** (formulário de pagamento embutido na própria página via SDK oficial, iframe seguro — sem redirecionar o visitante para fora do site).
- Rota dedicada de checkout: **`/inscricao`** (não embutido dentro da seção `Investment` da landing).
- Preço diferenciado por CNPJ associado, com base carregada no Supabase via **upload manual (CSV)** — sem sincronização automática com o Omie por enquanto.
- Campo CNPJ no checkout é **opcional**: em branco ou não encontrado na base → preço cheio (não bloqueia a compra).
- Persistência própria de pedidos em **Supabase** (não depender só do painel do Mercado Pago como registro).
- **Cupons de desconto percentuais**, com área de **admin no próprio site** (não só gerenciado direto no Supabase), protegida por login **e-mail/senha via Supabase Auth**.
- Toda criação de cupom registra **quem criou** (`criado_por`, e-mail do admin logado).

## Preços

`src/content/curso.ts` ganha dois campos novos em `investment`, espelhando o padrão que `price`/`earlyBirdPrice` já usam (string numérica, ou `placeholder(...)` enquanto o valor real não é definido):

- `associadoPrice` — preço cheio para associado. Valor real ainda não definido → fica como `placeholder("PREÇO ASSOCIADO")` até a ABVCAP confirmar.
- `associadoEarlyBirdPrice` — preço early-bird para associado (mesma janela/data limite do early-bird de não associado: 20 de dezembro de 2026). Também `placeholder("PREÇO ASSOCIADO EARLY BIRD")` por enquanto.

Também é adicionado `earlyBirdDeadlineISO: "2026-12-20"` — gêmeo machine-readable de `earlyBirdDeadline` (que continua só para exibição, em português), necessário porque o cálculo de preço em código precisa comparar a data atual com o prazo do early-bird, o que o texto livre atual não permite fazer de forma confiável.

Enquanto `associadoPrice`/`associadoEarlyBirdPrice` forem placeholders, uma compra marcada como associada cai de volta no preço de não associado (cheio ou early-bird, conforme a data) em vez de falhar — com um aviso no log do servidor —, já que negar desconto por um valor ainda não definido é mais seguro do que travar a venda.

## Modelo de dados (Supabase)

### `associados`
| Campo | Tipo | Observação |
|---|---|---|
| `cnpj` | texto (só dígitos) | chave única |
| `razao_social` | texto | opcional, só pra conferência do CSV |
| `ativo` | boolean | default `true` |
| `created_at` | timestamp | |

Carregada por upload manual de CSV (fora do app — processo operacional, não uma tela no site).

### `cupons`
| Campo | Tipo | Observação |
|---|---|---|
| `codigo` | texto | único, ex: `BLACKFRIDAY10` |
| `percentual_desconto` | numérico | ex: `10` = 10% |
| `ativo` | boolean | |
| `valido_de` | timestamp | opcional — sem data = sem início definido |
| `valido_ate` | timestamp | opcional — sem data = sem limite |
| `limite_uso` | inteiro | opcional — `null` = ilimitado |
| `usos_atuais` | inteiro | incrementado a cada pedido **aprovado** que usar o código |
| `criado_por` | texto | e-mail do admin (Supabase Auth) que criou o cupom |
| `created_at` | timestamp | |

### `pedidos`
| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid | |
| `mp_payment_id` | texto | id do pagamento no Mercado Pago; nullable até o Brick ser submetido e `POST /api/checkout/pagamento` efetivar a cobrança |
| `nome`, `email`, `cpf`, `telefone` | texto | dados do comprador |
| `cnpj_informado` | texto | nullable |
| `is_associado` | boolean | resultado do lookup em `associados` no momento da compra |
| `cupom_codigo` | texto | nullable — código aplicado, se houver |
| `valor_base` | numérico | preço antes do cupom (associado ou cheio) |
| `valor_cobrado` | numérico | preço final, já com cupom aplicado — **travado no momento da criação**, nunca recalculado depois |
| `status` | enum/texto | `pending` \| `approved` \| `rejected` \| `cancelled` |
| `payment_method` | texto | `credit_card` \| `pix` |
| `created_at`, `updated_at` | timestamp | |

Preço e condição de associado ficam congelados no pedido para que mudanças futuras na base de associados ou no cupom não alterem retroativamente o valor que a pessoa efetivamente pagou.

## Fluxo de compra

1. Visitante clica em "Quero me matricular" (Hero e seção `Investment`) → navega para `/inscricao` (rota nova, em vez do link externo da Glueup).
2. **Passo 1 — dados do comprador:** nome, e-mail, CPF, telefone, CNPJ (opcional), cupom (opcional). Ao preencher o CNPJ e/ou cupom, o frontend chama o backend para recalcular o preço mostrado (base → associado/não associado → desconto do cupom), para o comprador ver o valor final antes de pagar.
3. Ao confirmar o passo 1, o frontend chama `POST /api/checkout/pedido`, que:
   - resolve `is_associado` (lookup em `associados`) e `cupom` (validação de vigência/limite de uso),
   - calcula `valor_base` e `valor_cobrado`,
   - grava o registro em `pedidos` com `status: pending`,
   - devolve o `pedidoId` e o `valor_cobrado`, usados para inicializar o Brick com o valor correto.
4. **Passo 2 — pagamento:** o Payment Brick do Mercado Pago (componente oficial, **não** o modelo "Checkout Pro"/preference com redirecionamento) é renderizado na própria página `/inscricao`, oferecendo cartão (com parcelamento) ou Pix (QR code). O Brick tokeniza o cartão (ou monta os dados do Pix) inteiramente no navegador — nenhum dado sensível passa pelo nosso servidor — e devolve esse payload tokenizado (`formData`) para o site via callback `onSubmit`. O site então envia esse `formData` + o `pedidoId` para `POST /api/checkout/pagamento`, que chama a API de Pagamentos do Mercado Pago (`POST /v1/payments`, com `external_reference` = `pedidoId`) para efetivar a cobrança e atualiza `pedidos` com o resultado imediato (`approved`/`in_process`/`rejected`) e o `mp_payment_id`. Para Pix, a resposta dessa chamada também traz o QR code a ser exibido.
5. Resultado do pagamento é tratado **na mesma rota**, via query param (`/inscricao?status=approved&pedido=...`, etc.), sem páginas separadas de sucesso/erro/pendente.
   - Cartão: aprovação quase imediata.
   - Pix: UI mostra "aguardando confirmação do Pix" e faz polling leve em `GET /api/checkout/pedido/:id` até o webhook confirmar ou o Pix expirar.
6. `POST /api/webhooks/mercadopago` recebe as notificações assíncronas do Mercado Pago (fonte de verdade — importante sobretudo para Pix, cuja confirmação não é imediata), valida a assinatura (`MERCADOPAGO_WEBHOOK_SECRET`), localiza o pedido pelo `mp_payment_id`, atualiza `status`. Quando o novo status é `approved`:
   - incrementa `usos_atuais` do cupom, se houver,
   - dispara e-mail de confirmação ao aluno e notificação interna à ABVCAP (reaproveitando a infraestrutura de e-mail já existente via Resend).
   - Idempotente: reprocessar o mesmo `mp_payment_id` não duplica e-mails nem incrementa o cupom duas vezes.

## Área de admin de cupons

- Rota protegida `/admin/cupons`, atrás de login **Supabase Auth** (e-mail/senha). Só contas cadastradas manualmente no Supabase Auth (equipe ABVCAP) têm acesso — sem auto-cadastro público.
- Middleware/guard de rota redireciona para tela de login quando não autenticado.
- Funcionalidades: listar cupons, criar cupom (código, percentual, validade, limite de uso), ativar/desativar, ver `usos_atuais` e `criado_por`.
- Fora de escopo: edição de valor já usado/histórico de uso detalhado por pedido (fica disponível indiretamente via `pedidos.cupom_codigo` no Supabase, sem tela dedicada).

## Conteúdo a atualizar

- Seção `Investment` (`src/components/sections/Investment.tsx`) e Hero: CTA passa a apontar para `/inscricao`, não mais para a URL da Glueup.
- FAQ: a resposta sobre política de cancelamento/reembolso hoje remete à "política comercial da plataforma de matrícula" (Glueup) — precisa ser reescrita para refletir a política direta da ABVCAP/Mercado Pago.
- `termos-de-uso` e `politica-de-privacidade`: já são páginas "em elaboração" (placeholder), sem texto jurídico real hoje — ficam como estão; redigir a política real (incluindo processamento de pagamento via Mercado Pago) é trabalho jurídico fora do escopo deste plano de engenharia.
- `src/content/curso.ts`: preço, preço de associado e qualquer texto que hoje assuma o fluxo via Glueup.

## Variáveis de ambiente novas

- `MERCADOPAGO_ACCESS_TOKEN` — secreta, servidor, usada para chamar a API de Pagamentos do Mercado Pago e consultar pagamentos.
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` — pública, inicializa o Brick no navegador.
- `MERCADOPAGO_WEBHOOK_SECRET` — valida assinatura das notificações recebidas.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — servidor, acesso a `associados`/`pedidos`/`cupons` (nunca expostas ao cliente).
- `SUPABASE_ANON_KEY` / config de Supabase Auth — necessária para o login client-side da área `/admin`.
- Ambientes de teste (sandbox) do Mercado Pago usados em dev/preview; credenciais de produção só na Vercel de produção (e futuramente Hostinger).

## Tratamento de erros / casos de borda

- CNPJ não encontrado na base → segue como não associado, preço cheio, não bloqueia a compra.
- Cupom inválido/expirado/esgotado → aviso na UI, segue sem desconto, não bloqueia a compra.
- Cartão recusado → Brick mostra o erro nativo do Mercado Pago, mantém os dados do passo 1 preenchidos para nova tentativa.
- Pix expirado → pedido fica `cancelled`, usuário pode gerar um novo a partir do passo 1.
- Webhook duplicado/fora de ordem → idempotente por `mp_payment_id`.
- Falha ao enviar e-mail de confirmação não reverte o pagamento (já aprovado pelo Mercado Pago) — só loga erro para investigação manual, como já acontece hoje com a notificação interna de lead.

## Testes

- Unitários: cálculo de preço (associado + cupom empilhados, na ordem correta), validação dos campos do passo 1, validação da assinatura do webhook, lógica de cupom (vigência/limite de uso).
- Mock do SDK do Mercado Pago nos testes automatizados — sem chamadas reais à API.
- Teste manual de ponta a ponta no ambiente sandbox do Mercado Pago (cartão de teste aprovado, cartão recusado, Pix de teste) antes de qualquer liberação em produção.

## Fora de escopo (por agora)

- Controle de vagas esgotadas / overselling.
- Nota fiscal ou integração automática com o Omie (associados continuam entrando via CSV manual).
- Cupons de valor fixo ou "preço fixo próprio" — só percentual, por decisão deste desenho.
- Sincronização automática da base de associados.
- Relatórios/dashboard de vendas dentro do admin (fica a consulta direta no Supabase, se necessário).
