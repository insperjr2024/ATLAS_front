export interface Cargo {
  id: number;
  nome: string;
  pode_definir_formulario: boolean;
  pode_agendar_banca: boolean;
  pode_gerenciar_cargos: boolean;
}

/** Os 4 perfis do §3. Distinto de `Cargo`, que são as permissões do módulo de bancas. */
export type Posicao = "diretor" | "gerente" | "coordenador" | "consultor";

/** §10 — sair por vontade própria (ex_membro) é diferente de ser desligado. */
export type StatusUsuario = "ativo" | "ex_membro" | "desligado";

export interface Usuario {
  id: number;
  nome: string;
  email_insper: string;
  cargo: Cargo;
  posicao: Posicao;
  status: StatusUsuario;
  ativo: boolean;
}

// Forma "crua" devolvida por GET /usuarios e GET /usuarios/{id}: cargo_id
// solto, sem o objeto Cargo aninhado (só o /auth/me + AuthContext resolve
// e monta o Usuario completo, pro usuário logado).
export interface UsuarioFrente {
  id: number;
  usuario_id: number;
  frente_id: number;
}

export interface UsuarioResumo {
  id: number;
  nome: string;
  email_insper: string;
  cargo_id: number;
  posicao: Posicao;
  status: StatusUsuario;
  ativo: boolean;
}