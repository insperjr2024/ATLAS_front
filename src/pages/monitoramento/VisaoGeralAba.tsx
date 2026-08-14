import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { ConteudoPaginado, POR_PAGINA, Paginacao, usePaginacao } from "./Paginacao";
import { useAuth } from "@/context/AuthContext";
import {
  getVisaoGeral,
  ROTULO_ATENCAO,
  type TipoAtencao,
  type VisaoGeral,
} from "@/lib/monitoramento";
import { paraDataUtc } from "@/lib/projetos";
// `formatarData`/`formatarDataHora` saíram no merge de propósito: os dois
// únicos lugares que formatavam data crua aqui (o sparkline de entregas e a
// lista antiga de bancas) viraram `LinhaEntregas` e `diaDaSemana`/`horaDaBanca`.

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
  ControlesGrafico,
  FieldSelect,
  ItemAtencao,
  ItemDestaque,
  // A main tirou `ItemLista` daqui porque converteu bancas e tempo parado para
  // `LinhaItem`; o card "Janela dos escopos" da `ajustes` ainda usa a linha
  // simples (nome + resumo, sem navegação por linha inteira), então volta.
  AprovacaoDetalhe,
  ItemLista,
  ItemTexto,
  KpiCard,
  KpiGrid,
  KpiNota,
  KpiRotulo,
  KpiValor,
  LinhaItem,
  LinkProjeto,
  ListaAtencaoGrid,
  ListaSimples,
  PainelGrid,
  type NivelSeveridade,
} from "./Monitoramento.styled";
import { useFiltroFrente } from "./FiltroFrente";
import { useFiltroEscopo } from "./FiltroEscopo";

/** Pra "voltar" do projeto cair de novo aqui — Visão geral é a rota índice
 *  de Monitoramento, então o destino é a pasta sem sub-rota. */
const VOLTAR_PARA_AQUI = { voltarPara: "/monitoramento", voltarRotulo: "Voltar para Monitoramento" };

/** "seg 11", o dia da semana é o que a pessoa usa para se localizar numa
 *  agenda de 7 dias; a data completa não acrescenta nada nessa janela. */
function diaDaSemana(iso: string): string {
  const d = paraDataUtc(iso);
  const dia = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${dia} ${d.getDate()}`;
}

function horaDaBanca(iso: string): string {
  return paraDataUtc(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Itens sem contagem de dias (kickoff não marcado, sem reunião na semana) não
 *  são menos importantes, só não têm magnitude. Ficam no degrau do meio em
 *  vez de fingir gravidade que não foi medida. */
function nivelAtencao(dias: number | null): NivelSeveridade {
  if (dias == null) return "media";
  if (dias > 10) return "critica";
  if (dias > 3) return "media";
  return "leve";
}

export function VisaoGeralAba() {
  const { token } = useAuth();
  const { frenteId, seletor: seletorFrente } = useFiltroFrente();
  const { escopoId, seletor: seletorEscopo } = useFiltroEscopo(frenteId);
  const seletor = (
    <>
      {seletorFrente}
      {seletorEscopo}
    </>
  );
  const [dados, setDados] = useState<VisaoGeral | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getVisaoGeral(token, frenteId, escopoId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o monitoramento");
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

  return <ConteudoVisaoGeral dados={dados} seletor={seletor} />;
}

/**
 * O corpo da aba, montado só quando `dados` já chegou.
 *
 * Separado do componente de cima por causa dos `usePaginacao`: lá em cima há dois
 * `return` cedo (erro e carregando), e hook depois deles seria hook
 * condicional, a contagem muda entre renders e o React desalinha o estado.
 */
function ConteudoVisaoGeral({ dados, seletor }: { dados: VisaoGeral; seletor: ReactNode }) {
  const [motivoPedido, setMotivoPedido] = useState<TipoAtencao | "">("");

  /* Quantos itens de cada motivo, na ordem de `ROTULO_ATENCAO`, do que o time
     controla para o que depende de terceiro. Só entram os que têm item. */
  const motivosPresentes = useMemo(() => {
    const contagem = new Map<TipoAtencao, number>();
    for (const i of dados.atencao_agora) {
      contagem.set(i.tipo, (contagem.get(i.tipo) ?? 0) + 1);
    }
    return (Object.keys(ROTULO_ATENCAO) as TipoAtencao[])
      .filter((t) => contagem.has(t))
      .map((t) => [t, contagem.get(t)!] as const);
  }, [dados.atencao_agora]);

  /* O motivo é DERIVADO, não guardado cru. Trocar a frente troca os dados, e
     o motivo escolhido pode não existir mais no recorte novo, aí o card
     ficaria vazio exibindo um filtro que sumiu da lista. Voltar para "todos"
     quando isso acontece é o mesmo cuidado do clamp de página em
     `usePaginacao`. */
  const motivo = motivosPresentes.some(([t]) => t === motivoPedido) ? motivoPedido : "";

  const filtrados = useMemo(
    () => (motivo ? dados.atencao_agora.filter((i) => i.tipo === motivo) : dados.atencao_agora),
    [dados.atencao_agora, motivo],
  );

  // Estes três crescem com o tamanho do núcleo e não têm teto no backend.
  // Motivo → itens, na ordem em que o backend já ordenou (pior primeiro).
  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof filtrados>();
    for (const item of filtrados) {
      const lista = mapa.get(item.tipo) ?? [];
      lista.push(item);
      mapa.set(item.tipo, lista);
    }
    // Grupo menor primeiro: um caso isolado é mais acionável que vinte, e a
    // pilha de vinte não pode empurrar o item único para fora da vista.
    return [...mapa.entries()].sort((a, b) => a[1].length - b[1].length);
  }, [filtrados]);
  const bancas = usePaginacao(dados.bancas_proximas, POR_PAGINA);
  const parados = usePaginacao(dados.tempo_parado, POR_PAGINA);
  // A janela do escopo, por projeto: dias ajustados, atraso e dias
  // parados. Só entram os projetos com algum número diferente de zero —
  // listar o portfólio inteiro com três zeros esconderia os que importam.
  const comJanela = (dados.janela?.por_projeto ?? []).filter(
    (p) => p.dias_ajustados || p.dias_de_atraso || p.dias_parados,
  );
  const janela = usePaginacao(comJanela, POR_PAGINA);

  return (
    <PageStack>
      {seletor}
      {/* ⭐ **Quatro caixas, não cinco, e cada uma responde a uma pergunta.**
          Havia "0% Atrasados" e "100% Placar da gestão" lado a lado: desde que
          o pilar de ENTREGA saiu do cálculo (2026-08-12), o único motivo de
          atraso é a banca — que é exatamente o que o placar mede. Os dois
          somavam 100 sempre, e o comentário que jurava o contrário ficou para
          trás. Ficou o placar, que é o número que o §7.1 pede por nome.

          ⚠ E o "29" ganhou nota: a tela mostrava 29, 21 e 26 em lugares
          diferentes sem dizer que 26 é o denominador de tudo. */}
      <KpiGrid>
        <KpiCard>
          <KpiValor>{dados.kpis.total}</KpiValor>
          <KpiRotulo>Projetos</KpiRotulo>
          <KpiNota>
            {dados.placar_gestao.total_ativos} em curso
            {dados.kpis.pausados > 0 && ` · ${dados.kpis.pausados} pausado${dados.kpis.pausados > 1 ? "s" : ""}`}
            {dados.kpis.finalizados > 0 && ` · ${dados.kpis.finalizados} finalizado${dados.kpis.finalizados > 1 ? "s" : ""}`}
          </KpiNota>
        </KpiCard>
        <KpiCard>
          <KpiValor>{dados.kpis.em_execucao}</KpiValor>
          <KpiRotulo>Em execução</KpiRotulo>
          <KpiNota>ambientação, andamento e bancas</KpiNota>
        </KpiCard>
        <KpiCard>
          <KpiValor>{dados.kpis.perto_de_finalizar}</KpiValor>
          <KpiRotulo>Perto de finalizar</KpiRotulo>
          <KpiNota>TEP e período de ajustes</KpiNota>
        </KpiCard>
        <KpiCard>
          {/* §7.1: "a saúde geral da área num número só". Só as bancas contam —
              a entrega ao cliente depende da agenda dele e fica à parte. */}
        </KpiCard>
        <KpiCard $destaque={dados.kpis.atrasados > 0 ? "alerta" : undefined}>
          {/* Percentual como valor grande, contagem na nota, mesmo formato do
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
          {/* O placar da gestão: só as bancas contam, a entrega ao cliente
              depende da agenda dele e é acompanhada à parte. */}
          <KpiValor $destaque={dados.placar_gestao.percentual >= 80 ? "ok" : "alerta"}>
            {dados.placar_gestao.percentual}%
          </KpiValor>
          <KpiRotulo>Placar da gestão</KpiRotulo>
          <KpiNota>
            {dados.placar_gestao.no_prazo}/{dados.placar_gestao.total_ativos} sem banca vencida
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
                Alocação, quem abre o login não tem por que pagar por ele. */}
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
              <EmptyText>Nenhum vão entre escopos.</EmptyText>
            ) : (
              <>
                <ConteudoPaginado estado={parados}>
                  <ListaSimples>
                    {parados.visiveis.map((p) => (
                      // A chave é o PAR, não o projeto: um projeto de três
                      // escopos tem dois vãos, e chavear pelo projeto os
                      // colapsaria em um.
                      <li key={`${p.projeto_id}-${p.escopo_entregue}-${p.escopo_seguinte ?? ""}`}>
                        {/* Vai direto para o CRONOGRAMA, não para a visão geral
                            do projeto: o que destrava um projeto parado é dar
                            `data_inicio` ao próximo escopo, e é lá que isso se
                            faz. Cair na visão geral obrigaria mais um clique
                            justo em quem veio resolver. */}
                        <LinhaItem to={`/projetos/${p.projeto_id}/cronograma`} state={VOLTAR_PARA_AQUI}>
                          {/* Os dias vêm para a esquerda, no lugar que a agenda
                              de bancas usa para a data: é o número que ordena a
                              lista, então é por ele que o olho desce. */}
                          <ItemDestaque>
                            <strong>{p.dias_parado}</strong>
                            <span>{p.dias_parado === 1 ? "dia" : "dias"}</span>
                          </ItemDestaque>
                          <ItemTexto>
                            <strong>{p.projeto_nome}</strong>
                            {/* O vão inteiro, não só o lado de trás: "de
                                onde saiu" e "para onde foi". Sem o segundo
                                nome, um vão FECHADO (o próximo já começou)
                                ficava indistinguível de um aberto. */}
                            <span>
                              {p.aberto
                                ? `entregou ${p.escopo_entregue} · ninguém começou o próximo`
                                : `${p.escopo_entregue} → ${p.escopo_seguinte}`}
                            </span>
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

        {/* Os números da janela do escopo, o placar que a Visão geral
            do projeto mostra por escopo, aqui somado por projeto.

            "Dias parados" NÃO é o card acima: aquele conta os dias corridos
            entre a entrega de um escopo e o começo do próximo; este conta os
            dias ÚTEIS EM BRANCO do cronograma inteiro desde o kickoff, dia
            sem etapa, reunião, banca ou entrega. Um responde "está entre
            escopos?", o outro "está andando?". */}
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Tempo dos escopos</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {comJanela.length === 0 ? (
              <EmptyText>Nenhum projeto com dias ajustados, tempo além do vendido ou vão sem planejamento.</EmptyText>
            ) : (
              <>
                {/* ⚠ **A palavra "atraso" saiu deste card.** Ela tem dono: na
                    aba Atrasos, "atrasado" é banca vencida. O número daqui é
                    outro — dias consumidos além do vendido — e chamá-lo de
                    atraso fazia esta tela dizer "0 atrasados" no topo e
                    "19 em atraso" no meio.

                    ⚠ **E o total sumiu.** "352 parados na gestão" somava dias
                    de projetos diferentes: não existe pergunta cuja resposta
                    seja esse número. Cada projeto tem o seu, e é por projeto
                    que se age. */}
                <KpiNota>
                  {comJanela.length} projeto{comJanela.length > 1 ? "s" : ""} com algum desses
                  números — clique para ver o cronograma
                </KpiNota>
                <ConteudoPaginado estado={janela}>
                  <ListaSimples>
                    {janela.visiveis.map((p) => (
                      <ItemLista key={p.projeto_id}>
                        <LinkProjeto to={`/projetos/${p.projeto_id}/cronograma`} state={VOLTAR_PARA_AQUI}>
                          {p.projeto_nome}
                        </LinkProjeto>
                        <small>
                          {[
                            p.dias_ajustados && `+${p.dias_ajustados} ajustados`,
                            p.dias_de_atraso && `${p.dias_de_atraso} além do vendido`,
                            p.dias_parados && `${p.dias_parados} sem planejamento`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      </ItemLista>
                    ))}
                  </ListaSimples>
                </ConteudoPaginado>
                <Paginacao estado={janela} />
              </>
            )}
          </PageCardContent>
        </PageCard>
      </PainelGrid>

      {/* ⚠ Havia aqui um card "Pedidos de dias de ajuste", o MESMO componente
          da aba Aprovações. Saiu: pedido pendente é uma decisão esperando
          pessoa, e a fila de decisões tem uma aba inteira dedicada a ela desde
          que Aprovações passou a existir. Duplicá-lo aqui obrigava a manter
          dois lugares em sincronia, e este ignorava os dois seletores do topo
          — o mesmo pedido aparecia mesmo com a frente filtrada. */}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Atenção agora ({filtrados.length}
            {motivo && ` de ${dados.atencao_agora.length}`})
          </PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.atencao_agora.length === 0 ? (
            <EmptyText>Nada pedindo ação no momento.</EmptyText>
          ) : (
            <>
              {/* As opções saem do que EXISTE hoje, não de uma lista fixa:
                  oferecer "Kickoff" quando nenhum projeto está sem kickoff
                  devolve card vazio e a impressão de que quebrou. A contagem
                  ao lado evita ter que filtrar para descobrir se vale a pena. */}
              <ControlesGrafico>
                <FieldSelect
                  value={motivo}
                  onChange={(e) => setMotivoPedido(e.target.value as TipoAtencao | "")}
                  aria-label="Filtrar por motivo"
                >
                  <option value="">Todos os motivos ({dados.atencao_agora.length})</option>
                  {motivosPresentes.map(([tipo, n]) => (
                    <option key={tipo} value={tipo}>
                      {ROTULO_ATENCAO[tipo]} ({n})
                    </option>
                  ))}
                </FieldSelect>
              </ControlesGrafico>

              {/* ⭐ **Agrupado por motivo, não uma linha por projeto.**
                  Numa quinta-feira típica a lista abria com 20 cópias exatas de
                  "sem reunião registrada esta semana" — o mesmo texto, o mesmo
                  ponto colorido, mudando só o nome do projeto. Card que repete
                  a mesma frase vinte vezes deixa de ser lido.

                  O sino de notificações já resolvia isso agregando por tipo
                  (`listar_notificacoes`), com a MESMA detecção por baixo. Aqui
                  a diferença é que o detalhe continua a um clique: cada grupo
                  abre e mostra os projetos. */}
              {grupos.map(([tipo, itens]) => (
                <AprovacaoDetalhe key={tipo} open={itens.length <= 3 || !!motivo}>
                  <summary>
                    <ItemAtencao as="span" $nivel={nivelAtencao(itens[0].dias)}>
                      <strong>
                        {itens.length} {ROTULO_ATENCAO[tipo as TipoAtencao] ?? tipo}
                      </strong>
                    </ItemAtencao>
                  </summary>
                  <ListaAtencaoGrid>
                    {itens.map((item, i) => (
                      /* A cor do marcador carrega a gravidade: sem ela uma lista
                         de 15 itens grita igual e a diretoria não sabe por onde
                         começar. */
                      <ItemAtencao key={i} $nivel={nivelAtencao(item.dias)}>
                        <strong>
                          <LinkProjeto to={`/projetos/${item.projeto_id}`} state={VOLTAR_PARA_AQUI}>
                            {item.projeto_nome}
                          </LinkProjeto>
                        </strong>
                        {/* O motivo vem pronto e específico do backend, §7.1 é
                            explícito que não pode ser rótulo genérico. */}
                        <span>
                          {item.motivo}
                          {item.dias != null && ` · há ${item.dias} dias`}
                        </span>
                      </ItemAtencao>
                    ))}
                  </ListaAtencaoGrid>
                </AprovacaoDetalhe>
              ))}
            </>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
