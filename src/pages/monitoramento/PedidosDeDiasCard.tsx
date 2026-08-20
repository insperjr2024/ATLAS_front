import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { responderPedidoDeDias } from "@/lib/cronograma";
import { formatarData } from "@/lib/projetos";
import type { AprovacaoDiasDeAjuste } from "@/lib/monitoramento";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButtonSm,
  EmptyText,
} from "@/styles/page.styled";
import {
  AprovacaoCitacao,
  AprovacaoMeta,
  AtrasoTitulo,
  LinkProjeto,
  ListaSimples,
  Pilula,
} from "./Monitoramento.styled";
import { AprovacaoLinha, FormDecisao } from "./AprovacaoLinha";

/**
 * A fila de pedidos de dias de ajuste, para quem os aprova.
 *
 * É o ÚNICO lugar onde o pedido é decidido: no cronograma do projeto o
 * banner apenas informa que há pedido aguardando. Esta lista existe para
 * quem chega pelo portfólio.
 *
 * A projeção é o dado que decide. A linha dizia "+5 dias sobre 8
 * vendidos" e deixava a conta para a diretoria fazer de cabeça, e a conta
 * não é somar: são 13 dias ÚTEIS a partir da reunião inicial, pulando
 * feriado, prova e recesso do calendário do Insper. "Janela até 19/08 → 26/08
 * se aprovar" responde a pergunta que a decisão faz de verdade.
 *
 * Um dono só, e por isso os itens chegam por prop. O card viveu também
 * na Visão geral, buscando sozinho em `/reajustes/pendentes`, o que disparava
 * duas requisições para a mesma fila e, pior, um 403 na cara de todo gerente
 * que abria o Monitoramento, já que a rota é `require_diretor`. A duplicata
 * saiu; a fila de decisões tem uma aba dedicada.
 */

/** Hoje em `yyyy-MM-dd` local — mesmo formato das datas que o backend manda. */
function hojeIso(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
interface Props {
  itens: AprovacaoDiasDeAjuste[];
  onDecidiu: () => void;
  /** Pra "voltar" do cronograma cair de novo em quem chamou este card. */
  voltarPara: string;
  voltarRotulo: string;
}

export function PedidosDeDiasCard({ itens, onDecidiu, voltarPara, voltarRotulo }: Props) {
  const { token } = useAuth();
  const [decidindo, setDecidindo] = useState<{ id: number; aprovado: boolean } | null>(null);
  const pedidos = itens;

  return (
    <PageCard id="fila-dias">
      <PageCardHeader>
        <PageCardTitle>
          Pedidos de dias de ajuste{pedidos.length > 0 && ` (${pedidos.length})`}
        </PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {pedidos.length === 0 ? (
          <EmptyText>Nenhum pedido aguardando decisão.</EmptyText>
        ) : (
          <ListaSimples>
            {pedidos.map((p) => {
              const janelaAtual = p.dias_vendidos + p.dias_ajustados;
              // Comparação de STRINGS de data local: `new Date("yyyy-MM-dd")`
              // é meia-noite UTC, e a comparação com o agora local carimbava
              // "fora do prazo" no próprio dia do prazo — que ainda vale (§8).
              const foraDoPrazo =
                !!p.prazo_pedido_ajuste && p.prazo_pedido_ajuste.slice(0, 10) < hojeIso();
              return (
                <AprovacaoLinha
                  key={p.id}
                  desde={p.criado_em}
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto
                        to={`/projetos/${p.projeto_id}/cronograma`}
                        state={{ voltarPara, voltarRotulo }}
                      >
                        {p.projeto_nome}, {p.escopo_nome}
                      </LinkProjeto>
                      {foraDoPrazo ? (
                        <Pilula $tom="atencao">pedido fora do prazo</Pilula>
                      ) : (
                        <Pilula $tom="neutro">+{p.dias_solicitados} dias</Pilula>
                      )}
                    </AtrasoTitulo>
                  }
                  acoes={
                    decidindo?.id === p.id ? (
                      <FormDecisao
                        rotuloConfirmar={
                          decidindo.aprovado
                            ? `Confirmar +${p.dias_solicitados}`
                            : "Confirmar recusa"
                        }
                        onCancelar={() => setDecidindo(null)}
                        onConfirmar={async (texto) => {
                          if (!token) return;
                          await responderPedidoDeDias(
                            p.id,
                            { aprovado: decidindo.aprovado, justificativa: texto },
                            token,
                          );
                          setDecidindo(null);
                          onDecidiu();
                        }}
                      />
                    ) : (
                      <>
                        {/* O número no rótulo é de propósito: é o que impede
                            aprovar +45 achando que era +5. */}
                        <PageButtonSm
                          type="button"
                          $variant="outline"
                          onClick={() => setDecidindo({ id: p.id, aprovado: true })}
                        >
                          Aprovar +{p.dias_solicitados}
                        </PageButtonSm>
                        <PageButtonSm
                          type="button"
                          $variant="ghost"
                          onClick={() => setDecidindo({ id: p.id, aprovado: false })}
                        >
                          Negar
                        </PageButtonSm>
                      </>
                    )
                  }
                >
                  <AprovacaoMeta>
                    {/* Os dois números lado a lado, nunca somados: a diferença
                        entre ter vendido 30 e ter vendido 20 e precisado de
                        mais 10 é a informação inteira. */}
                    <span>
                      janela: <strong>{p.dias_vendidos}</strong> vendidos
                      {p.dias_ajustados > 0 && (
                        <>
                          {" "}
                          + <strong>{p.dias_ajustados}</strong> já ajustados
                        </>
                      )}
                    </span>
                    {p.fim_janela && (
                      <span>
                        hoje vai até <strong>{formatarData(p.fim_janela)}</strong>
                      </span>
                    )}
                    {p.fim_se_aprovar && (
                      <span>
                        se aprovar: <em>{formatarData(p.fim_se_aprovar)}</em> (
                        {janelaAtual + p.dias_solicitados} dias)
                      </span>
                    )}
                    <span>
                      {p.solicitado_por_nome ?? "coordenador"} em {formatarData(p.criado_em)}
                    </span>
                  </AprovacaoMeta>

                  <AprovacaoCitacao>{p.motivo}</AprovacaoCitacao>
                </AprovacaoLinha>
              );
            })}
          </ListaSimples>
        )}
      </PageCardContent>
    </PageCard>
  );
}
