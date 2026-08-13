import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight, Inbox, TriangleAlert, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROTULO_STATUS, formatarDataHora } from "@/lib/projetos";
import type { StatusProjeto } from "@/types/projeto";
import {
  cancelarSolicitacao,
  criarSolicitacao,
  getMinhasSolicitacoes,
  getProjetosComVaga,
  getProjetosCoordenados,
  getSolicitacoesRecebidas,
  responderSolicitacao,
  type MinhaSolicitacao,
  type ProjetoComVaga,
  type ProjetoCoordenado,
  type SituacaoDeCarga,
  type SolicitacaoRecebida,
} from "@/lib/vagas";
import { VagaProjetoModal } from "./VagaProjetoModal";
import { VagasAlocarPainel } from "./VagasAlocarPainel";
import {
  PageStack,
  PageHeader,
  PageHeaderText,
  PageTitle,
  PageSubtitle,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  EmptyText,
  ErrorBlock,
  ErrorText,
} from "@/styles/page.styled";
import {
  TabBar,
  TabButton,
  TabCount,
  FieldGroup,
  FieldLabel,
  FieldSelect,
} from "./Bancas.styled";
// A mesma pílula da aba de Alocação: é onde a situação de carga já é lida
// hoje, e duas formas diferentes para o mesmo rótulo fariam a pessoa achar
// que são coisas distintas.
import { Pilula } from "@/pages/monitoramento/Monitoramento.styled";
// A paginação do monitoramento, inteira: o hook, o encaixe que segura a
// altura entre páginas e a barra de navegação.
import {
  ConteudoPaginado,
  Paginacao,
  usePaginacao,
} from "@/pages/monitoramento/Paginacao";
import {
  VagasGrid,
  ProjetoCard,
  CardTopo,
  CardNome,
  CardCliente,
  CardLinha,
  Vagas as VagasDots,
  Bolinha,
  Impedimento,
  FrentesRow,
  PedidoCard,
  PedidoTopo,
  Justificativa,
  PedidoAcoes,
  LinhaDeCampos,
  ContagemFiltro,
  GrupoFrente,
  GrupoFrenteTitulo,
  GrupoFrenteContagem,
  SolGrupo,
  SolGrupoCabecalho,
  SolGrupoBotao,
  SolGrupoTitulo,
  SolGrupoFrentes,
  SolGrupoContagem,
  SolGrupoSeta,
  SolGrupoConteudo,
  SolCard,
  SolTopo,
  SolNome,
  SolQuando,
  SolMeta,
  SolTexto,
  SolAcoes,
  HistLista,
  HistItem,
  HistTopo,
  HistDesfecho,
  HistTexto,
  CargaBadge,
  CargaRecado,
  CoordLista,
  CoordCard,
  CoordCabecalhoTitulo,
  CoordCabecalho,
  CoordSeta,
  CoordIdentidadeLinha,
  CoordIdentidade,
  CoordNome,
  CoordCliente,
  CoordTags,
  CoordOcupacao,
  CoordContagem,
  CoordBarraTrilho,
  CoordBarraPreenchida,
  CoordCorpo,
  CoordColuna,
  CoordColunaTitulo,
  CoordPessoa,
  CoordAvatar,
  CoordPessoaNome,
  CoordPapel,
  CoordVaga,
  CoordVagaMarca,
  CoordPedido,
  CoordPedidoTopo,
  CoordPedidoMeta,
  CoordJustificativa,
  CoordVazio,
} from "./Vagas.styled";

/** As abas em lista, e não só em tipo: a vinda da URL precisa ser validada em
 *  tempo de execução antes de virar `Aba`. */
const ABAS = ["vagas", "meus", "coordenados", "gestao", "solicitacoes", "historico"] as const;

type Aba = (typeof ABAS)[number];

/** Rótulo do grupo de projetos sem frente cadastrada. Vai por último. */
const SEM_FRENTE = "Sem frente";

const TOM_STATUS = {
  pendente: "warning",
  aprovada: "success",
  recusada: "danger",
} as const;

/** O status por extenso: cor sozinha não informa quem não distingue as duas,
 *  e "aprovada" solto não diz o que aconteceu com a pessoa. */
const ROTULO_PEDIDO = {
  pendente: "Aguardando",
  aprovada: "Entrou no time",
  recusada: "Recusado",
} as const;

const TODOS = "__todos__";

/**
 * Pedidos por página no cartão do coordenador.
 *
 * Menor que os 12 do monitoramento porque o item aqui é alto: nome, carga e a
 * justificativa inteira, que passa de três linhas quando a pessoa escreve
 * direito. Um projeto disputado chega a 20 pedidos, e sem página o cartão
 * viraria uma tela de rolagem só dele, os outros projetos sumiriam abaixo.
 */
const PEDIDOS_POR_PAGINA = 5;

/** No histórico o item é uma linha compacta, sem botão nem justificativa
 *  inteira, cabe mais que na fila sem o bloco virar uma rolagem própria. */
const HISTORICO_POR_PAGINA = 10;

/**
 * Vagas em projetos.
 *
 * A página serve três públicos, e o back diz qual é qual pelas flags de
 * `/projetos-com-vaga`:
 *
 * - `pode_solicitar` (só consultor): "Projetos" e "Meus pedidos";
 * - `coordena_projeto`: "Meus projetos", só leitura, quem está no time e
 *   quem pediu para entrar, sem botão de decidir;
 * - `pode_responder` (gerência e diretoria): "Solicitações" e "Histórico",
 *   com filtro por frente e por projeto, mais a alocação direta.
 *
 * O coordenador decidia os pedidos do projeto dele até 2026-08-12. Saiu por
 * decisão da diretoria: entrar em equipe é alocação, e alocação é da gestão.
 */
export function Vagas() {
  const { token } = useAuth();
  /* A notificação manda `/vagas?aba=…`: sem ler isso, o clique abriria a
     primeira aba disponível e a pessoa teria de achar o pedido sozinha —
     logo depois de a plataforma ter dito que havia um.

     `null` quando o parâmetro não serve: aí vale a aba derivada do papel,
     logo abaixo. Um valor inválido não pode prender ninguém numa aba que a
     posição dele nem tem. */
  const [searchParams] = useSearchParams();
  const [aba, setAba] = useState<Aba | null>(() => {
    const pedida = searchParams.get("aba");
    // `recebidos` é o nome que a aba de decisão tinha antes desta versão, e
    // segue vivo nas notificações gravadas até aqui.
    if (pedida === "recebidos") return "solicitacoes";
    return ABAS.includes(pedida as Aba) ? (pedida as Aba) : null;
  });
  const [dados, setDados] = useState<{
    projetos: ProjetoComVaga[];
    minhaCarga: number;
    situacao: SituacaoDeCarga | null;
    podeSolicitar: boolean;
    podeResponder: boolean;
    coordenaProjeto: boolean;
    filtraPorFrente: boolean;
  } | null>(null);
  const [meus, setMeus] = useState<MinhaSolicitacao[]>([]);
  const [recebidos, setRecebidos] = useState<SolicitacaoRecebida[]>([]);
  const [coordenados, setCoordenados] = useState<ProjetoCoordenado[]>([]);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [aberto, setAberto] = useState<ProjetoComVaga | null>(null);
  const [respondendo, setRespondendo] = useState<number | null>(null);

  // Filtro por projeto: vale para "Solicitações" e "Histórico", que são a
  // mesma lista recortada por status.
  const [filtroProjeto, setFiltroProjeto] = useState(TODOS);

  // Filtro por frente: só na fila, e só para quem enxerga mais de uma. Para
  // o gerente de uma frente a lista já chega recortada nela, o seletor teria
  // uma opção. No histórico ele não entra: lá a pergunta é "o que decidimos
  // sobre o projeto X", e o filtro de projeto já responde.
  const [filtroFrente, setFiltroFrente] = useState(TODOS);

  // Grade da gestão: o filtro de frente e o projeto aberto no painel lateral.
  const [frenteDaGrade, setFrenteDaGrade] = useState(TODOS);
  const [alocarEm, setAlocarEm] = useState<ProjetoComVaga | null>(null);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    Promise.all([
      getProjetosComVaga(token),
      getMinhasSolicitacoes(token),
      getSolicitacoesRecebidas(token),
      getProjetosCoordenados(token),
    ])
      .then(([vagas, m, r, c]) => {
        if (!ativo) return;
        setDados({
          projetos: vagas.projetos,
          minhaCarga: vagas.minha_carga,
          situacao: vagas.situacao,
          podeSolicitar: vagas.pode_solicitar,
          podeResponder: vagas.pode_responder,
          coordenaProjeto: vagas.coordena_projeto,
          filtraPorFrente: vagas.filtra_por_frente,
        });
        setMeus(m);
        setRecebidos(r);
        setCoordenados(c);
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar as vagas");
      });
    return () => {
      ativo = false;
    };
  }, [token, tentativa]);

  function recarregar() {
    setTentativa((n) => n + 1);
  }

  /**
   * **Recarrega mesmo quando falha**, e é o `finally` que importa aqui.
   *
   * O pedido é gravado antes de o coordenador ser notificado, então uma falha
   * depois do commit devolve erro para uma solicitação que EXISTE. Sem o
   * recarregamento, "Meus pedidos" continuava mostrando a lista velha: a
   * pessoa via o erro, tentava de novo, ouvia que já tinha um pedido em
   * análise, e não achava esse pedido em lugar nenhum da tela.
   *
   * O `throw` segue para o modal, que é quem mostra a mensagem, mas agora a
   * lista por trás já está com a verdade.
   */
  async function enviarPedido(justificativa: string) {
    if (!token || !aberto) return;
    try {
      await criarSolicitacao(aberto.id, justificativa, token);
      setAberto(null);
    } finally {
      recarregar();
    }
  }

  async function responder(id: number, aprovar: boolean) {
    if (!token) return;
    setRespondendo(id);
    try {
      await responderSolicitacao(id, aprovar, token);
      recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao responder");
    } finally {
      setRespondendo(null);
    }
  }

  async function desistir(id: number) {
    if (!token) return;
    await cancelarSolicitacao(id, token);
    recarregar();
  }

  const pendentes = useMemo(
    () => recebidos.filter((s) => s.status === "pendente"),
    [recebidos],
  );
  const respondidos = useMemo(
    () => recebidos.filter((s) => s.status !== "pendente"),
    [recebidos],
  );

  const frentesDaFila = useMemo(
    () => [...new Set(pendentes.flatMap((s) => s.frentes))].sort(),
    [pendentes],
  );
  const projetosDisponiveis = useMemo(
    () =>
      [...new Map(recebidos.map((s) => [s.projeto_id, s.projeto_nome])).entries()].sort((a, b) =>
        a[1].localeCompare(b[1]),
      ),
    [recebidos],
  );

  /**
   * `comFrente` liga o recorte por frente, que só existe na fila. Sem esse
   * parâmetro, uma frente escolhida ali continuaria filtrando o histórico
   * sem nenhum controle visível dizendo por quê.
   */
  function filtrar(lista: SolicitacaoRecebida[], comFrente: boolean) {
    return lista.filter(
      (s) =>
        (filtroProjeto === TODOS || String(s.projeto_id) === filtroProjeto) &&
        (!comFrente || filtroFrente === TODOS || s.frentes.includes(filtroFrente)),
    );
  }

  if (erro && !dados) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={recarregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (!dados) return <PageLoadingBlock />;

  // A aba ativa sai do que existe para ESTA pessoa, e não de um padrão fixo:
  // "vagas" como inicial abriria vazia para o diretor, que não pede nada.
  const disponiveis: Aba[] = [
    ...(dados.podeSolicitar ? (["vagas", "meus"] as Aba[]) : []),
    ...(dados.coordenaProjeto ? (["coordenados"] as Aba[]) : []),
    ...(dados.podeResponder ? (["gestao", "solicitacoes", "historico"] as Aba[]) : []),
  ];
  const abaAtiva = aba && disponiveis.includes(aba) ? aba : disponiveis[0];

  const pendentesFiltrados = filtrar(pendentes, true);
  const respondidosFiltrados = filtrar(respondidos, false);

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Vagas em projetos</PageTitle>
          <PageSubtitle>
            {dados.podeSolicitar ? (
              <>
                Você está em {dados.minhaCarga}{" "}
                {dados.minhaCarga === 1 ? "projeto" : "projetos"}.{" "}
                {/* A situação é aviso, não trava: a escala da diretoria é
                    recomendação, e pedir continua liberado em qualquer
                    ponto dela. */}
                {dados.situacao && <Pilula $tom={dados.situacao.tom}>{dados.situacao.nome}</Pilula>}
              </>
            ) : dados.podeResponder ? (
              "Os pedidos para entrar em projeto, e a alocação de quem não pediu."
            ) : (
              "O time e os pedidos dos projetos que você coordena."
            )}
          </PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      {disponiveis.length === 0 ? (
        <PageCard>
          <PageCardContent>
            <EmptyText>
              Sua posição entra em projeto por alocação da gestão, e você não coordena nenhum
              projeto no momento, não há nada para pedir nem para acompanhar aqui.
            </EmptyText>
          </PageCardContent>
        </PageCard>
      ) : (
        <>
          <TabBar>
            {dados.podeSolicitar && (
              <>
                <TabButton
                  type="button"
                  $ativa={abaAtiva === "vagas"}
                  onClick={() => setAba("vagas")}
                >
                  Projetos
                  <TabCount>{dados.projetos.filter((p) => !p.impedimento).length}</TabCount>
                </TabButton>
                <TabButton type="button" $ativa={abaAtiva === "meus"} onClick={() => setAba("meus")}>
                  Meus pedidos
                  <TabCount>{meus.length}</TabCount>
                </TabButton>
              </>
            )}
            {dados.coordenaProjeto && (
              <TabButton
                type="button"
                $ativa={abaAtiva === "coordenados"}
                onClick={() => setAba("coordenados")}
              >
                Meus projetos
                <TabCount>{coordenados.length}</TabCount>
              </TabButton>
            )}
            {dados.podeResponder && (
              <>
                <TabButton
                  type="button"
                  $ativa={abaAtiva === "gestao"}
                  onClick={() => setAba("gestao")}
                >
                  Projetos
                  <TabCount>{dados.projetos.length}</TabCount>
                </TabButton>
                <TabButton
                  type="button"
                  $ativa={abaAtiva === "solicitacoes"}
                  onClick={() => setAba("solicitacoes")}
                >
                  Solicitações
                  <TabCount>{pendentes.length}</TabCount>
                </TabButton>
                <TabButton
                  type="button"
                  $ativa={abaAtiva === "historico"}
                  onClick={() => setAba("historico")}
                >
                  Histórico
                  <TabCount>{respondidos.length}</TabCount>
                </TabButton>
              </>
            )}
          </TabBar>

          {abaAtiva === "vagas" && (
            <PageCard>
              <PageCardHeader>
                <PageCardTitle>Projetos abertos</PageCardTitle>
              </PageCardHeader>
              <PageCardContent>
                {dados.projetos.length === 0 ? (
                  <EmptyText>Nenhum projeto aberto no momento.</EmptyText>
                ) : (
                  <VagasGrid>
                    {dados.projetos.map((p) => (
                      <CartaoProjeto key={p.id} projeto={p} modo="solicitar" onAbrir={setAberto} />
                    ))}
                  </VagasGrid>
                )}
              </PageCardContent>
            </PageCard>
          )}

          {abaAtiva === "gestao" && (
            <PageCard>
              <PageCardHeader>
                <PageCardTitle>Projetos</PageCardTitle>
              </PageCardHeader>
              <PageCardContent>
                {/* Filtro e agrupamento só para quem compara frentes. O
                    gerente de uma frente só já recebe a lista recortada
                    nela: o seletor teria uma opção e o agrupamento, um
                    grupo. Quem decide é o back, pelo recorte. */}
                {dados.filtraPorFrente && (
                  <LinhaDeCampos>
                    <FieldGroup>
                      <FieldLabel htmlFor="grade-frente">Frente</FieldLabel>
                      <FieldSelect
                        id="grade-frente"
                        value={frenteDaGrade}
                        onChange={(e) => setFrenteDaGrade(e.target.value)}
                      >
                        <option value={TODOS}>Todas as frentes</option>
                        {[...new Set(dados.projetos.flatMap((p) => p.frentes))].sort().map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </FieldSelect>
                    </FieldGroup>
                  </LinhaDeCampos>
                )}

                <GradeDaGestao
                  projetos={dados.projetos}
                  frente={dados.filtraPorFrente ? frenteDaGrade : TODOS}
                  agrupar={dados.filtraPorFrente}
                  onAbrir={setAlocarEm}
                />
              </PageCardContent>
            </PageCard>
          )}

          {abaAtiva === "meus" && (
            <PageCard>
              <PageCardHeader>
                <PageCardTitle>Meus pedidos</PageCardTitle>
              </PageCardHeader>
              <PageCardContent>
                {meus.length === 0 ? (
                  <EmptyText>Você ainda não pediu para entrar em nenhum projeto.</EmptyText>
                ) : (
                  meus.map((s) => (
                    <PedidoCard key={s.id}>
                      <PedidoTopo>
                        <CardNome>{s.projeto_nome}</CardNome>
                        <PageBadge $tone={TOM_STATUS[s.status]}>{s.status}</PageBadge>
                      </PedidoTopo>
                      <Justificativa>{s.justificativa}</Justificativa>
                      {s.resposta && <CardLinha>Resposta: {s.resposta}</CardLinha>}
                      {s.status === "pendente" && (
                        <PedidoAcoes>
                          <PageButtonSm
                            $variant="outline"
                            type="button"
                            onClick={() => desistir(s.id)}
                          >
                            Desistir
                          </PageButtonSm>
                        </PedidoAcoes>
                      )}
                    </PedidoCard>
                  ))
                )}
              </PageCardContent>
            </PageCard>
          )}

          {abaAtiva === "coordenados" && (
            <PageCard>
              <PageCardHeader>
                <PageCardTitle>Projetos que você coordena</PageCardTitle>
              </PageCardHeader>
              <PageCardContent>
                <EmptyText>
                  Quem entra no time é decidido pela gerência da frente e pela diretoria. Aqui você
                  acompanha quem já está e quem pediu para entrar.
                </EmptyText>
                {coordenados.length === 0 ? (
                  <EmptyText>Você não coordena nenhum projeto aberto.</EmptyText>
                ) : (
                  <CoordLista>
                    {coordenados.map((p) => (
                      <ProjetoCoordenadoCard
                        key={p.id}
                        projeto={p}
                        abertoInicial={coordenados.length === 1}
                      />
                    ))}
                  </CoordLista>
                )}
              </PageCardContent>
            </PageCard>
          )}

          {(abaAtiva === "solicitacoes" || abaAtiva === "historico") && (
            <PageCard>
              <PageCardHeader>
                <PageCardTitle>
                  {abaAtiva === "solicitacoes"
                    ? "Pedidos aguardando resposta"
                    : "Pedidos já respondidos"}
                </PageCardTitle>
              </PageCardHeader>
              <PageCardContent>
                {erro && <ErrorText>{erro}</ErrorText>}

                {/* Alocar sem pedido saiu daqui: agora é a aba "Projetos",
                    onde se clica no projeto e o painel lateral abre com quem
                    está disponível. Um seletor de projeto solto obrigava a
                    saber de cabeça em qual deles havia vaga. */}
                <LinhaDeCampos>
                  {/* Frente só na fila, e só para quem compara frentes: a
                      mesma regra da grade de projetos, vinda do back. */}
                  {abaAtiva === "solicitacoes" && dados.filtraPorFrente && (
                    <FieldGroup>
                      <FieldLabel htmlFor="filtro-frente">Frente</FieldLabel>
                      <FieldSelect
                        id="filtro-frente"
                        value={filtroFrente}
                        onChange={(e) => setFiltroFrente(e.target.value)}
                      >
                        <option value={TODOS}>Todas as frentes</option>
                        {frentesDaFila.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </FieldSelect>
                    </FieldGroup>
                  )}
                  <FieldGroup>
                    <FieldLabel htmlFor="filtro-projeto">Projeto</FieldLabel>
                    <FieldSelect
                      id="filtro-projeto"
                      value={filtroProjeto}
                      onChange={(e) => setFiltroProjeto(e.target.value)}
                    >
                      <option value={TODOS}>Todos os projetos</option>
                      {projetosDisponiveis.map(([id, nome]) => (
                        <option key={id} value={id}>
                          {nome}
                        </option>
                      ))}
                    </FieldSelect>
                  </FieldGroup>
                </LinhaDeCampos>

                {abaAtiva === "solicitacoes" ? (
                  pendentesFiltrados.length === 0 ? (
                    <ContagemFiltro>
                      {pendentes.length === 0
                        ? "Nenhum pedido aguardando resposta."
                        : "Nenhum pedido pendente com esses filtros."}
                    </ContagemFiltro>
                  ) : (
                    <>
                      <ContagemFiltro>
                        {pendentesFiltrados.length} de {pendentes.length}
                      </ContagemFiltro>
                      <FilaDePedidos
                        pedidos={pendentesFiltrados}
                        respondendo={respondendo}
                        onResponder={responder}
                      />
                    </>
                  )
                ) : respondidosFiltrados.length === 0 ? (
                  <ContagemFiltro>
                    {respondidos.length === 0
                      ? "Nenhum pedido respondido ainda."
                      : "Nenhum pedido respondido com esses filtros."}
                  </ContagemFiltro>
                ) : (
                  <>
                    <ContagemFiltro>
                      {respondidosFiltrados.length} de {respondidos.length}
                    </ContagemFiltro>
                    <HistoricoDePedidos pedidos={respondidosFiltrados} />
                  </>
                )}
              </PageCardContent>
            </PageCard>
          )}
        </>
      )}

      {aberto && (
        <VagaProjetoModal
          projeto={aberto}
          onFechar={() => setAberto(null)}
          onEnviar={enviarPedido}
        />
      )}

      {alocarEm && token && (
        <VagasAlocarPainel
          projeto={alocarEm}
          token={token}
          onFechar={() => setAlocarEm(null)}
          onAlocou={recarregar}
        />
      )}
    </PageStack>
  );
}

/**
 * O cartão de projeto, usado pelos dois públicos.
 *
 * Para o consultor ele é um botão de "pedir para entrar", e desliga quando há
 * impedimento. Para a gestão é sempre clicável e o impedimento não aparece:
 * ali o texto seria "sua posição entra por alocação da gestão", que é
 * verdade e irrelevante, ela não está pedindo nada, está alocando.
 */
function CartaoProjeto({
  projeto: p,
  modo,
  onAbrir,
}: {
  projeto: ProjetoComVaga;
  modo: "solicitar" | "gestao";
  onAbrir: (p: ProjetoComVaga) => void;
}) {
  const bloqueado = modo === "solicitar" && !!p.impedimento;

  return (
    <ProjetoCard
      type="button"
      $indisponivel={bloqueado}
      disabled={bloqueado}
      onClick={() => onAbrir(p)}
    >
      <CardTopo>
        <div>
          <CardNome>{p.nome}</CardNome>
          <br />
          <CardCliente>{p.cliente}</CardCliente>
        </div>
        <PageBadge $tone={p.vagas > 0 ? "success" : "muted"}>
          {p.vagas > 0 ? `${p.vagas} vaga${p.vagas > 1 ? "s" : ""}` : "Completo"}
        </PageBadge>
      </CardTopo>

      {p.frentes.length > 0 && (
        <FrentesRow>
          {p.frentes.map((f) => (
            <PageBadge key={f} $tone="default">
              {f}
            </PageBadge>
          ))}
        </FrentesRow>
      )}

      <VagasDots aria-label={`${p.alocados} de ${p.max_consultores} consultores`}>
        {Array.from({ length: p.max_consultores }, (_, i) => (
          <Bolinha key={i} $ocupada={i < p.alocados} />
        ))}
        <CardLinha>
          &nbsp;{p.alocados}/{p.max_consultores}
        </CardLinha>
      </VagasDots>

      <CardLinha>Coordenador: {p.coordenador_nome ?? "—"}</CardLinha>
      {modo === "solicitar" && p.impedimento && <Impedimento>{p.impedimento}</Impedimento>}
    </ProjetoCard>
  );
}

/**
 * A grade da gestão: agrupada por frente quando nenhuma está selecionada.
 *
 * Os grupos vêm ordenados por quantidade de projetos, do maior para o menor —
 * a frente que concentra o trabalho aparece primeiro, que é onde a decisão de
 * alocar costuma estar.
 *
 * Projeto sinérgico tem duas frentes e aparece nos DOIS grupos: o gerente que
 * abre a tela procurando a frente dele precisa achá-lo ali, e não num grupo
 * combinado que ele não pensaria em procurar.
 */
function GradeDaGestao({
  projetos,
  frente,
  agrupar,
  onAbrir,
}: {
  projetos: ProjetoComVaga[];
  frente: string;
  /** Falso para o gerente de uma frente só: um grupo não separa nada. */
  agrupar: boolean;
  onAbrir: (p: ProjetoComVaga) => void;
}) {
  const visiveis = useMemo(
    () => projetos.filter((p) => frente === TODOS || p.frentes.includes(frente)),
    [projetos, frente],
  );

  const grupos = useMemo(() => {
    if (!agrupar || frente !== TODOS) return [] as [string, ProjetoComVaga[]][];
    const mapa = new Map<string, ProjetoComVaga[]>();
    for (const p of visiveis) {
      for (const chave of p.frentes.length > 0 ? p.frentes : [SEM_FRENTE]) {
        mapa.set(chave, [...(mapa.get(chave) ?? []), p]);
      }
    }
    return [...mapa.entries()].sort((a, b) =>
      a[0] === SEM_FRENTE ? 1 : b[0] === SEM_FRENTE ? -1 : b[1].length - a[1].length,
    );
  }, [agrupar, frente, visiveis]);

  if (visiveis.length === 0) {
    return (
      <EmptyText>
        {projetos.length === 0
          ? "Nenhum projeto aberto no momento."
          : "Nenhum projeto desta frente."}
      </EmptyText>
    );
  }

  if (grupos.length === 0) {
    return (
      <VagasGrid>
        {visiveis.map((p) => (
          <CartaoProjeto key={p.id} projeto={p} modo="gestao" onAbrir={onAbrir} />
        ))}
      </VagasGrid>
    );
  }

  return (
    <>
      {grupos.map(([nome, doGrupo]) => (
        <GrupoFrente key={nome}>
          <GrupoFrenteTitulo>
            {nome}
            <GrupoFrenteContagem>
              {doGrupo.length} {doGrupo.length === 1 ? "projeto" : "projetos"}
            </GrupoFrenteContagem>
          </GrupoFrenteTitulo>
          <VagasGrid>
            {doGrupo.map((p) => (
              <CartaoProjeto key={p.id} projeto={p} modo="gestao" onAbrir={onAbrir} />
            ))}
          </VagasGrid>
        </GrupoFrente>
      ))}
    </>
  );
}

/** Iniciais para o círculo do time. Duas letras no máximo, três já viram
 *  mancha e param de funcionar como âncora visual. */
function iniciais(nome: string | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Um projeto na visão do coordenador.
 *
 * O cartão responde, de cima para baixo, às perguntas na ordem em que ele as
 * faz: que projeto é este, quão cheio está, quem está dentro, quem quer
 * entrar. As duas listas ficam lado a lado porque a comparação entre elas é o
 * ponto, "tenho 1 vaga e 3 pedidos" é a leitura que interessa, e ela some se
 * as listas ficarem uma embaixo da outra.
 */
function ProjetoCoordenadoCard({
  projeto,
  abertoInicial,
}: {
  projeto: ProjetoCoordenado;
  abertoInicial: boolean;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  const coordenador = projeto.equipe.filter((m) => m.papel === "coordenador");
  const consultores = projeto.equipe.filter((m) => m.papel === "consultor");
  const cheio = projeto.vagas === 0;
  const proporcao =
    projeto.max_consultores > 0 ? projeto.alocados / projeto.max_consultores : 0;

  // Pendentes primeiro: é o que ainda pode virar alguma coisa. Dentro de cada
  // grupo a ordem de chegada do back (mais recente antes) se mantém. O
  // `useMemo` existe para a lista não ser recriada a cada render, a
  // paginação usa a identidade dela para memoizar a fatia visível.
  const pedidos = useMemo(
    () =>
      [...projeto.pedidos].sort(
        (a, b) => Number(b.status === "pendente") - Number(a.status === "pendente"),
      ),
    [projeto.pedidos],
  );
  const pendentes = pedidos.filter((s) => s.status === "pendente").length;
  const paginacao = usePaginacao(pedidos, PEDIDOS_POR_PAGINA);

  return (
    <CoordCard>
      <CoordCabecalhoTitulo>
        <CoordCabecalho
          type="button"
          aria-expanded={aberto}
          aria-controls={`projeto-coordenado-${projeto.id}`}
          onClick={() => setAberto((v) => !v)}
        >
          <CoordIdentidadeLinha>
            <CoordSeta>
              {aberto ? (
                <ChevronDown size={18} aria-hidden="true" />
              ) : (
                <ChevronRight size={18} aria-hidden="true" />
              )}
            </CoordSeta>
            <CoordIdentidade>
              <CoordNome>{projeto.nome}</CoordNome>
              <CoordCliente>{projeto.cliente}</CoordCliente>
              <CoordTags>
                <PageBadge $tone="muted">
                  {ROTULO_STATUS[projeto.status as StatusProjeto] ?? projeto.status}
                </PageBadge>
                {projeto.frentes.map((f) => (
                  <PageBadge key={f} $tone="default">
                    {f}
                  </PageBadge>
                ))}
              </CoordTags>
            </CoordIdentidade>
          </CoordIdentidadeLinha>

          <CoordOcupacao>
            <CoordContagem>
              {projeto.alocados} de {projeto.max_consultores} consultores
            </CoordContagem>
            <CoordBarraTrilho aria-hidden="true">
              <CoordBarraPreenchida $proporcao={proporcao} $cheio={cheio} />
            </CoordBarraTrilho>
            <CoordPedidoMeta>
              {cheio
                ? "Time completo"
                : `${projeto.vagas} vaga${projeto.vagas > 1 ? "s" : ""} em aberto`}
              {pendentes > 0 && ` · ${pendentes} aguardando`}
            </CoordPedidoMeta>
          </CoordOcupacao>
        </CoordCabecalho>
      </CoordCabecalhoTitulo>

      {!aberto ? null : (
      <CoordCorpo id={`projeto-coordenado-${projeto.id}`}>
        <CoordColuna>
          <CoordColunaTitulo>
            <Users size={14} aria-hidden="true" />
            Time
          </CoordColunaTitulo>

          {coordenador.map((m) => (
            <CoordPessoa key={m.usuario_id}>
              <CoordAvatar $destaque aria-hidden="true">
                {iniciais(m.nome)}
              </CoordAvatar>
              <CoordPessoaNome>{m.nome}</CoordPessoaNome>
              <CoordPapel>coordenação</CoordPapel>
            </CoordPessoa>
          ))}

          {consultores.map((m) => (
            <CoordPessoa key={m.usuario_id}>
              <CoordAvatar aria-hidden="true">{iniciais(m.nome)}</CoordAvatar>
              <CoordPessoaNome>{m.nome}</CoordPessoaNome>
              <CoordPapel>consultoria</CoordPapel>
            </CoordPessoa>
          ))}

          {/* A vaga aberta aparece como lugar vazio na própria lista: ver o
              buraco é mais direto do que somar o número do cabeçalho. */}
          {Array.from({ length: projeto.vagas }, (_, i) => (
            <CoordVaga key={`vaga-${i}`}>
              <CoordVagaMarca aria-hidden="true" />
              Vaga em aberto
            </CoordVaga>
          ))}
        </CoordColuna>

        <CoordColuna>
          <CoordColunaTitulo>
            <Inbox size={14} aria-hidden="true" />
            Pedidos para entrar
            {pendentes > 0 && ` · ${pendentes} aguardando`}
          </CoordColunaTitulo>

          {pedidos.length === 0 ? (
            <CoordVazio>Ninguém pediu para entrar neste projeto.</CoordVazio>
          ) : (
            <>
              <ConteudoPaginado estado={paginacao}>
                {paginacao.visiveis.map((s) => (
                  <CoordPedido key={s.id}>
                    <CoordPedidoTopo>
                      <CoordPessoaNome>{s.usuario_nome}</CoordPessoaNome>
                      <PageBadge $tone={TOM_STATUS[s.status]}>{ROTULO_PEDIDO[s.status]}</PageBadge>
                    </CoordPedidoTopo>
                    <CoordPedidoMeta>
                      já está em {s.carga_do_solicitante}{" "}
                      {s.carga_do_solicitante === 1 ? "projeto" : "projetos"}
                      {s.status !== "pendente" &&
                        s.respondido_por_nome &&
                        ` · respondido por ${s.respondido_por_nome}`}
                    </CoordPedidoMeta>
                    <CoordJustificativa>{s.justificativa}</CoordJustificativa>
                  </CoordPedido>
                ))}
              </ConteudoPaginado>
              <Paginacao estado={paginacao} />
            </>
          )}
        </CoordColuna>
      </CoordCorpo>
      )}
    </CoordCard>
  );
}

/** Agrupa por projeto mantendo a ordem em que os pedidos chegaram. */
function porProjeto(pedidos: SolicitacaoRecebida[]) {
  const mapa = new Map<number, SolicitacaoRecebida[]>();
  for (const s of pedidos) {
    mapa.set(s.projeto_id, [...(mapa.get(s.projeto_id) ?? []), s]);
  }
  return [...mapa.entries()];
}

/**
 * ⭐ Em quantos projetos o solicitante já está — a informação que decide o
 * pedido, com o peso visual de quem decide.
 *
 * Era uma linha de meta cinza, do mesmo tamanho da data, e passava batido:
 * quem aprova lia a justificativa (por que a pessoa QUER entrar) e não via a
 * carga (se ela CABE em mais um). Virou badge, e fica vermelho quando a
 * escala classifica a carga como alerta.
 *
 * ⚠ **O gatilho é o `tom` da escala, nunca um número aqui.** O limiar de
 * "Demanda alta" — hoje 3 projetos — é editável pela diretoria em
 * `situacao_carga`. Cravar `>= 3` no front recriaria a régua paralela que o
 * núcleo acabou de tirar do backend, e as duas divergiriam no dia em que
 * alguém mexesse na configuração.
 *
 * ⚠ Não é bloqueio, e o texto evita soar como um: a carga alta é aviso, e
 * quem decide é quem está lendo. Dizer "não pode" seria mentira — a
 * plataforma aceita.
 */
function CargaDoSolicitante({ pedido }: { pedido: SolicitacaoRecebida }) {
  const situacao = pedido.situacao_do_solicitante;
  const alerta = situacao?.tom === "alerta";
  const carga = pedido.carga_do_solicitante;

  return (
    <CargaBadge $alerta={alerta}>
      {alerta && <TriangleAlert size={13} aria-hidden />}
      <span>
        Já está em {carga} {carga === 1 ? "projeto" : "projetos"}
        {situacao && ` · ${situacao.nome}`}
        {alerta && (
          <CargaRecado> — entrar em mais um pode sobrecarregar</CargaRecado>
        )}
      </span>
    </CargaBadge>
  );
}

/**
 * Um projeto na lista de pedidos: cabeçalho sempre visível, conteúdo que
 * abre e fecha, e paginação dentro quando a fila daquele projeto é longa.
 *
 * As duas dimensões que faziam a página crescer sem limite estão contidas
 * aqui: a quantidade de PROJETOS, porque fechado cada um ocupa uma linha; e a
 * de PEDIDOS por projeto, porque aberto ele mostra uma página de cada vez.
 *
 * Abre sozinho quando é o único da lista, um clique obrigatório para ver a
 * única coisa que existe na tela é clique desperdiçado.
 */
function BlocoDeProjeto({
  pedidos,
  porPagina,
  abertoInicial,
  contagem,
  children,
}: {
  pedidos: SolicitacaoRecebida[];
  porPagina: number;
  abertoInicial: boolean;
  contagem: string;
  children: (visiveis: SolicitacaoRecebida[]) => React.ReactNode;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  const paginacao = usePaginacao(pedidos, porPagina);
  const primeiro = pedidos[0];
  const idConteudo = `pedidos-projeto-${primeiro.projeto_id}`;

  return (
    <SolGrupo>
      <SolGrupoCabecalho>
        <SolGrupoBotao
          type="button"
          aria-expanded={aberto}
          aria-controls={idConteudo}
          onClick={() => setAberto((v) => !v)}
        >
          <SolGrupoSeta>
            {aberto ? (
              <ChevronDown size={16} aria-hidden="true" />
            ) : (
              <ChevronRight size={16} aria-hidden="true" />
            )}
          </SolGrupoSeta>
          <SolGrupoTitulo>
            {primeiro.projeto_nome}
            {primeiro.frentes.length > 0 && (
              <SolGrupoFrentes>{primeiro.frentes.join(" · ")}</SolGrupoFrentes>
            )}
          </SolGrupoTitulo>
          <SolGrupoContagem>{contagem}</SolGrupoContagem>
        </SolGrupoBotao>
      </SolGrupoCabecalho>

      {aberto && (
        <SolGrupoConteudo id={idConteudo}>
          <ConteudoPaginado estado={paginacao}>{children(paginacao.visiveis)}</ConteudoPaginado>
          <Paginacao estado={paginacao} />
        </SolGrupoConteudo>
      )}
    </SolGrupo>
  );
}

/**
 * A fila de pedidos a responder, um bloco por projeto.
 *
 * Cartão por pedido, com a ação no rodapé e separada por uma linha: aceitar
 * alguém num time é decisão, e decisão precisa de ar em volta para não ser
 * tomada por engano ao varrer a lista. "Recusar" vem antes de "Aceitar no
 * time" porque é a ordem que os modais do app já usam, secundária à
 * esquerda, primária à direita.
 */
function FilaDePedidos({
  pedidos,
  respondendo,
  onResponder,
}: {
  pedidos: SolicitacaoRecebida[];
  respondendo: number | null;
  onResponder: (id: number, aprovar: boolean) => void;
}) {
  const grupos = porProjeto(pedidos);

  return (
    <>
      {grupos.map(([projetoId, doProjeto]) => (
        <BlocoDeProjeto
          key={projetoId}
          pedidos={doProjeto}
          porPagina={PEDIDOS_POR_PAGINA}
          abertoInicial={grupos.length === 1}
          contagem={`${doProjeto.length} aguardando`}
        >
          {(visiveis) =>
            visiveis.map((s) => (
              <SolCard key={s.id}>
                <SolTopo>
                  <SolNome>{s.usuario_nome}</SolNome>
                  <SolQuando dateTime={s.criado_em}>{formatarDataHora(s.criado_em)}</SolQuando>
                </SolTopo>
                <CargaDoSolicitante pedido={s} />
                <SolTexto>{s.justificativa}</SolTexto>
                <SolAcoes>
                  <PageButtonSm
                    $variant="outline"
                    type="button"
                    disabled={respondendo === s.id}
                    onClick={() => onResponder(s.id, false)}
                  >
                    Recusar
                  </PageButtonSm>
                  <PageButtonSm
                    type="button"
                    disabled={respondendo === s.id}
                    onClick={() => onResponder(s.id, true)}
                  >
                    {respondendo === s.id ? "Salvando…" : "Aceitar no time"}
                  </PageButtonSm>
                </SolAcoes>
              </SolCard>
            ))
          }
        </BlocoDeProjeto>
      ))}
    </>
  );
}

/**
 * O histórico: a mesma informação da fila, em densidade de consulta.
 *
 * Linhas em vez de cartões, sem botão, e o desfecho como palavra em vez de
 * pílula, numa lista longa, uma caixa colorida por linha vira serrilhado e
 * compete com o nome, que é o que se procura ao varrer. A justificativa fica
 * cortada em duas linhas: aqui ela é contexto, não a decisão.
 */
function HistoricoDePedidos({ pedidos }: { pedidos: SolicitacaoRecebida[] }) {
  const grupos = porProjeto(pedidos);

  return (
    <>
      {grupos.map(([projetoId, doProjeto]) => (
        <BlocoDeProjeto
          key={projetoId}
          pedidos={doProjeto}
          porPagina={HISTORICO_POR_PAGINA}
          abertoInicial={grupos.length === 1}
          contagem={`${doProjeto.length} ${doProjeto.length === 1 ? "respondido" : "respondidos"}`}
        >
          {(visiveis) => (
            <HistLista>
              {visiveis.map((s) => (
                <HistItem key={s.id}>
                  <HistTopo>
                    <SolNome>{s.usuario_nome}</SolNome>
                    <HistDesfecho $aprovada={s.status === "aprovada"}>
                      {ROTULO_PEDIDO[s.status]}
                    </HistDesfecho>
                  </HistTopo>
                  <SolMeta>
                    <CargaDoSolicitante pedido={s} />
                    {s.respondido_por_nome && ` · por ${s.respondido_por_nome}`}
                    {s.respondido_em && ` · ${formatarDataHora(s.respondido_em)}`}
                  </SolMeta>
                  <HistTexto>{s.justificativa}</HistTexto>
                  {s.resposta && <SolMeta>Motivo: {s.resposta}</SolMeta>}
                </HistItem>
              ))}
            </HistLista>
          )}
        </BlocoDeProjeto>
      ))}
    </>
  );
}
