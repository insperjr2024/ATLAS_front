import { apiFetch } from "@/lib/api";

export type TipoEvento = "banca" | "kickoff" | "reuniao" | "entrega" | "prova";

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
 * O calendário geral (§6.5) — recortado por posição no backend (diretor vê
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
  prova: "Prova",
};

export const COR_TIPO: Record<TipoEvento, string> = {
  banca: "#D03985",
  kickoff: "#397AD0",
  reuniao: "#39D09E",
  entrega: "#D07539",
  prova: "#7839D0",
};

const CHAVE_CORES_CUSTOM = "atlas:calendario:cores";

/**
 * A cor de cada tipo de evento é customizável POR NAVEGADOR (`localStorage`),
 * não por conta — é uma preferência de leitura, não um dado que precise
 * sincronizar entre dispositivos ou aparecer pra outras pessoas. Evita a
 * tabela e o endpoint que uma preferência de conta exigiria, pra algo que só
 * muda como a MESMA informação é desenhada.
 */
export function getCoresCustomizadas(): Partial<Record<TipoEvento, string>> {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CORES_CUSTOM);
    return bruto ? JSON.parse(bruto) : {};
  } catch {
    return {};
  }
}

export function salvarCoresCustomizadas(cores: Partial<Record<TipoEvento, string>>): void {
  try {
    window.localStorage.setItem(CHAVE_CORES_CUSTOM, JSON.stringify(cores));
  } catch {
    // Modo privado ou quota cheia: a cor escolhida ainda vale pra sessão
    // atual (já está no state React), só não sobrevive a um F5.
  }
}
