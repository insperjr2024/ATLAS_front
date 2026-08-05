import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  abrirLote,
  createLote,
  deleteLote,
  fecharLote,
  getLotes,
  getPendencias,
  seguirDatasLote,
  updateLote,
} from "@/lib/desempenho-lotes";
import { getProjetos } from "@/lib/projetos";
import type { DesempenhoLote, DesempenhoPendencia, DesempenhoTipo } from "@/types/desempenho";
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
import { FieldGroup, FieldInput, FieldLabel, FieldSelect, FormStack } from "@/pages/Bancas.styled";
import {
  CampoInlineRow,
  LoteCard,
  LoteCardAcoes,
  LoteCardHeader,
  LoteCardMeta,
  LoteCardTitulo,
  LotesStack,
  PendenciaCard,
  PendenciaFaltamRotulo,
  PendenciaIcone,
  PendenciaNome,
  PendenciaTexto,
  ProjetoChip,
  ProjetoChipsRow,
  SubLista,
} from "./Painel.styled";

function paraDatetimeLocal(iso: string): string {
  const data = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

function agoraDatetimeLocal(): string {
  return paraDatetimeLocal(new Date().toISOString());
}

function statusLote(lote: DesempenhoLote): { rotulo: string; tone: "success" | "muted" | "warning" } {
  if (lote.override_manual === "aberto") return { rotulo: "Aberto (manual)", tone: "success" };
  if (lote.override_manual === "fechado") return { rotulo: "Fechado (manual)", tone: "muted" };
  if (lote.aberto) return { rotulo: "Aberto", tone: "success" };
  return new Date(lote.data_inicio) > new Date()
    ? { rotulo: "Agendado", tone: "warning" }
    : { rotulo: "Encerrado", tone: "muted" };
}

interface PendenciasDoAvaliador {
  avaliadorId: number;
  avaliadorNome: string;
  itens: DesempenhoPendencia[];
}

// Agrupa por AVALIADOR (quem falta preencher), não por par — um card por
// pessoa com todo mundo que falta avaliar junto é o que dá pra escanear
// rápido; uma linha por par vira uma parede de texto repetindo nomes.
function agruparPendenciasPorAvaliador(pendencias: DesempenhoPendencia[]): PendenciasDoAvaliador[] {
  const grupos = new Map<number, PendenciasDoAvaliador>();
  for (const p of pendencias) {
    if (p.respondida) continue;
    const atual = grupos.get(p.avaliador_id) ?? {
      avaliadorId: p.avaliador_id,
      avaliadorNome: p.avaliador_nome ?? `Usuário ${p.avaliador_id}`,
      itens: [],
    };
    atual.itens.push(p);
    grupos.set(p.avaliador_id, atual);
  }
  return Array.from(grupos.values());
}

export function PainelLotes() {
  const { token } = useAuth();
  const [lotes, setLotes] = useState<DesempenhoLote[]>([]);
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [pendenciasLoteId, setPendenciasLoteId] = useState<number | null>(null);
  const [pendencias, setPendencias] = useState<DesempenhoPendencia[]>([]);

  const [editandoLoteId, setEditandoLoteId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editDataInicio, setEditDataInicio] = useState("");
  const [editDataFim, setEditDataFim] = useState("");
  const [editProjetoIds, setEditProjetoIds] = useState<number[]>([]);
  const [editSalvando, setEditSalvando] = useState(false);
  const [editErro, setEditErro] = useState("");

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<DesempenhoTipo>("periodico");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [projetoIds, setProjetoIds] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [l, p] = await Promise.all([getLotes(token, false), getProjetos(token)]);
      setLotes(l);
      setProjetos(p);
      // Tipo default do formulário é "periódico" — pré-marca na carga
      // inicial os mesmos projetos que `handleMudarTipo` marcaria.
      const finalizadosNaCarga = new Set<number>();
      for (const proj of p) {
        if (proj.status === "finalizado") finalizadosNaCarga.add(proj.id);
      }
      for (const lote of l) {
        if (lote.tipo === "finalizacao" && !lote.aberto) {
          for (const pid of lote.projeto_ids) finalizadosNaCarga.add(pid);
        }
      }
      setProjetoIds(p.filter((proj) => !finalizadosNaCarga.has(proj.id)).map((proj) => proj.id));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar lotes");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const nomesProjeto = useMemo(() => new Map(projetos.map((p) => [p.id, p.nome])), [projetos]);

  // Um projeto conta como "finalizado" pra esta tela se: (a) já está
  // marcado como finalizado no sistema de bancas, ou (b) já foi coberto por
  // um lote de finalização que fechou. Nos dois casos ele continua
  // escolhível manualmente — só não vem pré-marcado numa periódica nova.
  const projetosFinalizados = useMemo(() => {
    const finalizados = new Set<number>();
    for (const p of projetos) {
      if (p.status === "finalizado") finalizados.add(p.id);
    }
    for (const lote of lotes) {
      if (lote.tipo === "finalizacao" && !lote.aberto) {
        for (const pid of lote.projeto_ids) finalizados.add(pid);
      }
    }
    return finalizados;
  }, [projetos, lotes]);

  function toggleProjeto(id: number) {
    setProjetoIds((atual) => (atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]));
  }

  function handleMudarTipo(novoTipo: DesempenhoTipo) {
    setTipo(novoTipo);
    // Periódica pré-marca tudo que ainda não terminou (o time normalmente
    // quer avaliar todo mundo); finalização começa vazia — é por projeto
    // específico que está encerrando, não um "avalia todo mundo de novo".
    setProjetoIds(
      novoTipo === "periodico" ? projetos.filter((p) => !projetosFinalizados.has(p.id)).map((p) => p.id) : [],
    );
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!nome.trim() || !dataInicio || !dataFim) {
      setErroForm("Preencha nome e as duas datas.");
      return;
    }
    setSalvando(true);
    setErroForm("");
    try {
      const novo = await createLote(
        {
          nome: nome.trim(),
          tipo,
          data_inicio: new Date(dataInicio).toISOString(),
          data_fim: new Date(dataFim).toISOString(),
          projeto_ids: projetoIds,
        },
        token,
      );
      setLotes((atual) => [novo, ...atual]);
      setNome("");
      setDataInicio("");
      setDataFim("");
      setProjetoIds([]);
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : "Erro ao criar lote");
    } finally {
      setSalvando(false);
    }
  }

  async function handleAbrir(loteId: number) {
    if (!token) return;
    const atualizado = await abrirLote(loteId, token);
    setLotes((atual) => atual.map((l) => (l.id === loteId ? atualizado : l)));
  }

  async function handleFechar(loteId: number) {
    if (!token) return;
    const atualizado = await fecharLote(loteId, token);
    setLotes((atual) => atual.map((l) => (l.id === loteId ? atualizado : l)));
  }

  async function handleSeguirDatas(loteId: number) {
    if (!token) return;
    const atualizado = await seguirDatasLote(loteId, token);
    setLotes((atual) => atual.map((l) => (l.id === loteId ? atualizado : l)));
  }

  function toggleEditProjeto(id: number) {
    setEditProjetoIds((atual) => (atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]));
  }

  function handleIniciarEdicao(lote: DesempenhoLote) {
    setEditandoLoteId(lote.id);
    setEditNome(lote.nome);
    setEditDataInicio(paraDatetimeLocal(lote.data_inicio));
    setEditDataFim(paraDatetimeLocal(lote.data_fim));
    setEditProjetoIds(lote.projeto_ids);
    setEditErro("");
  }

  async function handleSalvarEdicao(loteId: number) {
    if (!token) return;
    if (!editNome.trim() || !editDataInicio || !editDataFim) {
      setEditErro("Preencha nome e as duas datas.");
      return;
    }
    setEditSalvando(true);
    setEditErro("");
    try {
      const atualizado = await updateLote(
        loteId,
        {
          nome: editNome.trim(),
          data_inicio: new Date(editDataInicio).toISOString(),
          data_fim: new Date(editDataFim).toISOString(),
          projeto_ids: editProjetoIds,
        },
        token,
      );
      setLotes((atual) => atual.map((l) => (l.id === loteId ? atualizado : l)));
      setEditandoLoteId(null);
    } catch (err) {
      setEditErro(err instanceof Error ? err.message : "Erro ao salvar o lote");
    } finally {
      setEditSalvando(false);
    }
  }

  async function handleExcluir(lote: DesempenhoLote) {
    if (!token) return;
    if (!confirm(`Excluir o lote "${lote.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteLote(lote.id, token);
      setLotes((atual) => atual.filter((l) => l.id !== lote.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir o lote");
    }
  }

  async function handleVerPendencias(loteId: number) {
    if (!token) return;
    if (pendenciasLoteId === loteId) {
      setPendenciasLoteId(null);
      return;
    }
    setPendenciasLoteId(loteId);
    setPendencias(await getPendencias(loteId, token));
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
    <>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Novo lote</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <FormStack onSubmit={handleCriar}>
            <FieldGroup>
              <FieldLabel htmlFor="lote-nome">Nome</FieldLabel>
              <FieldInput id="lote-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="lote-tipo">Tipo</FieldLabel>
              <FieldSelect id="lote-tipo" value={tipo} onChange={(e) => handleMudarTipo(e.target.value as DesempenhoTipo)}>
                <option value="periodico">Periódica</option>
                <option value="finalizacao">Finalização</option>
              </FieldSelect>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="lote-inicio">Início</FieldLabel>
              <CampoInlineRow>
                <FieldInput
                  id="lote-inicio"
                  type="datetime-local"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
                <PageButtonSm $variant="outline" type="button" onClick={() => setDataInicio(agoraDatetimeLocal())}>
                  Agora
                </PageButtonSm>
              </CampoInlineRow>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="lote-fim">Fim</FieldLabel>
              <FieldInput
                id="lote-fim"
                type="datetime-local"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Projetos cobertos</FieldLabel>
              <ProjetoChipsRow>
                {projetos.map((p) => (
                  <ProjetoChip
                    key={p.id}
                    type="button"
                    $selecionado={projetoIds.includes(p.id)}
                    onClick={() => toggleProjeto(p.id)}
                  >
                    {p.nome}
                    {projetosFinalizados.has(p.id) && " (Finalizado)"}
                  </ProjetoChip>
                ))}
              </ProjetoChipsRow>
            </FieldGroup>
            {erroForm && <ErrorText>{erroForm}</ErrorText>}
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Criando..." : "Criar lote"}
            </PageButton>
          </FormStack>
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Lotes</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {lotes.length === 0 ? (
            <EmptyText>Nenhum lote criado ainda.</EmptyText>
          ) : (
            <LotesStack>
            {lotes.map((lote) => {
              const status = statusLote(lote);
              const gruposPendencias =
                pendenciasLoteId === lote.id ? agruparPendenciasPorAvaliador(pendencias) : [];
              return (
                <LoteCard key={lote.id}>
                  <LoteCardHeader>
                    <div>
                      <LoteCardTitulo>{lote.nome}</LoteCardTitulo>{" "}
                      <PageBadge $tone={status.tone}>{status.rotulo}</PageBadge>
                    </div>
                    <LoteCardAcoes>
                      <PageButtonSm
                        $variant="outline"
                        type="button"
                        onClick={() =>
                          editandoLoteId === lote.id ? setEditandoLoteId(null) : handleIniciarEdicao(lote)
                        }
                      >
                        {editandoLoteId === lote.id ? "Cancelar" : "Editar"}
                      </PageButtonSm>
                      <PageButtonSm $variant="outline" type="button" onClick={() => handleAbrir(lote.id)}>
                        Abrir
                      </PageButtonSm>
                      <PageButtonSm $variant="outline" type="button" onClick={() => handleFechar(lote.id)}>
                        Fechar
                      </PageButtonSm>
                      {lote.override_manual !== null && (
                        <PageButtonSm $variant="ghost" type="button" onClick={() => handleSeguirDatas(lote.id)}>
                          Voltar ao automático
                        </PageButtonSm>
                      )}
                      <PageButtonSm type="button" onClick={() => handleVerPendencias(lote.id)}>
                        Pendências
                      </PageButtonSm>
                      <PageButtonSm $variant="ghost" type="button" onClick={() => handleExcluir(lote)}>
                        Excluir
                      </PageButtonSm>
                    </LoteCardAcoes>
                  </LoteCardHeader>

                  {editandoLoteId === lote.id ? (
                    <FormStack onSubmit={(e) => { e.preventDefault(); handleSalvarEdicao(lote.id); }}>
                      <FieldGroup>
                        <FieldLabel htmlFor={`edit-nome-${lote.id}`}>Nome</FieldLabel>
                        <FieldInput
                          id={`edit-nome-${lote.id}`}
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          required
                        />
                      </FieldGroup>
                      <FieldGroup>
                        <FieldLabel htmlFor={`edit-inicio-${lote.id}`}>Início</FieldLabel>
                        <CampoInlineRow>
                          <FieldInput
                            id={`edit-inicio-${lote.id}`}
                            type="datetime-local"
                            value={editDataInicio}
                            onChange={(e) => setEditDataInicio(e.target.value)}
                            required
                          />
                          <PageButtonSm
                            $variant="outline"
                            type="button"
                            onClick={() => setEditDataInicio(agoraDatetimeLocal())}
                          >
                            Agora
                          </PageButtonSm>
                        </CampoInlineRow>
                      </FieldGroup>
                      <FieldGroup>
                        <FieldLabel htmlFor={`edit-fim-${lote.id}`}>Fim</FieldLabel>
                        <FieldInput
                          id={`edit-fim-${lote.id}`}
                          type="datetime-local"
                          value={editDataFim}
                          onChange={(e) => setEditDataFim(e.target.value)}
                          required
                        />
                      </FieldGroup>
                      <FieldGroup>
                        <FieldLabel>Projetos cobertos</FieldLabel>
                        <ProjetoChipsRow>
                          {projetos.map((p) => (
                            <ProjetoChip
                              key={p.id}
                              type="button"
                              $selecionado={editProjetoIds.includes(p.id)}
                              onClick={() => toggleEditProjeto(p.id)}
                            >
                              {p.nome}
                              {projetosFinalizados.has(p.id) && " (Finalizado)"}
                            </ProjetoChip>
                          ))}
                        </ProjetoChipsRow>
                      </FieldGroup>
                      {editErro && <ErrorText>{editErro}</ErrorText>}
                      <PageButtonSm type="submit" disabled={editSalvando}>
                        {editSalvando ? "Salvando..." : "Salvar"}
                      </PageButtonSm>
                    </FormStack>
                  ) : (
                    <LoteCardMeta>
                      {lote.tipo === "periodico" ? "Periódica" : "Finalização"} · {paraDatetimeLocal(lote.data_inicio)} a{" "}
                      {paraDatetimeLocal(lote.data_fim)} · {lote.projeto_ids.length} projeto(s):{" "}
                      {lote.projeto_ids.map((id) => nomesProjeto.get(id) ?? id).join(", ") || "nenhum"}
                    </LoteCardMeta>
                  )}

                  {pendenciasLoteId === lote.id && (
                    <SubLista>
                      {gruposPendencias.length === 0 ? (
                        <EmptyText>Ninguém pendente neste lote.</EmptyText>
                      ) : (
                        gruposPendencias.map((grupo) => (
                          <PendenciaCard key={grupo.avaliadorId}>
                            <PendenciaIcone>
                              <AlertTriangle size={16} />
                            </PendenciaIcone>
                            <PendenciaTexto>
                              <PendenciaNome>{grupo.avaliadorNome}</PendenciaNome>{" "}
                              <PendenciaFaltamRotulo>falta avaliar:</PendenciaFaltamRotulo>{" "}
                              {grupo.itens.map((p, i) => (
                                <span key={p.avaliado_id}>
                                  {p.avaliado_nome}
                                  {p.projeto_nomes.filter(Boolean).length > 0 &&
                                    ` (${p.projeto_nomes.filter(Boolean).join(", ")})`}
                                  {i < grupo.itens.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </PendenciaTexto>
                          </PendenciaCard>
                        ))
                      )}
                    </SubLista>
                  )}
                </LoteCard>
              );
            })}
            </LotesStack>
          )}
        </PageCardContent>
      </PageCard>
    </>
  );
}
