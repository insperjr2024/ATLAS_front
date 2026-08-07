import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { NotebookPen, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createNovaVersaoFormulario,
  getAvaliacoes,
  getAvaliacoesNotas,
  getFormularioAtivo,
  getNotasPorPergunta,
  isPerguntaNota,
} from "@/lib/avaliacoes";
import { NotaEscala, NotaEscalaGrupo } from "@/components/NotaEscala";
import { DescricaoQuote } from "@/styles/shared.styled";
import { getEscopos, getFrentes } from "@/lib/bancas";
import { getHistoricoBancas } from "@/lib/historico";
import { getBancas, getBancasFrentes, getCandidaturas } from "@/lib/bancas";
import { DashboardBancas } from "./DashboardBancas";
import { nomeEscopo, nomeUsuario } from "@/lib/nucleo";
import { getSemestres } from "@/lib/semestres";
import { getUsuarios } from "@/lib/usuarios";
import type {
  Avaliacao,
  AvaliacaoNota,
  Banca,
  BancaFrente,
  Candidatura,
  Escopo,
  Frente,
  FormularioAtivo,
  HistoricoBanca,
  NotaPorPergunta,
  PerguntaNovaVersao,
  Semestre,
} from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  NameCell,
  TableCell,
  ActionsCell,
  NotaCell,
  TableScrollWrap,
  LIST_MAX_VISIVEIS,
  FiltersRow,
  FormHint,
  CardActions,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FieldTextarea,
  FieldSelect,
  FormErrorText,
  PerguntaEditorList,
  PerguntaEditorRow,
  PerguntaSecao,
  PerguntaSecaoTitulo,
  PerguntaSecaoVazia,
  PerguntaGrupoFrente,
  RemoveButton,
  MoveButton,
  MoveButtonGroup,
  FormularioResumo,
  FormularioResumoItem,
  FormularioResumoValor,
  FormularioResumoLabel,
  PreviewToggleRow,
  SectionTitle,
  NotaFinalDestaque,
  DescricaoIndicador,
  AvaliacaoBlock,
  AvaliacaoTitulo,
  AvaliacaoMeta,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  FormularioModalContent,
} from "./Avaliacoes.styled";

function formatNota(nota: number | null | undefined): string {
  if (nota == null) return "—";
  return nota.toFixed(1);
}

interface PerguntaEditavel {
  texto: string;
  tipo_resposta: "nota" | "texto";
  escopo_id: number | null;
}

export function Avaliacoes() {
  const { usuario, token } = useAuth();
  const [historico, setHistorico] = useState<HistoricoBanca[]>([]);
  const [formulario, setFormulario] = useState<FormularioAtivo | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [avaliacoesNotas, setAvaliacoesNotas] = useState<AvaliacaoNota[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [escopos, setEscopos] = useState<Escopo[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  // Só o dashboard usa estes três: os cards de baixo vivem do histórico.
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [bancasFrentes, setBancasFrentes] = useState<BancaFrente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroSemestre, setFiltroSemestre] = useState("");
  const [filtroCoordenador, setFiltroCoordenador] = useState("");
  const [filtroConsultor, setFiltroConsultor] = useState("");
  const [filtroEscopo, setFiltroEscopo] = useState("");

  const [bancaDetalhe, setBancaDetalhe] = useState<HistoricoBanca | null>(null);
  const [editarFormulario, setEditarFormulario] = useState(false);

  // O formulário de banca saiu das caixas de cargo: volta a ser da diretoria.
  const podeEditarFormulario = usuario?.posicao === "diretor";

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [historicoResp, formularioResp, avaliacoesResp, notasResp, usuariosResp, escoposResp, frentesResp, semestresResp, bancasResp, candidaturasResp, bancasFrentesResp] =
        await Promise.all([
          getHistoricoBancas(token),
          getFormularioAtivo(token).catch(() => null),
          getAvaliacoes(token),
          getAvaliacoesNotas(token),
          getUsuarios(token),
          getEscopos(token),
          getFrentes(token),
          getSemestres(token),
          getBancas(token),
          getCandidaturas(token),
          getBancasFrentes(token),
        ]);
      setHistorico(historicoResp);
      setFormulario(formularioResp);
      setAvaliacoes(avaliacoesResp);
      setAvaliacoesNotas(notasResp);
      setUsuarios(usuariosResp);
      setEscopos(escoposResp);
      setFrentes(frentesResp);
      setSemestres(semestresResp);
      setBancas(bancasResp);
      setCandidaturas(candidaturasResp);
      setBancasFrentes(bancasFrentesResp);
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

  const historicoFiltrado = useMemo(() => {
    return historico
      .filter((b) => {
        if (filtroSemestre && String(b.semestre_id) !== filtroSemestre) return false;
        if (filtroCoordenador && String(b.coordenador_id) !== filtroCoordenador) return false;
        if (filtroEscopo && String(b.escopo_id) !== filtroEscopo) return false;
        if (filtroConsultor) {
          const avaliou = avaliacoes.some(
            (a) => a.banca_id === b.id && a.avaliador_id === Number(filtroConsultor) && a.status === "submetida",
          );
          if (!avaliou) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  }, [historico, filtroSemestre, filtroCoordenador, filtroConsultor, filtroEscopo, avaliacoes]);

  if (usuario?.posicao !== "diretor") {
    return <Navigate to="/dashboard" replace />;
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar as avaliações: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Dashboard Bancas</PageHeading>
          <PageSubheading>
            Os números da área, a presença de cada membro e as notas das bancas realizadas.
          </PageSubheading>
        </PageHeaderText>
      </PageHeaderRow>

      <DashboardBancas
        bancas={bancas}
        candidaturas={candidaturas}
        avaliacoes={avaliacoes}
        usuarios={usuarios}
        escopos={escopos}
        frentes={frentes}
        bancasFrentes={bancasFrentes}
        historico={historico}
        semestres={semestres}
      />

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Bancas realizadas</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <FiltersRow>
            <FieldSelect value={filtroSemestre} onChange={(e) => setFiltroSemestre(e.target.value)} style={{ width: "10rem" }}>
              <option value="">Todos os semestres</option>
              {semestres.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </FieldSelect>
            <FieldSelect value={filtroCoordenador} onChange={(e) => setFiltroCoordenador(e.target.value)} style={{ width: "10rem" }}>
              <option value="">Todos os coordenadores</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </FieldSelect>
            <FieldSelect value={filtroConsultor} onChange={(e) => setFiltroConsultor(e.target.value)} style={{ width: "10rem" }}>
              <option value="">Todos os avaliadores</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </FieldSelect>
            <FieldSelect value={filtroEscopo} onChange={(e) => setFiltroEscopo(e.target.value)} style={{ width: "10rem" }}>
              <option value="">Todos os escopos</option>
              {escopos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </FieldSelect>
          </FiltersRow>

          {historicoFiltrado.length === 0 && <EmptyText>Nenhuma banca encontrada com os filtros selecionados.</EmptyText>}
          {historicoFiltrado.length > 0 && (
            <TableScrollWrap $scrollable={historicoFiltrado.length > LIST_MAX_VISIVEIS}>
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Projeto</TableHeadCell>
                  <TableHeadCell>Data</TableHeadCell>
                  <TableHeadCell>Coordenador</TableHeadCell>
                  <TableHeadCell>Escopo</TableHeadCell>
                  <TableHeadCell>Semestre</TableHeadCell>
                  <TableHeadCell>Nota</TableHeadCell>
                  <TableHeadCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {historicoFiltrado.map((banca) => (
                  <TableRow key={banca.id}>
                    <NameCell>
                      {banca.nome_projeto}
                      {banca.descricao_coordenador && (
                        <DescricaoIndicador title="Coordenador registrou descrição">
                          <NotebookPen size={13} aria-hidden="true" />
                        </DescricaoIndicador>
                      )}
                    </NameCell>
                    <TableCell>{new Date(banca.data_hora).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{nomeUsuario(usuarios, banca.coordenador_id)}</TableCell>
                    <TableCell>{nomeEscopo(escopos, banca.escopo_id)}</TableCell>
                    <TableCell>{banca.semestre_nome ?? "—"}</TableCell>
                    <NotaCell>{formatNota(banca.nota_final)}</NotaCell>
                    <ActionsCell>
                      <PageButtonSm $variant="outline" type="button" onClick={() => setBancaDetalhe(banca)}>
                        Ver avaliações
                      </PageButtonSm>
                    </ActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
            </TableScrollWrap>
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Formulário padrão de avaliação</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {formulario ? (
            <FormularioResumo>
              <FormularioResumoItem>
                <FormularioResumoValor>{formulario.perguntas.length}</FormularioResumoValor>
                <FormularioResumoLabel>Perguntas cadastradas</FormularioResumoLabel>
              </FormularioResumoItem>
              <FormularioResumoItem>
                <FormularioResumoValor>
                  {new Set(formulario.perguntas.map((p) => p.escopo_id).filter((id) => id != null)).size}
                </FormularioResumoValor>
                <FormularioResumoLabel>Escopos com pergunta própria</FormularioResumoLabel>
              </FormularioResumoItem>
              <FormularioResumoItem>
                <FormularioResumoValor>
                  {escopos.length -
                    new Set(formulario.perguntas.map((p) => p.escopo_id).filter((id) => id != null)).size}
                </FormularioResumoValor>
                <FormularioResumoLabel>Escopos ainda sem pergunta</FormularioResumoLabel>
              </FormularioResumoItem>
            </FormularioResumo>
          ) : (
            <EmptyText>Nenhum formulário ativo configurado no momento.</EmptyText>
          )}
          {podeEditarFormulario && (
            <CardActions>
              <PageButton type="button" onClick={() => setEditarFormulario(true)}>
                Editar formulário
              </PageButton>
            </CardActions>
          )}
        </PageCardContent>
      </PageCard>

      {bancaDetalhe && token && (
        <VerAvaliacoesModal
          banca={bancaDetalhe}
          usuarios={usuarios}
          avaliacoes={avaliacoes}
          avaliacoesNotas={avaliacoesNotas}
          token={token}
          onClose={() => setBancaDetalhe(null)}
        />
      )}

      {editarFormulario && token && (
        <EditarFormularioModal
          formulario={formulario}
          escopos={escopos}
          frentes={frentes}
          token={token}
          onClose={() => setEditarFormulario(false)}
          onSalvo={(novo) => {
            setFormulario(novo);
            setEditarFormulario(false);
          }}
        />
      )}
    </PageStack>
  );
}

function VerAvaliacoesModal({
  banca,
  usuarios,
  avaliacoes,
  avaliacoesNotas,
  token,
  onClose,
}: {
  banca: HistoricoBanca;
  usuarios: UsuarioResumo[];
  avaliacoes: Avaliacao[];
  avaliacoesNotas: AvaliacaoNota[];
  token: string;
  onClose: () => void;
}) {
  const [medias, setMedias] = useState<NotaPorPergunta[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getNotasPorPergunta(banca.id, token)
      .then(setMedias)
      .finally(() => setCarregando(false));
  }, [banca.id, token]);

  const avaliacoesSubmetidas = avaliacoes.filter((a) => a.banca_id === banca.id && a.status === "submetida");

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="avaliacoes-banca-titulo">
        <ModalHeader>
          <ModalTitle id="avaliacoes-banca-titulo">Avaliações — {banca.nome_projeto}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <DetailList>
            <DetailRow>
              <DetailTerm>Data</DetailTerm>
              <DetailValue>{new Date(banca.data_hora).toLocaleDateString("pt-BR")}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Coordenador</DetailTerm>
              <DetailValue>{nomeUsuario(usuarios, banca.coordenador_id)}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Semestre</DetailTerm>
              <DetailValue>{banca.semestre_nome ?? "—"}</DetailValue>
            </DetailRow>
          </DetailList>

          <NotaFinalDestaque>
            Nota final: <strong>{formatNota(banca.nota_final)}</strong>
          </NotaFinalDestaque>

          <SectionTitle>Descrição do coordenador</SectionTitle>
          {banca.descricao_coordenador ? (
            <DescricaoQuote>{banca.descricao_coordenador}</DescricaoQuote>
          ) : (
            <EmptyText>O coordenador ainda não registrou uma descrição desta banca.</EmptyText>
          )}

          <SectionTitle>Médias por critério</SectionTitle>
          {carregando && <EmptyText>Carregando médias...</EmptyText>}
          {!carregando && medias.length === 0 && <EmptyText>Sem notas registradas.</EmptyText>}
          {!carregando && medias.length > 0 && (
            <DetailList>
              {medias.map((m) => (
                <DetailRow key={m.pergunta_id}>
                  <DetailTerm>{m.texto ?? `Pergunta ${m.pergunta_id}`}</DetailTerm>
                  <DetailValue>{formatNota(m.media)}</DetailValue>
                </DetailRow>
              ))}
            </DetailList>
          )}

          <SectionTitle>Avaliações individuais ({avaliacoesSubmetidas.length})</SectionTitle>
          {avaliacoesSubmetidas.length === 0 && <EmptyText>Nenhuma avaliação submetida.</EmptyText>}
          {avaliacoesSubmetidas.map((av) => {
            const notas = avaliacoesNotas.filter((n) => n.avaliacao_id === av.id);
            return (
              <AvaliacaoBlock key={av.id}>
                <AvaliacaoTitulo>{nomeUsuario(usuarios, av.avaliador_id)}</AvaliacaoTitulo>
                {av.submetida_em && (
                  <AvaliacaoMeta>
                    Submetida em {new Date(av.submetida_em).toLocaleDateString("pt-BR")}
                  </AvaliacaoMeta>
                )}
                {notas.map((n) => (
                  <AvaliacaoMeta key={n.id}>
                    {n.nota != null ? `Nota: ${formatNota(n.nota)}` : n.resposta_texto ?? "—"}
                  </AvaliacaoMeta>
                ))}
                {av.comentario_feedback && <AvaliacaoMeta>Comentário: {av.comentario_feedback}</AvaliacaoMeta>}
              </AvaliacaoBlock>
            );
          })}
        </ModalBody>
        <ModalFooter>
          <PageButton $variant="outline" type="button" onClick={onClose}>
            Fechar
          </PageButton>
        </ModalFooter>
      </WideModalContent>
    </ModalOverlay>
  );
}

/** Seção "Geral" (Bloco 1/3, sem escopo) mais uma por escopo do catálogo,
 *  agrupadas por frente. Escopo sem pergunta ainda (ex.: Simulação e
 *  Otimização de Processos) aparece do mesmo jeito, com a seção vazia e o
 *  botão de adicionar — a diretoria cadastra as dela quando quiser. */
function agruparPorFrente(escopos: Escopo[], frentes: Frente[]) {
  const porFrente = new Map<number, Escopo[]>();
  for (const escopo of escopos) {
    if (escopo.frente_id == null) continue;
    const lista = porFrente.get(escopo.frente_id) ?? [];
    lista.push(escopo);
    porFrente.set(escopo.frente_id, lista);
  }
  return frentes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((frente) => ({
      frente,
      escopos: (porFrente.get(frente.id) ?? []).slice().sort((a, b) => a.nome.localeCompare(b.nome)),
    }))
    .filter((grupo) => grupo.escopos.length > 0);
}

function EditarFormularioModal({
  formulario,
  escopos,
  frentes,
  token,
  onClose,
  onSalvo,
}: {
  formulario: FormularioAtivo | null;
  escopos: Escopo[];
  frentes: Frente[];
  token: string;
  onClose: () => void;
  onSalvo: (formulario: FormularioAtivo) => void;
}) {
  const [perguntas, setPerguntas] = useState<PerguntaEditavel[]>(() =>
    (formulario?.perguntas ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((p) => ({ texto: p.texto, tipo_resposta: p.tipo_resposta, escopo_id: p.escopo_id })),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [previsualizando, setPrevisualizando] = useState(false);

  const gruposPorFrente = useMemo(() => agruparPorFrente(escopos, frentes), [escopos, frentes]);

  function atualizar(index: number, campo: "texto" | "tipo_resposta", valor: string) {
    setPerguntas((lista) =>
      lista.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)),
    );
  }

  function adicionar(escopoId: number | null) {
    setPerguntas((lista) => [...lista, { texto: "", tipo_resposta: "nota", escopo_id: escopoId }]);
  }

  function remover(index: number) {
    setPerguntas((lista) => lista.filter((_, i) => i !== index));
  }

  /** Reordena dentro do mesmo escopo (a ordem só importa entre perguntas do
   *  mesmo bloco — Geral e cada escopo são exibidos e reagrupados por tipo
   *  separadamente na hora da avaliação). */
  function mover(escopoId: number | null, posicaoNaSecao: number, direcao: -1 | 1) {
    setPerguntas((lista) => {
      const indicesDaSecao = lista
        .map((_, i) => i)
        .filter((i) => lista[i].escopo_id === escopoId);
      const alvoPos = posicaoNaSecao + direcao;
      if (alvoPos < 0 || alvoPos >= indicesDaSecao.length) return lista;
      const i1 = indicesDaSecao[posicaoNaSecao];
      const i2 = indicesDaSecao[alvoPos];
      const nova = lista.slice();
      [nova[i1], nova[i2]] = [nova[i2], nova[i1]];
      return nova;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validas = perguntas.filter((p) => p.texto.trim());
    if (validas.length === 0) {
      setErro("Adicione ao menos uma pergunta.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const novo = await createNovaVersaoFormulario(
        validas.map(
          (p, i): PerguntaNovaVersao => ({
            texto: p.texto.trim(),
            ordem: i + 1,
            tipo_resposta: p.tipo_resposta,
            escopo_id: p.escopo_id,
          }),
        ),
        token,
      );
      onSalvo(novo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar formulário");
    } finally {
      setSalvando(false);
    }
  }

  function renderSecao(titulo: string, escopoId: number | null) {
    const linhas = perguntas
      .map((p, index) => ({ ...p, index }))
      .filter((p) => p.escopo_id === escopoId);

    return (
      <PerguntaSecao key={escopoId ?? "geral"}>
        <PerguntaSecaoTitulo>{titulo}</PerguntaSecaoTitulo>
        {linhas.length === 0 && <PerguntaSecaoVazia>Nenhuma pergunta ainda.</PerguntaSecaoVazia>}
        <PerguntaEditorList>
          {linhas.map(({ index, texto, tipo_resposta }, posicao) => (
            <PerguntaEditorRow key={index}>
              <FieldInput
                value={texto}
                onChange={(e) => atualizar(index, "texto", e.target.value)}
                placeholder="Texto da pergunta"
                required
              />
              <FieldSelect
                value={tipo_resposta}
                onChange={(e) => atualizar(index, "tipo_resposta", e.target.value)}
                aria-label="Tipo da pergunta"
              >
                <option value="nota">Nota — escala de 1 a 5</option>
                <option value="texto">Texto</option>
              </FieldSelect>
              <MoveButtonGroup>
                <MoveButton
                  type="button"
                  aria-label="Mover para cima"
                  disabled={posicao === 0}
                  onClick={() => mover(escopoId, posicao, -1)}
                >
                  ▲
                </MoveButton>
                <MoveButton
                  type="button"
                  aria-label="Mover para baixo"
                  disabled={posicao === linhas.length - 1}
                  onClick={() => mover(escopoId, posicao, 1)}
                >
                  ▼
                </MoveButton>
              </MoveButtonGroup>
              <RemoveButton type="button" onClick={() => remover(index)}>
                Remover
              </RemoveButton>
            </PerguntaEditorRow>
          ))}
        </PerguntaEditorList>
        <PageButtonSm type="button" $variant="outline" onClick={() => adicionar(escopoId)}>
          <Plus size={14} />
          Adicionar pergunta
        </PageButtonSm>
      </PerguntaSecao>
    );
  }

  /** Mesma seção, mas como quem vai preencher a avaliação vai ver — os
   *  componentes reais do formulário (NotaEscala) desabilitados, sem os
   *  controles de edição. */
  function renderSecaoPreview(titulo: string, escopoId: number | null) {
    const linhas = perguntas.filter((p) => p.escopo_id === escopoId && p.texto.trim());
    const notas = linhas.filter((p) => isPerguntaNota(p.tipo_resposta));
    const textos = linhas.filter((p) => !isPerguntaNota(p.tipo_resposta));

    return (
      <PerguntaSecao key={escopoId ?? "geral"}>
        <PerguntaSecaoTitulo>{titulo}</PerguntaSecaoTitulo>
        {linhas.length === 0 && <PerguntaSecaoVazia>Nenhuma pergunta ainda.</PerguntaSecaoVazia>}
        {notas.length > 0 && (
          <NotaEscalaGrupo>
            {notas.map((p, i) => (
              <NotaEscala key={i} label={p.texto} value={null} disabled />
            ))}
          </NotaEscalaGrupo>
        )}
        {textos.map((p, i) => (
          <FieldGroup key={i}>
            <FieldLabel>{p.texto}</FieldLabel>
            <FieldTextarea disabled placeholder="Resposta em texto" />
          </FieldGroup>
        ))}
      </PerguntaSecao>
    );
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <FormularioModalContent
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="editar-form-titulo"
      >
        <ModalHeader>
          <ModalTitle id="editar-form-titulo">Editar formulário padrão</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            <FormHint>
              Uma nova versão será criada para o semestre atual. Bancas já avaliadas mantêm o formulário anterior.
              As perguntas "Geral" aparecem em toda avaliação; as de um escopo só aparecem quando a banca
              avaliada é daquele escopo.
            </FormHint>

            <PreviewToggleRow>
              <PageButtonSm type="button" $variant="outline" onClick={() => setPrevisualizando((v) => !v)}>
                {previsualizando ? "Voltar a editar" : "Pré-visualizar"}
              </PageButtonSm>
            </PreviewToggleRow>

            {previsualizando ? (
              <>
                {renderSecaoPreview("Geral (informações iniciais e avaliação final)", null)}
                {gruposPorFrente.map(({ frente, escopos: escoposDaFrente }) => (
                  <PerguntaGrupoFrente key={frente.id}>
                    <SectionTitle>{frente.nome}</SectionTitle>
                    {escoposDaFrente.map((escopo) => renderSecaoPreview(escopo.nome, escopo.id))}
                  </PerguntaGrupoFrente>
                ))}
              </>
            ) : (
              <>
                {renderSecao("Geral (informações iniciais e avaliação final)", null)}
                {gruposPorFrente.map(({ frente, escopos: escoposDaFrente }) => (
                  <PerguntaGrupoFrente key={frente.id}>
                    <SectionTitle>{frente.nome}</SectionTitle>
                    {escoposDaFrente.map((escopo) => renderSecao(escopo.nome, escopo.id))}
                  </PerguntaGrupoFrente>
                ))}
              </>
            )}

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton $variant="outline" type="button" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando || previsualizando}>
              {salvando ? "Salvando..." : "Publicar nova versão"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </FormularioModalContent>
    </ModalOverlay>
  );
}
