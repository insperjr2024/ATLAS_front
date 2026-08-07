import type { Posicao, StatusUsuario, Usuario } from "@/types/auth";

/**
 * A tabela de permissões do §3 do briefing, num lugar só.
 *
 * Nenhum botão da aplicação deve fazer `if (usuario.posicao === "diretor")`
 * solto: todos consultam `pode()`. E o backend revalida tudo — esconder o
 * botão é conveniência de UI, não segurança.
 */
export type Acao =
  | "arquivar_projeto"
  | "apagar_projeto_permanente"
  | "mudar_status_projeto"
  | "mover_projeto_kanban"
  | "remarcar_banca"
  | "liberar_excecao_choque"
  | "registrar_justificativa_atraso"
  | "configurar_colunas"
  | "registrar_reuniao"
  | "filtrar_por_frente"
  | "ver_tarefas_gerais"
  | "ver_cronogramas_gerais";

const MATRIZ: Record<Acao, Posicao[]> = {
  // Gestão — restrito às lideranças
  arquivar_projeto: ["diretor", "gerente"],

  // Só a diretoria
  /** Sem volta — mais pesado que arquivar, por isso não é diretor+gerente. */
  apagar_projeto_permanente: ["diretor"],
  remarcar_banca: ["diretor"],
  liberar_excecao_choque: ["diretor"],
  registrar_justificativa_atraso: ["diretor"],
  filtrar_por_frente: ["diretor"],
  /** O kanban de projetos muda o ciclo de vida por arrasto — mais informal
   *  que os botões de `mudar_status_projeto`, por isso fica restrito à
   *  diretoria, mesmo o botão equivalente aceitando gerente/coordenador. */
  mover_projeto_kanban: ["diretor"],
  //: As colunas do kanban são por projeto, mas quem as edita é sempre a
  //: diretoria — o time move cards, não redesenha o fluxo.
  configurar_colunas: ["diretor"],
  /** O board macro de tarefas (todos os projetos juntos) — o backend usa
   *  require_diretor, não require_gestao: mais informal que os números
   *  agregados do resto do Monitoramento, então fica só pra diretoria. */
  ver_tarefas_gerais: ["diretor"],
  /** O board macro de cronogramas (todos os projetos juntos) — mesma trava
   *  do board de tarefas: o backend usa require_diretor. */
  ver_cronogramas_gerais: ["diretor"],

  // Condução do projeto — o consultor não define cronograma nem move o
  // ciclo de vida do projeto (§4)
  mudar_status_projeto: ["diretor", "gerente", "coordenador"],

  // Todo mundo (a regra de herança do §3 já está refletida aqui)
  registrar_reuniao: ["diretor", "gerente", "coordenador", "consultor"],

  // As 10 ações da tabela do §3 saíram desta matriz: viraram caixas de CARGO,
  // editáveis na tela de Cargos (a posição agora só define o padrão com que o
  // cargo nasce). Deixá-las aqui criaria uma segunda fonte de verdade
  // divergindo do backend — foi o que já aconteceu uma vez.
  // O que sobrou aqui é o que ficou FORA da tabela e segue travado por posição.
};

export function pode(usuario: Usuario | null | undefined, acao: Acao): boolean {
  if (!usuario) return false;
  return MATRIZ[acao].includes(usuario.posicao);
}

/** Diretor, gerente e coordenador. Consultor não é liderança. */
export function ehLideranca(usuario: Usuario | null | undefined): boolean {
  return !!usuario && usuario.posicao !== "consultor";
}

export const ROTULO_POSICAO: Record<Posicao, string> = {
  diretor: "Diretor(a)",
  gerente: "Gerente de frente",
  coordenador: "Coordenador(a)",
  consultor: "Consultor(a)",
};

/**
 * §10: os dois modos de sair são distintos e não podem virar um booleano só.
 * `ex_membro` sai por vontade própria ou fim de gestão e mantém o histórico;
 * `desligado` perde o acesso. Em ambos, a participação em projetos passados
 * continua íntegra.
 */
export const ROTULO_STATUS_USUARIO: Record<StatusUsuario, string> = {
  ativo: "Ativo",
  ex_membro: "Ex-membro",
  desligado: "Desligado",
};

/**
 * Coordenador e consultor enxergam só os projetos em que estão alocados —
 * para eles o menu diz "Meus projetos" (§6.1).
 */
export function rotuloProjetos(usuario: Usuario | null | undefined): string {
  return usuario && ehLideranca(usuario) && usuario.posicao !== "coordenador"
    ? "Projetos"
    : "Meus projetos";
}
