import { useState } from "react";
import { FieldSelect } from "./Monitoramento.styled";
import { useMonitoramento } from "./MonitoramentoLayout";

/**
 * O filtro de escopo de UMA aba — irmão de `useFiltroFrente`, mesma ideia:
 * estado próprio por aba, sem seletor global no topo.
 *
 * Diferente da frente, o escopo NÃO tem trava de visão (§7.5 é só sobre
 * frente) — qualquer um que enxerga o Monitoramento pode filtrar por
 * qualquer escopo do catálogo, sem gate de `pode()`.
 */
export function useFiltroEscopo() {
  const { escopos } = useMonitoramento();
  const [escopoId, setEscopoId] = useState<number | null>(null);

  return {
    escopoId,
    seletor: (
      <FieldSelect
        value={escopoId ? String(escopoId) : ""}
        onChange={(e) => setEscopoId(e.target.value ? Number(e.target.value) : null)}
        aria-label="Filtrar por escopo"
      >
        <option value="">Todos os escopos</option>
        {escopos.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </FieldSelect>
    ),
  };
}
