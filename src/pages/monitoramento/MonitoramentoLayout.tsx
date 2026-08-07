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
  const podeVerCronogramasGerais = pode(usuario, "ver_cronogramas_gerais");

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
        <TabLink to="/monitoramento/execucao">Execução</TabLink>
        <TabLink to="/monitoramento/alocacao">Alocação</TabLink>
        <TabLink to="/monitoramento/atrasos">Atrasos</TabLink>
        {podeVerTarefasGerais && <TabLink to="/monitoramento/tarefas">Tarefas</TabLink>}
        {podeVerCronogramasGerais && (
          <TabLink to="/monitoramento/cronogramas">Cronogramas</TabLink>
        )}
      </TabBar>

      <Outlet context={contexto} />
    </PageStack>
  );
}
