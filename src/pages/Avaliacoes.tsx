import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createNovaVersaoFormulario,
  getAvaliacoes,
  getAvaliacoesNotas,
  getFormularioAtivo,
  getNotasPorPergunta,
} from "@/lib/avaliacoes";
import { getEscopos } from "@/lib/bancas";
import { getHistoricoBancas } from "@/lib/historico";
import { nomeEscopo, nomeUsuario } from "@/lib/nucleo";
import { getSemestres } from "@/lib/semestres";
import { getUsuarios } from "@/lib/usuarios";
import type {
  Avaliacao,
  AvaliacaoNota,
  Escopo,
  FormularioAtivo,
  HistoricoBanca,
  NotaPorPergunta,
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
  FilterSelect,
  FormHint,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  FormStack,
  FieldInput,
  FieldSelect,
  FormErrorText,
  PerguntaEditorList,
  PerguntaEditorRow,
  RemoveButton,
  SectionTitle,
  NotaFinalDestaque,
  AvaliacaoBlock,
  AvaliacaoTitulo,
  AvaliacaoMeta,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
} from "./Avaliacoes.styled";

function formatNota(nota: number | null | undefined): string {
  if (nota == null) return "—";
  return nota.toFixed(1);
}

interface PerguntaEditavel {
  texto: string;
  tipo_resposta: "nota" | "texto";
}

export function Avaliacoes() {
  const { usuario, token } = useAuth();
  const [historico, setHistorico] = useState<HistoricoBanca[]>([]);
  const [formulario, setFormulario] = useState<FormularioAtivo | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [avaliacoesNotas, setAvaliacoesNotas] = useState<AvaliacaoNota[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [escopos, setEscopos] = useState<Escopo[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroSemestre, setFiltroSemestre] = useState("");
  const [filtroCoordenador, setFiltroCoordenador] = useState("");
  const [filtroConsultor, setFiltroConsultor] = useState("");
  const [filtroEscopo, setFiltroEscopo] = useState("");

  const [bancaDetalhe, setBancaDetalhe] = useState<HistoricoBanca | null>(null);
  const [editarFormulario, setEditarFormulario] = useState(false);

  const podeEditarFormulario = !!usuario?.cargo.pode_definir_formulario;

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [historicoResp, formularioResp, avaliacoesResp, notasResp, usuariosResp, escoposResp, semestresResp] =
        await Promise.all([
          getHistoricoBancas(token),
          getFormularioAtivo(token).catch(() => null),
          getAvaliacoes(token),
          getAvaliacoesNotas(token),
          getUsuarios(token),
          getEscopos(token),
          getSemestres(token),
        ]);
      setHistorico(historicoResp);
      setFormulario(formularioResp);
      setAvaliacoes(avaliacoesResp);
      setAvaliacoesNotas(notasResp);
      setUsuarios(usuariosResp);
      setEscopos(escoposResp);
      setSemestres(semestresResp);
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

  if (!usuario?.cargo.pode_definir_formulario && !usuario?.cargo.pode_gerenciar_cargos) {
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
          <PageHeading>Avaliações</PageHeading>
          <PageSubheading>Consulte notas de bancas realizadas e gerencie o formulário padrão de avaliação.</PageSubheading>
        </PageHeaderText>
      </PageHeaderRow>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Bancas realizadas</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <FiltersRow>
            <FilterSelect value={filtroSemestre} onChange={(e) => setFiltroSemestre(e.target.value)}>
              <option value="">Todos os semestres</option>
              {semestres.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filtroCoordenador} onChange={(e) => setFiltroCoordenador(e.target.value)}>
              <option value="">Todos os coordenadores</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filtroConsultor} onChange={(e) => setFiltroConsultor(e.target.value)}>
              <option value="">Todos os avaliadores</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filtroEscopo} onChange={(e) => setFiltroEscopo(e.target.value)}>
              <option value="">Todos os escopos</option>
              {escopos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </FilterSelect>
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
                    <NameCell>{banca.nome_projeto}</NameCell>
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
          {podeEditarFormulario && (
            <PageButtonSm type="button" onClick={() => setEditarFormulario(true)}>
              Editar
            </PageButtonSm>
          )}
        </PageCardHeader>
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

function EditarFormularioModal({
  formulario,
  token,
  onClose,
  onSalvo,
}: {
  formulario: FormularioAtivo | null;
  token: string;
  onClose: () => void;
  onSalvo: (formulario: FormularioAtivo) => void;
}) {
  const [perguntas, setPerguntas] = useState<PerguntaEditavel[]>(() =>
    (formulario?.perguntas ?? [{ texto: "", tipo_resposta: "nota" as const }])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((p) => ({ texto: p.texto, tipo_resposta: p.tipo_resposta })),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function atualizar(index: number, campo: keyof PerguntaEditavel, valor: string) {
    setPerguntas((lista) =>
      lista.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)),
    );
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
        validas.map((p, i) => ({
          texto: p.texto.trim(),
          ordem: i + 1,
          tipo_resposta: p.tipo_resposta,
        })),
        token,
      );
      onSalvo(novo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar formulário");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="editar-form-titulo">
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
            </FormHint>
            <PerguntaEditorList>
              {perguntas.map((p, index) => (
                <PerguntaEditorRow key={index}>
                  <FieldInput
                    value={p.texto}
                    onChange={(e) => atualizar(index, "texto", e.target.value)}
                    placeholder={`Pergunta ${index + 1}`}
                    required
                  />
                  <FieldSelect
                    value={p.tipo_resposta}
                    onChange={(e) => atualizar(index, "tipo_resposta", e.target.value)}
                    aria-label={`Tipo da pergunta ${index + 1}`}
                  >
                    <option value="nota">Nota — slider (0–5)</option>
                    <option value="texto">Texto</option>
                  </FieldSelect>
                  <RemoveButton
                    type="button"
                    onClick={() => setPerguntas((lista) => lista.filter((_, i) => i !== index))}
                    disabled={perguntas.length <= 1}
                  >
                    Remover
                  </RemoveButton>
                </PerguntaEditorRow>
              ))}
            </PerguntaEditorList>
            <PageButton
              type="button"
              $variant="outline"
              onClick={() => setPerguntas((lista) => [...lista, { texto: "", tipo_resposta: "nota" }])}
            >
              <Plus size={16} />
              Adicionar pergunta
            </PageButton>
            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton $variant="outline" type="button" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Publicar nova versão"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </WideModalContent>
    </ModalOverlay>
  );
}
