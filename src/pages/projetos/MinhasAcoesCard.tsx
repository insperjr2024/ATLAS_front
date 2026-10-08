import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatarData, formatarDataHora } from "@/lib/projetos";
import { concluirMinhaAcao, getMinhasAcoes, type Acao } from "@/lib/health-track";
import {
  ErrorText,
  PageBadge,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
} from "@/styles/page.styled";
import { ItemAcao, ListaAcoes, Secundario } from "@/pages/health-track/HealthTrack.styled";

/**
 * As ações do Health Track atribuídas a MIM neste projeto (a pedido da
 * diretoria, 2026-10-08: "fica gravado em algum lugar?"). Quem recebe uma
 * ação costuma ser coordenador, que não vê o Health Track; aqui ele vê o
 * problema, a próxima ação e o prazo, e marca como feita. As cores dos
 * pilares não aparecem.
 *
 * Só renderiza quando há alguma ação: a Visão geral do projeto não ganha um
 * card vazio pra quem nunca recebeu nada.
 */
export function MinhasAcoesCard({ projetoId }: { projetoId: number }) {
  const { token } = useAuth();
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getMinhasAcoes(token)
      .then((lista) => vivo && setAcoes(lista.filter((a) => a.projeto_id === projetoId)))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [token, projetoId]);

  if (acoes.length === 0) return null;

  async function alternar(acao: Acao) {
    if (!token) return;
    try {
      const nova = await concluirMinhaAcao(acao.id, !acao.concluida_em, token);
      setAcoes((lista) => lista.map((a) => (a.id === nova.id ? nova : a)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível atualizar a ação");
    }
  }

  const abertas = acoes.filter((a) => !a.concluida_em).length;

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Ações atribuídas a você</PageCardTitle>
        <Secundario as="span">
          {abertas === 0 ? "Tudo concluído" : `${abertas} em aberto`} · registradas pela gestão no acompanhamento do projeto
        </Secundario>
      </PageCardHeader>
      <PageCardContent>
        {erro && <ErrorText>{erro}</ErrorText>}
        <ListaAcoes>
          {acoes.map((a) => (
            <ItemAcao key={a.id} $concluida={!!a.concluida_em} $atrasada={a.atrasada}>
              <div>
                <div className="problema">
                  {a.problema}
                  {a.atrasada && (
                    <PageBadge $tone="danger" style={{ marginLeft: "0.4rem" }}>
                      Atrasada
                    </PageBadge>
                  )}
                </div>
                <div className="acao">{a.proxima_acao}</div>
                <Secundario>
                  {a.prazo ? `Até ${formatarData(a.prazo)}` : "Sem prazo"}
                  {a.criado_por_nome && ` · pedida por ${a.criado_por_nome}`}
                  {a.concluida_em && ` · concluída em ${formatarDataHora(a.concluida_em)}`}
                </Secundario>
              </div>
              <span className="acoes">
                <PageButtonSm type="button" $variant={a.concluida_em ? "ghost" : "outline"} onClick={() => alternar(a)}>
                  {a.concluida_em ? "Reabrir" : "Marcar como feita"}
                </PageButtonSm>
              </span>
            </ItemAcao>
          ))}
        </ListaAcoes>
      </PageCardContent>
    </PageCard>
  );
}
