import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getAprovacoes, type Aprovacoes } from "@/lib/monitoramento";
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

/** Pra "voltar" do projeto cair de novo aqui, não em `/projetos` — mesmo
 *  padrão de `AtrasosAba.tsx`. */
const VOLTAR_PARA_AQUI = { voltarPara: "/monitoramento/aprovacoes", voltarRotulo: "Voltar para Aprovações" };

/**
 * ⭐ A fila da diretoria — tudo que espera decisão dela, num lugar só.
 *
 * O problema que esta aba resolve não é de dado, é de descoberta. As decisões
 * estavam espalhadas: o pedido de dias num card da Visão geral e a
 * justificativa de atraso dentro da aba Atrasos. Fila que ninguém sabe que
 * existe é fila parada — dois pedidos chegaram a ficar represados sem ninguém
 * notar.
 *
 * ⚠ **Nem toda ação restrita à diretoria é uma aprovação.** Criar formulário,
 * configurar coluna do kanban e excluir usuário também são só dela, e nenhuma
 * entra aqui: são coisas que ela FAZ quando quer, não coisas que esperam por
 * ela. O critério é ter alguém do outro lado bloqueado enquanto não houver
 * resposta.
 *
 * A fila de atrasos **não decide aqui**: ela leva ao lugar onde a decisão tem
 * contexto. Justificar um atraso sem ver os motivos é decidir no escuro. A aba
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
            Nenhum pedido de dias e nenhum atraso sem justificativa. Quando algo precisar da
            sua decisão, aparece aqui.
          </EmptyText>
        </PageCardContent>
      </PageCard>
    );
  }

  return (
    <PageStack>
      {/* Decide na própria lista: o pedido traz o motivo escrito, que é todo o
          contexto de que a decisão precisa. */}
      <PedidosDeDiasCard
        onDecidiu={carregar}
        voltarPara={VOLTAR_PARA_AQUI.voltarPara}
        voltarRotulo={VOLTAR_PARA_AQUI.voltarRotulo}
      />

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
                      <LinkProjeto as={Link} to={`/projetos/${a.projeto_id}`} state={VOLTAR_PARA_AQUI}>
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

      {/* ⚠ Havia aqui um terceiro card, "Entregas sem classificação": as
          entregas atrasadas ainda não marcadas como atraso interno ou por
          agenda do cliente. Saiu em 2026-08-12 junto com o que lhe dava
          sentido — o atraso de ENTREGA deixou de ser insight, e com ele a
          métrica que separava os dois tipos. O card seguia pedindo à diretoria
          uma classificação que não mudava mais número nenhum. */}
    </PageStack>
  );
}
