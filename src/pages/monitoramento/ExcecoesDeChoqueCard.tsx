import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  decidirExcecaoChoque,
  getExcecoesChoquePendentes,
  type ExcecaoChoquePendente,
} from "@/lib/bancas";
import { formatarDataHora } from "@/lib/projetos";
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
 * ⭐ §8: a fila de exceções de choque de horário, para quem as decide.
 *
 * ⚠ **A regra existia sem via de cumprimento.** O backend recusa duas bancas no
 * mesmo horário dizendo que a exceção é da diretoria — e não havia como pedi-la
 * nem como concedê-la: a rota que gravava a liberação não tinha chamador
 * nenhum. Quem esbarrava no choque só podia mudar o horário ou resolver por
 * fora do sistema.
 *
 * **Decide-se AQUI, não em outra tela** — ao contrário de três das outras filas
 * desta aba. O contexto de que a decisão precisa é curto e cabe na linha: qual
 * projeto quer o horário, com qual banca ele choca, e por quê. Mandar a
 * diretoria abrir o cronograma para isso seria um desvio sem ganho.
 *
 * A resposta é obrigatória nos dois sentidos: recusar sem motivo deixa quem
 * pediu sem saber o que mudar, e aprovar sem motivo apaga por que a regra foi
 * aberta naquele caso — que é justamente o que se vai querer saber depois.
 */
export function ExcecoesDeChoqueCard({ onDecidiu }: { onDecidiu?: () => void } = {}) {
  const { token, usuario } = useAuth();
  const [pedidos, setPedidos] = useState<ExcecaoChoquePendente[]>([]);
  const [erro, setErro] = useState("");
  const [decidindo, setDecidindo] = useState<{ id: number; aprovar: boolean } | null>(null);
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Mesma régua do `PedidosDeDiasCard`: a POSIÇÃO, que é o que a rota cobra
  // com `require_diretor`.
  const podeDecidir = usuario?.posicao === "diretor";

  const carregar = useCallback(async () => {
    if (!token || !podeDecidir) return;
    try {
      setPedidos(await getExcecoesChoquePendentes(token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os pedidos");
    }
  }, [token, podeDecidir]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Some inteiro para quem não decide — lista que a pessoa não pode responder
  // é só ansiedade.
  if (!podeDecidir) return null;

  async function responder() {
    if (!token || !decidindo) return;
    setErro("");
    setEnviando(true);
    try {
      await decidirExcecaoChoque(
        decidindo.id,
        { aprovar: decidindo.aprovar, resposta: resposta.trim() },
        token,
      );
      setDecidindo(null);
      setResposta("");
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
        <PageCardTitle>Exceções de choque de horário ({pedidos.length})</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {erro && <ErrorText>{erro}</ErrorText>}
        {pedidos.length === 0 ? (
          <EmptyText>Nenhum pedido para marcar banca em horário já ocupado.</EmptyText>
        ) : (
          <ListaSimples>
            {pedidos.map((p) => (
              <ItemLista key={p.id}>
                <div>
                  <LinkProjeto to={`/projetos/${p.projeto_id}/cronograma`}>
                    {p.projeto_nome}
                  </LinkProjeto>
                  {/* O horário e o conflito na mesma linha: é a comparação
                      que a decisão é. */}
                  <small>
                    quer {formatarDataHora(p.data_hora_pretendida)} · choca com a banca de{" "}
                    <strong>{p.conflita_com}</strong>
                  </small>
                  <small>
                    {p.solicitado_por_nome ?? "coordenador"} · {p.justificativa}
                  </small>
                </div>

                {decidindo?.id === p.id ? (
                  <FieldGroup>
                    <FieldLabel htmlFor={`resposta-choque-${p.id}`}>
                      Motivo da decisão
                    </FieldLabel>
                    <FieldInput
                      as="textarea"
                      id={`resposta-choque-${p.id}`}
                      rows={2}
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                    />
                    <div>
                      <PageButton
                        type="button"
                        disabled={enviando || !resposta.trim()}
                        onClick={responder}
                      >
                        {decidindo.aprovar ? "Confirmar liberação" : "Confirmar recusa"}
                      </PageButton>
                      <PageButton type="button" $variant="ghost" onClick={() => setDecidindo(null)}>
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
                        setResposta("");
                        setDecidindo({ id: p.id, aprovar: true });
                      }}
                    >
                      Liberar
                    </PageButton>
                    <PageButton
                      type="button"
                      $variant="ghost"
                      onClick={() => {
                        setResposta("");
                        setDecidindo({ id: p.id, aprovar: false });
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
