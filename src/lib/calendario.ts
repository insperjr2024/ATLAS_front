import { apiFetch } from "@/lib/api";

export type TipoEvento = "banca" | "kickoff" | "reuniao" | "entrega";

export interface EventoCalendario {
  tipo: TipoEvento;
  data: string;
  /** Vazio em banca legada, que não tem projeto vinculado. */
  projeto_id: number | null;
  projeto_nome: string;
  titulo: string;
  referencia_id: number;
  status: string | null;
}

/**
 * O calendário geral, recortado por posição no backend (diretor vê
 * tudo, gerente a própria frente, coordenador/consultor só os projetos em
 * que estão alocados), igual ao resto do site.
 *
 * A resposta sempre traz `projeto_nome`, mesmo quando o front não precisa
 * mais navegar pro projeto: o modal de detalhe mostra o que já veio aqui,
 * sem depender de uma segunda chamada.
 */
export function getEventos(inicio: string, fim: string, token: string, tipos?: TipoEvento[]) {
  const filtro = tipos && tipos.length > 0 ? `&tipos=${tipos.join(",")}` : "";
  return apiFetch<EventoCalendario[]>(
    `/calendario/eventos?inicio=${inicio}&fim=${fim}${filtro}`,
    { token },
  );
}

export const ROTULO_TIPO: Record<TipoEvento, string> = {
  banca: "Banca",
  kickoff: "Kickoff",
  reuniao: "Reunião",
  entrega: "Entrega",
};

/** Glifo + cor, nunca cor sozinha, o calendário também é impresso.
 *  Símbolos tipográficos, não emoji: precisam renderizar igual em qualquer
 *  fonte/SO e não competir visualmente com o resto da tela. */
export const GLIFO_TIPO: Record<TipoEvento, string> = {
  banca: "★",
  kickoff: "■",
  reuniao: "▲",
  entrega: "●",
};

export const COR_TIPO: Record<TipoEvento, string> = {
  banca: "#D03985",
  kickoff: "#397AD0",
  reuniao: "#39D09E",
  entrega: "#D07539",
};
