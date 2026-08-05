import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  alocar,
  createBanca,
  deleteBanca,
  aceitaInscricao,
  desalocar,
  getBancas,
  getBancasFrentes,
  getCandidaturas,
  getBancasParaAvaliar,
  getEquipesProjeto,
  getEscopos,
  getFrentes,
  podeGerenciarBanca,
  syncBancaFrentes,
  syncEquipeProjeto,
  toDateInputValue,
  toTimeInputValue,
  updateBanca,
} from "@/lib/bancas";
import { getCargos } from "@/lib/cargos";
import { getUsuarios } from "@/lib/usuarios";
import {
  createAvaliacao,
  createAvaliacaoNota,
  getFormularioAtivo,
  getAvaliacoes,
  isComentarioFeedbackPergunta,
  isPerguntaNota,
  isPerguntaOpcional,
  submeterAvaliacao,
} from "@/lib/avaliacoes";
import { NotaSlider, NotaSliderGroup } from "@/components/NotaSlider";
import type { Banca, BancaFrente, Candidatura, EquipeProjeto, Escopo, Frente, FormularioAtivo } from "@/types/banca";
import type { Cargo, UsuarioResumo } from "@/types/auth";
import {
  avaliadoresDaBanca,
  consultoresDoNucleo,
  frentesDaBanca,
  membrosDaBanca,
  nomeEscopo,
  nomeUsuario,
} from "@/lib/nucleo";
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
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  NameCell,
  TableCell,
  ActionsCell,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FieldTextarea,
  FieldSelect,
  CheckboxGrid,
  CheckboxLabel,
  DateTimeRow,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  ModalFooterSplit,
  NarrowModalContent,
  WideModalContent,
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  TableScrollWrap,
  LIST_MAX_VISIVEIS,
  SectionGroup,
  SectionTitle,
} from "./Bancas.styled";

interface Contexto {
  usuarios: UsuarioResumo[];
  cargos: Cargo[];
  escopos: Escopo[];
  frentes: Frente[];
  bancasFrentes: BancaFrente[];
  equipesProjeto: EquipeProjeto[];
  candidaturas: Candidatura[];
}

export function Bancas() {
  const { usuario, token } = useAuth();
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [paraAvaliar, setParaAvaliar] = useState<Banca[]>([]);
  const [jaAvaliadas, setJaAvaliadas] = useState<Banca[]>([]);
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [formulario, setFormulario] = useState<FormularioAtivo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [bancaDetalhe, setBancaDetalhe] = useState<Banca | null>(null);
  const [bancaAvaliar, setBancaAvaliar] = useState<Banca | null>(null);
  const [bancaEditar, setBancaEditar] = useState<Banca | null>(null);
  const [criarAberto, setCriarAberto] = useState(false);

  const podeAgendar = !!usuario?.cargo.pode_definir_cronograma;

  async function recarregar() {
    if (!token || !usuario) return;
    setCarregando(true);
    setErro("");
    try {
      const [bancasResp, candidaturasResp, avaliarResp, avaliacoesResp, usuarios, cargos, escopos, frentes, bancasFrentes, equipesProjeto, formularioAtivo] =
        await Promise.all([
          getBancas(token),
          getCandidaturas(token),
          getBancasParaAvaliar(usuario.id, token),
          getAvaliacoes(token),
          getUsuarios(token),
          getCargos(token),
          getEscopos(token),
          getFrentes(token),
          getBancasFrentes(token),
          getEquipesProjeto(token),
          getFormularioAtivo(token).catch(() => null),
        ]);
      setBancas(bancasResp);
      setCandidaturas(candidaturasResp);
      setParaAvaliar(
        avaliarResp
          .map((item) => bancasResp.find((b) => b.id === item.banca_id))
          .filter((b): b is Banca => b != null),
      );
      const bancasAvaliadasIds = new Set(
        avaliacoesResp
          .filter((a) => a.avaliador_id === usuario.id && a.status === "submetida")
          .map((a) => a.banca_id),
      );
      const candidaturaBancaIds = new Set(
        candidaturasResp.filter((c) => c.usuario_id === usuario.id).map((c) => c.banca_id),
      );
      setJaAvaliadas(
        bancasResp
          .filter(
            (b) =>
              b.status === "realizada" && bancasAvaliadasIds.has(b.id) && candidaturaBancaIds.has(b.id),
          )
          .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()),
      );
      setContexto({ usuarios, cargos, escopos, frentes, bancasFrentes, equipesProjeto, candidaturas: candidaturasResp });
      setFormulario(formularioAtivo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar bancas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, usuario]);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar as bancas: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={recarregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !contexto || !usuario) return <PageLoadingBlock />;

  // A narrowing do `!usuario` acima não sobrevive dentro das funções
  // declaradas depois — o TS não sabe quando elas rodam. Segurar o valor
  // numa const resolve sem espalhar `usuario!` pelo arquivo.
  const usuarioLogado = usuario;

  function candidaturaDe(bancaId: number) {
    return candidaturas.find((c) => c.banca_id === bancaId && c.usuario_id === usuarioLogado.id);
  }

  const bancasDoProjeto = bancas
    .filter(
      (b) =>
        b.coordenador_id === usuario.id ||
        contexto.equipesProjeto.some((e) => e.banca_id === b.id && e.usuario_id === usuario.id),
    )
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  // ⚠ `aceitaInscricao` no lugar da comparação com a string antiga: uma banca
  // `atrasada` continua nestes baldes. Trocar só o literal a faria sumir da
  // tela inteira.
  const jaAlocado = bancas.filter((b) => aceitaInscricao(b.status) && candidaturaDe(b.id));
  const lotadas = bancas.filter(
    (b) => aceitaInscricao(b.status) && !candidaturaDe(b.id) && b.alocados >= b.vagas,
  );
  const disponiveisParaAlocacao = bancas.filter(
    (b) => aceitaInscricao(b.status) && !candidaturaDe(b.id) && b.alocados < b.vagas,
  );

  async function handleAlocar(bancaId: number) {
    if (!token) return;
    await alocar(bancaId, token);
    recarregar();
  }

  async function handleDesalocar(bancaId: number) {
    const candidatura = candidaturaDe(bancaId);
    if (!token || !candidatura) return;
    await desalocar(candidatura.id, token);
    recarregar();
  }

  async function handleExcluir(banca: Banca) {
    if (!token || !podeGerenciarBanca(banca, usuarioLogado.id)) return;
    if (!confirm(`Excluir a banca "${banca.nome_projeto}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteBanca(banca.id, token);
      setBancaDetalhe(null);
      setBancaEditar(null);
      recarregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir banca");
    }
  }

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Bancas</PageHeading>
          <PageSubheading>
            {podeAgendar
              ? "Aloque-se para assistir bancas, avalie as que participou e crie bancas dos seus projetos."
              : "Aloque-se para assistir bancas disponíveis e avalie as que participou."}
          </PageSubheading>
        </PageHeaderText>
        {podeAgendar && (
          <PageButton type="button" onClick={() => setCriarAberto(true)}>
            <Plus size={16} />
            Criar banca
          </PageButton>
        )}
      </PageHeaderRow>

      {(podeAgendar || bancasDoProjeto.length > 0) && (
        <SecaoBancas
          titulo="Bancas dos meus projetos"
          bancas={bancasDoProjeto}
          contexto={contexto}
          acao="nenhuma"
          usuarioId={usuario.id}
          gerenciar={podeAgendar}
          onVerMais={setBancaDetalhe}
          onEditar={setBancaEditar}
          onExcluir={handleExcluir}
        />
      )}

      <SectionGroup>
        <SectionTitle>Bancas futuras</SectionTitle>
        <SecaoBancas
          titulo="Já alocado"
          bancas={jaAlocado}
          contexto={contexto}
          acao="deslocar"
          onAcao={handleDesalocar}
          onVerMais={setBancaDetalhe}
        />
        <SecaoBancas
          titulo="Disponíveis para alocação"
          bancas={disponiveisParaAlocacao}
          contexto={contexto}
          acao="alocar"
          onAcao={handleAlocar}
          onVerMais={setBancaDetalhe}
        />
        <SecaoBancas
          titulo="Com alocação máxima"
          bancas={lotadas}
          contexto={contexto}
          acao="nenhuma"
          onVerMais={setBancaDetalhe}
        />
      </SectionGroup>

      <SectionGroup>
        <SectionTitle>Bancas realizadas</SectionTitle>
        <SecaoBancas
          titulo="Com avaliação pendente"
          bancas={paraAvaliar}
          contexto={contexto}
          acao="avaliar"
          onAcao={(id) => setBancaAvaliar(paraAvaliar.find((b) => b.id === id) ?? null)}
          onVerMais={setBancaDetalhe}
        />
        <SecaoBancas
          titulo="Avaliadas"
          bancas={jaAvaliadas}
          contexto={contexto}
          acao="nenhuma"
          onVerMais={setBancaDetalhe}
        />
      </SectionGroup>

      <VerMaisModal
        banca={bancaDetalhe}
        contexto={contexto}
        usuarioId={usuario.id}
        onClose={() => setBancaDetalhe(null)}
        onEditar={setBancaEditar}
        onExcluir={handleExcluir}
      />

      {criarAberto && token && (
        <BancaFormModal
          contexto={contexto}
          token={token}
          onClose={() => setCriarAberto(false)}
          onSalvo={() => {
            setCriarAberto(false);
            recarregar();
          }}
        />
      )}

      {bancaEditar && token && (
        <BancaFormModal
          banca={bancaEditar}
          contexto={contexto}
          token={token}
          onClose={() => setBancaEditar(null)}
          onSalvo={() => {
            setBancaEditar(null);
            setBancaDetalhe(null);
            recarregar();
          }}
        />
      )}

      {bancaAvaliar && token && (
        <AvaliarModal
          banca={bancaAvaliar}
          formulario={formulario}
          token={token}
          onClose={() => setBancaAvaliar(null)}
          onEnviada={() => {
            setBancaAvaliar(null);
            recarregar();
          }}
        />
      )}
    </PageStack>
  );
}

function SecaoBancas({
  titulo,
  bancas,
  contexto,
  acao,
  onAcao,
  onVerMais,
  usuarioId,
  gerenciar,
  onEditar,
  onExcluir,
}: {
  titulo: string;
  bancas: Banca[];
  contexto: Contexto;
  acao: "nenhuma" | "alocar" | "deslocar" | "avaliar";
  onAcao?: (bancaId: number) => void;
  onVerMais: (banca: Banca) => void;
  usuarioId?: number;
  gerenciar?: boolean;
  onEditar?: (banca: Banca) => void;
  onExcluir?: (banca: Banca) => void;
}) {
  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>{titulo}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {bancas.length === 0 && <EmptyText>Nenhuma banca aqui.</EmptyText>}
        {bancas.length > 0 && (
          <TableScrollWrap $scrollable={bancas.length > LIST_MAX_VISIVEIS}>
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Nome</TableHeadCell>
                  <TableHeadCell>Data</TableHeadCell>
                  <TableHeadCell>Hora</TableHeadCell>
                  <TableHeadCell>Coord</TableHeadCell>
                  <TableHeadCell>Alocados</TableHeadCell>
                  <TableHeadCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {bancas.map((banca) => {
                  const dataHora = new Date(banca.data_hora);
                  const lotada = acao === "alocar" && banca.alocados >= banca.vagas;
                  const podeGerenciar = gerenciar && usuarioId != null && podeGerenciarBanca(banca, usuarioId);
                  return (
                    <TableRow key={banca.id}>
                      <NameCell>{banca.nome_projeto}</NameCell>
                      <TableCell>{dataHora.toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell>{nomeUsuario(contexto.usuarios, banca.coordenador_id)}</TableCell>
                      <TableCell>
                        {banca.alocados}/{banca.vagas}
                      </TableCell>
                      <ActionsCell>
                        <PageButtonSm $variant="outline" type="button" onClick={() => onVerMais(banca)}>
                          Ver mais
                        </PageButtonSm>
                        {podeGerenciar && onEditar && (
                          <PageButtonSm $variant="outline" type="button" onClick={() => onEditar(banca)}>
                            Editar
                          </PageButtonSm>
                        )}
                        {podeGerenciar && onExcluir && (
                          <PageButtonSm $variant="outline" type="button" onClick={() => onExcluir(banca)}>
                            Excluir
                          </PageButtonSm>
                        )}
                        {acao !== "nenhuma" && onAcao && (
                          <PageButtonSm
                            $variant={acao === "deslocar" ? "outline" : "primary"}
                            type="button"
                            disabled={lotada}
                            onClick={() => onAcao(banca.id)}
                          >
                            {lotada ? "Lotada" : acao === "alocar" ? "Alocar-se" : acao === "deslocar" ? "Deslocar-se" : "Avaliar"}
                          </PageButtonSm>
                        )}
                      </ActionsCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
          </TableScrollWrap>
        )}
      </PageCardContent>
    </PageCard>
  );
}

function BancaFormModal({
  banca,
  contexto,
  token,
  onClose,
  onSalvo,
}: {
  banca?: Banca | null;
  contexto: Contexto;
  token: string;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const editando = !!banca;

  const [nomeProjeto, setNomeProjeto] = useState(banca?.nome_projeto ?? "");
  const [escopoId, setEscopoId] = useState(banca ? String(banca.escopo_id) : "");
  const [data, setData] = useState(banca ? toDateInputValue(banca.data_hora) : "");
  const [hora, setHora] = useState(banca ? toTimeInputValue(banca.data_hora) : "");
  const [consultorIds, setConsultorIds] = useState<number[]>(() =>
    banca ? contexto.equipesProjeto.filter((e) => e.banca_id === banca.id).map((e) => e.usuario_id) : [],
  );
  const [frenteIds, setFrenteIds] = useState<number[]>(() =>
    banca ? contexto.bancasFrentes.filter((bf) => bf.banca_id === banca.id).map((bf) => bf.frente_id) : [],
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const consultores = consultoresDoNucleo(contexto.usuarios, contexto.cargos);

  function toggleId(lista: number[], id: number): number[] {
    return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!escopoId || !data || !hora) return;
    setEnviando(true);
    setErro("");
    try {
      const dataHora = new Date(`${data}T${hora}:00`).toISOString();
      if (editando && banca) {
        await updateBanca(
          banca.id,
          {
            nome_projeto: nomeProjeto.trim(),
            escopo_id: Number(escopoId),
            data_hora: dataHora,
          },
          token,
        );
        await syncEquipeProjeto(banca.id, consultorIds, contexto.equipesProjeto, token);
        await syncBancaFrentes(banca.id, frenteIds, contexto.bancasFrentes, token);
      } else {
        await createBanca(
          {
            nome_projeto: nomeProjeto.trim(),
            escopo_id: Number(escopoId),
            data_hora: dataHora,
            consultor_ids: consultorIds,
            frente_ids: frenteIds,
          },
          token,
        );
      }
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : editando ? "Erro ao salvar banca" : "Erro ao criar banca");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="banca-form-titulo">
        <ModalHeader>
          <ModalTitle id="banca-form-titulo">{editando ? "Editar banca" : "Criar banca"}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="nome-projeto">Nome do projeto</FieldLabel>
              <FieldInput
                id="nome-projeto"
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                placeholder="Ex.: Portugal 1"
                required
              />
            </FieldGroup>

            <DateTimeRow>
              <FieldGroup>
                <FieldLabel htmlFor="data-banca">Data</FieldLabel>
                <FieldInput id="data-banca" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="hora-banca">Horário</FieldLabel>
                <FieldInput id="hora-banca" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
              </FieldGroup>
            </DateTimeRow>

            <FieldGroup>
              <FieldLabel htmlFor="escopo">Escopo</FieldLabel>
              <FieldSelect id="escopo" value={escopoId} onChange={(e) => setEscopoId(e.target.value)} required>
                <option value="">Selecione um escopo</option>
                {contexto.escopos.map((escopo) => (
                  <option key={escopo.id} value={escopo.id}>
                    {escopo.nome}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Consultores do projeto</FieldLabel>
              <CheckboxGrid>
                {consultores.length === 0 && <EmptyText>Nenhum consultor disponível.</EmptyText>}
                {consultores.map((consultor) => (
                  <CheckboxLabel key={consultor.id}>
                    <input
                      type="checkbox"
                      checked={consultorIds.includes(consultor.id)}
                      onChange={() => setConsultorIds((ids) => toggleId(ids, consultor.id))}
                    />
                    {consultor.nome}
                  </CheckboxLabel>
                ))}
              </CheckboxGrid>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Frentes</FieldLabel>
              <CheckboxGrid>
                {contexto.frentes.length === 0 && <EmptyText>Nenhuma frente cadastrada.</EmptyText>}
                {contexto.frentes.map((frente) => (
                  <CheckboxLabel key={frente.id}>
                    <input
                      type="checkbox"
                      checked={frenteIds.includes(frente.id)}
                      onChange={() => setFrenteIds((ids) => toggleId(ids, frente.id))}
                    />
                    {frente.nome}
                  </CheckboxLabel>
                ))}
              </CheckboxGrid>
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton $variant="outline" type="button" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={enviando}>
              {enviando ? (editando ? "Salvando..." : "Criando...") : editando ? "Salvar" : "Criar"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </WideModalContent>
    </ModalOverlay>
  );
}

function VerMaisModal({
  banca,
  contexto,
  usuarioId,
  onClose,
  onEditar,
  onExcluir,
}: {
  banca: Banca | null;
  contexto: Contexto;
  usuarioId: number;
  onClose: () => void;
  onEditar?: (banca: Banca) => void;
  onExcluir?: (banca: Banca) => void;
}) {
  if (!banca) return null;

  const podeGerenciar = podeGerenciarBanca(banca, usuarioId);

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <NarrowModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="ver-mais-titulo">
        <ModalHeader>
          <ModalTitle id="ver-mais-titulo">{banca.nome_projeto}</ModalTitle>
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
              <DetailTerm>Horário</DetailTerm>
              <DetailValue>
                {new Date(banca.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Escopo</DetailTerm>
              <DetailValue>{nomeEscopo(contexto.escopos, banca.escopo_id)}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Frentes</DetailTerm>
              <DetailValue>{frentesDaBanca(contexto.bancasFrentes, contexto.frentes, banca.id).join(", ") || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Coordenador</DetailTerm>
              <DetailValue>{nomeUsuario(contexto.usuarios, banca.coordenador_id)}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Membros</DetailTerm>
              <DetailValue>{membrosDaBanca(contexto.equipesProjeto, contexto.usuarios, banca.id).join(", ") || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Avaliadores</DetailTerm>
              <DetailValue>{avaliadoresDaBanca(contexto.candidaturas, contexto.usuarios, banca.id).join(", ") || "—"}</DetailValue>
            </DetailRow>
          </DetailList>
        </ModalBody>
        <ModalFooter>
          {podeGerenciar && onEditar && (
            <PageButton type="button" onClick={() => onEditar(banca)}>
              Editar
            </PageButton>
          )}
          {podeGerenciar && onExcluir && (
            <PageButton $variant="outline" type="button" onClick={() => onExcluir(banca)}>
              Excluir
            </PageButton>
          )}
          <PageButton $variant="outline" type="button" onClick={onClose}>
            Fechar
          </PageButton>
        </ModalFooter>
      </NarrowModalContent>
    </ModalOverlay>
  );
}

function AvaliarModal({
  banca,
  formulario,
  token,
  onClose,
  onEnviada,
}: {
  banca: Banca;
  formulario: FormularioAtivo | null;
  token: string;
  onClose: () => void;
  onEnviada: () => void;
}) {
  const perguntasVisiveis = (formulario?.perguntas ?? [])
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .filter((p) => !isComentarioFeedbackPergunta(p.tipo_resposta, p.texto));

  const perguntasNota = perguntasVisiveis.filter((p) => isPerguntaNota(p.tipo_resposta));
  const perguntasTexto = perguntasVisiveis.filter((p) => !isPerguntaNota(p.tipo_resposta));

  const [notas, setNotas] = useState<Record<number, number>>(() =>
    Object.fromEntries(perguntasNota.map((p) => [p.id, 0])),
  );
  const [respostasTexto, setRespostasTexto] = useState<Record<number, string>>({});
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formulario) return;
    setEnviando(true);
    setErro("");
    try {
      const avaliacao = await createAvaliacao({ banca_id: banca.id, formulario_id: formulario.id }, token);
      for (const pergunta of perguntasVisiveis) {
        if (isPerguntaNota(pergunta.tipo_resposta)) {
          await createAvaliacaoNota(
            {
              avaliacao_id: avaliacao.id,
              pergunta_id: pergunta.id,
              nota: notas[pergunta.id] ?? 0,
            },
            token,
          );
        } else {
          const valor = respostasTexto[pergunta.id];
          if (valor === undefined || valor === "") continue;
          await createAvaliacaoNota(
            {
              avaliacao_id: avaliacao.id,
              pergunta_id: pergunta.id,
              resposta_texto: valor,
            },
            token,
          );
        }
      }
      await submeterAvaliacao(avaliacao.id, comentario.trim() || null, token);
      onEnviada();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar avaliação");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="avaliar-titulo">
        <ModalHeader>
          <ModalTitle id="avaliar-titulo">Formulário de avaliação — {banca.nome_projeto}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        {!formulario ? (
          <ModalBody>
            <EmptyText>Nenhum formulário ativo configurado no momento.</EmptyText>
          </ModalBody>
        ) : (
          <FormStack onSubmit={handleSubmit}>
            <ModalBody>
              {perguntasNota.length > 0 && (
                <NotaSliderGroup>
                  {perguntasNota.map((pergunta) => (
                    <NotaSlider
                      key={pergunta.id}
                      id={`pergunta-${pergunta.id}`}
                      label={pergunta.texto}
                      value={notas[pergunta.id] ?? 0}
                      onChange={(valor) => setNotas((n) => ({ ...n, [pergunta.id]: valor }))}
                    />
                  ))}
                </NotaSliderGroup>
              )}
              {perguntasTexto.map((pergunta) => (
                <FieldGroup key={pergunta.id}>
                  <FieldLabel htmlFor={`pergunta-${pergunta.id}`}>{pergunta.texto}</FieldLabel>
                  <FieldTextarea
                    id={`pergunta-${pergunta.id}`}
                    value={respostasTexto[pergunta.id] ?? ""}
                    onChange={(e) => setRespostasTexto((r) => ({ ...r, [pergunta.id]: e.target.value }))}
                    required={!isPerguntaOpcional(pergunta.texto)}
                  />
                </FieldGroup>
              ))}
              <FieldGroup>
                <FieldLabel htmlFor="comentario">Comentário (opcional)</FieldLabel>
                <FieldTextarea id="comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} />
              </FieldGroup>
              {erro && <FormErrorText>{erro}</FormErrorText>}
            </ModalBody>
            <ModalFooterSplit>
              <PageButton $variant="outline" type="button" onClick={onClose}>
                Voltar
              </PageButton>
              <PageButton type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar avaliação"}
              </PageButton>
            </ModalFooterSplit>
          </FormStack>
        )}
      </WideModalContent>
    </ModalOverlay>
  );
}
