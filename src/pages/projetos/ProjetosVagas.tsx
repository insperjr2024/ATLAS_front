import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import {
  cancelarSolicitacao,
  criarSolicitacao,
  getMinhasSolicitacoes,
  getProjetosComVaga,
  type MinhaSolicitacao,
  type ProjetoComVaga,
} from "@/lib/vagas";
import type { Frente } from "@/types/banca";
import { VagaProjetoModal } from "@/pages/VagaProjetoModal";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButtonSm,
  PageLoadingBlock,
  EmptyText,
  ErrorBlock,
  ErrorText,
  PageButton,
} from "@/styles/page.styled";
import {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  FiltersRow,
  FrenteFilterWrap,
  FrenteFilterButton,
  FrenteFilterPanel,
  FrenteFilterFooter,
  FrenteFilterSecao,
  CheckboxLabel,
  FormErrorText,
  VoltarLink,
} from "./Projetos.styled";
import {
  VagasGrid,
  ProjetoCard,
  ProjetoCardEstatico,
  PedidoStatusLinha,
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
  PedidoTopoAcoes,
  BotaoExcluirPedido,
  MinhaJustificativa,
  PedidoAcoes,
  MeusPedidosWrap,
  MeusPedidosButton,
  MeusPedidosPanel,
} from "./Vagas.styled";

const TOM_STATUS = {
  pendente: "warning",
  aprovada: "success",
  recusada: "danger",
} as const;

// "Pedido" é masculino — "recusada"/"aprovada" (concordando com
// "solicitação", como vem do banco) lia estranho aqui. Mesmo rótulo que
// `ProjetosSolicitacoes.tsx` já usa pro coordenador ("Aceito"/"Recusado").
const ROTULO_STATUS = {
  pendente: "Pendente",
  aprovada: "Aceito",
  recusada: "Recusado",
} as const;

/**
 * Vagas em projetos (§7.3) — a parte de NAVEGAR e pedir pra entrar.
 *
 * Vive em `/projetos/vagas`, não mais como item próprio do menu: é uma
 * intenção diferente de "olhar meus projetos" (por isso não é um filtro nem
 * um modo de visualização de `ProjetosList`), mas ainda É sobre projetos —
 * uma porta de entrada a partir de lá, não um destino solto.
 *
 * "Recebidos" (pedidos pro que EU coordeno) foi pra `/projetos/solicitacoes`
 * — é a mesma rota que a notificação de pedido novo já usa no backend
 * (`solicitacao_projeto.py`), então essa separação já era esperada por lá.
 * "Meus pedidos" fica AQUI (não em Meu Perfil): é sobre vagas, não sobre
 * cadastro, e precisa mostrar o histórico completo (pendente/aceito/
 * recusado, com a resposta do coordenador) e deixar cancelar mesmo quando
 * o projeto já saiu da grade de "Projetos abertos" (arquivado, time
 * completo, fechado) — senão o pedido pendente fica com um cancelar
 * inalcançável.
 */
interface VoltarState {
  voltarPara?: string;
  voltarRotulo?: string;
}

export function ProjetosVagas() {
  const { usuario, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Quem chegou daqui de /projetos (kanban/lista/arquivados) volta pro
  // mesmo modo, não pro kanban padrão — mesma ideia do `voltarPara` de
  // `ProjetoPage.tsx`, só que sem sub-rota pra guardar o estado.
  const voltar = (location.state ?? {}) as VoltarState;
  const voltarPara = voltar.voltarPara ?? "/projetos";
  const voltarRotulo = voltar.voltarRotulo ?? "Voltar para Projetos";
  const [dados, setDados] = useState<{
    projetos: ProjetoComVaga[];
    minhaCarga: number;
    teto: number;
  } | null>(null);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [frentesSelecionadas, setFrentesSelecionadas] = useState<number[]>([]);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const filtroRef = useRef<HTMLDivElement>(null);
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState<MinhaSolicitacao[]>([]);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [pedidosAberto, setPedidosAberto] = useState(false);
  const pedidosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    getProjetosComVaga(token)
      .then((vagas) => {
        if (!ativo) return;
        setDados({ projetos: vagas.projetos, minhaCarga: vagas.minha_carga, teto: vagas.teto });
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar as vagas");
      });
    return () => {
      ativo = false;
    };
  }, [token, tentativa]);

  // Pra saber, card a card, se EU já pedi pra entrar naquele projeto —
  // recarrega junto com `dados` (mesma dependência `tentativa`) porque pedir
  // ou cancelar muda os dois ao mesmo tempo.
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    getMinhasSolicitacoes(token)
      .then((r) => {
        if (ativo) setMinhasSolicitacoes(r);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [token, tentativa]);

  // Aceito só precisa aparecer UMA vez aqui — dali pra frente o projeto já
  // aparece normal em "Meus projetos", e ficar acumulando pedido aceito
  // nesta lista é redundante. Limpa sozinho assim que a pessoa abre o
  // painel (o momento em que ela efetivamente "viu"), sem esperar um clique.
  useEffect(() => {
    if (!pedidosAberto || !token) return;
    const aprovados = minhasSolicitacoes.filter((s) => s.status === "aprovada");
    if (aprovados.length === 0) return;
    Promise.all(aprovados.map((s) => cancelarSolicitacao(s.id, token)))
      .then(() => setTentativa((n) => n + 1))
      .catch(() => {});
  }, [pedidosAberto, minhasSolicitacoes, token]);

  // Direto na frente de atuação: a lista já abre filtrada pelas frentes da
  // própria pessoa, sem impedir de limpar e ver as outras. Roda uma vez só
  // (não depende de `tentativa`) pra não atropelar uma seleção manual depois
  // de reenviar um pedido.
  useEffect(() => {
    if (!token || !usuario) return;
    let ativo = true;
    Promise.all([getFrentes(token), getUsuariosFrentes(token)])
      .then(([frentesResp, vinculosResp]) => {
        if (!ativo) return;
        setFrentes(frentesResp);
        setFrentesSelecionadas(
          vinculosResp.filter((v) => v.usuario_id === usuario.id).map((v) => v.frente_id),
        );
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [token, usuario]);

  useEffect(() => {
    if (!filtroAberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [filtroAberto]);

  useEffect(() => {
    if (!pedidosAberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (pedidosRef.current && !pedidosRef.current.contains(e.target as Node)) {
        setPedidosAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [pedidosAberto]);

  function alternarFrente(id: number) {
    setFrentesSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  // O modal vive no parâmetro `?vaga=`, não num useState local: abrir EMPILHA
  // uma entrada de histórico (`setSearchParams` sem `replace`), então o botão
  // Voltar do navegador fecha só o modal e cai de volta nesta mesma grade —
  // sem isso, Voltar pulava o modal inteiro e saía direto pra tela anterior a
  // /projetos/vagas.
  function abrirVaga(id: number) {
    setSearchParams((atual) => {
      const proximo = new URLSearchParams(atual);
      proximo.set("vaga", String(id));
      return proximo;
    });
  }

  function fecharVaga() {
    navigate(-1);
  }

  async function cancelar(solicitacaoId: number) {
    if (!token) return;
    setCancelando(solicitacaoId);
    try {
      await cancelarSolicitacao(solicitacaoId, token);
      setTentativa((n) => n + 1);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao cancelar o pedido");
    } finally {
      setCancelando(null);
    }
  }

  if (erro && !dados) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => setTentativa((n) => n + 1)}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (!dados) return <PageLoadingBlock />;

  const idAberto = searchParams.get("vaga");
  const aberto = idAberto ? (dados.projetos.find((p) => p.id === Number(idAberto)) ?? null) : null;

  async function enviarPedido(justificativa: string) {
    if (!token || !aberto) return;
    await criarSolicitacao(aberto.id, justificativa, token);
    fecharVaga();
    setTentativa((n) => n + 1);
  }

  const pendentePorProjeto = new Map(
    minhasSolicitacoes.filter((s) => s.status === "pendente").map((s) => [s.projeto_id, s]),
  );

  const nomesSelecionados = frentes
    .filter((f) => frentesSelecionadas.includes(f.id))
    .map((f) => f.nome);
  // Sinérgico (mais de uma frente) aparece se QUALQUER uma das suas frentes
  // estiver marcada — mesma regra do filtro em Projetos.
  const projetosFiltrados =
    nomesSelecionados.length === 0
      ? dados.projetos
      : dados.projetos.filter((p) => p.frentes.some((nome) => nomesSelecionados.includes(nome)));

  return (
    <PageStack>
      <VoltarLink to={voltarPara}>
        <ArrowLeft size={14} />
        {voltarRotulo}
      </VoltarLink>

      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Vagas em projetos</PageHeading>
          <PageSubheading>
            Você está em {dados.minhaCarga} de {dados.teto} projetos.
            {dados.minhaCarga >= dados.teto && " Saia de um antes de pedir para entrar em outro."}
          </PageSubheading>
        </PageHeaderText>
        <FiltersRow>
          {/* Meus pedidos entra aqui, não Frentes: é sobre a pessoa (o que
              ELA pediu), não sobre filtrar a grade de projetos abaixo — por
              isso troca de lugar com o filtro, que é da grade. */}
          <MeusPedidosWrap ref={pedidosRef}>
            <MeusPedidosButton
              type="button"
              aria-haspopup="dialog"
              aria-expanded={pedidosAberto}
              onClick={() => setPedidosAberto((aberto) => !aberto)}
            >
              <Send size={14} />
              Meus pedidos{minhasSolicitacoes.length > 0 && ` (${minhasSolicitacoes.length})`}
            </MeusPedidosButton>
            {pedidosAberto && (
              <MeusPedidosPanel role="dialog" aria-label="Meus pedidos">
                {minhasSolicitacoes.length === 0 ? (
                  <EmptyText>Você ainda não pediu para entrar em nenhum projeto.</EmptyText>
                ) : (
                  minhasSolicitacoes.map((s) => (
                    <PedidoCard key={s.id}>
                      <PedidoTopo>
                        <CardNome>{s.projeto_nome}</CardNome>
                        <PedidoTopoAcoes>
                          <PageBadge $tone={TOM_STATUS[s.status]}>{ROTULO_STATUS[s.status]}</PageBadge>
                          {s.status === "recusada" && (
                            <BotaoExcluirPedido
                              type="button"
                              aria-label="Excluir pedido"
                              title="Excluir pedido"
                              disabled={cancelando === s.id}
                              onClick={() => cancelar(s.id)}
                            >
                              <Trash2 size={14} />
                            </BotaoExcluirPedido>
                          )}
                        </PedidoTopoAcoes>
                      </PedidoTopo>
                      <MinhaJustificativa>{s.justificativa}</MinhaJustificativa>
                      {s.resposta && <CardLinha>Resposta: {s.resposta}</CardLinha>}
                      {s.status === "pendente" && (
                        <PedidoAcoes>
                          <PageButtonSm
                            type="button"
                            $variant="outline"
                            disabled={cancelando === s.id}
                            onClick={() => cancelar(s.id)}
                          >
                            Cancelar pedido
                          </PageButtonSm>
                        </PedidoAcoes>
                      )}
                    </PedidoCard>
                  ))
                )}
              </MeusPedidosPanel>
            )}
          </MeusPedidosWrap>
        </FiltersRow>
      </PageHeaderRow>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Projetos abertos</PageCardTitle>
          <FrenteFilterWrap ref={filtroRef}>
            <FrenteFilterButton
              type="button"
              aria-haspopup="listbox"
              aria-expanded={filtroAberto}
              onClick={() => setFiltroAberto((aberto) => !aberto)}
            >
              Frentes{frentesSelecionadas.length > 0 && ` (${frentesSelecionadas.length})`}
              <ChevronDown size={14} />
            </FrenteFilterButton>
            {filtroAberto && (
              <FrenteFilterPanel role="listbox" aria-label="Filtrar por frente">
                <FrenteFilterSecao>Frentes</FrenteFilterSecao>
                {frentes.map((frente) => (
                  <CheckboxLabel key={frente.id}>
                    <input
                      type="checkbox"
                      checked={frentesSelecionadas.includes(frente.id)}
                      onChange={() => alternarFrente(frente.id)}
                    />
                    {frente.nome}
                  </CheckboxLabel>
                ))}
                {frentesSelecionadas.length > 0 && (
                  <FrenteFilterFooter type="button" onClick={() => setFrentesSelecionadas([])}>
                    Limpar seleção
                  </FrenteFilterFooter>
                )}
              </FrenteFilterPanel>
            )}
          </FrenteFilterWrap>
        </PageCardHeader>
        <PageCardContent>
          {erro && dados && <FormErrorText>{erro}</FormErrorText>}
          {projetosFiltrados.length === 0 ? (
            <EmptyText>
              {dados.projetos.length === 0
                ? "Nenhum projeto aberto no momento."
                : "Nenhum projeto aberto nas frentes selecionadas."}
            </EmptyText>
          ) : (
            <VagasGrid>
              {projetosFiltrados.map((p) => {
                const pedidoPendente = pendentePorProjeto.get(p.id);

                // Já pedi pra entrar aqui: o card deixa de abrir o modal —
                // pedir de novo não é uma opção — e mostra o status com o
                // cancelar direto ali, sem precisar abrir o painel de Meus
                // pedidos pra uma ação tão comum.
                if (pedidoPendente) {
                  return (
                    <ProjetoCardEstatico key={p.id}>
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

                      <PedidoStatusLinha>
                        <PageBadge $tone="warning">Pedido pendente</PageBadge>
                        <PageButtonSm
                          type="button"
                          $variant="outline"
                          disabled={cancelando === pedidoPendente.id}
                          onClick={() => cancelar(pedidoPendente.id)}
                        >
                          Cancelar pedido
                        </PageButtonSm>
                      </PedidoStatusLinha>
                    </ProjetoCardEstatico>
                  );
                }

                return (
                  <ProjetoCard
                    key={p.id}
                    type="button"
                    $indisponivel={!!p.impedimento}
                    disabled={!!p.impedimento}
                    onClick={() => abrirVaga(p.id)}
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
                    {p.impedimento && <Impedimento>{p.impedimento}</Impedimento>}
                  </ProjetoCard>
                );
              })}
            </VagasGrid>
          )}
        </PageCardContent>
      </PageCard>

      {aberto && (
        <VagaProjetoModal projeto={aberto} onFechar={fecharVaga} onEnviar={enviarPedido} />
      )}
    </PageStack>
  );
}
