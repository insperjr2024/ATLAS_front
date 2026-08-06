/**
 * As 10 permissões da tabela do §3, editáveis na tela de Cargos.
 *
 * A `posicao` da pessoa define só o PADRÃO com que o cargo dela nasce; daí em
 * diante quem decide é a caixa. O que ficou fora da tabela (formulário de
 * banca, núcleo/configurações, cargos e Avaliação de Desempenho) continua
 * travado por posição no backend.
 */
export interface Cargo {
  id: number;
  nome: string;
  /** 1. Criar projeto e alocar equipe */
  pode_criar_projeto: boolean;
  /** 2. Editar a equipe de um projeto */
  pode_editar_equipe: boolean;
  /** 3. Gerir membros (posição e status) */
  pode_gerir_membros: boolean;
  /** 4. Marcar kickoff e data de entrega */
  pode_marcar_kickoff: boolean;
  /** 5. Definir cronograma por escopo (etapas, banca) */
  pode_definir_cronograma: boolean;
  /** 6. Aprovar reajuste de cronograma */
  pode_aprovar_reajuste: boolean;
  /** 7. Criar tarefa */
  pode_criar_tarefa: boolean;
  /** 8. Mover e editar tarefa */
  pode_mover_editar_tarefa: boolean;
  /** 9. Ver os próprios projetos */
  pode_ver_proprios_projetos: boolean;
  /** 10. Monitoramento e alocação */
  pode_ver_monitoramento: boolean;
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
  /**
   * ⭐ A senha atual é a provisória que veio no e-mail de cadastro, e a pessoa
   * ainda não escolheu a dela. Enquanto for `true`, o `PrivateRoute` manda
   * para `/definir-senha` — e o backend recusa qualquer outra rota com 403.
   */
  senha_provisoria: boolean;
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
  /** 1º a 8º semestre da graduação — `null` pra quem não é aluno em curso
   *  (diretoria, gerência já formada etc). */
  semestre_graduacao: number | null;
  /** Ainda não fez o primeiro acesso — a tela de Membros marca essas linhas. */
  senha_provisoria: boolean;
  /**
   * Carga atual da pessoa (§7.3): projetos em que ela está alocada hoje,
   * sem contar os finalizados nem os arquivados.
   */
  projetos_alocados: number;
}