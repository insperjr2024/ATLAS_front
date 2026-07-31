// Campos vindos direto da tabela `banca`
export interface BancaBase {
  id: number;
  nome_projeto: string;
  escopo_id: number;
  coordenador_id: number;
  data_hora: string; // ISO 8601
}

// Campos calculados que a API adiciona em GET /bancas e GET /bancas/{id}
// (não existem no banco — ver seção "Campos calculados" do schema)
export interface Banca extends BancaBase {
  status: "aberta para inscrições" | "realizada";
  vagas: number;
  alocados: number;
  semestre_id: number;
  semestre_nome: string;
}

export interface Candidatura {
  id: number;
  banca_id: number;
  usuario_id: number;
  criado_em: string;
  confirmado: boolean;
}

export interface Desempenho {
  semestre_id: number;
  semestre_nome: string;
  bancas_atendidas: number;
  total_bancas_realizadas: number;
  percentual: number;
}