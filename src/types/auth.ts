export interface Cargo {
  id: number;
  nome: string;
  pode_definir_formulario: boolean;
  pode_agendar_banca: boolean;
  pode_gerenciar_cargos: boolean;
}

export interface Usuario {
  id: number;
  nome: string;
  email_insper: string;
  cargo: Cargo;
  ativo: boolean;
}