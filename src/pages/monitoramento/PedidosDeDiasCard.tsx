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
 * a fila de pedidos de dias de ajuste, para quem os aprova.
 *
 * **É o segundo caminho, não o único.** O mesmo pedido pode ser decidido no
 * banner do cronograma do projeto, onde o estouro está à vista. Esta lista
 * existe para quem chega pelo portfólio.
 *
 * ⭐ **A projeção é o dado que decide.** A linha dizia "+5 dias sobre 8
 * vendidos" e deixava a conta para a diretoria fazer de cabeça — e a conta
 * não é somar: são 13 dias ÚTEIS a partir da reunião inicial, pulando
 * feriado, prova e recesso do calendário do Insper. "Janela até 19/08 → 26/08
 * se aprovar" responde a pergunta que a decisão faz de verdade.
 *
 * ⚠ **Um dono só, e por isso os itens chegam por prop.** O card viveu também
 * na Visão geral, buscando sozinho em `/reajustes/pendentes` — o que disparava
 * duas requisições para a mesma fila e, pior, um 403 na cara de todo gerente
 * que abria o Monitoramento, já que a rota é `require_diretor`. A duplicata
 * saiu; a fila de decisões tem uma aba dedicada.
 */
export function PedidosDeDiasCard({
  itens,
  onDecidiu,
}: {
  itens: AprovacaoDiasDeAjuste[];
  onDecidiu: () => void;
}) {
  const { token } = useAuth();
  const [decidindo, setDecidindo] = useState<{ id: number; aprovado: boolean } | null>(null);
  const pedidos = itens;
  const [justificativa, setJustificativa] = useState("");
  const [enviando, setEnviando] = useState(false);

  // A régua é a POSIÇÃO, não uma caixa de cargo.
  //
  // Isto lia `cargo.pode_aprovar_reajuste`, que o backend removeu junto com a
  // coluna (migration 1556cc590a06). Como o campo deixou de vir, o default
  // `false` do AuthContext valia sempre, e o `return null` logo abaixo
  // escondia o card até da diretora, que é justamente quem decide. O  diz
  // "só a diretoria", e é isso que o `require_diretor` da rota cobra.
  const podeAprovar = usuario?.posicao === "diretor";

  const carregar = useCallback(async () => {
    if (!token || !podeAprovar) return;
    try {
      setPedidos(await getPedidosDeDiasPendentes(token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os pedidos");
    }
  }, [token, podeAprovar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O card inteiro some para quem não decide: uma lista de pedidos que a pessoa
  // não pode responder é só ansiedade.
  if (!podeAprovar) return null;

  async function responder() {
    if (!token || !decidindo) return;
    setErro("");
    setEnviando(true);
    try {
      await responderPedidoDeDias(
        decidindo.id,
        { aprovado: decidindo.aprovado, justificativa: justificativa.trim() },
        token,
      );
      setDecidindo(null);
      setJustificativa("");
      await carregar();
      onDecidiu?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível responder o pedido");
    } finally {
      setEnviando(false);
    }
  }

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
              const foraDoPrazo =
                !!p.prazo_pedido_ajuste && new Date(p.prazo_pedido_ajuste) < new Date();
              return (
                <AprovacaoLinha
                  key={p.id}
                  desde={p.criado_em}
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto to={`/projetos/${p.projeto_id}/cronograma`}>
                        {p.projeto_nome} — {p.escopo_nome}
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
            {pedidos.map((p) => (
              <ItemLista key={p.id}>
                <div>
                  <LinkProjeto to={`/projetos/${p.projeto_id}/cronograma`}>
                    {p.projeto_nome ?? "Projeto"}, {p.escopo_nome ?? "escopo"}
                  </LinkProjeto>
                  {/* Os dois números lado a lado, nunca somados: é contra a
                      janela de hoje que a diretoria decide se +N faz sentido. */}
                  <small>
                    +{p.dias_solicitados} dias sobre {p.dias_uteis_vendidos ?? "?"} vendidos
                    {!!p.dias_uteis_ajustados && ` · ${p.dias_uteis_ajustados} já ajustados`} ·{" "}
                    {p.solicitado_por_nome ?? "coordenador"} em {formatarData(p.criado_em)}
                  </small>
                  <small>{p.motivo}</small>
                </div>

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
