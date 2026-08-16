import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { pode } from "@/utils/permissoes";
import { FiltroSelect, FrenteTravadaAviso } from "./Monitoramento.styled";
import { useMonitoramento } from "./MonitoramentoLayout";

/**
 * O filtro de frente de UMA aba.
 *
 * **Cada aba tem o seu, e não há mais um global no topo.** O seletor único
 * ficava longe do conteúdo, quem descia até a tabela não via qual frente
 * estava escolhida, e o número na tela parecia o do núcleo inteiro. Perto do
 * card, o recorte se lê junto com o dado que ele recorta.
 *
 * Efeito colateral aceito: trocar de aba não leva o filtro junto. É o preço de
 * cada aba ter memória própria, e resolve o caso comum de olhar Atrasos de uma
 * frente e Alocação do núcleo todo sem ficar re-selecionando.
 *
 * Quem **decide** é o backend. Mesmo que um gerente forje um `?frente_id=`,
 * `aplicar_recorte_visao` restringe às frentes dele, esconder o seletor aqui
 * é conveniência de UI, não segurança ("o gerente fica travado na própria
 * frente").
 */
export function useFiltroFrente() {
  const { usuario } = useAuth();
  const { frentes } = useMonitoramento();
  const [frenteId, setFrenteId] = useState<number | null>(null);

  const podeFiltrar = pode(usuario, "filtrar_por_frente");

  return {
    /** O que vai para a API. `null` quando não pode filtrar: o backend já
     *  restringe o gerente à frente dele sem precisar do parâmetro. */
    frenteId: podeFiltrar ? frenteId : null,
    /** Só o campo. Quem posiciona é a aba, dentro da `BarraFiltros` que ela
     *  compartilha com os outros filtros. */
    seletor: podeFiltrar ? (
      <FiltroSelect
        value={frenteId ? String(frenteId) : ""}
        onChange={(e) => setFrenteId(e.target.value ? Number(e.target.value) : null)}
        aria-label="Filtrar por frente"
      >
        <option value="">Todas as frentes</option>
        {frentes.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nome}
          </option>
        ))}
      </FiltroSelect>
    ) : (
      <FrenteTravadaAviso>Visão restrita à sua frente</FrenteTravadaAviso>
    ),
  };
}
