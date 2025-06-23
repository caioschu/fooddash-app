import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add validation to ensure environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  global: {
    // Increase timeout to 60 seconds
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        signal: options?.signal || AbortSignal.timeout(60000) // 60 second timeout
      });
    }
  }
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          tipo_usuario: 'restaurante' | 'fornecedor' | 'candidato' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          tipo_usuario: 'restaurante' | 'fornecedor' | 'candidato' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          tipo_usuario?: 'restaurante' | 'fornecedor' | 'candidato' | 'admin';
          updated_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          cnpj: string | null;
          cidade: string;
          estado: string;
          endereco: string | null;
          telefone: string | null;
          categoria_culinaria: string;
          logo_url: string | null;
          descricao: string | null;
          horario_funcionamento: any;
          capacidade_pessoas: number | null;
          area_m2: number | null;
          completude_perfil: number;
          aceita_contato_fornecedores: boolean;
          ativo: boolean;
          pdv_erp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          cnpj?: string | null;
          cidade: string;
          estado: string;
          endereco?: string | null;
          telefone?: string | null;
          categoria_culinaria: string;
          logo_url?: string | null;
          descricao?: string | null;
          horario_funcionamento?: any;
          capacidade_pessoas?: number | null;
          area_m2?: number | null;
          completude_perfil?: number;
          aceita_contato_fornecedores?: boolean;
          ativo?: boolean;
          pdv_erp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          cnpj?: string | null;
          cidade?: string;
          estado?: string;
          endereco?: string | null;
          telefone?: string | null;
          categoria_culinaria?: string;
          logo_url?: string | null;
          descricao?: string | null;
          horario_funcionamento?: any;
          capacidade_pessoas?: number | null;
          area_m2?: number | null;
          completude_perfil?: number;
          aceita_contato_fornecedores?: boolean;
          ativo?: boolean;
          pdv_erp?: string | null;
          updated_at?: string;
        };
      };
      sales_channels: {
        Row: {
          id: string;
          restaurant_id: string;
          nome: string;
          taxa_percentual: number;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          nome: string;
          taxa_percentual?: number;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          nome?: string;
          taxa_percentual?: number;
          ativo?: boolean;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          restaurant_id: string;
          nome: string;
          taxa_percentual: number;
          tem_antecipacao: boolean;
          taxa_antecipacao: number;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          nome: string;
          taxa_percentual?: number;
          tem_antecipacao?: boolean;
          taxa_antecipacao?: number;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          nome?: string;
          taxa_percentual?: number;
          tem_antecipacao?: boolean;
          taxa_antecipacao?: number;
          ativo?: boolean;
        };
      };
      suppliers: {
        Row: {
          id: string;
          user_id: string;
          nome_empresa: string;
          cnpj: string | null;
          cidade: string;
          estado: string;
          endereco: string | null;
          telefone: string;
          email: string;
          categoria_produto: string;
          produtos: any;
          certificacoes: any;
          areas_entrega: any;
          pedido_minimo: number | null;
          prazos_pagamento: any;
          logo_url: string | null;
          descricao: string | null;
          avaliacao_media: number;
          total_avaliacoes: number;
          verificado: boolean;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome_empresa: string;
          cnpj?: string | null;
          cidade: string;
          estado: string;
          endereco?: string | null;
          telefone: string;
          email: string;
          categoria_produto: string;
          produtos?: any;
          certificacoes?: any;
          areas_entrega?: any;
          pedido_minimo?: number | null;
          prazos_pagamento?: any;
          logo_url?: string | null;
          descricao?: string | null;
          avaliacao_media?: number;
          total_avaliacoes?: number;
          verificado?: boolean;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome_empresa?: string;
          cnpj?: string | null;
          cidade?: string;
          estado?: string;
          endereco?: string | null;
          telefone?: string;
          email?: string;
          categoria_produto?: string;
          produtos?: any;
          certificacoes?: any;
          areas_entrega?: any;
          pedido_minimo?: number | null;
          prazos_pagamento?: any;
          logo_url?: string | null;
          descricao?: string | null;
          avaliacao_media?: number;
          total_avaliacoes?: number;
          verificado?: boolean;
          ativo?: boolean;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          user_id: string;
          nome_completo: string;
          cpf: string | null;
          telefone: string;
          cidade: string;
          estado: string;
          data_nascimento: string | null;
          experiencia_anos: number | null;
          areas_interesse: any;
          experiencia_anterior: string | null;
          curriculo_url: string | null;
          disponibilidade: 'imediata' | '15dias' | '30dias' | null;
          salario_pretendido: number | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome_completo: string;
          cpf?: string | null;
          telefone: string;
          cidade: string;
          estado: string;
          data_nascimento?: string | null;
          experiencia_anos?: number | null;
          areas_interesse?: any;
          experiencia_anterior?: string | null;
          curriculo_url?: string | null;
          disponibilidade?: 'imediata' | '15dias' | '30dias' | null;
          salario_pretendido?: number | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome_completo?: string;
          cpf?: string | null;
          telefone?: string;
          cidade?: string;
          estado?: string;
          data_nascimento?: string | null;
          experiencia_anos?: number | null;
          areas_interesse?: any;
          experiencia_anterior?: string | null;
          curriculo_url?: string | null;
          disponibilidade?: 'imediata' | '15dias' | '30dias' | null;
          salario_pretendido?: number | null;
          ativo?: boolean;
          updated_at?: string;
        };
      };
      job_postings: {
        Row: {
          id: string;
          restaurant_id: string;
          titulo: string;
          cargo: string;
          descricao: string;
          requisitos: any;
          beneficios: any;
          cidade: string;
          estado: string;
          horario_escala: string | null;
          salario_min: number | null;
          salario_max: number | null;
          tipo_contrato: 'clt' | 'pj' | 'temporario' | 'estagio' | null;
          contato_preferencial: 'whatsapp' | 'email' | 'ambos' | null;
          contato_whatsapp: string | null;
          contato_email: string | null;
          ativa: boolean;
          expira_em: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          titulo: string;
          cargo: string;
          descricao: string;
          requisitos?: any;
          beneficios?: any;
          cidade: string;
          estado: string;
          horario_escala?: string | null;
          salario_min?: number | null;
          salario_max?: number | null;
          tipo_contrato?: 'clt' | 'pj' | 'temporario' | 'estagio' | null;
          contato_preferencial?: 'whatsapp' | 'email' | 'ambos' | null;
          contato_whatsapp?: string | null;
          contato_email?: string | null;
          ativa?: boolean;
          expira_em?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          titulo?: string;
          cargo?: string;
          descricao?: string;
          requisitos?: any;
          beneficios?: any;
          cidade?: string;
          estado?: string;
          horario_escala?: string | null;
          salario_min?: number | null;
          salario_max?: number | null;
          tipo_contrato?: 'clt' | 'pj' | 'temporario' | 'estagio' | null;
          contato_preferencial?: 'whatsapp' | 'email' | 'ambos' | null;
          contato_whatsapp?: string | null;
          contato_email?: string | null;
          ativa?: boolean;
          expira_em?: string | null;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          candidate_id: string;
          job_posting_id: string;
          status: 'pendente' | 'visualizada' | 'aceita' | 'rejeitada';
          observacoes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_posting_id: string;
          status?: 'pendente' | 'visualizada' | 'aceita' | 'rejeitada';
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          job_posting_id?: string;
          status?: 'pendente' | 'visualizada' | 'aceita' | 'rejeitada';
          observacoes?: string | null;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          restaurant_id: string;
          data: string;
          canal: string;
          forma_pagamento: string;
          valor_bruto: number;
          valor_liquido: number | null;
          numero_pedidos: number;
          ticket_medio: number | null;
          taxa_canal: number | null;
          taxa_pagamento: number | null;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          data: string;
          canal: string;
          forma_pagamento: string;
          valor_bruto: number;
          valor_liquido?: number | null;
          numero_pedidos?: number;
          ticket_medio?: number | null;
          taxa_canal?: number | null;
          taxa_pagamento?: number | null;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          data?: string;
          canal?: string;
          forma_pagamento?: string;
          valor_bruto?: number;
          valor_liquido?: number | null;
          numero_pedidos?: number;
          ticket_medio?: number | null;
          taxa_canal?: number | null;
          taxa_pagamento?: number | null;
          observacoes?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          restaurant_id: string;
          data: string;
          nome: string;
          categoria: string;
          subcategoria: string | null;
          tipo: 'fixa' | 'variavel' | 'marketing' | 'taxa_automatica';
          valor: number;
          forma_pagamento: string | null;
          canal: string | null;
          recorrente: boolean;
          origem_automatica: boolean;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          data: string;
          nome: string;
          categoria: string;
          subcategoria?: string | null;
          tipo: 'fixa' | 'variavel' | 'marketing' | 'taxa_automatica';
          valor: number;
          forma_pagamento?: string | null;
          canal?: string | null;
          recorrente?: boolean;
          origem_automatica?: boolean;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          data?: string;
          nome?: string;
          categoria?: string;
          subcategoria?: string | null;
          tipo?: 'fixa' | 'variavel' | 'marketing' | 'taxa_automatica';
          valor?: number;
          forma_pagamento?: string | null;
          canal?: string | null;
          recorrente?: boolean;
          origem_automatica?: boolean;
          observacoes?: string | null;
        };
      };
      benchmarking: {
        Row: {
          id: string;
          cidade: string;
          estado: string;
          categoria_culinaria: string;
          ticket_medio: number;
          margem_media: number;
          cmv_medio: number;
          gasto_fixo_medio: number;
          ponto_equilibrio_medio: number;
          taxa_media_venda: number;
          gasto_marketing_medio: number;
          total_restaurantes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cidade: string;
          estado: string;
          categoria_culinaria: string;
          ticket_medio: number;
          margem_media: number;
          cmv_medio: number;
          gasto_fixo_medio: number;
          ponto_equilibrio_medio: number;
          taxa_media_venda: number;
          gasto_marketing_medio: number;
          total_restaurantes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cidade?: string;
          estado?: string;
          categoria_culinaria?: string;
          ticket_medio?: number;
          margem_media?: number;
          cmv_medio?: number;
          gasto_fixo_medio?: number;
          ponto_equilibrio_medio?: number;
          taxa_media_venda?: number;
          gasto_marketing_medio?: number;
          total_restaurantes?: number;
          updated_at?: string;
        };
      };
      simulated_benchmarks: {
        Row: {
          id: string;
          regiao: string;
          categoria_culinaria: string;
          ticket_medio: number;
          margem_media: number;
          cmv_medio: number;
          gasto_fixo_medio: number;
          ponto_equilibrio_medio: number;
          taxa_media_venda: number;
          gasto_marketing_medio: number;
          total_restaurantes: number;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          regiao: string;
          categoria_culinaria: string;
          ticket_medio: number;
          margem_media: number;
          cmv_medio: number;
          gasto_fixo_medio: number;
          ponto_equilibrio_medio: number;
          taxa_media_venda: number;
          gasto_marketing_medio: number;
          total_restaurantes: number;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          regiao?: string;
          categoria_culinaria?: string;
          ticket_medio?: number;
          margem_media?: number;
          cmv_medio?: number;
          gasto_fixo_medio?: number;
          ponto_equilibrio_medio?: number;
          taxa_media_venda?: number;
          gasto_marketing_medio?: number;
          total_restaurantes?: number;
          ativo?: boolean;
          updated_at?: string;
        };
      };
      benchmark_settings: {
        Row: {
          id: string;
          use_real_data: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          use_real_data?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          use_real_data?: boolean;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          status: string;
          plan_name: string;
          plan_price: number;
          plan_interval: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          status: string;
          plan_name: string;
          plan_price: number;
          plan_interval: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          status?: string;
          plan_name?: string;
          plan_price?: number;
          plan_interval?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
      };
      stripe_customers: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string;
          email?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          stripe_payment_intent_id: string;
          amount: number;
          currency: string;
          status: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          stripe_payment_intent_id: string;
          amount: number;
          currency?: string;
          status: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          stripe_payment_intent_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          description?: string;
          created_at?: string;
        };
      };
    };
  };
};