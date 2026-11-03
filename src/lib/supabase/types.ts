export type PedidoStatus = "pending" | "approved" | "rejected" | "cancelled";
export type PaymentMethod = "credit_card" | "pix";

export interface AssociadoRow {
  id: string;
  cnpj: string;
  razao_social: string | null;
  ativo: boolean;
  created_at: string;
}

export interface CupomRow {
  id: string;
  codigo: string;
  percentual_desconto: number;
  ativo: boolean;
  valido_de: string | null;
  valido_ate: string | null;
  limite_uso: number | null;
  usos_atuais: number;
  criado_por: string;
  created_at: string;
}

export interface PedidoRow {
  id: string;
  mp_payment_id: string | null;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cnpj_informado: string | null;
  is_associado: boolean;
  cupom_codigo: string | null;
  valor_base: number;
  valor_cobrado: number;
  status: PedidoStatus;
  payment_method: PaymentMethod | null;
  created_at: string;
  updated_at: string;
}
