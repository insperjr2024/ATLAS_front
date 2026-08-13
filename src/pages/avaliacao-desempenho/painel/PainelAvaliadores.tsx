import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { deleteAvaliacao, getAvaliacaoDetalhe, getAvaliacoes } from "@/lib/desempenho-avaliacoes";
import { getLotes } from "@/lib/desempenho-lotes";
import { getUsuarios } from "@/lib/usuarios";
import { getProjetos, paraDataUtc } from "@/lib/projetos";
import { getFrentes } from "@/lib/frentes";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import { frentesDoUsuario } from "@/lib/nucleo";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import type { DesempenhoAvaliacao, DesempenhoAvaliacaoDetalhe, DesempenhoLote, DesempenhoTipo } from "@/types/desempenho";
import type { UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { ProjetoResumo } from "@/types/projeto";
import type { Frente } from "@/types/banca";

const SEMESTRES_GRADUACAO = [1, 2, 3, 4, 5, 6, 7, 8];
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
  PessoaContexto,
  PessoaHeader,
  PessoaResumo,
  SubItem,
  SubItemMeta,
  SubLista,
} from "./Painel.styled";

function corPorNota(nota: number): "danger" | "default" {
  return nota < 3 ? "danger" : "default";
}

/** Vermelho abaixo do esperado, âmbar no meio, verde acima, mesma leitura
 *  rápida de "isso é bom ou ruim" da escala 1-5 do formulário de origem. */
function corDaNota(nota: number): string {
  if (nota < 3) return theme.colors.destructive;
  if (nota === 3) return theme.colors.warning;
  return theme.colors.success;
}

function formatarData(iso?: string): string {
  if (!iso) return "—";
  return paraDataUtc(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function PainelAvaliadores() {
  const { token } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<DesempenhoAvaliacao[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [lotes, setLotes] = useState<DesempenhoLote[]>([]);
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [usuariosFrentes, setUsuariosFrentes] = useState<UsuarioFrente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<DesempenhoTipo | "todos">("todos");
  const [filtroFrente, setFiltroFrente] = useState<string>("todas");
  const [filtroSemestre, setFiltroSemestre] = useState<string>("todos");

  const [avaliacaoExpandidaId, setAvaliacaoExpandidaId] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<Map<number, DesempenhoAvaliacaoDetalhe>>(new Map());
  const [paraRemover, setParaRemover] = useState<DesempenhoAvaliacao | null>(null);

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [a, u, l, p, f, uf] = await Promise.all([
        getAvaliacoes(token),
        getUsuarios(token),
        getLotes(token, false),
        getProjetos(token),
        getFrentes(token),
        getUsuariosFrentes(token),
      ]);
      setAvaliacoes(a);
      setUsuarios(u);
      setLotes(l);
      setProjetos(p);
      setFrentes(f);
      setUsuariosFrentes(uf);
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
  const semestrePorUsuario = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u.semestre_graduacao])),
    [usuarios],
  );

  // Só a(s) frente(s) que a PESSOA integra hoje (`usuario_frente`), nunca a
  // união das frentes dos projetos que ela avaliou/foi avaliada, que pode
  // juntar frentes de rodadas diferentes e não bate com "a pessoa está em
  // 1 ou 2 frentes, nunca mais".
  const frenteIdsPorUsuario = useMemo(() => {
    const mapa = new Map<number, Set<number>>();
    for (const uf of usuariosFrentes) {
      const atual = mapa.get(uf.usuario_id) ?? new Set<number>();
      atual.add(uf.frente_id);
      mapa.set(uf.usuario_id, atual);
    }
    return mapa;
  }, [usuariosFrentes]);

  function projetosDoLote(loteId: number): string {
    const ids = projetoIdsPorLote.get(loteId) ?? [];
    return ids.map((id) => nomeProjetoPorId.get(id)).filter(Boolean).join(", ") || "—";
  }

  // O resumo de contexto que aparece do lado do nome: a frente que a pessoa
  // integra hoje e o semestre da graduação dela, atributos DA PESSOA, não
  // da rodada de avaliação.
  function resumoContexto(pessoaId: number): string {
    const frentesPessoa = frentesDoUsuario(usuariosFrentes, frentes, pessoaId);
    const semestre = semestrePorUsuario.get(pessoaId);
    const partes = [frentesPessoa.join("/") || "sem frente", semestre ? `${semestre}º semestre` : "sem semestre"];
    return partes.join(" · ");
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
    // O filtro de frente/semestre é sobre QUEM avaliou, não sobre a
    // avaliação em si, aplicado depois de agrupar, senão um filtro
    // removeria linhas individuais e deixaria o grupo com contagem errada.
    return Array.from(grupos.entries())
      .filter(([avaliadorId]) => {
        if (filtroFrente !== "todas" && !frenteIdsPorUsuario.get(avaliadorId)?.has(Number(filtroFrente))) {
          return false;
        }
        if (filtroSemestre !== "todos" && String(semestrePorUsuario.get(avaliadorId) ?? "") !== filtroSemestre) {
          return false;
        }
        return true;
      })
      .sort(([, a], [, b]) => b.length - a.length);
  }, [avaliacoesFiltradas, filtroFrente, filtroSemestre, frenteIdsPorUsuario, semestrePorUsuario]);

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
          <FieldSelect value={filtroFrente} onChange={(e) => setFiltroFrente(e.target.value)}>
            <option value="todas">Todas as frentes</option>
            {frentes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </FieldSelect>
          <FieldSelect value={filtroSemestre} onChange={(e) => setFiltroSemestre(e.target.value)}>
            <option value="todos">Todos os semestres</option>
            {SEMESTRES_GRADUACAO.map((n) => (
              <option key={n} value={n}>
                {n}º semestre
              </option>
            ))}
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
                  <span>
                    {nomes.get(avaliadorId) ?? `Usuário ${avaliadorId}`}{" "}
                    <PessoaContexto>({resumoContexto(avaliadorId)})</PessoaContexto>
                  </span>
                  <PessoaResumo>{lista.length} avaliações enviadas</PessoaResumo>
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
