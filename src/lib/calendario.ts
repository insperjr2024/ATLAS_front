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
 * O calendário geral (§6.5) — **sem recorte de visão**, todos veem tudo.
 *
 * Consequência de UX que o §6.5 não menciona: um consultor pode ver o kickoff
 * de um projeto de outra equipe, mas `GET /projetos/{id}` devolveria 404 para
 * ele. Por isso a resposta já traz `projeto_nome` — a tela abre um modal com
 * o que tem, em vez de navegar para um erro.
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

/** Glifo + cor, nunca cor sozinha — o calendário também é impresso. */
export const GLIFO_TIPO: Record<TipoEvento, string> = {
  banca: "★",
  kickoff: "🏁",
  reuniao: "▲",
  entrega: "●",
};

export const COR_TIPO: Record<TipoEvento, string> = {
  banca: "#D03985",
  kickoff: "#397AD0",
  reuniao: "#39D09E",
  entrega: "#D07539",
};
