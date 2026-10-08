import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { formatarDataHora, ROTULO_STATUS } from "@/lib/projetos";
import {
  abrirRodada,
  concluirRodada,
  desfazerJustificativa,
  justificarProjeto,
  type ProjetoNaRodada,
  type Rodada,
} from "@/lib/health-track";
import { ehDiretoriaDeProjetos } from "@/utils/permissoes";
import type { StatusProjeto } from "@/types/projeto";
import {
  EmptyText,
  ErrorText,
  PageButton,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
} from "@/styles/page.styled";
import { JustificarModal } from "./JustificarModal";
import {
  BarraProgresso,
  FilaRodada,
  Historico,
  ItemRodada,
  Justificativa,
  Progresso,
  Secundario,
} from "./HealthTrack.styled";

/**
 * A rodada de avaliação (2026-10-08, a pedido da diretoria de projetos).
 *
 * Sem cadência automática: a diretora clica em "Abrir rodada" quando decide
 * que é dia. A lista dos projetos em acompanhamento congela, e a rodada só
 * conclui quando cada um foi avaliado (pelo painel do projeto, que marca
 * sozinho) ou justificado. O que ficou pra trás aparece em vermelho.
 *
 * Abrir, concluir e justificar é da diretoria de projetos; quem mais tem a
 * caixa (gerente, por exemplo) vê a fila e avalia os projetos da frente dele.
 */
export function RodadaCard({
  atual,
  historico,
  onMudou,
}: {
  atual: Rodada | null;
  historico: Rodada[];
  onMudou: () => Promise<void>;
}) {
  const { token, usuario } = useAuth();
  const diretoria = ehDiretoriaDeProjetos(usuario);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [justificando, setJustificando] = useState<ProjetoNaRodada | null>(null);
  const [confirmando, setConfirmando] = useState<"abrir" | "concluir" | null>(null);

  async function executar(acao: () => Promise<unknown>) {
    if (!token) return;
    setOcupado(true);
    setErro("");
    try {
      await acao();
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível atualizar a rodada");
      throw err;
    } finally {
      setOcupado(false);
    }
  }

  const concluidas = historico.filter((r) => r.concluida_em);

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>{atual ? "Rodada em andamento" : "Rodada de avaliação"}</PageCardTitle>
        {diretoria && !atual && (
          <PageButton type="button" onClick={() => setConfirmando("abrir")} disabled={ocupado}>
            Abrir rodada
          </PageButton>
        )}
        {diretoria && atual && (
          <PageButton
            type="button"
            onClick={() => setConfirmando("concluir")}
            disabled={ocupado || atual.pendente > 0}
            title={atual.pendente > 0 ? "Avalie ou justifique todos os pendentes antes" : undefined}
          >
            Concluir rodada
          </PageButton>
        )}
      </PageCardHeader>
      <PageCardContent>
        {erro && <ErrorText>{erro}</ErrorText>}
        {atual ? (
          <>
            <Progresso>
              <span>
                Aberta em {formatarDataHora(atual.aberta_em)}
                {atual.aberta_por_nome && ` por ${atual.aberta_por_nome}`}
              </span>
              <BarraProgresso $pct={atual.total ? Math.round(((atual.total - atual.pendente) / atual.total) * 100) : 0} />
              <span>
                <strong>{atual.total - atual.pendente}</strong> de {atual.total} resolvidos
                {atual.justificada > 0 && ` (${atual.justificada} justificado${atual.justificada > 1 ? "s" : ""})`}
              </span>
            </Progresso>
            <FilaRodada>
              {atual.projetos.map((p) => (
                <ItemRodada key={p.projeto_id} $situacao={p.situacao}>
                  <Link to={`/health-track/projetos/${p.projeto_id}`}>{p.projeto_nome}</Link>
                  <Secundario as="span">
                    {ROTULO_STATUS[p.projeto_status as StatusProjeto] ?? p.projeto_status}
                    {" · "}
                    {p.situacao === "pendente"
                      ? "pendente"
                      : p.situacao === "avaliada"
                        ? `avaliado${p.resolvido_por_nome ? ` por ${p.resolvido_por_nome}` : ""}`
                        : `justificado${p.resolvido_por_nome ? ` por ${p.resolvido_por_nome}` : ""}`}
                  </Secundario>
                  <span className="acoes">
                    {p.situacao === "pendente" && (
                      <PageButtonSm as={Link} to={`/health-track/projetos/${p.projeto_id}`}>
                        Avaliar
                      </PageButtonSm>
                    )}
                    {diretoria && p.situacao === "pendente" && (
                      <PageButtonSm type="button" $variant="outline" onClick={() => setJustificando(p)} disabled={ocupado}>
                        Justificar
                      </PageButtonSm>
                    )}
                    {diretoria && p.situacao === "justificada" && (
                      <PageButtonSm
                        type="button"
                        $variant="ghost"
                        onClick={() => executar(() => desfazerJustificativa(atual.id, p.projeto_id, token!)).catch(() => undefined)}
                        disabled={ocupado}
                      >
                        Desfazer
                      </PageButtonSm>
                    )}
                  </span>
                  {p.justificativa && <Justificativa>"{p.justificativa}"</Justificativa>}
                </ItemRodada>
              ))}
            </FilaRodada>
          </>
        ) : (
          <EmptyText>
            {diretoria
              ? "Nenhuma rodada aberta. Quando for dia de avaliar, abra uma: ela lista todos os projetos em acompanhamento e só conclui quando cada um foi avaliado ou justificado."
              : "Nenhuma rodada de avaliação aberta no momento."}
          </EmptyText>
        )}

        {concluidas.length > 0 && (
          <Historico>
            <summary>
              {concluidas.length === 1 ? "1 rodada concluída" : `${concluidas.length} rodadas concluídas`}
            </summary>
            <ul>
              {concluidas.map((r) => (
                <li key={r.id}>
                  {formatarDataHora(r.aberta_em)} a {formatarDataHora(r.concluida_em!)}
                  {" · "}
                  {r.avaliada} avaliado{r.avaliada !== 1 && "s"}
                  {r.justificada > 0 && `, ${r.justificada} justificado${r.justificada > 1 ? "s" : ""}`}
                  {r.concluida_por_nome && ` · concluída por ${r.concluida_por_nome}`}
                  {r.projetos.some((p) => p.justificativa) && (
                    <ul>
                      {r.projetos
                        .filter((p) => p.justificativa)
                        .map((p) => (
                          <li key={p.projeto_id}>
                            <Secundario as="span">
                              {p.projeto_nome}: "{p.justificativa}"
                            </Secundario>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Historico>
        )}
      </PageCardContent>

      {justificando && atual && (
        <JustificarModal
          projetoNome={justificando.projeto_nome}
          inicial={justificando.justificativa}
          onConfirmar={async (texto) => {
            await executar(() => justificarProjeto(atual.id, justificando.projeto_id, texto, token!));
            setJustificando(null);
          }}
          onCancelar={() => setJustificando(null)}
        />
      )}
      {confirmando === "abrir" && (
        <ConfirmarModal
          titulo="Abrir rodada de avaliação"
          mensagem="A lista dos projetos em acompanhamento congela agora. Cada um precisa ser avaliado ou ter a falta justificada antes de a rodada concluir."
          rotuloConfirmar="Abrir rodada"
          rotuloProcessando="Abrindo…"
          onConfirmar={async () => {
            await executar(() => abrirRodada(token!));
            setConfirmando(null);
          }}
          onCancelar={() => setConfirmando(null)}
        />
      )}
      {confirmando === "concluir" && atual && (
        <ConfirmarModal
          titulo="Concluir rodada"
          mensagem={`Concluir a rodada aberta em ${formatarDataHora(atual.aberta_em)}? ${atual.avaliada} avaliado(s) e ${atual.justificada} justificado(s). Ela fica no histórico.`}
          rotuloConfirmar="Concluir"
          rotuloProcessando="Concluindo…"
          onConfirmar={async () => {
            await executar(() => concluirRodada(atual.id, token!));
            setConfirmando(null);
          }}
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </PageCard>
  );
}
