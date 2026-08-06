import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { deleteAvaliacao, getAvaliacaoDetalhe, getAvaliacoes } from "@/lib/desempenho-avaliacoes";
import { getLotes } from "@/lib/desempenho-lotes";
import { getUsuarios } from "@/lib/usuarios";
import { getProjetos } from "@/lib/projetos";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import type { DesempenhoAvaliacao, DesempenhoAvaliacaoDetalhe, DesempenhoLote, DesempenhoTipo } from "@/types/desempenho";
import type { UsuarioResumo } from "@/types/auth";
import type { ProjetoResumo } from "@/types/projeto";
import {
  EmptyText,
  ErrorBlock,
  ErrorText,
  PageBadge,
  PageButton,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageLoadingBlock,
} from "@/styles/page.styled";
import { FieldSelect } from "@/pages/Bancas.styled";
import { theme } from "@/styles/theme";
import {
  AvaliacaoDetalheBlock,
  DetalheComentarioBlock,
  DetalheComentarioRotulo,
  DetalheComentarioTexto,
  DetalheCriterioBarraFill,
  DetalheCriterioBarraTrilha,
  DetalheCriterioLabel,
  DetalheCriterioNumero,
  DetalheCriterioRow,
  DetalheCriterioTexto,
  DetalheCriteriosLista,
  DetalheNotaGeralDestaque,
  DetalheNotaGeralNumero,
  DetalheNotaGeralRotulo,
  FiltrosRow,
  ListaExpansivel,
  PessoaHeader,
  PessoaResumo,
  SubItem,
  SubItemMeta,
  SubLista,
} from "./Painel.styled";

function corPorNota(nota: number): "danger" | "default" {
  return nota < 3 ? "danger" : "default";
}

/** Vermelho abaixo do esperado, âmbar no meio, verde acima — mesma leitura
 *  rápida de "isso é bom ou ruim" da escala 1-5 do formulário de origem. */
function corDaNota(nota: number): string {
  if (nota < 3) return theme.colors.destructive;
  if (nota === 3) return theme.colors.warning;
  return theme.colors.success;
}

function formatarData(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function PainelAvaliadores() {
  const { token } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<DesempenhoAvaliacao[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [lotes, setLotes] = useState<DesempenhoLote[]>([]);
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<DesempenhoTipo | "todos">("todos");

  const [avaliacaoExpandidaId, setAvaliacaoExpandidaId] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<Map<number, DesempenhoAvaliacaoDetalhe>>(new Map());
  const [paraRemover, setParaRemover] = useState<DesempenhoAvaliacao | null>(null);

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [a, u, l, p] = await Promise.all([
        getAvaliacoes(token),
        getUsuarios(token),
        getLotes(token, false),
        getProjetos(token),
      ]);
      setAvaliacoes(a);
      setUsuarios(u);
      setLotes(l);
      setProjetos(p);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar avaliações");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const nomes = useMemo(() => new Map(usuarios.map((u) => [u.id, u.nome])), [usuarios]);
  const tipoPorLote = useMemo(() => new Map(lotes.map((l) => [l.id, l.tipo])), [lotes]);
  const projetoIdsPorLote = useMemo(() => new Map(lotes.map((l) => [l.id, l.projeto_ids])), [lotes]);
  const nomeProjetoPorId = useMemo(() => new Map(projetos.map((p) => [p.id, p.nome])), [projetos]);

  function projetosDoLote(loteId: number): string {
    const ids = projetoIdsPorLote.get(loteId) ?? [];
    return ids.map((id) => nomeProjetoPorId.get(id)).filter(Boolean).join(", ") || "—";
  }

  const avaliacoesFiltradas = useMemo(() => {
    if (filtroTipo === "todos") return avaliacoes;
    return avaliacoes.filter((a) => tipoPorLote.get(a.lote_id) === filtroTipo);
  }, [avaliacoes, tipoPorLote, filtroTipo]);

  const porAvaliador = useMemo(() => {
    const grupos = new Map<number, DesempenhoAvaliacao[]>();
    for (const a of avaliacoesFiltradas) {
      const lista = grupos.get(a.avaliador_id) ?? [];
      lista.push(a);
      grupos.set(a.avaliador_id, lista);
    }
    return Array.from(grupos.entries()).sort(([, a], [, b]) => b.length - a.length);
  }, [avaliacoesFiltradas]);

  async function toggleDetalhe(avaliacaoId: number) {
    if (!token) return;
    if (avaliacaoExpandidaId === avaliacaoId) {
      setAvaliacaoExpandidaId(null);
      return;
    }
    setAvaliacaoExpandidaId(avaliacaoId);
    if (!detalhes.has(avaliacaoId)) {
      const detalhe = await getAvaliacaoDetalhe(avaliacaoId, token);
      setDetalhes((atual) => new Map(atual).set(avaliacaoId, detalhe));
    }
  }

  async function confirmarRemocao() {
    if (!token || !paraRemover) return;
    await deleteAvaliacao(paraRemover.id, token);
    setAvaliacoes((atual) => atual.filter((a) => a.id !== paraRemover.id));
    setAvaliacaoExpandidaId(null);
    setParaRemover(null);
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Quem avaliou quem</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        <FiltrosRow>
          <FieldSelect value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as DesempenhoTipo | "todos")}>
            <option value="todos">Todos os tipos</option>
            <option value="periodico">Periódica</option>
            <option value="finalizacao">Finalização</option>
          </FieldSelect>
        </FiltrosRow>

        {porAvaliador.length === 0 ? (
          <EmptyText>Nenhuma avaliação registrada ainda.</EmptyText>
        ) : (
          <ListaExpansivel>
            {porAvaliador.map(([avaliadorId, lista]) => (
              <div key={avaliadorId}>
                <PessoaHeader
                  type="button"
                  onClick={() => setExpandido((atual) => (atual === avaliadorId ? null : avaliadorId))}
                >
                  <span>{nomes.get(avaliadorId) ?? `Usuário ${avaliadorId}`}</span>
                  <PessoaResumo>{lista.length} avaliação(ões) enviada(s)</PessoaResumo>
                </PessoaHeader>
                {expandido === avaliadorId && (
                  <SubLista>
                    {lista.map((a) => {
                      const detalhe = detalhes.get(a.id);
                      const expandidaAqui = avaliacaoExpandidaId === a.id;
                      return (
                        <div key={a.id}>
                          <SubItem>
                            <span>
                              {nomes.get(a.avaliado_id) ?? `Usuário ${a.avaliado_id}`}
                              {" · "}
                              {projetosDoLote(a.lote_id)}
                              {" · "}
                              {formatarData(a.criado_em)}
                            </span>
                            <SubItemMeta>
                              <PageBadge $tone={corPorNota(a.nota_geral)}>{a.nota_geral.toFixed(1)}</PageBadge>
                              <PageButtonSm $variant="outline" type="button" onClick={() => toggleDetalhe(a.id)}>
                                {expandidaAqui ? "Ocultar" : "Detalhes"}
                              </PageButtonSm>
                              <PageButtonSm $variant="ghost" type="button" onClick={() => setParaRemover(a)}>
                                Remover
                              </PageButtonSm>
                            </SubItemMeta>
                          </SubItem>
                          {expandidaAqui && (
                            <AvaliacaoDetalheBlock>
                              {!detalhe ? (
                                <EmptyText>Carregando...</EmptyText>
                              ) : (
                                <>
                                  <DetalheNotaGeralDestaque $cor={corDaNota(detalhe.nota_geral)}>
                                    <DetalheNotaGeralRotulo>Nota geral</DetalheNotaGeralRotulo>
                                    <DetalheNotaGeralNumero $cor={corDaNota(detalhe.nota_geral)}>
                                      {detalhe.nota_geral.toFixed(1)}
                                    </DetalheNotaGeralNumero>
                                  </DetalheNotaGeralDestaque>

                                  <DetalheCriteriosLista>
                                    {detalhe.notas.map((n) =>
                                      n.tipo_resposta === "nota" && n.nota != null ? (
                                        <DetalheCriterioRow key={n.criterio_id}>
                                          <DetalheCriterioLabel>
                                            {n.label ?? `Critério ${n.criterio_id}`}
                                          </DetalheCriterioLabel>
                                          <DetalheCriterioBarraTrilha>
                                            <DetalheCriterioBarraFill
                                              $percent={(n.nota / 5) * 100}
                                              $cor={corDaNota(n.nota)}
                                            />
                                          </DetalheCriterioBarraTrilha>
                                          <DetalheCriterioNumero $cor={corDaNota(n.nota)}>
                                            {n.nota.toFixed(1)}
                                          </DetalheCriterioNumero>
                                        </DetalheCriterioRow>
                                      ) : (
                                        <DetalheCriterioRow key={n.criterio_id}>
                                          <DetalheCriterioLabel>
                                            {n.label ?? `Critério ${n.criterio_id}`}
                                          </DetalheCriterioLabel>
                                          <div />
                                          <div />
                                          <DetalheCriterioTexto>{n.resposta_texto || "—"}</DetalheCriterioTexto>
                                        </DetalheCriterioRow>
                                      ),
                                    )}
                                  </DetalheCriteriosLista>

                                  <DetalheComentarioBlock>
                                    <DetalheComentarioRotulo>Comentário</DetalheComentarioRotulo>
                                    <DetalheComentarioTexto>{detalhe.comentarios || "—"}</DetalheComentarioTexto>
                                  </DetalheComentarioBlock>
                                </>
                              )}
                            </AvaliacaoDetalheBlock>
                          )}
                        </div>
                      );
                    })}
                  </SubLista>
                )}
              </div>
            ))}
          </ListaExpansivel>
        )}
      </PageCardContent>

      {paraRemover && (
        <ConfirmarModal
          titulo="Remover avaliação"
          mensagem={`Remover a avaliação sobre ${
            nomes.get(paraRemover.avaliado_id) ?? `Usuário ${paraRemover.avaliado_id}`
          }? Esta ação não pode ser desfeita.`}
          rotuloConfirmar="Remover"
          onCancelar={() => setParaRemover(null)}
          onConfirmar={confirmarRemocao}
        />
      )}
    </PageCard>
  );
}
