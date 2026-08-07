import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPedidosDeDiasPendentes,
  responderPedidoDeDias,
  type PedidoPendente,
} from "@/lib/cronograma";
import { formatarData } from "@/lib/projetos";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  EmptyText,
  ErrorText,
} from "@/styles/page.styled";
import { FieldGroup, FieldInput, FieldLabel } from "@/pages/projetos/Projetos.styled";
import { ItemLista, LinkProjeto, ListaSimples } from "./Monitoramento.styled";

/**
 * §8: a fila de pedidos de dias de ajuste, para quem os aprova.
 *
 * ⭐ **É o segundo caminho, não o único.** O mesmo pedido pode ser decidido no
 * banner do cronograma do projeto, onde o estouro está à vista. Esta lista
 * existe para quem chega pelo portfólio: sem ela, a diretoria só descobriria os
 * pedidos abrindo projeto por projeto ou pela notificação, que some quando é
 * lida.
 *
 * A decisão exige justificativa nos dois sentidos — aprovar e negar. O §8 diz
 * que a recusa fica registrada, e é ela que explica depois por que a janela
 * continuou nos dias vendidos.
 */
export function PedidosDeDiasCard({ onDecidiu }: { onDecidiu?: () => void } = {}) {
  const { token, usuario } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoPendente[]>([]);
  const [erro, setErro] = useState("");
  const [decidindo, setDecidindo] = useState<{ id: number; aprovado: boolean } | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [enviando, setEnviando] = useState(false);

  // ⚠ A régua é a POSIÇÃO, não uma caixa de cargo.
  //
  // Isto lia `cargo.pode_aprovar_reajuste`, que o backend removeu junto com a
  // coluna (migration 1556cc590a06). Como o campo deixou de vir, o default
  // `false` do AuthContext valia sempre — e o `return null` logo abaixo
  // escondia o card até da diretora, que é justamente quem decide. O §8 diz
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
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Pedidos de dias de ajuste ({pedidos.length})</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {erro && <ErrorText>{erro}</ErrorText>}
        {pedidos.length === 0 ? (
          <EmptyText>Nenhum pedido aguardando decisão.</EmptyText>
        ) : (
          <ListaSimples>
            {pedidos.map((p) => (
              <ItemLista key={p.id}>
                <div>
                  <LinkProjeto to={`/projetos/${p.projeto_id}/cronograma`}>
                    {p.projeto_nome ?? "Projeto"} — {p.escopo_nome ?? "escopo"}
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

                {decidindo?.id === p.id ? (
                  <FieldGroup>
                    <FieldLabel htmlFor={`justificativa-${p.id}`}>
                      Justificativa da decisão
                    </FieldLabel>
                    <FieldInput
                      as="textarea"
                      id={`justificativa-${p.id}`}
                      rows={2}
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                    />
                    <div>
                      <PageButton
                        type="button"
                        disabled={enviando || !justificativa.trim()}
                        onClick={responder}
                      >
                        {decidindo.aprovado ? "Confirmar aprovação" : "Confirmar recusa"}
                      </PageButton>
                      <PageButton
                        type="button"
                        $variant="ghost"
                        onClick={() => setDecidindo(null)}
                      >
                        Cancelar
                      </PageButton>
                    </div>
                  </FieldGroup>
                ) : (
                  <div>
                    <PageButton
                      type="button"
                      $variant="outline"
                      onClick={() => {
                        setJustificativa("");
                        setDecidindo({ id: p.id, aprovado: true });
                      }}
                    >
                      Aprovar
                    </PageButton>
                    <PageButton
                      type="button"
                      $variant="ghost"
                      onClick={() => {
                        setJustificativa("");
                        setDecidindo({ id: p.id, aprovado: false });
                      }}
                    >
                      Negar
                    </PageButton>
                  </div>
                )}
              </ItemLista>
            ))}
          </ListaSimples>
        )}
      </PageCardContent>
    </PageCard>
  );
}
