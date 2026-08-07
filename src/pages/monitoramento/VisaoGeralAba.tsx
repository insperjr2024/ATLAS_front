import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { ConteudoPaginado, POR_PAGINA, Paginacao, usePaginacao } from "./Paginacao";
import { useAuth } from "@/context/AuthContext";
import { getVisaoGeral, type VisaoGeral } from "@/lib/monitoramento";

// Sob demanda: o recharts pesa ~450KB num bundle que já está acima do limite
// de aviso do Vite, e os gráficos só existem dentro do monitoramento.
const PizzaEtapas = lazy(() => import("./PizzaEtapas"));
const LinhaEntregas = lazy(() => import("./LinhaEntregas"));
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
  ItemDestaque,
  ItemTexto,
  KpiCard,
  KpiGrid,
  KpiNota,
  KpiRotulo,
  KpiValor,
  LinhaItem,
  LinkProjeto,
  ListaSimples,
  PainelGrid,
  type NivelSeveridade,
} from "./Monitoramento.styled";
import { useFiltroFrente } from "./FiltroFrente";

/** "seg 11" — o dia da semana é o que a pessoa usa para se localizar numa
 *  agenda de 7 dias; a data completa não acrescenta nada nessa janela. */
function diaDaSemana(iso: string): string {
  const d = new Date(iso);
  const dia = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${dia} ${d.getDate()}`;
}

function horaDaBanca(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Itens sem contagem de dias (kickoff não marcado, sem reunião na semana) não
 *  são menos importantes — só não têm magnitude. Ficam no degrau do meio em
 *  vez de fingir gravidade que não foi medida. */
function nivelAtencao(dias: number | null): NivelSeveridade {
  if (dias == null) return "media";
  if (dias > 10) return "critica";
  if (dias > 3) return "media";
  return "leve";
}

export function VisaoGeralAba() {
  const { token } = useAuth();
  const { frenteId, seletor } = useFiltroFrente();
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

  return <ConteudoVisaoGeral dados={dados} seletor={seletor} />;
}

/**
 * O corpo da aba, montado só quando `dados` já chegou.
 *
 * Separado do componente de cima por causa dos `usePaginacao`: lá em cima há dois
 * `return` cedo (erro e carregando), e hook depois deles seria hook
 * condicional — a contagem muda entre renders e o React desalinha o estado.
 */
function ConteudoVisaoGeral({ dados, seletor }: { dados: VisaoGeral; seletor: ReactNode }) {
  // Estes três crescem com o tamanho do núcleo e não têm teto no backend.
  const atencao = usePaginacao(dados.atencao_agora, POR_PAGINA);
  const bancas = usePaginacao(dados.bancas_proximas, POR_PAGINA);
  const parados = usePaginacao(dados.tempo_parado, POR_PAGINA);

  return (
    <PageStack>
      {seletor}
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
          {/* Percentual como valor grande, contagem na nota — mesmo formato do
              placar ao lado. Os dois medem a MESMA população (`em_curso`), mas
              coisas diferentes: o placar só olha banca, este olha qualquer
              motivo. `100 - placar` não dá este número, e é por isso que os
              rótulos precisam ser explícitos. */}
          <KpiValor $destaque={dados.kpis.atrasados > 0 ? "alerta" : undefined}>
            {dados.atrasados_gestao.percentual}%
          </KpiValor>
          <KpiRotulo>Atrasados</KpiRotulo>
          <KpiNota>
            {dados.atrasados_gestao.atrasados}/{dados.atrasados_gestao.total_ativos} com algum
            atraso
          </KpiNota>
        </KpiCard>
        <KpiCard>
          {/* O placar da gestão: só as bancas contam — a entrega ao cliente
              depende da agenda dele e é acompanhada à parte (§7.1). */}
          <KpiValor $destaque={dados.placar_gestao.percentual >= 80 ? "ok" : "alerta"}>
            {dados.placar_gestao.percentual}%
          </KpiValor>
          <KpiRotulo>Placar da gestão</KpiRotulo>
          <KpiNota>
            {dados.placar_gestao.no_prazo}/{dados.placar_gestao.total_ativos} com bancas em dia
          </KpiNota>
        </KpiCard>
      </KpiGrid>

      <PainelGrid>
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Projetos por etapa</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {/* Sob demanda: o recharts pesa ~450KB e só é usado aqui e na
                Alocação — quem abre o login não tem por que pagar por ele. */}
            <Suspense fallback={<PageLoadingBlock />}>
              <PizzaEtapas etapas={dados.por_etapa} />
            </Suspense>
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>
              Entregas na gestão · {dados.entregas.total_escopos} escopos
            </PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.entregas.tendencia.length === 0 ? (
              <EmptyText>Nenhuma entrega registrada.</EmptyText>
            ) : (
              <Suspense fallback={<PageLoadingBlock />}>
                <LinhaEntregas meses={dados.entregas.tendencia} />
              </Suspense>
            )}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Bancas nos próximos 7 dias</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.bancas_proximas.length === 0 ? (
              <EmptyText>Nenhuma banca agendada para a próxima semana.</EmptyText>
            ) : (
              <>
                <ConteudoPaginado estado={bancas}>
                  <ListaSimples>
                    {bancas.visiveis.map((b) => (
                      <li key={b.banca_id}>
                        {/* A linha inteira é o link, não só o nome: numa agenda
                            o alvo útil é o compromisso todo, e um trecho
                            clicável no meio do texto é difícil de acertar. */}
                        <LinhaItem to={`/bancas?banca=${b.banca_id}`}>
                          <ItemDestaque>
                            <strong>{diaDaSemana(b.data_hora)}</strong>
                            <span>{horaDaBanca(b.data_hora)}</span>
                          </ItemDestaque>
                          <ItemTexto>
                            <strong>{b.projeto_nome}</strong>
                            <span>{b.escopo}</span>
                          </ItemTexto>
                          <ChevronRight size={15} aria-hidden="true" />
                        </LinhaItem>
                      </li>
                    ))}
                  </ListaSimples>
                </ConteudoPaginado>
                {/* A janela de 7 dias limita o período, não a quantidade: um
                    núcleo grande pode ter 25 bancas numa semana de validação. */}
                <Paginacao estado={bancas} />
              </>
            )}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Tempo parado entre escopos</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {dados.tempo_parado.length === 0 ? (
              <EmptyText>Nenhum projeto parado entre escopos.</EmptyText>
            ) : (
              <>
                <ConteudoPaginado estado={parados}>
                  <ListaSimples>
                    {parados.visiveis.map((p) => (
                      <li key={p.projeto_id}>
                        {/* Vai direto para o CRONOGRAMA, não para a visão geral
                            do projeto: o que destrava um projeto parado é dar
                            `data_inicio` ao próximo escopo, e é lá que isso se
                            faz. Cair na visão geral obrigaria mais um clique
                            justo em quem veio resolver. */}
                        <LinhaItem to={`/projetos/${p.projeto_id}/cronograma`}>
                          {/* Os dias vêm para a esquerda, no lugar que a agenda
                              de bancas usa para a data: é o número que ordena a
                              lista, então é por ele que o olho desce. */}
                          <ItemDestaque>
                            <strong>{p.dias_parado}</strong>
                            <span>{p.dias_parado === 1 ? "dia" : "dias"}</span>
                          </ItemDestaque>
                          <ItemTexto>
                            <strong>{p.projeto_nome}</strong>
                            <span>entregou {p.escopo_entregue}</span>
                          </ItemTexto>
                          <ChevronRight size={15} aria-hidden="true" />
                        </LinhaItem>
                      </li>
                    ))}
                  </ListaSimples>
                </ConteudoPaginado>
                <Paginacao estado={parados} />
              </>
            )}
          </PageCardContent>
        </PageCard>
      </PainelGrid>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Atenção agora ({dados.atencao_agora.length})</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.atencao_agora.length === 0 ? (
            <EmptyText>Nada pedindo ação no momento.</EmptyText>
          ) : (
            <>
              <ConteudoPaginado estado={atencao}>
                <ListaSimples>
                  {atencao.visiveis.map((item, i) => (
                    /* A cor do marcador carrega a gravidade: sem ela uma lista
                       de 15 itens grita igual e a diretoria não sabe por onde
                       começar. */
                    <ItemAtencao key={i} $nivel={nivelAtencao(item.dias)}>
                      <strong>
                        <LinkProjeto to={`/projetos/${item.projeto_id}`}>
                          {item.projeto_nome}
                        </LinkProjeto>
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
              </ConteudoPaginado>
              {/* Este é o card que mais cresce da tela: 77 itens com o núcleo
                  cheio. A lista vem ordenada por gravidade, então a página 1 é
                  o que pede ação e as seguintes são a cauda. */}
              <Paginacao estado={atencao} />
            </>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
