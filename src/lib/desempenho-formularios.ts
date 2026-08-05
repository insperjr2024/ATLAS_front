import { apiFetch } from "@/lib/api";
import type { DesempenhoFormulario, DesempenhoPapel, DesempenhoTipo, DesempenhoTipoResposta } from "@/types/desempenho";

export function getFormulario(tipo: DesempenhoTipo, papel: DesempenhoPapel, token: string) {
  return apiFetch<DesempenhoFormulario>(`/desempenho/formularios/${tipo}/${papel}`, { token });
}

interface CriterioInput {
  id?: number;
  label: string;
  descricao?: string | null;
  tipo_resposta: DesempenhoTipoResposta;
  limite_caracteres?: number | null;
}

interface SecaoInput {
  id?: number;
  titulo: string;
  descricao?: string | null;
  criterios: CriterioInput[];
}

export function updateFormulario(
  tipo: DesempenhoTipo,
  papel: DesempenhoPapel,
  payload: Partial<{
    nota_geral_titulo: string;
    nota_geral_descricao: string;
    comentarios_titulo: string;
    comentarios_descricao: string;
    comentarios_aviso: string;
    secoes: SecaoInput[];
  }>,
  token: string,
) {
  return apiFetch<DesempenhoFormulario>(`/desempenho/formularios/${tipo}/${papel}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}
