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

// Forma "crua" devolvida por GET /usuarios e GET /usuarios/{id}: cargo_id
// solto, sem o objeto Cargo aninhado (só o /auth/me + AuthContext resolve
// e monta o Usuario completo, pro usuário logado).
export interface UsuarioResumo {
  id: number;
  nome: string;
  email_insper: string;
  cargo_id: number;
  ativo: boolean;
}