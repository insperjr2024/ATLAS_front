import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { getEscopos } from "@/lib/escopos";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import type { Escopo, Frente } from "@/types/banca";
import { pode } from "@/utils/permissoes";
import { PageStack } from "@/styles/page.styled";
import {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  TabBar,
  TabLink,
} from "./Monitoramento.styled";

export interface MonitoramentoContexto {
  /** As frentes disponíveis para o seletor. O layout carrega UMA vez e
   *  compartilha — cinco abas buscando a mesma lista seriam cinco requisições
   *  iguais a cada troca de aba. Quem guarda a escolha é cada aba, via
   *  `useFiltroFrente`. */
  frentes: Frente[];
  /** O catálogo de escopos, pro seletor de `useFiltroEscopo` — mesmo motivo
   *  de `frentes`: carrega uma vez no layout, não uma vez por aba. */
  escopos: Escopo[];
  /** As frentes do usuário logado — usado só pra estreitar as OPÇÕES do
   *  filtro de escopo de um gerente à frente dele (`useFiltroEscopo`). Não é
   *  segurança (o backend já trava isso sozinho); é só não oferecer escopo
   *  de frente que o gerente nunca vai poder ver o resultado. */
  minhasFrentes: number[];
}

export function useMonitoramento() {
  return useOutletContext<MonitoramentoContexto>();
}

/**
 * O shell do monitoramento (§7). As 4 abas são sub-rotas.
 *
 * O seletor de frente só aparece para a diretoria (§7.5: "o gerente fica
 * travado na própria frente"). Mas quem **decide** é o backend: mesmo que o
 * gerente forje um `?frente_id=`, `aplicar_recorte_visao` restringe às
 * frentes dele. Esconder o seletor é conveniência de UI.
 */
export function MonitoramentoLayout() {
  const { usuario, token } = useAuth();
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [escopos, setEscopos] = useState<Escopo[]>([]);
  const [minhasFrentes, setMinhasFrentes] = useState<number[]>([]);

  const podeVerTarefasGerais = pode(usuario, "ver_tarefas_gerais");
  // A fila é DELA: gerente vê o Monitoramento inteiro, mas não decide nada
  // do que está nesta aba (§3). Mostrar uma lista que a pessoa não pode
  // responder é só ansiedade.
  const podeAprovar = usuario?.posicao === "diretor";
  const podeVerCronogramasGerais = pode(usuario, "ver_cronogramas_gerais");
  // Histórico de projetos: diretoria e gerência (o backend usa require_gestao).
  const podeVerHistorico = pode(usuario, "ver_historico_projetos");

  useEffect(() => {
    if (!token || !usuario) return;
    getFrentes(token).then(setFrentes).catch(() => setFrentes([]));
    getEscopos(token).then(setEscopos).catch(() => setEscopos([]));
    getUsuariosFrentes(token)
      .then((todas) =>
        setMinhasFrentes(todas.filter((uf) => uf.usuario_id === usuario.id).map((uf) => uf.frente_id)),
      )
      .catch(() => setMinhasFrentes([]));
  }, [token, usuario]);

  const contexto: MonitoramentoContexto = { frentes, escopos, minhasFrentes };

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Monitoramento</PageHeading>
          <PageSubheading>
            Acompanhar a execução de todos os projetos sem precisar entrar em cada um.
          </PageSubheading>
        </PageHeaderText>

      </PageHeaderRow>

      <TabBar>
        <TabLink to="/monitoramento" end>
          Visão geral
        </TabLink>
        {podeAprovar && <TabLink to="/monitoramento/aprovacoes">Aprovações</TabLink>}
        <TabLink to="/monitoramento/execucao">Execução</TabLink>
        <TabLink to="/monitoramento/alocacao">Alocação</TabLink>
        <TabLink to="/monitoramento/atrasos">Atrasos</TabLink>
        <TabLink to="/monitoramento/graficos">Gráficos</TabLink>
        {podeVerHistorico && (
          <TabLink to="/monitoramento/historico">Histórico de projetos</TabLink>
        )}
        {podeVerTarefasGerais && <TabLink to="/monitoramento/tarefas">Tarefas</TabLink>}
        {podeVerCronogramasGerais && (
          <TabLink to="/monitoramento/cronogramas">Cronogramas</TabLink>
        )}
      </TabBar>

      <Outlet context={contexto} />
    </PageStack>
  );
}
