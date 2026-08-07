import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FieldSelect } from "./Monitoramento.styled";
import { useMonitoramento } from "./MonitoramentoLayout";

/**
 * O filtro de escopo de UMA aba — irmão de `useFiltroFrente`, mesma ideia:
 * estado próprio por aba, sem seletor global no topo.
 *
 * Diferente da frente, o escopo NÃO tem trava de visão (§7.5 é só sobre
 * frente) — qualquer um que enxerga o Monitoramento pode filtrar por
 * qualquer escopo do catálogo, sem gate de `pode()`. O que ESTREITA as
 * opções (não a segurança, o backend já resolve isso sozinho) é a frente
 * efetiva: um `?frente_id=` escolhido no filtro irmão, ou — pra gerente, que
 * não escolhe, fica sempre travado — a própria frente dele. Sem isso, a
 * lista oferecia escopo de outra frente que o resultado nunca ia poder
 * mostrar (o backend zera silenciosamente).
 *
 * @param frenteEfetiva o `frenteId` que a aba está usando agora (do filtro
 *   irmão `useFiltroFrente`), pra estreitar as opções de escopo junto.
 */
export function useFiltroEscopo(frenteEfetiva: number | null) {
  const { usuario } = useAuth();
  const { escopos, minhasFrentes } = useMonitoramento();
  const [escopoId, setEscopoId] = useState<number | null>(null);

  const frentesRelevantes =
    frenteEfetiva != null
      ? [frenteEfetiva]
      : usuario?.posicao === "gerente"
        ? minhasFrentes
        : null;

  const opcoes = frentesRelevantes
    ? escopos.filter((e) => e.frente_id != null && frentesRelevantes.includes(e.frente_id))
    : escopos;

  // Trocar a frente pode deixar o escopo escolhido fora da lista nova — some
  // a opção sem avisar, e o filtro continuaria "aplicado" a um escopo que
  // nem aparece mais pra escolher de novo.
  useEffect(() => {
    if (escopoId != null && !opcoes.some((e) => e.id === escopoId)) setEscopoId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frenteEfetiva]);

  return {
    escopoId,
    seletor: (
      <FieldSelect
        value={escopoId ? String(escopoId) : ""}
        onChange={(e) => setEscopoId(e.target.value ? Number(e.target.value) : null)}
        aria-label="Filtrar por escopo"
      >
        <option value="">Todos os escopos</option>
        {opcoes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </FieldSelect>
    ),
  };
}
