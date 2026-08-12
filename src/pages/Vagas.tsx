import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  cancelarSolicitacao,
  criarSolicitacao,
  getMinhasSolicitacoes,
  getProjetosComVaga,
  getSolicitacoesRecebidas,
  responderSolicitacao,
  type MinhaSolicitacao,
  type ProjetoComVaga,
  type SolicitacaoRecebida,
} from "@/lib/vagas";
import { VagaProjetoModal } from "./VagaProjetoModal";
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
import { TabBar, TabButton, TabCount } from "./Bancas.styled";
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
  GrupoProjeto,
  GrupoTitulo,
} from "./Vagas.styled";

type Aba = "vagas" | "meus" | "recebidos";

const TOM_STATUS = {
  pendente: "warning",
  aprovada: "success",
  recusada: "danger",
} as const;

/**
 * Vagas em projetos (§7.3).
 *
 * O consultor vê os projetos que ainda cabem gente, abre um e declara
 * interesse com uma justificativa. Quem responde é o COORDENADOR daquele
 * projeto, na aba "Recebidos" — que só aparece para quem coordena algo.
 */
export function Vagas() {
  const { token } = useAuth();
  const [aba, setAba] = useState<Aba>("vagas");
  const [dados, setDados] = useState<{
    projetos: ProjetoComVaga[];
    minhaCarga: number;
    teto: number;
  } | null>(null);
  const [meus, setMeus] = useState<MinhaSolicitacao[]>([]);
  const [recebidos, setRecebidos] = useState<SolicitacaoRecebida[]>([]);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [aberto, setAberto] = useState<ProjetoComVaga | null>(null);
  const [respondendo, setRespondendo] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    Promise.all([
      getProjetosComVaga(token),
      getMinhasSolicitacoes(token),
      getSolicitacoesRecebidas(token),
    ])
      .then(([vagas, m, r]) => {
        if (!ativo) return;
        setDados({ projetos: vagas.projetos, minhaCarga: vagas.minha_carga, teto: vagas.teto });
        setMeus(m);
        setRecebidos(r);
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
   * ⚠ **Recarrega mesmo quando falha** — e é o `finally` que importa aqui.
   *
   * O pedido é gravado antes de o coordenador ser notificado, então uma falha
   * depois do commit devolve erro para uma solicitação que EXISTE. Sem o
   * recarregamento, "Meus pedidos" continuava mostrando a lista velha: a
   * pessoa via o erro, tentava de novo, ouvia que já tinha um pedido em
   * análise, e não achava esse pedido em lugar nenhum da tela.
   *
   * O `throw` segue para o modal, que é quem mostra a mensagem — mas agora a
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

  const pendentesRecebidos = recebidos.filter((s) => s.status === "pendente");
  // Agrupa por projeto: o coordenador pensa "quem quer entrar no Alfa?",
  // não numa fila cronológica de pedidos soltos.
  const porProjeto = new Map<number, SolicitacaoRecebida[]>();
  for (const s of recebidos) {
    porProjeto.set(s.projeto_id, [...(porProjeto.get(s.projeto_id) ?? []), s]);
  }

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Vagas em projetos</PageTitle>
          <PageSubtitle>
            Você está em {dados.minhaCarga} de {dados.teto} projetos.
            {dados.minhaCarga >= dados.teto && " Saia de um antes de pedir para entrar em outro."}
          </PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <TabBar>
        <TabButton type="button" $ativa={aba === "vagas"} onClick={() => setAba("vagas")}>
          Projetos
          <TabCount>{dados.projetos.filter((p) => !p.impedimento).length}</TabCount>
        </TabButton>
        <TabButton type="button" $ativa={aba === "meus"} onClick={() => setAba("meus")}>
          Meus pedidos
          <TabCount>{meus.length}</TabCount>
        </TabButton>
        {/* Só quem coordena algum projeto tem o que responder. */}
        {recebidos.length > 0 && (
          <TabButton type="button" $ativa={aba === "recebidos"} onClick={() => setAba("recebidos")}>
            Recebidos
            <TabCount>{pendentesRecebidos.length}</TabCount>
          </TabButton>
        )}
      </TabBar>

      {aba === "vagas" && (
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
                  <ProjetoCard
                    key={p.id}
                    type="button"
                    $indisponivel={!!p.impedimento}
                    disabled={!!p.impedimento}
                    onClick={() => setAberto(p)}
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
                ))}
              </VagasGrid>
            )}
          </PageCardContent>
        </PageCard>
      )}

      {aba === "meus" && (
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
                      <PageButtonSm $variant="outline" type="button" onClick={() => desistir(s.id)}>
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

      {aba === "recebidos" && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Quem quer entrar nos seus projetos</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {erro && <ErrorText>{erro}</ErrorText>}
            {[...porProjeto.entries()].map(([projetoId, pedidos]) => (
              <GrupoProjeto key={projetoId}>
                <GrupoTitulo>{pedidos[0].projeto_nome}</GrupoTitulo>
                {pedidos.map((s) => (
                  <PedidoCard key={s.id}>
                    <PedidoTopo>
                      <div>
                        <CardNome>{s.usuario_nome}</CardNome>{" "}
                        <CardLinha>
                          já está em {s.carga_do_solicitante}{" "}
                          {s.carga_do_solicitante === 1 ? "projeto" : "projetos"}
                        </CardLinha>
                      </div>
                      <PageBadge $tone={TOM_STATUS[s.status]}>{s.status}</PageBadge>
                    </PedidoTopo>
                    <Justificativa>{s.justificativa}</Justificativa>
                    {s.status === "pendente" ? (
                      <PedidoAcoes>
                        <PageButtonSm
                          type="button"
                          disabled={respondendo === s.id}
                          onClick={() => responder(s.id, true)}
                        >
                          Aceitar no time
                        </PageButtonSm>
                        <PageButtonSm
                          $variant="outline"
                          type="button"
                          disabled={respondendo === s.id}
                          onClick={() => responder(s.id, false)}
                        >
                          Recusar
                        </PageButtonSm>
                      </PedidoAcoes>
                    ) : (
                      <CardLinha>
                        {s.status === "aprovada" ? "Aceito" : "Recusado"}
                        {s.respondido_por_nome && ` por ${s.respondido_por_nome}`}
                      </CardLinha>
                    )}
                  </PedidoCard>
                ))}
              </GrupoProjeto>
            ))}
          </PageCardContent>
        </PageCard>
      )}

      {aberto && (
        <VagaProjetoModal
          projeto={aberto}
          onFechar={() => setAberto(null)}
          onEnviar={enviarPedido}
        />
      )}
    </PageStack>
  );
}
