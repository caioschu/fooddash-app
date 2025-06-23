export interface User {
  id: string;
  email: string;
  tipo_usuario: 'restaurante' | 'fornecedor' | 'candidato' | 'admin';
  created_at: string;
}

export interface Restaurant {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  categoria_culinaria: string;
  logo_url?: string;
  canais_de_venda: Canal[];
  formas_pagamento: FormaPagamento[];
  completude_perfil: number;
  aceita_contato_fornecedores: boolean;
}

export interface Canal {
  nome: string;
  taxa: number;
}

export interface FormaPagamento {
  nome: string;
  taxa: number;
}

export interface Sale {
  id: string;
  restaurante_id: string;
  data: string;
  canal: string;
  forma_pagamento: string;
  valor_bruto: number;
  numero_pedidos?: number;
  observacoes?: string;
}

export interface Expense {
  id: string;
  restaurante_id: string;
  data: string;
  nome: string;
  categoria: string;
  subcategoria?: string;
  tipo: 'fixa' | 'variavel' | 'marketing' | 'taxa_automatica';
  valor: number;
  forma_pagamento: string;
  canal?: string;
  recorrente: boolean;
  origem_automatica: boolean;
}

export interface Supplier {
  id: string;
  nome_empresa: string;
  cnpj?: string;
  cidade: string;
  estado: string;
  categoria_produto: string;
  email: string;
  telefone: string;
  logo_url?: string;
}

export interface JobPosting {
  id: string;
  restaurante_id: string;
  cargo: string;
  descricao: string;
  cidade: string;
  estado: string;
  horario_escala: string;
  faixa_salarial?: string;
  contato_preferencial: string;
  ativa: boolean;
}

export interface Candidate {
  id: string;
  nome_completo: string;
  cidade: string;
  estado: string;
  telefone: string;
  area_interesse: string;
  experiencia_anterior?: string;
  curriculo_url?: string;
}

export interface Benchmarking {
  cidade: string;
  categoria_culinaria: string;
  ticket_medio: number;
  margem_media: number;
  cmv_medio: number;
  gasto_fixo_medio: number;
  ponto_equilibrio_medio: number;
  taxa_media_venda: number;
  gasto_marketing_medio: number;
}