/**
 * As permissões da tabela do §3 (9 das 10 — "aprovar reajuste" saiu em
 * 2026-08-06 junto com a feature de reajuste, removida) + as 4 que a
 * estenderam depois, editáveis na tela de Cargos.
 *
 * A `posicao` da pessoa define só o PADRÃO com que o cargo dela nasce; daí em
 * diante quem decide é a caixa.
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
  /** 7. Criar tarefa */
  pode_criar_tarefa: boolean;
  /** 8. Mover e editar tarefa */
  pode_mover_editar_tarefa: boolean;
  /** 9. Ver os próprios projetos */
  pode_ver_proprios_projetos: boolean;
  /** 10. Monitoramento e alocação */
  pode_ver_monitoramento: boolean;
  /** Administrar a Avaliação de Desempenho (lotes, avaliadores, mentoria, PDI). */
  pode_administrar_desempenho: boolean;
  /** Editar os formulários de Avaliação de Desempenho — mais sensível que
   *  administrar, porque muda o que todo mundo é avaliado. */
  pode_editar_formularios_desempenho: boolean;
  /** Ver o Núcleo (visão executiva de bancas por gestão). */
  pode_ver_nucleo: boolean;
  /** Administrar Configurações e Calendários base — inclusive editar cargos,
   *  a mais sensível: quem tem essa caixa pode conceder (ou tirar) qualquer
   *  permissão de qualquer cargo, inclusive o próprio. */
  pode_administrar_configuracoes: boolean;
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
  /** 1º a 8º semestre da graduação — `null` pra quem não é aluno em curso
   *  (diretoria, gerência já formada etc). */
  semestre_graduacao: number | null;
  /**
   * Carga atual da pessoa (§7.3): projetos em que ela está alocada hoje,
   * sem contar os finalizados nem os arquivados.
   */
  projetos_alocados: number;
}