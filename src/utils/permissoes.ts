import type { Posicao, Usuario } from "@/types/auth";

/**
 * A tabela de permissões do §3 do briefing, num lugar só.
 *
 * Nenhum botão da aplicação deve fazer `if (usuario.posicao === "diretor")`
 * solto: todos consultam `pode()`. E o backend revalida tudo — esconder o
 * botão é conveniência de UI, não segurança.
 */
export type Acao =
  | "criar_projeto"
  | "editar_equipe"
  | "gerir_membros"
  | "marcar_kickoff"
  | "mudar_status_projeto"
  | "definir_cronograma"
  | "aprovar_reajuste"
  | "remarcar_banca"
  | "liberar_excecao_choque"
  | "registrar_justificativa_atraso"
  | "criar_tarefa"
  | "mover_tarefa"
  | "registrar_reuniao"
  | "ver_monitoramento"
  | "filtrar_por_frente";

const MATRIZ: Record<Acao, Posicao[]> = {
  // Gestão — restrito às lideranças
  criar_projeto: ["diretor", "gerente"],
  editar_equipe: ["diretor", "gerente"],
  ver_monitoramento: ["diretor", "gerente"],

  // Só a diretoria
  gerir_membros: ["diretor"],
  aprovar_reajuste: ["diretor"],
  remarcar_banca: ["diretor"],
  liberar_excecao_choque: ["diretor"],
  registrar_justificativa_atraso: ["diretor"],
  filtrar_por_frente: ["diretor"],

  // Condução do projeto — o consultor não define cronograma nem move o
  // ciclo de vida do projeto (§4)
  definir_cronograma: ["diretor", "gerente", "coordenador"],
  mudar_status_projeto: ["diretor", "gerente", "coordenador"],

  // Todo mundo (a regra de herança do §3 já está refletida aqui)
  marcar_kickoff: ["diretor", "gerente", "coordenador", "consultor"],
  criar_tarefa: ["diretor", "gerente", "coordenador", "consultor"],
  mover_tarefa: ["diretor", "gerente", "coordenador", "consultor"],
  registrar_reuniao: ["diretor", "gerente", "coordenador", "consultor"],
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
 * Coordenador e consultor enxergam só os projetos em que estão alocados —
 * para eles o menu diz "Meus projetos" (§6.1).
 */
export function rotuloProjetos(usuario: Usuario | null | undefined): string {
  return usuario && ehLideranca(usuario) && usuario.posicao !== "coordenador"
    ? "Projetos"
    : "Meus projetos";
}
