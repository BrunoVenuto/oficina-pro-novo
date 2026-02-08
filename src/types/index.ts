export type StatusOS = 'aberta' | 'em_andamento' | 'aguardando_peca' | 'concluida' | 'entregue';
export type TipoItem = 'servico' | 'peca';
export type TipoFoto = 'antes' | 'durante' | 'depois';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf_cnpj?: string;
  endereco?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Veiculo {
  id: string;
  cliente_id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano?: number;
  cor?: string;
  created_at: string;
  user_id: string;
  cliente?: Cliente;
}

export interface OrdemServico {
  id: string;
  numero: number;
  cliente_id: string;
  veiculo_id: string;
  status: StatusOS;
  problema_relatado: string;
  km: number;
  combustivel: number;
  valor_total: number;
  previsao_entrega?: string;
  data_entrada: string;
  data_conclusao?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  cliente?: Cliente;
  veiculo?: Veiculo;

  // Extra fields used in localDb and UI
  mao_de_obra?: number;
  paid_at?: string | null;
  delivered_at?: string | null;
  itens?: any[];
  timeline?: any[];
}

export interface OSChecklist {
  id: string;
  os_id: string;
  item: string;
  checked: boolean;
  ordem: number;
  created_at: string;
}

export interface OSItem {
  id: string;
  os_id: string;
  tipo: TipoItem;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  created_at: string;
}

export interface OSFoto {
  id: string;
  os_id: string;
  tipo: TipoFoto;
  url: string;
  created_at: string;
}

export interface OSTimeline {
  id: string;
  os_id: string;
  evento: string;
  created_at: string;
  user_id?: string;
}


export type OrdemServicoExtra = {
  mao_de_obra?: number;
  paid_at?: string | null;
  delivered_at?: string | null;
};
