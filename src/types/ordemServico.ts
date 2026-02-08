export type OrdemServicoStatus =
  | "aberta"
  | "aguardando_peca"
  | "concluida"
  | "entregue";

export type OrdemServico = {
  id: string;
  numero: string;

  cliente_id: string;
  veiculo_id: string;
  user_id: string;

  status: OrdemServicoStatus;

  itens: {
    descricao: string;
    valor: number;
  }[];

  mao_de_obra?: number;

  valor_total: number;

  createdAt: string; // ISO
  updatedAt?: string;

  // Datas financeiras
  paid_at?: string | null; // quando foi paga
  delivered_at?: string | null; // quando foi entregue
  data_conclusao?: string | null; // fallback histórico

  // Previsão (opcional)
  data_prevista_entrega?: string | null; // YYYY-MM-DD
};
