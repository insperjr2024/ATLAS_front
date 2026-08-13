import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getSolicitacoesRecebidas, responderSolicitacao, type SolicitacaoRecebida } from "@/lib/vagas";
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
  FieldGroup,
  FieldLabel,
  FieldTextarea,
} from "./Projetos.styled";
import {
  PedidoCard,
  PedidoTopo,
  Justificativa,
  PedidoAcoes,
  GrupoProjeto,
  GrupoTitulo,
  CardNome,
  CardLinha,
} from "./Vagas.styled";

const TOM_STATUS = {
  pendente: "warning",
  aprovada: "success",
  recusada: "danger",
} as const;

// "Pedido" é masculino — "recusada"/"aprovada" (concordando com
// "solicitação", como vem do banco) lia estranho aqui.
const ROTULO_STATUS = {
  pendente: "Pendente",
  aprovada: "Aceito",
  recusada: "Recusado",
} as const;

/**
 * "Quem quer entrar nos seus projetos" (§7.3) — a metade de Vagas em
 * projetos que é sobre RESPONDER, não pedir. Fica vazia pra quem não
 * coordena nada; a rota é a MESMA que a notificação de pedido novo já leva
 * (`registrar(..., rota="/projetos/solicitacoes")` em
 * `solicitacao_projeto.py`), então mover isto pra cá não pediu mudança
 * nenhuma no backend.
 */
interface VoltarState {
  voltarPara?: string;
  voltarRotulo?: string;
}

export function ProjetosSolicitacoes() {
  const { token } = useAuth();
  const location = useLocation();
  // Chega daqui tanto de uma notificação quanto do aviso dentro de um
  // projeto específico (`ProjetoPage.tsx`) — "voltar" precisa cair de novo
  // em quem mandou, não sempre no /projetos genérico.
  const voltar = (location.state ?? {}) as VoltarState;
  const voltarPara = voltar.voltarPara ?? "/projetos";
  const voltarRotulo = voltar.voltarRotulo ?? "Voltar para Projetos";
  const [recebidos, setRecebidos] = useState<SolicitacaoRecebida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [respondendo, setRespondendo] = useState<number | null>(null);
  // Aceitar/Recusar não dispara na hora: abre este mini-formulário pra
  // deixar escrever o motivo antes — opcional, mas precisa de ONDE escrever,
  // que era o que faltava (respondia sempre com `resposta: null`).
  const [decidindo, setDecidindo] = useState<{ id: number; aprovar: boolean } | null>(null);
  const [resposta, setResposta] = useState("");

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    setCarregando(true);
    getSolicitacoesRecebidas(token)
      .then((r) => {
        if (!ativo) return;
        setRecebidos(r);
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar as solicitações");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, tentativa]);

  async function responder() {
    if (!token || !decidindo) return;
    const { id, aprovar } = decidindo;
    setRespondendo(id);
    try {
      await responderSolicitacao(id, aprovar, token, resposta.trim() || undefined);
      setDecidindo(null);
      setResposta("");
      setTentativa((n) => n + 1);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao responder");
    } finally {
      setRespondendo(null);
    }
  }

  if (erro && recebidos.length === 0 && !carregando) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => setTentativa((n) => n + 1)}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  // Agrupa por projeto: o coordenador pensa "quem quer entrar no Alfa?",
  // não numa fila cronológica de pedidos soltos.
  const porProjeto = new Map<number, SolicitacaoRecebida[]>();
  for (const s of recebidos) {
    porProjeto.set(s.projeto_id, [...(porProjeto.get(s.projeto_id) ?? []), s]);
  }

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Solicitações recebidas</PageHeading>
          <PageSubheading>Quem pediu para entrar nos projetos que você coordena.</PageSubheading>
        </PageHeaderText>
        <Link to={voltarPara}>
          <PageButtonSm type="button" $variant="outline">
            {voltarRotulo}
          </PageButtonSm>
        </Link>
      </PageHeaderRow>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Pedidos</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {recebidos.length === 0 ? (
            <EmptyText>Nenhuma solicitação por enquanto.</EmptyText>
          ) : (
            [...porProjeto.entries()].map(([projetoId, pedidos]) => (
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
                      <PageBadge $tone={TOM_STATUS[s.status]}>{ROTULO_STATUS[s.status]}</PageBadge>
                    </PedidoTopo>
                    <Justificativa>{s.justificativa}</Justificativa>
                    {s.status === "pendente" ? (
                      decidindo?.id === s.id ? (
                        <FieldGroup>
                          <FieldLabel htmlFor={`resposta-${s.id}`}>
                            Motivo (opcional) — {s.usuario_nome} vai ver isto
                          </FieldLabel>
                          <FieldTextarea
                            id={`resposta-${s.id}`}
                            rows={2}
                            value={resposta}
                            onChange={(e) => setResposta(e.target.value)}
                          />
                          <PedidoAcoes>
                            <PageButtonSm
                              type="button"
                              disabled={respondendo === s.id}
                              onClick={responder}
                            >
                              {decidindo.aprovar ? "Confirmar aceite" : "Confirmar recusa"}
                            </PageButtonSm>
                            <PageButtonSm
                              type="button"
                              $variant="ghost"
                              disabled={respondendo === s.id}
                              onClick={() => {
                                setDecidindo(null);
                                setResposta("");
                              }}
                            >
                              Cancelar
                            </PageButtonSm>
                          </PedidoAcoes>
                        </FieldGroup>
                      ) : (
                        <PedidoAcoes>
                          <PageButtonSm
                            type="button"
                            onClick={() => setDecidindo({ id: s.id, aprovar: true })}
                          >
                            Aceitar no time
                          </PageButtonSm>
                          <PageButtonSm
                            $variant="outline"
                            type="button"
                            onClick={() => setDecidindo({ id: s.id, aprovar: false })}
                          >
                            Recusar
                          </PageButtonSm>
                        </PedidoAcoes>
                      )
                    ) : (
                      <CardLinha>
                        {s.status === "aprovada" ? "Aceito" : "Recusado"}
                        {s.respondido_por_nome && ` por ${s.respondido_por_nome}`}
                      </CardLinha>
                    )}
                  </PedidoCard>
                ))}
              </GrupoProjeto>
            ))
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
