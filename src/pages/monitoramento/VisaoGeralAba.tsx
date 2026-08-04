import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { getVisaoGeral, type VisaoGeral } from "@/lib/monitoramento";
import { formatarData, formatarDataHora, ROTULO_STATUS } from "@/lib/projetos";
import type { StatusProjeto } from "@/types/projeto";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  ItemAtencao,
  ItemLista,
  KpiCard,
  KpiGrid,
  KpiRotulo,
  KpiValor,
  ListaSimples,
  PainelGrid,
  Pilula,
  SparkBarra,
  SparkRotulos,
  Sparkline,
} from "./Monitoramento.styled";
import { useMonitoramento } from "./MonitoramentoLayout";

export function VisaoGeralAba() {
  const { token } = useAuth();
  const { frenteId } = useMonitoramento();
  const [dados, setDados] = useState<VisaoGeral | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getVisaoGeral(token, frenteId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o monitoramento");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId]);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  const maxTendencia = Math.max(1, ...dados.entregas.tendencia.map((t) => t.total));

  return (
    <PageStack>
      <KpiGrid>
        <KpiCard>
          <KpiValor>{dados.kpis.total}</KpiValor>
          <KpiRotulo>Projetos</KpiRotulo>
        </KpiCard>
        <KpiCard>
          <KpiValor>{dados.kpis.em_execucao}</KpiValor>
          <KpiRotulo>Em execução</KpiRotulo>
        </KpiCard>
        <KpiCard>
          <KpiValor>{dados.kpis.perto_de_finalizar}</KpiValor>
          <KpiRotulo>Perto de finalizar</KpiRotulo>
        </KpiCard>
        <KpiCard $destaque={dados.kpis.atrasados > 0 ? "alerta" : undefined}>
          <KpiValor $destaque={dados.kpis.atrasados > 0 ? "alerta" : undefined}>
            {dados.kpis.atrasados}
          </KpiValor>
          <KpiRotulo>Atrasados</KpiRotulo>
        </KpiCard>
        <KpiCard>
          {/* 🎯 O placar da gestão: só as bancas contam — a entrega ao cliente
              depende da agenda dele e é acompanhada à parte (§7.1). */}
          <KpiValor $destaque={dados.placar_gestao.percentual >= 80 ? "ok" : "alerta"}>
            {dados.placar_gestao.percentual}%
          </KpiValor>
          <KpiRotulo>Placar da gestão</KpiRotulo>
          <EmptyText style={{ fontSize: "0.7rem" }}>
            {dados.placar_gestao.no_prazo}/{dados.placar_gestao.total_ativos} com bancas em dia
          </EmptyText>
        </KpiCard>
      </KpiGrid>

      <PainelGrid>
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Distribuição por status</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {Object.keys(dados.por_status).length === 0 ? (
              <EmptyText>Nenhum projeto.</EmptyText>
            ) : (
              <ListaSimples>
                {Object.entries(dados.por_status)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, total]) => (
                    <ItemLista key={status}>
                      <span>{ROTULO_STATUS[status as StatusProjeto] ?? status}</span>
                      <small>{total}</small>
                    </ItemLista>
                  ))}
              </ListaSimples>
            )}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>
              Entregas na gestão · {dados.entregas.total_escopos} escopos
            </PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.entregas.recentes.length === 0 ? (
              <EmptyText>Nenhuma entrega registrada na gestão atual.</EmptyText>
            ) : (
              <ListaSimples>
                {dados.entregas.recentes.map((e, i) => (
                  <ItemLista key={i}>
                    <span>
                      {e.projeto_nome} · {e.escopo}
                    </span>
                    <small>
                      {formatarData(e.data)}{" "}
                      <Pilula $tom={e.no_prazo ? "ok" : "alerta"}>
                        {e.no_prazo ? "no prazo" : "atrasada"}
                      </Pilula>
                    </small>
                  </ItemLista>
                ))}
              </ListaSimples>
            )}
            <Sparkline>
              {dados.entregas.tendencia.map((t) => (
                <SparkBarra key={t.inicio} $altura={(t.total / maxTendencia) * 100} title={`${t.total} entrega(s)`} />
              ))}
            </Sparkline>
            <SparkRotulos>
              <span>{format(new Date(`${dados.entregas.tendencia[0]?.inicio}T12:00:00`), "dd/MM", { locale: ptBR })}</span>
              <span>ritmo das últimas 8 semanas</span>
              <span>hoje</span>
            </SparkRotulos>
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>★ Bancas nos próximos 7 dias</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.bancas_proximas.length === 0 ? (
              <EmptyText>Nenhuma banca agendada para a próxima semana.</EmptyText>
            ) : (
              <ListaSimples>
                {dados.bancas_proximas.map((b, i) => (
                  <ItemLista key={i}>
                    <span>
                      {b.projeto_nome} · {b.escopo}
                    </span>
                    <small>{formatarDataHora(b.data_hora)}</small>
                  </ItemLista>
                ))}
              </ListaSimples>
            )}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>😴 Tempo parado entre escopos</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.tempo_parado.length === 0 ? (
              <EmptyText>Nenhum projeto parado entre escopos.</EmptyText>
            ) : (
              <ListaSimples>
                {dados.tempo_parado.map((p) => (
                  <ItemLista key={p.projeto_id}>
                    <Link to={`/projetos/${p.projeto_id}`}>
                      {p.projeto_nome} — entregou {p.escopo_entregue}
                    </Link>
                    <small>há {p.dias_parado} dias</small>
                  </ItemLista>
                ))}
              </ListaSimples>
            )}
          </PageCardContent>
        </PageCard>
      </PainelGrid>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>🚨 Atenção agora ({dados.atencao_agora.length})</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.atencao_agora.length === 0 ? (
            <EmptyText>Nada pedindo ação no momento.</EmptyText>
          ) : (
            <ListaSimples>
              {dados.atencao_agora.map((item, i) => (
                <ItemAtencao key={i}>
                  <strong>
                    <Link to={`/projetos/${item.projeto_id}`}>{item.projeto_nome}</Link>
                  </strong>
                  {/* O motivo vem pronto e específico do backend — §7.1 é
                      explícito que não pode ser rótulo genérico. */}
                  <span>
                    {item.motivo}
                    {item.dias != null && ` · há ${item.dias} dias`}
                  </span>
                </ItemAtencao>
              ))}
            </ListaSimples>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
