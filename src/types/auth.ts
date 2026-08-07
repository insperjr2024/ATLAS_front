/**
 * As permissões da tabela do §3 (9 das 10 — "aprovar reajuste" saiu em
 * 2026-08-06 junto com a feature de reajuste, removida) + as 4 que a
 * estenderam depois. Editáveis por POSIÇÃO (`GET /posicoes-permissoes`) —
 * até 2026-08-07 eram editáveis por um catálogo de "cargo" separado, que
 * foi removido: a distinção não sobrevivia ao uso real (dava pra marcar uma
 * caixa "Admin" numa pessoa sem isso mudar quais projetos ela via).
 * ("Ver o Núcleo" existiu brevemente como uma extensão a mais, mas a página
 * em si foi substituída pelo Dashboard Bancas antes de a permissão chegar a
 * ser usada.)
 */
export interface Permissoes {
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
  // ⚠ `pode_aprovar_reajuste` foi removido: decidir os pedidos de dias (§8) é
  // da POSIÇÃO diretor, não de uma caixa de cargo. O backend derrubou a coluna
  // na migration 1556cc590a06, e a rota cobra `require_diretor`.
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
  /** Administrar Configurações e Calendários base — inclusive editar as
   *  permissões de todas as posições, a mais sensível: quem tem essa caixa
   *  pode conceder (ou tirar) qualquer permissão de qualquer posição,
   *  inclusive a própria. */
  pode_administrar_configuracoes: boolean;
  /** A única caixa que muda QUAIS projetos aparecem — as outras nunca tocam
   *  no recorte de visão (coordenador/consultor continuam só vendo onde
   *  estão alocados mesmo com todas marcadas). Quem tem esta é tratado como
   *  diretor só para fins de visão de projetos. */
  pode_ver_todos_projetos: boolean;
}

/** Os 4 perfis do §3 — desde 2026-08-07 a única dimensão de permissão. */
export type Posicao = "diretor" | "gerente" | "coordenador" | "consultor";

/** Uma linha de `GET /posicoes-permissoes`: as 13 caixas de UMA posição. */
export interface PosicaoPermissao extends Permissoes {
  posicao: Posicao;
}

/** §10 — sair por vontade própria (ex_membro) é diferente de ser desligado. */
export type StatusUsuario = "ativo" | "ex_membro" | "desligado";

export interface Usuario {
  id: number;
  nome: string;
  email_insper: string;
  permissoes: Permissoes;
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

export interface UsuarioFrente {
  id: number;
  usuario_id: number;
  frente_id: number;
}

export interface UsuarioResumo {
  id: number;
  nome: string;
  email_insper: string;
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
