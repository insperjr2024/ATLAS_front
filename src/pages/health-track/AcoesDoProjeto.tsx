import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { formatarData, formatarDataHora } from "@/lib/projetos";
import {
  apagarAcao,
  concluirAcao,
  criarAcao,
  editarAcao,
  getAcoesDoProjeto,
  type Acao,
  type AcaoPayload,
} from "@/lib/health-track";
import {
  EmptyText,
  ErrorText,
  PageBadge,
  PageButton,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
} from "@/styles/page.styled";
import { AcaoModal } from "./AcaoModal";
import { ItemAcao, ListaAcoes, Secundario } from "./HealthTrack.styled";

/** Quem preenche o Health Track cria ações. A regra de verdade é do
 *  backend; aqui só se esconde o botão de quem nunca poderia. */
const POSICOES_QUE_AGEM = new Set(["diretor_projetos", "gerente"]);

/**
 * As ações de um projeto (§15), no painel dele: abertas primeiro (atrasadas
 * em vermelho), concluídas riscadas no fim.
 */
export function AcoesDoProjeto({
  projetoId,
  projetoNome,
  equipeIds,
}: {
  projetoId: number;
  projetoNome: string;
  equipeIds?: number[];
}) {
  const { token, usuario } = useAuth();
  const podeAgir = POSICOES_QUE_AGEM.has(usuario?.posicao ?? "");
  const [acoes, setAcoes] = useState<Acao[] | null>(null);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<Acao | null | "nova">(null);
  const [apagando, setApagando] = useState<Acao | null>(null);

  const carregar = useCallback(() => {
    if (!token) return Promise.resolve();
    return getAcoesDoProjeto(projetoId, token)
      .then(setAcoes)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar as ações"));
  }, [projetoId, token]);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getAcoesDoProjeto(projetoId, token)
      .then((lista) => vivo && setAcoes(lista))
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : "Erro ao carregar as ações"));
    return () => {
      vivo = false;
    };
  }, [projetoId, token]);

  async function salvar(dados: AcaoPayload) {
    if (!token) return;
    if (editando && editando !== "nova") await editarAcao(projetoId, editando.id, dados, token);
    else await criarAcao(projetoId, dados, token);
    setEditando(null);
    await carregar();
  }

  async function alternar(acao: Acao) {
    if (!token) return;
    try {
      await concluirAcao(projetoId, acao.id, !acao.concluida_em, token);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível atualizar a ação");
    }
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Ações</PageCardTitle>
        {podeAgir && (
          <PageButton type="button" $variant="outline" onClick={() => setEditando("nova")}>
            Nova ação
          </PageButton>
        )}
      </PageCardHeader>
      <PageCardContent>
        {erro && <ErrorText>{erro}</ErrorText>}
        {acoes === null ? (
          <EmptyText>Carregando…</EmptyText>
        ) : acoes.length === 0 ? (
          <EmptyText>
            Nenhuma ação registrada. Um problema relevante vira problema, responsável, próxima ação e prazo.
          </EmptyText>
        ) : (
          <ListaAcoes>
            {acoes.map((a) => (
              <ItemAcao key={a.id} $concluida={!!a.concluida_em} $atrasada={a.atrasada}>
                <div>
                  <div className="problema">
                    {a.problema}
                    {a.pilar_nome && (
                      <PageBadge $tone="muted" style={{ marginLeft: "0.4rem" }}>
                        {a.pilar_nome}
                      </PageBadge>
                    )}
                    {a.atrasada && (
                      <PageBadge $tone="danger" style={{ marginLeft: "0.4rem" }}>
                        Atrasada
                      </PageBadge>
                    )}
                  </div>
                  <div className="acao">{a.proxima_acao}</div>
                  <Secundario>
                    {a.responsavel_nome ?? "Sem responsável"}
                    {a.prazo && ` · até ${formatarData(a.prazo)}`}
                    {a.concluida_em
                      ? ` · concluída em ${formatarDataHora(a.concluida_em)}${a.concluida_por_nome ? ` por ${a.concluida_por_nome}` : ""}`
                      : a.criado_por_nome && ` · aberta por ${a.criado_por_nome}`}
                  </Secundario>
                </div>
                {podeAgir && (
                  <span className="acoes">
                    <PageButtonSm type="button" $variant={a.concluida_em ? "ghost" : "outline"} onClick={() => alternar(a)}>
                      {a.concluida_em ? "Reabrir" : "Concluir"}
                    </PageButtonSm>
                    {!a.concluida_em && (
                      <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(a)}>
                        Editar
                      </PageButtonSm>
                    )}
                    <PageButtonSm type="button" $variant="ghost" onClick={() => setApagando(a)}>
                      Excluir
                    </PageButtonSm>
                  </span>
                )}
              </ItemAcao>
            ))}
          </ListaAcoes>
        )}
      </PageCardContent>

      {editando && (
        <AcaoModal
          projetoNome={projetoNome}
          inicial={editando === "nova" ? null : editando}
          equipeIds={equipeIds}
          onConfirmar={salvar}
          onCancelar={() => setEditando(null)}
        />
      )}
      {apagando && (
        <ConfirmarModal
          titulo="Excluir ação"
          mensagem={`Excluir a ação "${apagando.problema}"? Ela some do histórico do projeto.`}
          rotuloConfirmar="Excluir"
          onConfirmar={async () => {
            if (!token) return;
            await apagarAcao(projetoId, apagando.id, token);
            setApagando(null);
            await carregar();
          }}
          onCancelar={() => setApagando(null)}
        />
      )}
    </PageCard>
  );
}
