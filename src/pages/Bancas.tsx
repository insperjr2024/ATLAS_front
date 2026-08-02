import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  alocar,
  createBanca,
  desalocar,
  getBancas,
  getBancasFrentes,
  getCandidaturas,
  getBancasParaAvaliar,
  getEquipesProjeto,
  getEscopos,
  getFrentes,
} from "@/lib/bancas";
import { getCargos } from "@/lib/cargos";
import { getUsuarios } from "@/lib/usuarios";
import { createAvaliacao, createAvaliacaoNota, getFormularioAtivo, submeterAvaliacao } from "@/lib/avaliacoes";
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
  NarrowModalContent,
  WideModalContent,
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
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
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [formulario, setFormulario] = useState<FormularioAtivo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [bancaDetalhe, setBancaDetalhe] = useState<Banca | null>(null);
  const [bancaAvaliar, setBancaAvaliar] = useState<Banca | null>(null);
  const [criarAberto, setCriarAberto] = useState(false);

  const podeAgendar = !!usuario?.cargo.pode_agendar_banca;

  async function recarregar() {
    if (!token || !usuario) return;
    setCarregando(true);
    setErro("");
    try {
      const [bancasResp, candidaturasResp, avaliarResp, usuarios, cargos, escopos, frentes, bancasFrentes, equipesProjeto, formularioAtivo] =
        await Promise.all([
          getBancas(token),
          getCandidaturas(token),
          getBancasParaAvaliar(usuario.id, token),
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
      setParaAvaliar(avaliarResp);
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

  function candidaturaDe(bancaId: number) {
    return candidaturas.find((c) => c.banca_id === bancaId && c.usuario_id === usuario.id);
  }

  const bancasDoProjeto = bancas
    .filter((b) => b.coordenador_id === usuario.id)
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  const jaAlocado = bancas.filter((b) => b.status === "aberta para inscrições" && candidaturaDe(b.id));
  const disponiveis = bancas.filter((b) => b.status === "aberta para inscrições" && !candidaturaDe(b.id));

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

      {podeAgendar && (
        <SecaoBancas
          titulo="Bancas do meu projeto"
          bancas={bancasDoProjeto}
          contexto={contexto}
          acao="nenhuma"
          onVerMais={setBancaDetalhe}
        />
      )}

      <SecaoBancas
        titulo="Bancas futuras já alocado"
        bancas={jaAlocado}
        contexto={contexto}
        acao="deslocar"
        onAcao={handleDesalocar}
        onVerMais={setBancaDetalhe}
      />
      <SecaoBancas
        titulo="Bancas futuras disponíveis"
        bancas={disponiveis}
        contexto={contexto}
        acao="alocar"
        onAcao={handleAlocar}
        onVerMais={setBancaDetalhe}
      />
      <SecaoBancas
        titulo="Bancas passadas — avaliar"
        bancas={paraAvaliar}
        contexto={contexto}
        acao="avaliar"
        onAcao={(id) => setBancaAvaliar(bancas.find((b) => b.id === id) ?? paraAvaliar.find((b) => b.id === id) ?? null)}
        onVerMais={setBancaDetalhe}
      />

      <VerMaisModal banca={bancaDetalhe} contexto={contexto} onClose={() => setBancaDetalhe(null)} />

      {criarAberto && token && (
        <CriarBancaModal
          contexto={contexto}
          token={token}
          onClose={() => setCriarAberto(false)}
          onCriada={() => {
            setCriarAberto(false);
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
}: {
  titulo: string;
  bancas: Banca[];
  contexto: Contexto;
  acao: "nenhuma" | "alocar" | "deslocar" | "avaliar";
  onAcao?: (bancaId: number) => void;
  onVerMais: (banca: Banca) => void;
}) {
  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>{titulo}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {bancas.length === 0 && <EmptyText>Nenhuma banca aqui.</EmptyText>}
        {bancas.length > 0 && (
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
        )}
      </PageCardContent>
    </PageCard>
  );
}

function CriarBancaModal({
  contexto,
  token,
  onClose,
  onCriada,
}: {
  contexto: Contexto;
  token: string;
  onClose: () => void;
  onCriada: () => void;
}) {
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [escopoId, setEscopoId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [consultorIds, setConsultorIds] = useState<number[]>([]);
  const [frenteIds, setFrenteIds] = useState<number[]>([]);
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
      const dataHora = new Date(`${data}T${hora}:00`);
      await createBanca(
        {
          nome_projeto: nomeProjeto.trim(),
          escopo_id: Number(escopoId),
          data_hora: dataHora.toISOString(),
          consultor_ids: consultorIds,
          frente_ids: frenteIds,
        },
        token,
      );
      onCriada();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar banca");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="criar-banca-titulo">
        <ModalHeader>
          <ModalTitle id="criar-banca-titulo">Criar banca</ModalTitle>
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
              {enviando ? "Criando..." : "Criar"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </WideModalContent>
    </ModalOverlay>
  );
}

function VerMaisModal({ banca, contexto, onClose }: { banca: Banca | null; contexto: Contexto; onClose: () => void }) {
  if (!banca) return null;

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
  const [respostas, setRespostas] = useState<Record<number, string>>({});
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
      for (const pergunta of formulario.perguntas) {
        const valor = respostas[pergunta.id];
        if (valor === undefined || valor === "") continue;
        await createAvaliacaoNota(
          {
            avaliacao_id: avaliacao.id,
            pergunta_id: pergunta.id,
            nota: pergunta.tipo_resposta === "nota" ? Number(valor) : undefined,
            resposta_texto: pergunta.tipo_resposta === "texto" ? valor : undefined,
          },
          token,
        );
      }
      await submeterAvaliacao(avaliacao.id, comentario || null, token);
      onEnviada();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar avaliação");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <NarrowModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="avaliar-titulo">
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
              {formulario.perguntas
                .slice()
                .sort((a, b) => a.ordem - b.ordem)
                .map((pergunta) => (
                  <FieldGroup key={pergunta.id}>
                    <FieldLabel htmlFor={`pergunta-${pergunta.id}`}>{pergunta.texto}</FieldLabel>
                    {pergunta.tipo_resposta === "nota" ? (
                      <FieldInput
                        id={`pergunta-${pergunta.id}`}
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={respostas[pergunta.id] ?? ""}
                        onChange={(e) => setRespostas((r) => ({ ...r, [pergunta.id]: e.target.value }))}
                        required
                      />
                    ) : (
                      <FieldTextarea
                        id={`pergunta-${pergunta.id}`}
                        value={respostas[pergunta.id] ?? ""}
                        onChange={(e) => setRespostas((r) => ({ ...r, [pergunta.id]: e.target.value }))}
                        required
                      />
                    )}
                  </FieldGroup>
                ))}
              <FieldGroup>
                <FieldLabel htmlFor="comentario">Comentário (opcional)</FieldLabel>
                <FieldTextarea id="comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} />
              </FieldGroup>
              {erro && <FormErrorText>{erro}</FormErrorText>}
            </ModalBody>
            <ModalFooter>
              <PageButton type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar avaliação"}
              </PageButton>
            </ModalFooter>
          </FormStack>
        )}
      </NarrowModalContent>
    </ModalOverlay>
  );
}
