import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatarDataHora, getHistoricoProjeto, ROTULO_STATUS } from "@/lib/projetos";
import type { StatusHistorico } from "@/types/projeto";
import {
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
import { Timeline, TimelineItem, TimelineTexto } from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

/**
 * Por enquanto só o histórico de status. Reajustes de cronograma e
 * remarcações de banca entram aqui na F11, na mesma linha do tempo.
 */
export function ProjetoHistorico() {
  const { projeto, usuarios } = useProjeto();
  const { token } = useAuth();
  const [historico, setHistorico] = useState<StatusHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setHistorico(await getHistoricoProjeto(projeto.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o histórico");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, projeto.id]);

  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar o histórico: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Mudanças de status</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {historico.length === 0 ? (
          <EmptyText>Nenhuma mudança registrada.</EmptyText>
        ) : (
          <Timeline>
            {[...historico]
              .sort((a, b) => b.alterado_em.localeCompare(a.alterado_em))
              .map((linha) => (
                <TimelineItem key={linha.id}>
                  <TimelineTexto>
                    <span>
                      {linha.status_anterior
                        ? `${ROTULO_STATUS[linha.status_anterior]} → ${ROTULO_STATUS[linha.status_novo]}`
                        : `Projeto criado como ${ROTULO_STATUS[linha.status_novo]}`}
                    </span>
                    <small>
                      {formatarDataHora(linha.alterado_em)} ·{" "}
                      {/* Sem autor = 🤖 o sistema mudou sozinho (o kickoff, por exemplo). */}
                      {linha.alterado_por ? nomeUsuario(linha.alterado_por) : "🤖 automático"}
                    </small>
                  </TimelineTexto>
                </TimelineItem>
              ))}
          </Timeline>
        )}
      </PageCardContent>
    </PageCard>
  );
}
