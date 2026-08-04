import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import type { Frente } from "@/types/banca";
import { pode } from "@/utils/permissoes";
import { PageStack } from "@/styles/page.styled";
import {
  FieldSelect,
  FrenteTravadaAviso,
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  TabBar,
  TabLink,
} from "./Monitoramento.styled";

export interface MonitoramentoContexto {
  frenteId: number | null;
  frentes: Frente[];
}

export function useMonitoramento() {
  return useOutletContext<MonitoramentoContexto>();
}

/**
 * O shell do monitoramento (§7). As 4 abas são sub-rotas.
 *
 * 🔐 O seletor de frente só aparece para a diretoria (§7.5: "o gerente fica
 * travado na própria frente"). Mas quem **decide** é o backend: mesmo que o
 * gerente forje um `?frente_id=`, `aplicar_recorte_visao` restringe às
 * frentes dele. Esconder o seletor é conveniência de UI.
 */
export function MonitoramentoLayout() {
  const { usuario, token } = useAuth();
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [frenteId, setFrenteId] = useState<number | null>(null);

  const podeFiltrar = pode(usuario, "filtrar_por_frente");

  useEffect(() => {
    if (!token) return;
    getFrentes(token).then(setFrentes).catch(() => setFrentes([]));
  }, [token]);

  const contexto: MonitoramentoContexto = { frenteId, frentes };

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Monitoramento</PageHeading>
          <PageSubheading>
            Acompanhar a execução de todos os projetos sem precisar entrar em cada um.
          </PageSubheading>
        </PageHeaderText>

        {podeFiltrar ? (
          <FieldSelect
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
          </FieldSelect>
        ) : (
          <FrenteTravadaAviso>Visão restrita à sua frente</FrenteTravadaAviso>
        )}
      </PageHeaderRow>

      <TabBar>
        <TabLink to="/monitoramento" end>
          Visão geral
        </TabLink>
        <TabLink to="/monitoramento/execucao">Execução</TabLink>
        <TabLink to="/monitoramento/alocacao">Alocação</TabLink>
        <TabLink to="/monitoramento/atrasos">Atrasos</TabLink>
      </TabBar>

      <Outlet context={contexto} />
    </PageStack>
  );
}
