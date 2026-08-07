import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RealizarBancaModal } from "./RealizarBancaModal";
import { AlocarPessoasModal } from "./AlocarPessoasModal";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  alocar,
  deleteBanca,
  aceitaInscricao,
  desalocar,
  getBancas,
  getBancasFrentes,
  getCandidaturas,
  getBancasParaAvaliar,
  getEquipesProjeto,
  getEscopos,
  getEscoposVendidos,
  getFrentes,
  podeGerenciarBanca,
  realizarBanca,
  registrarDescricaoCoordenador,
  ROTULO_STATUS_BANCA,
  syncBancaFrentes,
  syncEquipeProjeto,
  toDateInputValue,
  toTimeInputValue,
  tomDoStatusBanca,
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
import { NotaEscala, NotaEscalaGrupo } from "@/components/NotaEscala";
import { AlertModal } from "@/components/AlertModal";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { DescricaoQuote } from "@/styles/shared.styled";
import {
  cancelarSolicitacaoTroca,
  confirmarSolicitacaoTroca,
  createSolicitacaoTroca,
  getSolicitacoesTroca,
} from "@/lib/solicitacoes-troca";
import { getProjetos, getEscoposProjeto, marcarBancaDoEscopo } from "@/lib/projetos";
import type { EscopoVendido, ProjetoResumo } from "@/types/projeto";
import type {
  Banca,
  BancaFrente,
  Candidatura,
  EquipeProjeto,
  Escopo,
  EscopoVendidoResumo,
  Frente,
  FormularioAtivo,
} from "@/types/banca";
import type { SolicitacaoTroca } from "@/types/notificacao";
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
  PageBadge,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  DescricaoSecao,
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
  ListScrollWrap,
  LIST_MAX_VISIVEIS,
  SectionGroup,
  TabBar,
  TabButton,
  TabCount,
  BuscaLista,
  BuscaItem,
  BuscaTexto,
  BuscaNome,
  BuscaMeta,
  EscolhidoBox,
  EscopoIndisponivel,
  BancaLinha,
  BancaCard,
  BancaCardScrollWrap,
  BancaCardFooter,
  BancaAcoesSecundarias,
  BancaData,
  BancaDataDiaSemana,
  BancaDataDia,
  BancaInfo,
  BancaNomeLinha,
  BancaNome,
  BancaMeta,
  BancaAcoes,
} from "./Bancas.styled";

type AbaBancas = "meus" | "alocacao" | "avaliacao";

function porDataMaisProxima(a: Banca, b: Banca): number {
  return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
}

interface Contexto {
  usuarios: UsuarioResumo[];
  cargos: Cargo[];
  escopos: Escopo[];
  escoposVendidos: EscopoVendidoResumo[];
  frentes: Frente[];
  bancasFrentes: BancaFrente[];
  equipesProjeto: EquipeProjeto[];
  candidaturas: Candidatura[];
  solicitacoesTroca: SolicitacaoTroca[];
  /** banca_id → prazo de avaliação — separado de `Banca` porque
   *  `paraAvaliar` funde `BancaParaAvaliar` com a `Banca` cheia e descarta os
   *  campos extras (ver `recarregar`). */
  prazosAvaliacao: Record<number, { prazoAvaliacao: string; prazoExpirado: boolean }>;
}

export function Bancas() {
  /* Chegada pelo card "bancas nos próximos 7 dias" do monitoramento
     (/bancas?banca=123): a lista aqui é longa, então rola até a banca e a
     destaca. Sem isso o clique de lá só abriria a página e a pessoa teria de
     procurar de novo a banca em que acabou de clicar. */
  const [searchParams] = useSearchParams();
  const bancaDestacada = Number(searchParams.get("banca")) || null;
  const refDestacada = useRef<HTMLDivElement>(null);

  const { usuario, token } = useAuth();
  const [bancas, setBancas] = useState<Banca[]>([]);

  // Depois que as bancas chegam, e não na montagem: no primeiro render a lista
  // ainda está vazia e não existe elemento para rolar até.
  useEffect(() => {
    refDestacada.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [bancaDestacada, bancas]);
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
  const [bancaRealizar, setBancaRealizar] = useState<Banca | null>(null);
  const [bancaAlocar, setBancaAlocar] = useState<Banca | null>(null);
  const [aba, setAba] = useState<AbaBancas>("alocacao");
  const [avisoErro, setAvisoErro] = useState("");
  const [bancaParaExcluir, setBancaParaExcluir] = useState<Banca | null>(null);
  const [bancaConvidar, setBancaConvidar] = useState<Banca | null>(null);

  const podeAgendar = !!usuario?.cargo.pode_definir_cronograma;
  const ehDiretor = usuario?.posicao === "diretor";

  async function recarregar() {
    if (!token || !usuario) return;
    setCarregando(true);
    setErro("");
    try {
      const [bancasResp, candidaturasResp, avaliarResp, avaliacoesResp, usuarios, cargos, escopos, escoposVendidos, frentes, bancasFrentes, equipesProjeto, formularioAtivo, solicitacoesTroca] =
        await Promise.all([
          getBancas(token),
          getCandidaturas(token),
          getBancasParaAvaliar(usuario.id, token),
          getAvaliacoes(token),
          getUsuarios(token),
          getCargos(token),
          getEscopos(token),
          getEscoposVendidos(token),
          getFrentes(token),
          getBancasFrentes(token),
          getEquipesProjeto(token),
          getFormularioAtivo(token).catch(() => null),
          getSolicitacoesTroca(token),
        ]);
      setBancas(bancasResp);
      setCandidaturas(candidaturasResp);
      setParaAvaliar(
        avaliarResp
          .map((item) => bancasResp.find((b) => b.id === item.banca_id))
          .filter((b): b is Banca => b != null)
          .sort(porDataMaisProxima),
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
      setContexto({
        usuarios,
        cargos,
        escopos,
        escoposVendidos,
        frentes,
        bancasFrentes,
        equipesProjeto,
        candidaturas: candidaturasResp,
        solicitacoesTroca,
        prazosAvaliacao: Object.fromEntries(
          avaliarResp.map((item) => [
            item.banca_id,
            { prazoAvaliacao: item.prazo_avaliacao, prazoExpirado: item.prazo_expirado },
          ]),
        ),
      });
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
  const contextoAtual = contexto;

  function candidaturaDe(bancaId: number) {
    return candidaturas.find((c) => c.banca_id === bancaId && c.usuario_id === usuarioLogado.id);
  }

  // Coordenador ou membro da equipe daquela banca — o próprio grupo, que não
  // pode se candidatar a assistir/avaliar a própria banca.
  function ehDoProprioGrupo(banca: Banca): boolean {
    // `equipe_ids` já vem do backend somando coordenador + equipe do projeto
    // (`projeto_membro`) + a tabela legada. O `equipesProjeto` fica como
    // segunda checagem só para bancas antigas servidas por um backend anterior
    // ao campo — some quando todas tiverem passado por aqui.
    return (
      banca.equipe_ids?.includes(usuarioLogado.id) ||
      banca.coordenador_id === usuarioLogado.id ||
      contextoAtual.equipesProjeto.some((e) => e.banca_id === banca.id && e.usuario_id === usuarioLogado.id)
    );
  }

  const bancasDoProjeto = bancas.filter(ehDoProprioGrupo).sort(porDataMaisProxima);

  const mostrarMeusProjetos = podeAgendar || bancasDoProjeto.length > 0;

  // ⚠ `aceitaInscricao` no lugar da comparação com a string antiga: uma banca
  // `atrasada` continua nestes baldes. Trocar só o literal a faria sumir da
  // tela inteira.
  const jaAlocado = bancas
    .filter((b) => aceitaInscricao(b.status) && candidaturaDe(b.id))
    .sort(porDataMaisProxima);
  const lotadas = bancas
    .filter(
      (b) => aceitaInscricao(b.status) && !candidaturaDe(b.id) && b.alocados >= b.vagas && !ehDoProprioGrupo(b),
    )
    .sort(porDataMaisProxima);
  const disponiveisParaAlocacao = bancas
    .filter(
      (b) => aceitaInscricao(b.status) && !candidaturaDe(b.id) && b.alocados < b.vagas && !ehDoProprioGrupo(b),
    )
    .sort(porDataMaisProxima);

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

  async function handlePedirTroca(bancaId: number) {
    const candidatura = candidaturaDe(bancaId);
    if (!token || !candidatura) return;
    try {
      await createSolicitacaoTroca(candidatura.id, token);
      recarregar();
    } catch (err) {
      setAvisoErro(err instanceof Error ? err.message : "Erro ao pedir troca");
    }
  }

  async function handleConvidarTroca(bancaId: number, usuarioConvidadoId: number) {
    const candidatura = candidaturaDe(bancaId);
    if (!token || !candidatura) return;
    try {
      await createSolicitacaoTroca(candidatura.id, token, usuarioConvidadoId);
      setBancaConvidar(null);
      recarregar();
    } catch (err) {
      setAvisoErro(err instanceof Error ? err.message : "Erro ao convidar para a troca");
    }
  }

  async function handleConfirmarTroca(solicitacaoId: number) {
    if (!token) return;
    try {
      await confirmarSolicitacaoTroca(solicitacaoId, token);
      recarregar();
    } catch (err) {
      setAvisoErro(err instanceof Error ? err.message : "Erro ao confirmar troca");
    }
  }

  async function handleCancelarTroca(solicitacaoId: number) {
    if (!token) return;
    try {
      await cancelarSolicitacaoTroca(solicitacaoId, token);
      recarregar();
    } catch (err) {
      setAvisoErro(err instanceof Error ? err.message : "Erro ao cancelar troca");
    }
  }

  function handleExcluir(banca: Banca) {
    if (!token || !podeGerenciarBanca(banca, usuarioLogado.id)) return;
    setBancaParaExcluir(banca);
  }

  async function confirmarExclusaoBanca() {
    if (!token || !bancaParaExcluir) return;
    await deleteBanca(bancaParaExcluir.id, token);
    setBancaParaExcluir(null);
    setBancaDetalhe(null);
    setBancaEditar(null);
    recarregar();
  }

  async function handleRealizar(dados: {
    realizado_em: string;
    presentes: number[];
    forcar: boolean;
  }) {
    if (!token || !bancaRealizar) return;
    // O erro sobe para o modal mostrar; ele só fecha se deu certo.
    await realizarBanca(bancaRealizar.id, dados, token);
    setBancaRealizar(null);
    await recarregar();
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
          {ehDiretor && (
            <PageSubheading>
              Bancas dos próximos 7 dias que ainda estiverem sem gente são preenchidas
              automaticamente todo dia às 6h, por rodízio e priorizando a mesma frente. Use
              “Alocar pessoas” num card para escalar alguém antes disso.
            </PageSubheading>
          )}
        </PageHeaderText>
        {podeAgendar && (
          <PageButton type="button" onClick={() => setCriarAberto(true)}>
            <Plus size={16} />
            Criar banca
          </PageButton>
        )}
      </PageHeaderRow>

      <TabBar>
        {mostrarMeusProjetos && (
          <TabButton type="button" $ativa={aba === "meus"} onClick={() => setAba("meus")}>
            Meus projetos
            <TabCount>{bancasDoProjeto.length}</TabCount>
          </TabButton>
        )}
        <TabButton type="button" $ativa={aba === "alocacao"} onClick={() => setAba("alocacao")}>
          Alocação
          <TabCount>{jaAlocado.length + disponiveisParaAlocacao.length + lotadas.length}</TabCount>
        </TabButton>
        <TabButton type="button" $ativa={aba === "avaliacao"} onClick={() => setAba("avaliacao")}>
          Avaliação
          <TabCount>{paraAvaliar.length + jaAvaliadas.length}</TabCount>
        </TabButton>
      </TabBar>

      {aba === "meus" && mostrarMeusProjetos && (
        <SecaoBancas
          bancaDestacada={bancaDestacada}
          refDestacada={refDestacada}
          titulo="Bancas dos meus projetos"
          bancas={bancasDoProjeto}
          contexto={contexto}
          acao="nenhuma"
          usuarioId={usuario.id}
          gerenciar={podeAgendar}
          onVerMais={setBancaDetalhe}
          onEditar={setBancaEditar}
          onExcluir={handleExcluir}
          onRealizar={setBancaRealizar}
          onAlocarPessoas={setBancaAlocar}
          ehDiretorLista={ehDiretor}
        />
      )}

      {aba === "alocacao" && (
        <SectionGroup>
          <SecaoBancas
          bancaDestacada={bancaDestacada}
          refDestacada={refDestacada}
            titulo="Já alocado"
            bancas={jaAlocado}
            contexto={contexto}
            acao="deslocar"
            usuarioId={usuario.id}
            gerenciar={podeAgendar}
            onRealizar={setBancaRealizar}
            onAlocarPessoas={setBancaAlocar}
            ehDiretorLista={ehDiretor}
            onAcao={handleDesalocar}
            onPedirTroca={handlePedirTroca}
            onConvidar={setBancaConvidar}
            onCancelarTroca={handleCancelarTroca}
            onVerMais={setBancaDetalhe}
          />
          <SecaoBancas
          bancaDestacada={bancaDestacada}
          refDestacada={refDestacada}
            titulo="Disponíveis para alocação"
            bancas={disponiveisParaAlocacao}
            contexto={contexto}
            acao="alocar"
            usuarioId={usuario.id}
            gerenciar={podeAgendar}
            onAcao={handleAlocar}
            onRealizar={setBancaRealizar}
            onAlocarPessoas={setBancaAlocar}
            ehDiretorLista={ehDiretor}
            onVerMais={setBancaDetalhe}
          />
          <SecaoBancas
          bancaDestacada={bancaDestacada}
          refDestacada={refDestacada}
            titulo="Com alocação máxima"
            bancas={lotadas}
            contexto={contexto}
            acao="nenhuma"
            usuarioId={usuario.id}
            gerenciar={podeAgendar}
            onRealizar={setBancaRealizar}
            onAlocarPessoas={setBancaAlocar}
            ehDiretorLista={ehDiretor}
            onVerMais={setBancaDetalhe}
          />
          <SecaoTrocas
            solicitacoes={contexto.solicitacoesTroca}
            bancas={bancas}
            usuarioId={usuario.id}
            onConfirmar={handleConfirmarTroca}
            onCancelar={handleCancelarTroca}
          />
        </SectionGroup>
      )}

      {aba === "avaliacao" && (
        <SectionGroup>
          <SecaoBancas
          bancaDestacada={bancaDestacada}
          refDestacada={refDestacada}
            titulo="Com avaliação pendente"
            bancas={paraAvaliar}
            contexto={contexto}
            acao="avaliar"
            gerenciar={podeAgendar}
            onRealizar={setBancaRealizar}
            onAlocarPessoas={setBancaAlocar}
            ehDiretorLista={ehDiretor}
            onAcao={(id) => setBancaAvaliar(paraAvaliar.find((b) => b.id === id) ?? null)}
            onVerMais={setBancaDetalhe}
          />
          <SecaoBancas
          bancaDestacada={bancaDestacada}
          refDestacada={refDestacada}
            titulo="Avaliadas"
            bancas={jaAvaliadas}
            contexto={contexto}
            acao="nenhuma"
            usuarioId={usuario.id}
            gerenciar={podeAgendar}
            onVerMais={setBancaDetalhe}
          />
        </SectionGroup>
      )}

      <VerMaisModal
        banca={bancaDetalhe}
        contexto={contexto}
        usuarioId={usuario.id}
        token={token}
        onClose={() => setBancaDetalhe(null)}
        onEditar={setBancaEditar}
        onExcluir={handleExcluir}
        onDescricaoEnviada={recarregar}
      />

      {bancaConvidar && contexto && (
        <ConvidarTrocaModal
          banca={bancaConvidar}
          contexto={contexto}
          usuarioId={usuario.id}
          onConvidar={(usuarioConvidadoId) => handleConvidarTroca(bancaConvidar.id, usuarioConvidadoId)}
          onClose={() => setBancaConvidar(null)}
        />
      )}

      {bancaRealizar && usuario && (
        <RealizarBancaModal
          banca={bancaRealizar}
          candidaturas={candidaturas.filter((c) => c.banca_id === bancaRealizar.id)}
          usuarios={contexto?.usuarios ?? []}
          ehDiretor={!!ehDiretor}
          onCancelar={() => setBancaRealizar(null)}
          onConfirmar={handleRealizar}
        />
      )}

      {bancaAlocar && token && contexto && (
        <AlocarPessoasModal
          banca={bancaAlocar}
          usuarios={contexto.usuarios}
          candidaturas={candidaturas}
          equipes={contexto.equipesProjeto}
          token={token}
          onFechar={() => setBancaAlocar(null)}
          onAlocou={recarregar}
        />
      )}

      {criarAberto && token && (
        <BancaFormModal
          contexto={contexto}
          token={token}
          ehDiretor={usuario.posicao === "diretor"}
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
          ehDiretor={usuario.posicao === "diretor"}
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
          escopos={contexto.escopos}
          token={token}
          onClose={() => setBancaAvaliar(null)}
          onEnviada={() => {
            setBancaAvaliar(null);
            recarregar();
          }}
        />
      )}

      {bancaParaExcluir && (
        <ConfirmarModal
          titulo="Excluir banca"
          mensagem={`Excluir a banca "${bancaParaExcluir.nome_projeto}"? Esta ação não pode ser desfeita.`}
          onCancelar={() => setBancaParaExcluir(null)}
          onConfirmar={confirmarExclusaoBanca}
        />
      )}

      {avisoErro && <AlertModal mensagem={avisoErro} onFechar={() => setAvisoErro("")} />}
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
  onRealizar,
  onAlocarPessoas,
  ehDiretorLista,
  onPedirTroca,
  onConvidar,
  onCancelarTroca,
  bancaDestacada,
  refDestacada,
}: {
  titulo: string;
  bancas: Banca[];
  contexto: Contexto;
  /* Vem de /bancas?banca=123, o link do card do monitoramento. */
  bancaDestacada?: number | null;
  refDestacada?: React.Ref<HTMLDivElement>;
  acao: "nenhuma" | "alocar" | "deslocar" | "avaliar";
  onAcao?: (bancaId: number) => void;
  onVerMais: (banca: Banca) => void;
  usuarioId?: number;
  gerenciar?: boolean;
  onEditar?: (banca: Banca) => void;
  onExcluir?: (banca: Banca) => void;
  /** Abre o registro de realização — só faz sentido em banca já com data. */
  onRealizar?: (banca: Banca) => void;
  /** Abre a alocação manual — só faz sentido enquanto a banca não aconteceu. */
  onAlocarPessoas?: (banca: Banca) => void;
  /** Alocar OUTRA pessoa é ação de diretoria (§8), diferente de gerenciar. */
  ehDiretorLista?: boolean;
  onPedirTroca?: (bancaId: number) => void;
  /** Abre o picker de convite específico — alternativa ao pedido aberto. */
  onConvidar?: (banca: Banca) => void;
  onCancelarTroca?: (solicitacaoId: number) => void;
}) {
  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>{titulo}</PageCardTitle>
        <PageBadge $tone="muted">{bancas.length}</PageBadge>
      </PageCardHeader>
      <PageCardContent>
        {bancas.length === 0 && <EmptyText>Nenhuma banca aqui.</EmptyText>}
        {bancas.length > 0 && (
          <BancaCardScrollWrap $scrollable={bancas.length > LIST_MAX_VISIVEIS}>
            {bancas.map((banca) => {
              const dataHora = new Date(banca.data_hora);
              const diaSemana = dataHora.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
              const hora = dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              const lotada = acao === "alocar" && banca.alocados >= banca.vagas;
              const podeGerenciar = gerenciar && usuarioId != null && podeGerenciarBanca(banca, usuarioId);
              // Banca legada (sem escopo vendido vinculado) mostra o escopo do
              // catálogo, singular, como sempre foi. Banca costurada a
              // escopo(s) do projeto mostra todos os que ela cobre — uma
              // banca pode juntar mais de um (§8), e o campo antigo só
              // guardava o primeiro.
              const nomesEscopos =
                banca.projeto_escopo_ids.length > 0
                  ? banca.projeto_escopo_ids
                      .map((id) => contexto.escoposVendidos.find((e) => e.id === id)?.nome)
                      .filter((nome): nome is string => !!nome)
                  : [nomeEscopo(contexto.escopos, banca.escopo_id)];
              const minhaCandidatura =
                acao === "deslocar" && usuarioId != null
                  ? contexto.candidaturas.find((c) => c.banca_id === banca.id && c.usuario_id === usuarioId)
                  : undefined;
              const minhaSolicitacaoPendente = minhaCandidatura
                ? contexto.solicitacoesTroca.find(
                    (s) => s.candidatura_id === minhaCandidatura.id && s.status === "pendente",
                  )
                : undefined;
              const prazo = acao === "avaliar" ? contexto.prazosAvaliacao[banca.id] : undefined;
              const prazoExpirado = !!prazo?.prazoExpirado;

              // Qualquer clique dentro do rodapé de ações não deve também
              // disparar o clique do card inteiro (que abre "Ver mais").
              function pararPropagacao<T extends unknown[]>(fn?: (...args: T) => void) {
                return (e: React.MouseEvent, ...args: T) => {
                  e.stopPropagation();
                  fn?.(...args);
                };
              }

              return (
                <BancaCard
                  key={banca.id}
                  $destacada={banca.id === bancaDestacada}
                  ref={banca.id === bancaDestacada ? refDestacada : undefined}
                  role="button"
                  tabIndex={0}
                  onClick={() => onVerMais(banca)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onVerMais(banca);
                  }}
                >
                  <BancaData>
                    <BancaDataDiaSemana>{diaSemana}</BancaDataDiaSemana>
                    <BancaDataDia>{dataHora.getDate()}</BancaDataDia>
                  </BancaData>

                  <BancaInfo>
                    <BancaNomeLinha>
                      <BancaNome>{banca.nome_projeto}</BancaNome>
                      {nomesEscopos.map((nome, i) => (
                        <PageBadge key={`${nome}-${i}`} $tone="muted">
                          {nome}
                        </PageBadge>
                      ))}
                      {acao === "avaliar" && (
                        <PageBadge $tone={prazoExpirado ? "danger" : "warning"}>
                          {prazoExpirado
                            ? "Prazo esgotado"
                            : prazo
                              ? `Prazo: ${new Date(prazo.prazoAvaliacao).toLocaleDateString("pt-BR")}`
                              : "Pendente"}
                        </PageBadge>
                      )}
                      {acao === "deslocar" && <PageBadge $tone="default">Inscrito</PageBadge>}
                      {acao === "alocar" &&
                        (lotada ? (
                          <PageBadge $tone="danger">Lotada</PageBadge>
                        ) : (
                          <PageBadge $tone="success">{banca.vagas - banca.alocados} vaga(s)</PageBadge>
                        ))}
                      {acao === "nenhuma" && (
                        <PageBadge $tone={tomDoStatusBanca(banca.status)}>
                          {ROTULO_STATUS_BANCA[banca.status]}
                        </PageBadge>
                      )}
                    </BancaNomeLinha>
                    <BancaMeta>
                      {hora} · {nomeUsuario(contexto.usuarios, banca.coordenador_id)} ·{" "}
                      {banca.alocados}/{banca.vagas} alocados
                    </BancaMeta>
                  </BancaInfo>

                  <BancaCardFooter>
                    <BancaAcoesSecundarias>
                      {podeGerenciar && onEditar && (
                        <PageButtonSm $variant="outline" type="button" onClick={pararPropagacao(() => onEditar(banca))}>
                          Editar
                        </PageButtonSm>
                      )}
                      {podeGerenciar && onExcluir && (
                        <PageButtonSm $variant="outline" type="button" onClick={pararPropagacao(() => onExcluir(banca))}>
                          Excluir
                        </PageButtonSm>
                      )}

                      {/* Escalar à mão: a diretoria não precisa esperar a
                          janela de uma semana do push para preencher uma
                          banca vazia. */}
                      {ehDiretorLista && onAlocarPessoas && !banca.realizado_em && (
                        <PageButtonSm
                          $variant="outline"
                          type="button"
                          onClick={pararPropagacao(() => onAlocarPessoas(banca))}
                        >
                          Alocar pessoas
                        </PageButtonSm>
                      )}

                      {/* Ainda não aconteceu: o passo que tira a banca de
                          "atrasada" e alimenta o cálculo do §7.4.
                          ⚠ Trava por CARGO (`gerenciar`), não por ser o
                          coordenador daquela banca: o backend usa
                          `require_pode_definir_cronograma`, e usar
                          `podeGerenciarBanca` aqui escondia o botão da
                          própria diretoria — que é justamente quem precisa
                          dele. */}
                      {gerenciar && onRealizar && !banca.realizado_em && banca.data_hora && (
                        <PageButtonSm $variant="outline" type="button" onClick={pararPropagacao(() => onRealizar(banca))}>
                          Registrar realização
                        </PageButtonSm>
                      )}
                      {acao === "deslocar" && minhaCandidatura && (
                        <>
                          {minhaSolicitacaoPendente && onCancelarTroca ? (
                            <PageButtonSm
                              $variant="outline"
                              type="button"
                              onClick={pararPropagacao(() => onCancelarTroca(minhaSolicitacaoPendente.id))}
                            >
                              Cancelar troca
                            </PageButtonSm>
                          ) : (
                            <>
                              {onPedirTroca && (
                                <PageButtonSm
                                  $variant="outline"
                                  type="button"
                                  onClick={pararPropagacao(() => onPedirTroca(banca.id))}
                                >
                                  Pedir troca
                                </PageButtonSm>
                              )}
                              {onConvidar && (
                                <PageButtonSm $variant="outline" type="button" onClick={pararPropagacao(() => onConvidar(banca))}>
                                  Convidar alguém
                                </PageButtonSm>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </BancaAcoesSecundarias>

                    {acao !== "nenhuma" && onAcao && (
                      <PageButtonSm
                        $variant={acao === "deslocar" ? "outline" : "primary"}
                        type="button"
                        disabled={lotada || prazoExpirado}
                        onClick={pararPropagacao(() => onAcao(banca.id))}
                      >
                        {lotada
                          ? "Lotada"
                          : prazoExpirado
                            ? "Prazo esgotado"
                            : acao === "alocar"
                              ? "Alocar-se"
                              : acao === "deslocar"
                                ? "Deslocar-se"
                                : "Avaliar"}
                      </PageButtonSm>
                    )}
                  </BancaCardFooter>
                </BancaCard>
              );
            })}
          </BancaCardScrollWrap>
        )}
      </PageCardContent>
    </PageCard>
  );
}

/** Pedidos abertos de troca de candidatura (§8): qualquer consultor elegível
 *  pode confirmar; quem pediu vê os próprios pedidos aqui também, com opção
 *  de cancelar (o mesmo botão também aparece em "Já alocado", junto da
 *  banca — os dois lugares fazem a mesma coisa, de propósito). */
function SecaoTrocas({
  solicitacoes,
  bancas,
  usuarioId,
  onConfirmar,
  onCancelar,
}: {
  solicitacoes: SolicitacaoTroca[];
  bancas: Banca[];
  usuarioId: number;
  onConfirmar: (solicitacaoId: number) => void;
  onCancelar: (solicitacaoId: number) => void;
}) {
  const pendentes = solicitacoes.filter((s) => s.status === "pendente");
  // Convite pra outra pessoa não aparece pra mais ninguém: só quem pediu
  // ("Meu pedido") e quem foi convidado ("Convite pra você") — o resto do
  // pool nem sabe que existe (o backend também recusaria a confirmação).
  const disponiveis = pendentes.filter(
    (s) =>
      s.usuario_original_id !== usuarioId &&
      (s.usuario_convidado_id === null || s.usuario_convidado_id === usuarioId),
  );
  const minhas = pendentes.filter((s) => s.usuario_original_id === usuarioId);
  const total = disponiveis.length + minhas.length;

  function linha(solicitacao: SolicitacaoTroca, propria: boolean) {
    const banca = bancas.find((b) => b.id === solicitacao.banca_id);
    const dataHora = banca ? new Date(banca.data_hora) : null;
    const convitePraMim = !propria && solicitacao.usuario_convidado_id === usuarioId;
    return (
      <BancaLinha key={solicitacao.id}>
        <BancaData>
          {dataHora && (
            <>
              <BancaDataDiaSemana>
                {dataHora.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
              </BancaDataDiaSemana>
              <BancaDataDia>{dataHora.getDate()}</BancaDataDia>
            </>
          )}
        </BancaData>
        <BancaInfo>
          <BancaNomeLinha>
            <BancaNome>{banca?.nome_projeto ?? `Banca ${solicitacao.banca_id}`}</BancaNome>
            <PageBadge $tone={propria ? "default" : convitePraMim ? "success" : "warning"}>
              {propria ? "Meu pedido" : convitePraMim ? "Convite pra você" : "Troca aberta"}
            </PageBadge>
          </BancaNomeLinha>
          {dataHora && (
            <BancaMeta>
              {dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </BancaMeta>
          )}
        </BancaInfo>
        <BancaAcoes>
          {propria ? (
            <PageButtonSm $variant="outline" type="button" onClick={() => onCancelar(solicitacao.id)}>
              Cancelar
            </PageButtonSm>
          ) : (
            <PageButtonSm type="button" onClick={() => onConfirmar(solicitacao.id)}>
              Confirmar
            </PageButtonSm>
          )}
        </BancaAcoes>
      </BancaLinha>
    );
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Trocas disponíveis</PageCardTitle>
        <PageBadge $tone="muted">{total}</PageBadge>
      </PageCardHeader>
      <PageCardContent>
        {total === 0 && <EmptyText>Nenhuma solicitação de troca no momento.</EmptyText>}
        {total > 0 && (
          <ListScrollWrap $scrollable={total > LIST_MAX_VISIVEIS}>
            {disponiveis.map((s) => linha(s, false))}
            {minhas.map((s) => linha(s, true))}
          </ListScrollWrap>
        )}
      </PageCardContent>
    </PageCard>
  );
}

function BancaFormModal({
  banca,
  contexto,
  token,
  ehDiretor,
  onClose,
  onSalvo,
}: {
  banca?: Banca | null;
  contexto: Contexto;
  token: string;
  ehDiretor: boolean;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const editando = !!banca;

  const [nomeProjeto, setNomeProjeto] = useState(banca?.nome_projeto ?? "");

  // Criar banca parte de um projeto que já existe: nada de digitar o nome.
  // O endpoint `marcarBancaDoEscopo` deriva nome, coordenador e frentes do
  // próprio projeto — os mesmos dados que a tela de cronograma usa.
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [projetoId, setProjetoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [escoposCarregados, setEscoposCarregados] = useState<{
    projetoId: number;
    lista: EscopoVendido[];
  } | null>(null);
  const [escoposMarcados, setEscoposMarcados] = useState<number[]>([]);
  const [escopoId, setEscopoId] = useState(banca ? String(banca.escopo_id) : "");
  const [data, setData] = useState(banca ? toDateInputValue(banca.data_hora) : "");
  const [hora, setHora] = useState(banca ? toTimeInputValue(banca.data_hora) : "");
  const [consultorIds, setConsultorIds] = useState<number[]>(() =>
    banca ? contexto.equipesProjeto.filter((e) => e.banca_id === banca.id).map((e) => e.usuario_id) : [],
  );
  const [frenteIds, setFrenteIds] = useState<number[]>(() =>
    banca ? contexto.bancasFrentes.filter((bf) => bf.banca_id === banca.id).map((bf) => bf.frente_id) : [],
  );
  const [pisoOverride, setPisoOverride] = useState(
    banca?.piso_minimo_override != null ? String(banca.piso_minimo_override) : "",
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const consultores = consultoresDoNucleo(contexto.usuarios, contexto.cargos);

  useEffect(() => {
    if (editando) return;
    let ativo = true;
    getProjetos(token)
      .then((lista) => {
        if (ativo) setProjetos(lista.filter((p) => !p.arquivado_em));
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [editando, token]);

  useEffect(() => {
    if (projetoId == null) return;
    let ativo = true;
    getEscoposProjeto(projetoId, token)
      .then((lista) => {
        if (ativo) setEscoposCarregados({ projetoId, lista });
      })
      .catch(() => {
        if (ativo) setEscoposCarregados({ projetoId, lista: [] });
      });
    return () => {
      ativo = false;
    };
  }, [projetoId, token]);

  // Derivados em vez de estado espelhado: a lista só vale para o projeto que
  // a trouxe, então trocar de projeto já a invalida sozinho.
  const escoposDoProjeto =
    escoposCarregados?.projetoId === projetoId ? escoposCarregados.lista : [];
  const carregandoEscopos = projetoId != null && escoposCarregados?.projetoId !== projetoId;

  const projetoEscolhido = projetos.find((p) => p.id === projetoId) ?? null;

  const projetosFiltrados = busca.trim()
    ? projetos.filter((p) =>
        `${p.nome} ${p.cliente}`.toLowerCase().includes(busca.trim().toLowerCase()),
      )
    : projetos;

  /** Escopo que já tem banca não pode ser puxado para outra: o backend recusa
   *  (seria apagar em silêncio a data já marcada). */
  const escoposLivres = escoposDoProjeto.filter((e) => !e.banca);

  const frentesDosEscoposMarcados = [
    ...new Set(
      escoposDoProjeto
        .filter((e) => escoposMarcados.includes(e.id))
        .map((e) => contexto.frentes.find((f) => f.id === e.frente_id)?.nome)
        .filter((nome): nome is string => !!nome),
    ),
  ];

  function toggleId(lista: number[], id: number): number[] {
    return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !hora) return;
    if (editando ? !escopoId : escoposMarcados.length === 0) return;
    setEnviando(true);
    setErro("");
    try {
      const dataHora = new Date(`${data}T${hora}:00`).toISOString();
      const pisoMinimoOverride = ehDiretor
        ? pisoOverride.trim() === ""
          ? null
          : Number(pisoOverride)
        : undefined;
      if (editando && banca) {
        await updateBanca(
          banca.id,
          {
            nome_projeto: nomeProjeto.trim(),
            escopo_id: Number(escopoId),
            data_hora: dataHora,
            ...(pisoMinimoOverride !== undefined ? { piso_minimo_override: pisoMinimoOverride } : {}),
          },
          token,
        );
        await syncEquipeProjeto(banca.id, consultorIds, contexto.equipesProjeto, token);
        await syncBancaFrentes(banca.id, frenteIds, contexto.bancasFrentes, token);
      } else {
        // Uma banca pode cobrir vários escopos do mesmo projeto (§8). O
        // primeiro vai na URL, a lista completa no corpo — o backend deriva
        // dali o nome do projeto, o coordenador e as frentes.
        const criada = await marcarBancaDoEscopo(
          escoposMarcados[0],
          dataHora,
          token,
          undefined,
          escoposMarcados,
        );
        if (consultorIds.length > 0) {
          await syncEquipeProjeto(criada.id, consultorIds, contexto.equipesProjeto, token);
        }
        if (pisoMinimoOverride != null) {
          await updateBanca(criada.id, { piso_minimo_override: pisoMinimoOverride }, token);
        }
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
            {editando ? (
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
            ) : (
              <FieldGroup>
                <FieldLabel htmlFor="busca-projeto">Projeto</FieldLabel>
                {projetoEscolhido ? (
                  <EscolhidoBox>
                    <BuscaTexto>
                      <BuscaNome>{projetoEscolhido.nome}</BuscaNome>
                      <BuscaMeta>{projetoEscolhido.cliente}</BuscaMeta>
                    </BuscaTexto>
                    <PageButtonSm
                      $variant="outline"
                      type="button"
                      onClick={() => {
                        setProjetoId(null);
                        setEscoposMarcados([]);
                        setBusca("");
                      }}
                    >
                      Trocar
                    </PageButtonSm>
                  </EscolhidoBox>
                ) : (
                  <>
                    <FieldInput
                      id="busca-projeto"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Busque pelo nome do projeto ou do cliente"
                      autoComplete="off"
                    />
                    {projetos.length === 0 ? (
                      <EmptyText>Nenhum projeto ativo para marcar banca.</EmptyText>
                    ) : projetosFiltrados.length === 0 ? (
                      <EmptyText>Nenhum projeto encontrado para "{busca}".</EmptyText>
                    ) : (
                      <BuscaLista>
                        {projetosFiltrados.map((projeto) => (
                          <BuscaItem
                            key={projeto.id}
                            type="button"
                            onClick={() => {
                              setProjetoId(projeto.id);
                              setEscoposMarcados([]);
                              // A equipe do projeto é quem apresenta, e por
                              // isso não assiste à própria banca (§8) — já
                              // vem marcada para não montar à mão.
                              setConsultorIds(projeto.consultor_ids);
                            }}
                          >
                            <BuscaNome>{projeto.nome}</BuscaNome>
                            <BuscaMeta>{projeto.cliente}</BuscaMeta>
                          </BuscaItem>
                        ))}
                      </BuscaLista>
                    )}
                  </>
                )}
              </FieldGroup>
            )}

            {!editando && projetoEscolhido && (
              <FieldGroup>
                <FieldLabel as="span">Escopos que esta banca cobre</FieldLabel>
                {carregandoEscopos ? (
                  <EmptyText>Carregando escopos...</EmptyText>
                ) : escoposDoProjeto.length === 0 ? (
                  <EmptyText>Este projeto ainda não tem escopo vendido.</EmptyText>
                ) : escoposLivres.length === 0 ? (
                  <EmptyText>Todos os escopos deste projeto já têm banca marcada.</EmptyText>
                ) : (
                  <CheckboxGrid>
                    {escoposDoProjeto.map((escopo) => (
                      <CheckboxLabel key={escopo.id}>
                        <input
                          type="checkbox"
                          disabled={!!escopo.banca}
                          checked={escoposMarcados.includes(escopo.id)}
                          onChange={() => setEscoposMarcados((ids) => toggleId(ids, escopo.id))}
                        />
                        <span>
                          {escopo.nome}
                          {escopo.banca && (
                            <>
                              {" "}
                              <EscopoIndisponivel>
                                {escopo.banca.data_hora
                                  ? `já tem banca em ${new Date(escopo.banca.data_hora).toLocaleDateString("pt-BR")}`
                                  : "já tem banca, sem data"}
                              </EscopoIndisponivel>
                            </>
                          )}
                        </span>
                      </CheckboxLabel>
                    ))}
                  </CheckboxGrid>
                )}
              </FieldGroup>
            )}

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

            {editando && (
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
            )}

            {ehDiretor && (
              <FieldGroup>
                <FieldLabel htmlFor="piso-override">
                  Piso mínimo desta banca (opcional)
                </FieldLabel>
                <FieldInput
                  id="piso-override"
                  type="number"
                  min={0}
                  value={pisoOverride}
                  onChange={(e) => setPisoOverride(e.target.value)}
                  placeholder="Deixe em branco para usar o padrão da(s) frente(s)"
                />
              </FieldGroup>
            )}

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

            {editando ? (
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
            ) : (
              escoposMarcados.length > 0 && (
                <FieldGroup>
                  <FieldLabel as="span">Frentes</FieldLabel>
                  <BuscaMeta>
                    {frentesDosEscoposMarcados.length > 0
                      ? `${frentesDosEscoposMarcados.join(" · ")} — vêm dos escopos escolhidos.`
                      : "Definidas pelos escopos escolhidos."}
                  </BuscaMeta>
                </FieldGroup>
              )
            )}

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton $variant="outline" type="button" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton
              type="submit"
              disabled={enviando || (!editando && escoposMarcados.length === 0)}
            >
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
  token,
  onClose,
  onEditar,
  onExcluir,
  onDescricaoEnviada,
}: {
  banca: Banca | null;
  contexto: Contexto;
  usuarioId: number;
  token: string | null;
  onClose: () => void;
  onEditar?: (banca: Banca) => void;
  onExcluir?: (banca: Banca) => void;
  onDescricaoEnviada?: () => void;
}) {
  if (!banca) return null;

  const podeGerenciar = podeGerenciarBanca(banca, usuarioId);
  // O coordenador não é avaliador da própria banca (§8: "ninguém avalia o
  // próprio grupo") — no lugar do formulário de notas, ele só registra este
  // relato livre, e só depois que a banca de fato aconteceu.
  const ehCoordenador = usuarioId === banca.coordenador_id;

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

          {banca.realizado_em && (ehCoordenador || banca.descricao_coordenador) && (
            <DescricaoSecao>
              <DescricaoCoordenador
                banca={banca}
                editavel={ehCoordenador}
                token={token}
                onEnviada={onDescricaoEnviada}
              />
            </DescricaoSecao>
          )}
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

/**
 * O relato do coordenador sobre a banca — não é o formulário de avaliação
 * (ele nem candidato dela é, ver `create_candidatura`). Só aparece depois de
 * `realizado_em`; só o próprio coordenador edita, o resto só lê.
 */
function DescricaoCoordenador({
  banca,
  editavel,
  token,
  onEnviada,
}: {
  banca: Banca;
  editavel: boolean;
  token: string | null;
  onEnviada?: () => void;
}) {
  const [descricao, setDescricao] = useState(banca.descricao_coordenador ?? "");
  const [editando, setEditando] = useState(!banca.descricao_coordenador);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar() {
    if (!token || !descricao.trim()) return;
    setEnviando(true);
    setErro("");
    try {
      await registrarDescricaoCoordenador(banca.id, descricao.trim(), token);
      setEditando(false);
      onEnviada?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar a descrição");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <FieldGroup>
      <FieldLabel htmlFor="descricao-coordenador">Descrição do coordenador</FieldLabel>
      {editavel && editando ? (
        <>
          <FieldTextarea
            id="descricao-coordenador"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Como foi a banca, o que ficou combinado com o cliente…"
            disabled={enviando}
          />
          {erro && <FormErrorText>{erro}</FormErrorText>}
          <PageButtonSm type="button" disabled={enviando || !descricao.trim()} onClick={enviar}>
            {enviando ? "Enviando..." : "Enviar descrição"}
          </PageButtonSm>
        </>
      ) : (
        <>
          <DescricaoQuote>{banca.descricao_coordenador}</DescricaoQuote>
          {editavel && (
            <PageButtonSm $variant="outline" type="button" onClick={() => setEditando(true)}>
              Editar
            </PageButtonSm>
          )}
        </>
      )}
    </FieldGroup>
  );
}

/**
 * Convite direto pra troca — alternativa ao "Pedir troca" (pool aberto,
 * qualquer elegível confirma). Aqui quem pede escolhe a pessoa; só ela
 * consegue confirmar depois (o backend garante, ver `confirmar_solicitacao_troca`).
 * As mesmas exclusões do pool aberto valem aqui: coordenador e equipe do
 * projeto da banca, e quem já é candidato dela.
 */
function ConvidarTrocaModal({
  banca,
  contexto,
  usuarioId,
  onConvidar,
  onClose,
}: {
  banca: Banca;
  contexto: Contexto;
  usuarioId: number;
  onConvidar: (usuarioConvidadoId: number) => void;
  onClose: () => void;
}) {
  const excluidos = new Set<number>([usuarioId, banca.coordenador_id]);
  contexto.equipesProjeto
    .filter((e) => e.banca_id === banca.id)
    .forEach((e) => excluidos.add(e.usuario_id));
  contexto.candidaturas
    .filter((c) => c.banca_id === banca.id)
    .forEach((c) => excluidos.add(c.usuario_id));

  const elegiveis = contexto.usuarios
    .filter((u) => u.ativo && !excluidos.has(u.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const [usuarioEscolhidoId, setUsuarioEscolhidoId] = useState<number | "">("");

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <NarrowModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="convidar-troca-titulo">
        <ModalHeader>
          <ModalTitle id="convidar-troca-titulo">Convidar para a troca — {banca.nome_projeto}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          {elegiveis.length === 0 ? (
            <EmptyText>Ninguém elegível pra convidar nesta banca no momento.</EmptyText>
          ) : (
            <FieldGroup>
              <FieldLabel htmlFor="convidado">Pessoa</FieldLabel>
              <FieldSelect
                id="convidado"
                value={usuarioEscolhidoId}
                onChange={(e) => setUsuarioEscolhidoId(Number(e.target.value))}
                autoFocus
              >
                <option value="">Escolha quem convidar</option>
                {elegiveis.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>
          )}
        </ModalBody>
        <ModalFooter>
          <PageButton $variant="outline" type="button" onClick={onClose}>
            Cancelar
          </PageButton>
          <PageButton
            type="button"
            disabled={!usuarioEscolhidoId}
            onClick={() => usuarioEscolhidoId && onConvidar(usuarioEscolhidoId)}
          >
            Enviar convite
          </PageButton>
        </ModalFooter>
      </NarrowModalContent>
    </ModalOverlay>
  );
}

const OUTRO = "outro" as const;

function AvaliarModal({
  banca,
  formulario,
  escopos,
  token,
  onClose,
  onEnviada,
}: {
  banca: Banca;
  formulario: FormularioAtivo | null;
  escopos: Escopo[];
  token: string;
  onClose: () => void;
  onEnviada: () => void;
}) {
  const { usuario } = useAuth();
  const escoposOrdenados = escopos.slice().sort((a, b) => a.nome.localeCompare(b.nome));

  // Bloco 1 — a diretoria pede de novo mesmo o sistema já sabendo quem
  // está logado e qual o escopo cadastrado da banca: são só o ponto de
  // partida, o avaliador pode confirmar diferente.
  const [nomeAvaliador, setNomeAvaliador] = useState(usuario?.nome ?? "");
  const [tipoAvaliador, setTipoAvaliador] = useState<"consultor" | "lideranca">(
    usuario && usuario.posicao !== "consultor" ? "lideranca" : "consultor",
  );
  const [projetoAvaliado, setProjetoAvaliado] = useState(banca.nome_projeto);
  const [escopoSelecionado, setEscopoSelecionado] = useState<number | typeof OUTRO | "">(
    banca.escopo_id ?? OUTRO,
  );
  const [escopoOutro, setEscopoOutro] = useState("");

  // O Bloco 2 (critérios técnicos) depende do que foi respondido AQUI —
  // "Escopo Avaliado" — não de `banca.escopo_id` direto: é essa resposta
  // que decide o bloco, mesmo já vindo prenchida a partir da banca.
  const escopoIdParaFiltro = typeof escopoSelecionado === "number" ? escopoSelecionado : null;

  const perguntasVisiveis = (formulario?.perguntas ?? [])
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .filter((p) => p.escopo_id == null || p.escopo_id === escopoIdParaFiltro)
    .filter((p) => !isComentarioFeedbackPergunta(p.tipo_resposta, p.texto));

  const perguntasNota = perguntasVisiveis.filter((p) => isPerguntaNota(p.tipo_resposta));
  const perguntasTexto = perguntasVisiveis.filter((p) => !isPerguntaNota(p.tipo_resposta));

  const [notas, setNotas] = useState<Record<number, number | null>>(() =>
    Object.fromEntries(perguntasNota.map((p) => [p.id, null])),
  );
  const [respostasTexto, setRespostasTexto] = useState<Record<number, string>>({});
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formulario) return;
    const faltando = perguntasNota.some((p) => notas[p.id] == null);
    if (faltando) {
      setErro("Selecione uma nota de 1 a 5 para todos os critérios.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const avaliacao = await createAvaliacao(
        {
          banca_id: banca.id,
          formulario_id: formulario.id,
          nome_avaliador: nomeAvaliador.trim() || undefined,
          tipo_avaliador: tipoAvaliador,
          projeto_avaliado: projetoAvaliado.trim() || undefined,
          escopo_avaliado_id: escopoIdParaFiltro,
          escopo_avaliado_outro: escopoIdParaFiltro == null ? escopoOutro.trim() || null : null,
        },
        token,
      );
      for (const pergunta of perguntasVisiveis) {
        if (isPerguntaNota(pergunta.tipo_resposta)) {
          await createAvaliacaoNota(
            {
              avaliacao_id: avaliacao.id,
              pergunta_id: pergunta.id,
              nota: notas[pergunta.id] as number,
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
              <FieldGroup>
                <FieldLabel htmlFor="bloco1-nome">Nome</FieldLabel>
                <FieldInput
                  id="bloco1-nome"
                  value={nomeAvaliador}
                  onChange={(e) => setNomeAvaliador(e.target.value)}
                  required
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="bloco1-tipo">Consultor ou Liderança</FieldLabel>
                <FieldSelect
                  id="bloco1-tipo"
                  value={tipoAvaliador}
                  onChange={(e) => setTipoAvaliador(e.target.value as "consultor" | "lideranca")}
                >
                  <option value="consultor">Consultor</option>
                  <option value="lideranca">Liderança</option>
                </FieldSelect>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="bloco1-projeto">Projeto Avaliado</FieldLabel>
                <FieldInput
                  id="bloco1-projeto"
                  value={projetoAvaliado}
                  onChange={(e) => setProjetoAvaliado(e.target.value)}
                  placeholder="ex. PROJETO I"
                  required
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="bloco1-escopo">Escopo Avaliado</FieldLabel>
                <FieldSelect
                  id="bloco1-escopo"
                  value={escopoSelecionado}
                  onChange={(e) =>
                    setEscopoSelecionado(e.target.value === OUTRO ? OUTRO : Number(e.target.value))
                  }
                >
                  {escoposOrdenados.map((escopo) => (
                    <option key={escopo.id} value={escopo.id}>
                      {escopo.nome}
                    </option>
                  ))}
                  <option value={OUTRO}>Outro</option>
                </FieldSelect>
              </FieldGroup>
              {escopoIdParaFiltro == null && (
                <FieldGroup>
                  <FieldLabel htmlFor="bloco1-escopo-outro">Qual escopo?</FieldLabel>
                  <FieldInput
                    id="bloco1-escopo-outro"
                    value={escopoOutro}
                    onChange={(e) => setEscopoOutro(e.target.value)}
                    required
                  />
                </FieldGroup>
              )}

              {perguntasNota.length > 0 && (
                <NotaEscalaGrupo>
                  {perguntasNota.map((pergunta) => (
                    <NotaEscala
                      key={pergunta.id}
                      id={`pergunta-${pergunta.id}`}
                      label={pergunta.texto}
                      value={notas[pergunta.id] ?? null}
                      onChange={(valor) => setNotas((n) => ({ ...n, [pergunta.id]: valor }))}
                    />
                  ))}
                </NotaEscalaGrupo>
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
