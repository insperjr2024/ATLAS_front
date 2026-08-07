import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getAprovacoes, type Aprovacoes } from "@/lib/monitoramento";
import { formatarData } from "@/lib/projetos";
import { PedidosDeDiasCard } from "./PedidosDeDiasCard";
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
import { ItemLista, LinkProjeto, ListaSimples, Pilula } from "./Monitoramento.styled";

/**
 * ⭐ A fila da diretoria — tudo que espera decisão dela, num lugar só.
 *
 * O problema que esta aba resolve não é de dado, é de descoberta. As decisões
 * estavam espalhadas: o pedido de dias num card da Visão geral, a
 * justificativa de atraso dentro da aba Atrasos, e a classificação de entrega
 * em lugar nenhum. Fila que ninguém sabe que existe é fila parada — dois
 * pedidos chegaram a ficar represados sem ninguém notar.
 *
 * ⚠ **Nem toda ação restrita à diretoria é uma aprovação.** Criar formulário,
 * configurar coluna do kanban e excluir usuário também são só dela, e nenhuma
 * entra aqui: são coisas que ela FAZ quando quer, não coisas que esperam por
 * ela. O critério é ter alguém do outro lado bloqueado enquanto não houver
 * resposta.
 *
 * As duas filas de baixo **não decidem aqui**: elas levam ao lugar onde a
 * decisão tem contexto. Justificar um atraso sem ver os motivos, ou
 * classificar uma entrega sem ver o cronograma, é decidir no escuro. A aba
 * responde "o que falta?"; a tela do projeto responde "por quê?".
 */
export function AprovacoesAba() {
  const { token } = useAuth();
  const [dados, setDados] = useState<Aprovacoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      setDados(await getAprovacoes(token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as aprovações");
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  if (dados.total === 0) {
    return (
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Nada esperando por você</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <EmptyText>
            Nenhum pedido de dias, nenhum atraso sem justificativa e nenhuma entrega sem
            classificação. Quando algo precisar da sua decisão, aparece aqui.
          </EmptyText>
        </PageCardContent>
      </PageCard>
    );
  }

  return (
    <PageStack>
      {/* Decide na própria lista: o pedido traz o motivo escrito, que é todo o
          contexto de que a decisão precisa. */}
      <PedidosDeDiasCard onDecidiu={carregar} />

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Atrasos sem justificativa
            {dados.atrasos_sem_justificativa.length > 0 &&
              ` (${dados.atrasos_sem_justificativa.length})`}
          </PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.atrasos_sem_justificativa.length === 0 ? (
            <EmptyText>Todo projeto atrasado já tem o porquê registrado.</EmptyText>
          ) : (
            <>
              <EmptyText style={{ marginBottom: "0.75rem" }}>
                §7.4: o alerta de atraso é automático, mas o motivo é você quem escreve — e é ele
                que explica o vermelho para quem olha o portfólio depois.
              </EmptyText>
              <ListaSimples>
                {dados.atrasos_sem_justificativa.map((a) => (
                  <ItemLista key={a.projeto_id}>
                    <div>
                      <LinkProjeto as={Link} to={`/projetos/${a.projeto_id}`}>
                        {a.projeto_nome}
                      </LinkProjeto>
                      <EmptyText>{a.motivos.join(" · ")}</EmptyText>
                    </div>
                    <Pilula $tom="alerta">
                      {a.dias_totais} {a.dias_totais === 1 ? "dia" : "dias"}
                    </Pilula>
                  </ItemLista>
                ))}
              </ListaSimples>
            </>
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Entregas sem classificação
            {dados.entregas_sem_classificacao.length > 0 &&
              ` (${dados.entregas_sem_classificacao.length})`}
          </PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.entregas_sem_classificacao.length === 0 ? (
            <EmptyText>Toda entrega atrasada já foi classificada.</EmptyText>
          ) : (
            <>
              <EmptyText style={{ marginBottom: "0.75rem" }}>
                Atraso interno e atraso por agenda do cliente contam diferente na métrica da área.
                Enquanto a entrega não é classificada, os dois ficam misturados no mesmo número.
              </EmptyText>
              <ListaSimples>
                {dados.entregas_sem_classificacao.map((e) => (
                  <ItemLista key={e.escopo_id}>
                    <div>
                      <LinkProjeto as={Link} to={`/projetos/${e.projeto_id}`}>
                        {e.projeto_nome} — {e.escopo_nome}
                      </LinkProjeto>
                      <EmptyText>
                        prometida {formatarData(e.data_prometida)} · entregue{" "}
                        {formatarData(e.data_entrega)}
                      </EmptyText>
                    </div>
                    <Pilula $tom="alerta">
                      {e.dias_de_atraso} {e.dias_de_atraso === 1 ? "dia" : "dias"}
                    </Pilula>
                  </ItemLista>
                ))}
              </ListaSimples>
            </>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
