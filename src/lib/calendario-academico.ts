import { apiFetch } from "@/lib/api";

/**
 * O calendário acadêmico do Insper — a carga que **define o dia útil** (§5.4).
 *
 * Sem estes dados, `contar_dias_uteis` só exclui fim de semana, e toda a
 * contagem do sistema fica errada por feriado e semana de prova. É por isso
 * que este é o passo 1 do roteiro de demo.
 */

export type TipoDiaNaoLetivo = "feriado" | "prova" | "recesso" | "outro";

export interface DiaNaoLetivo {
  id: number;
  semestre_id: number;
  data: string;
  tipo: TipoDiaNaoLetivo;
  descricao: string | null;
}

export interface Semestre {
  id: number;
  nome: string;
  inicio: string;
  fim: string;
  status: "ativa" | "arquivada";
}

export const ROTULO_TIPO_DIA: Record<TipoDiaNaoLetivo, string> = {
  feriado: "Feriado",
  prova: "Semana de provas",
  recesso: "Recesso",
  outro: "Outro",
};

export function getSemestres(token: string) {
  return apiFetch<Semestre[]>("/semestres", { token });
}

export function createSemestre(
  dados: { nome: string; inicio: string; fim: string },
  token: string,
) {
  return apiFetch<Semestre>("/semestres", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/** Arquivar a gestão (§12) — os indicadores reiniciam na próxima. */
export function updateSemestre(
  semestreId: number,
  dados: { status?: "ativa" | "arquivada"; nome?: string; inicio?: string; fim?: string },
  token: string,
) {
  return apiFetch<Semestre>(`/semestres/${semestreId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

export function getDiasNaoLetivos(semestreId: number, token: string) {
  return apiFetch<DiaNaoLetivo[]>(`/semestres/${semestreId}/dias-nao-letivos`, { token });
}

export interface DiaNaoLetivoPayload {
  data: string;
  tipo: TipoDiaNaoLetivo;
  descricao?: string | null;
}

export interface ResultadoCarga {
  semestre_id: number;
  criados: number;
  /** Datas que já estavam carregadas — a rota é idempotente por (semestre, data). */
  ignorados: number;
  dias: DiaNaoLetivo[];
}

/** Carga em lote — o calendário inteiro do semestre de uma vez. */
export function carregarDiasNaoLetivos(
  semestreId: number,
  dias: DiaNaoLetivoPayload[],
  token: string,
) {
  return apiFetch<ResultadoCarga>(`/semestres/${semestreId}/dias-nao-letivos`, {
    method: "POST",
    token,
    body: JSON.stringify({ dias }),
  });
}

export function deleteDiaNaoLetivo(diaId: number, token: string) {
  return apiFetch(`/dias-nao-letivos/${diaId}`, { method: "DELETE", token });
}

export function limparDiasNaoLetivos(semestreId: number, token: string) {
  return apiFetch(`/semestres/${semestreId}/dias-nao-letivos`, { method: "DELETE", token });
}

/**
 * Interpreta a colagem de um calendário: uma linha por dia, nos formatos
 * `dd/mm/aaaa; tipo; descrição` ou `aaaa-mm-dd, tipo, descrição`.
 *
 * O §11 do briefing prevê leitura de imagem por OCR para a GRADE HORÁRIA
 * (coisa diferente, e fora desta entrega). Aqui é só colar texto — que é
 * como a diretoria recebe o calendário do Insper.
 */
export function interpretarColagem(texto: string): {
  dias: DiaNaoLetivoPayload[];
  erros: string[];
} {
  const dias: DiaNaoLetivoPayload[] = [];
  const erros: string[] = [];

  texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((linha, indice) => {
      const partes = linha.split(/[;,\t]/).map((p) => p.trim());
      const data = normalizarData(partes[0]);
      if (!data) {
        erros.push(`Linha ${indice + 1}: não entendi a data "${partes[0]}"`);
        return;
      }
      const tipoBruto = (partes[1] ?? "feriado").toLowerCase();
      const tipo: TipoDiaNaoLetivo = (
        ["feriado", "prova", "recesso", "outro"] as const
      ).includes(tipoBruto as TipoDiaNaoLetivo)
        ? (tipoBruto as TipoDiaNaoLetivo)
        : "outro";
      dias.push({ data, tipo, descricao: partes[2] || null });
    });

  return { dias, erros };
}

function normalizarData(bruto: string | undefined): string | null {
  if (!bruto) return null;
  const iso = bruto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return bruto;
  const br = bruto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, d, m, a] = br;
    return `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}
