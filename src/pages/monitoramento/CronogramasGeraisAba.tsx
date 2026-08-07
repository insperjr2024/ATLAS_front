import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCronogramasGerais, type CronogramasGerais, type EscopoCritico } from "@/lib/monitoramento";
import { MiniPaintedCalendar } from "@/components/cronograma-pintado/MiniPaintedCalendar";
import {
  PageStack,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  PageButton,
  EmptyText,
} from "@/styles/page.styled";
import {
  AvisoSomenteLeitura,
  CardCliente,
  CardGrid,
  CardTitle,
  CronogramaCardRodape,
  Pilula,
  ProjetoCard,
  type TomPilula,
} from "./Monitoramento.styled";
import { useFiltroFrente } from "./FiltroFrente";
import { useFiltroEscopo } from "./FiltroEscopo";

/** Um limiar curto o bastante para chamar atenção antes de estourar — não
 *  é a mesma régua do backend (que só distingue em_contagem/estourou), é
 *  só o corte visual de "quase lá" nesta tela. */
const DIAS_LIMIAR_ATENCAO = 5;

function rodapeDoEscopo(escopo: EscopoCritico | null): { tom: TomPilula; rotulo: string; texto: string } {
  if (!escopo) return { tom: "neutro", rotulo: "Sem escopo", texto: "Nenhum escopo em contagem" };
  if (escopo.estourou) {
    return {
      tom: "alerta",
      rotulo: "Estourou",
      texto: `${Math.abs(escopo.restantes)} dia(s) além do prazo em ${escopo.nome}`,
    };
  }
  if (escopo.restantes <= DIAS_LIMIAR_ATENCAO) {
    return { tom: "atencao", rotulo: "Atenção", texto: `Faltam ${escopo.restantes} dia(s) em ${escopo.nome}` };
  }
  return { tom: "ok", rotulo: "No prazo", texto: `Faltam ${escopo.restantes} dia(s) em ${escopo.nome}` };
}

/** Pra "Voltar" (no header do projeto) devolver pra cá, e não pra listagem
 *  de projetos — ver `voltarDoLocation` em `ProjetoPage.tsx`. */
const VOLTAR_PARA_AQUI = {
  voltarPara: "/monitoramento/cronogramas",
  voltarRotulo: "Voltar para Monitoramento",
};

/**
 * Board macro de cronogramas (§7): o mês atual de todos os projetos
 * visíveis, um mini-calendário por projeto, ordenados pelo escopo mais
 * perto de estourar o prazo primeiro — a ordem já vem pronta do backend.
 *
 * Read-only, mesmo espírito da aba Tarefas: clicar no card leva para o
 * cronograma de verdade do projeto, onde dá para editar.
 */
export function CronogramasGeraisAba() {
  const { token } = useAuth();
  const { frenteId, seletor: seletorFrente } = useFiltroFrente();
  const { escopoId, seletor: seletorEscopo } = useFiltroEscopo(frenteId);
  const seletor = (
    <>
      {seletorFrente}
      {seletorEscopo}
    </>
  );
  const [dados, setDados] = useState<CronogramasGerais | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getCronogramasGerais(token, frenteId, escopoId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os cronogramas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId, escopoId]);

  if (erro) {
    return (
      <PageStack>
        {seletor}
        <ErrorBlock>
          <ErrorText>{erro}</ErrorText>
          <PageButton $variant="outline" onClick={carregar}>
            Tentar novamente
          </PageButton>
        </ErrorBlock>
      </PageStack>
    );
  }

  if (carregando || !dados) {
    return (
      <PageStack>
        {seletor}
        <PageLoadingBlock />
      </PageStack>
    );
  }

  if (dados.projetos.length === 0) {
    return (
      <PageStack>
        {seletor}
        <EmptyText>Nenhum projeto na sua visão.</EmptyText>
      </PageStack>
    );
  }

  return (
    <PageStack>
      {seletor}
      <AvisoSomenteLeitura>
        Este painel é só para consulta. Para editar um cronograma, clique no card e abra o
        projeto correspondente.
      </AvisoSomenteLeitura>

      <CardGrid>
        {dados.projetos.map((item) => {
          const rodape = rodapeDoEscopo(item.escopo_critico);
          return (
            <ProjetoCard
              key={item.projeto_id}
              to={`/projetos/${item.projeto_id}/cronograma`}
              state={VOLTAR_PARA_AQUI}
            >
              <CardTitle>{item.projeto_nome}</CardTitle>
              <CardCliente>{item.cliente}</CardCliente>
              <MiniPaintedCalendar cronograma={item.cronograma} />
              <CronogramaCardRodape>
                <Pilula $tom={rodape.tom}>{rodape.rotulo}</Pilula>
                {rodape.texto}
              </CronogramaCardRodape>
            </ProjetoCard>
          );
        })}
      </CardGrid>
    </PageStack>
  );
}
