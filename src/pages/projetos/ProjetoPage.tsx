import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Archive, ArchiveRestore, ArrowLeft, ChevronDown, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { tonsDaColuna, type TonsColuna } from "@/lib/colunas-tarefa";
import {
  arquivarProjeto,
  CORES_STATUS,
  deletarProjetoPermanente,
  desarquivarProjeto,
  destinosValidos,
  formatarData,
  getProjeto,
  mudarStatus,
  podePausar,
  ROTULO_STATUS,
  tomDoStatus,
} from "@/lib/projetos";
import { getUsuarios } from "@/lib/usuarios";
import type { UsuarioResumo } from "@/types/auth";
import type { Frente } from "@/types/banca";
import type { ProjetoCompleto, StatusProjeto } from "@/types/projeto";
import { Ponto } from "@/components/kanban/Kanban.styled";
import { pode } from "@/utils/permissoes";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import {
  PageBadge,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  PageButton,
} from "@/styles/page.styled";
import {
  PageHeaderText,
  PageHeading,
  PageSubheading,
  FormErrorText,
  ProjetoShell,
  ShellHeader,
  VoltarLink,
  StatusRow,
  TagRow,
  FrenteTag,
  AvisoBanner,
  TabBar,
  TabLink,
  EtapaSeletorWrap,
  EtapaBotaoAtual,
  EtapaMenu,
  EtapaOpcaoBotao,
  StatusPilula,
} from "./Projetos.styled";

/** O que o shell entrega para as abas. */
export interface ProjetoContexto {
  projeto: ProjetoCompleto;
  usuarios: UsuarioResumo[];
  frentes: Frente[];
  recarregar: () => Promise<void>;
}

export function useProjeto() {
  return useOutletContext<ProjetoContexto>();
}

/**
 * O shell da página do projeto (§6.4). As abas são **sub-rotas**, não estado
 * local: é isso que deixa uma notificação abrir direto em
 * `/projetos/42/tarefas`.
 */
/** O que uma tela de origem manda pra dizer pra onde "voltar" aponta —
 *  ver `voltarDoLocation` logo abaixo. */
interface VoltarState {
  voltarPara?: string;
  voltarRotulo?: string;
}

/**
 * De onde "Voltar" deveria levar.
 *
 * Sem isto o link era fixo em `/projetos`, então quem chegava aqui a partir
 * do board macro de Tarefas ou Cronogramas gerais (Monitoramento) e clicava
 * em Voltar caía na listagem de projetos — perdendo o filtro/aba de onde
 * tinha vindo, em vez de voltar pra lá. Quem navega passa `state` com o
 * destino (`TarefasGeraisAba`, `CronogramasGeraisAba`); sem `state`, o
 * padrão de sempre continua sendo a listagem.
 */
function voltarDoLocation(state: unknown): { to: string; rotulo: string } {
  const voltar = (state ?? {}) as VoltarState;
  if (voltar.voltarPara) {
    return { to: voltar.voltarPara, rotulo: voltar.voltarRotulo ?? "Voltar" };
  }
  return { to: "/projetos", rotulo: "Voltar para projetos" };
}

export function ProjetoPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, token } = useAuth();
  const projetoId = Number(id);
  /**
   * Capturado só na ENTRADA no projeto (quando `id` muda), não a cada
   * navegação. As abas internas (Cronograma, Tarefas...) trocam de rota sem
   * levar `state` — recalcular a cada `location` perderia o destino assim
   * que a pessoa clicasse em outra aba dentro do mesmo projeto.
   */
  const [voltar, setVoltar] = useState(() => voltarDoLocation(location.state));
  useEffect(() => {
    setVoltar(voltarDoLocation(location.state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [projeto, setProjeto] = useState<ProjetoCompleto | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroStatus, setErroStatus] = useState("");
  const [mudandoStatus, setMudandoStatus] = useState(false);
  const [arquivando, setArquivando] = useState(false);
  const [confirmandoArquivamento, setConfirmandoArquivamento] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const carregar = useCallback(async () => {
    if (!token || !projetoId) return;
    setErro("");
    try {
      const [projetoResp, usuariosResp, frentesResp] = await Promise.all([
        getProjeto(projetoId, token),
        getUsuarios(token),
        getFrentes(token),
      ]);
      setProjeto(projetoResp);
      setUsuarios(usuariosResp);
      setFrentes(frentesResp);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o projeto");
    } finally {
      setCarregando(false);
    }
  }, [projetoId, token]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  async function aplicarStatus(statusNovo: string) {
    if (!token || !projeto) return;
    setMudandoStatus(true);
    setErroStatus("");
    try {
      await mudarStatus(projeto.id, statusNovo, token);
      await carregar();
    } catch (err) {
      setErroStatus(err instanceof Error ? err.message : "Erro ao mudar o status");
    } finally {
      setMudandoStatus(false);
    }
  }

  async function confirmarArquivamento() {
    if (!token || !projeto) return;
    const arquivado = Boolean(projeto.arquivado_em);
    setArquivando(true);
    try {
      if (arquivado) await desarquivarProjeto(projeto.id, token);
      else await arquivarProjeto(projeto.id, token);
      setConfirmandoArquivamento(false);
      await carregar();
    } catch (err) {
      setArquivando(false);
      throw err;
    }
  }

  async function confirmarExclusao() {
    if (!token || !projeto) return;
    setExcluindo(true);
    try {
      await deletarProjetoPermanente(projeto.id, token);
      navigate("/projetos", { replace: true });
    } catch (err) {
      setExcluindo(false);
      throw err;
    }
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível abrir o projeto: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => carregar()}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !projeto) return <PageLoadingBlock />;

  const nomeFrente = (frenteId: number) =>
    frentes.find((f) => f.id === frenteId)?.nome ?? `Frente ${frenteId}`;

  const podeMudarStatus = pode(usuario, "mudar_status_projeto");
  const podeArquivar = pode(usuario, "arquivar_projeto");
  const podeExcluir = pode(usuario, "apagar_projeto_permanente");
  const temKickoff = !!projeto.data_kickoff;

  // ✋ Livre entre as etapas ativas, nos dois sentidos — não só a vizinha.
  // Pausado é um estado à parte: só o retomar aparece. Vendido só oferece
  // Ambientação, e só quando já existe uma data de kickoff marcada.
  const opcoesEtapa: EtapaOpcao[] =
    projeto.status === "pausado"
      ? [{ chave: "retomar", rotulo: "Retomar", cor: null }]
      : [
          ...destinosValidos(projeto.status, temKickoff).map((status) => ({
            chave: status,
            rotulo: ROTULO_STATUS[status],
            cor: CORES_STATUS[status],
          })),
          ...(podePausar(projeto.status)
            ? [{ chave: "pausado", rotulo: "Pausar", cor: CORES_STATUS.pausado }]
            : []),
        ];

  const contexto: ProjetoContexto = { projeto, usuarios, frentes, recarregar: carregar };

  return (
    <ProjetoShell>
      <ShellHeader>
        <PageHeaderText>
          <VoltarLink to={voltar.to}>
            <ArrowLeft size={14} />
            {voltar.rotulo}
          </VoltarLink>
          <PageHeading>{projeto.nome}</PageHeading>
          <PageSubheading>{projeto.cliente}</PageSubheading>
          <TagRow>
            {projeto.frente_ids.map((frenteId) => (
              <FrenteTag key={frenteId}>{nomeFrente(frenteId)}</FrenteTag>
            ))}
            {projeto.sinergico && <FrenteTag>🔗 sinérgico</FrenteTag>}
          </TagRow>
        </PageHeaderText>

        <StatusRow>
          {podeMudarStatus ? (
            <EtapaSeletor
              statusAtual={projeto.status}
              rotuloAtual={ROTULO_STATUS[projeto.status]}
              opcoes={opcoesEtapa}
              ocupado={mudandoStatus}
              onSelecionar={aplicarStatus}
            />
          ) : (
            <PageBadge $tone={tomDoStatus(projeto.status)}>{ROTULO_STATUS[projeto.status]}</PageBadge>
          )}
          {podeArquivar && (
            <PageButtonSm
              type="button"
              $variant="outline"
              disabled={arquivando}
              onClick={() => setConfirmandoArquivamento(true)}
            >
              {projeto.arquivado_em ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {projeto.arquivado_em ? "Desarquivar" : "Arquivar"}
            </PageButtonSm>
          )}
          {podeExcluir && projeto.arquivado_em && (
            <PageButtonSm
              type="button"
              $variant="outline"
              disabled={excluindo}
              onClick={() => setConfirmandoExclusao(true)}
            >
              <Trash2 size={14} />
              Apagar para sempre
            </PageButtonSm>
          )}
        </StatusRow>
      </ShellHeader>

      {erroStatus && <FormErrorText>{erroStatus}</FormErrorText>}

      {projeto.arquivado_em && (
        <AvisoBanner>📦 Projeto arquivado — não aparece nas listagens normais.</AvisoBanner>
      )}

      {projeto.kickoff_pendente && (
        <AvisoBanner>
          ⚠ Kickoff pendente — combine a data com o cliente e marque na aba Visão geral.
        </AvisoBanner>
      )}

      {/* Kickoff já marcado, mas o projeto continua Vendido — cadastrado
          agora com início planejado pra mais adiante. Não é alerta: é só
          informação até alguém confirmar Ambientação no seletor de etapa. */}
      {projeto.status === "vendido" && projeto.data_kickoff && (
        <AvisoBanner>
          🗓 Kickoff planejado para {formatarData(projeto.data_kickoff)} — o projeto continua Vendido até alguém
          confirmar o início escolhendo "Ambientação" ali em cima.
        </AvisoBanner>
      )}

      <TabBar>
        <TabLink to={`/projetos/${projeto.id}`} end>
          Visão geral
        </TabLink>
        <TabLink to={`/projetos/${projeto.id}/cronograma`}>Cronograma</TabLink>
        <TabLink to={`/projetos/${projeto.id}/tarefas`}>Tarefas</TabLink>
        <TabLink to={`/projetos/${projeto.id}/reunioes`}>Reuniões</TabLink>
        <TabLink to={`/projetos/${projeto.id}/historico`}>Histórico</TabLink>
      </TabBar>

      <Outlet context={contexto} />

      {confirmandoArquivamento && (
        <ConfirmarModal
          titulo={projeto.arquivado_em ? "Desarquivar projeto" : "Arquivar projeto"}
          mensagem={
            projeto.arquivado_em
              ? "Desarquivar este projeto? Ele volta a aparecer nas listagens normais."
              : "Arquivar este projeto? Ele some das listagens normais, mas nada é apagado — dá pra desarquivar depois."
          }
          rotuloConfirmar={projeto.arquivado_em ? "Desarquivar" : "Arquivar"}
          onCancelar={() => setConfirmandoArquivamento(false)}
          onConfirmar={confirmarArquivamento}
        />
      )}

      {confirmandoExclusao && (
        <ConfirmarModal
          titulo="Apagar projeto para sempre"
          mensagem={`Apagar "${projeto.nome}" para sempre? Tarefas, bancas, avaliações, cronograma e histórico do projeto são todos apagados junto. Essa ação não pode ser desfeita.`}
          rotuloConfirmar="Apagar para sempre"
          onCancelar={() => setConfirmandoExclusao(false)}
          onConfirmar={confirmarExclusao}
        />
      )}
    </ProjetoShell>
  );
}

/* ------------------------------------------------------------------ */

interface EtapaOpcao {
  /** O valor que `aplicarStatus` espera: a etapa de destino, `"pausado"` ou `"retomar"`. */
  chave: string;
  rotulo: string;
  /** `null` pro Retomar — não dá pra saber a cor de destino sem reconsultar o histórico. */
  cor: string | null;
}

/**
 * Escolher a etapa como lista, não como botõezinhos de avançar/voltar/pausar
 * espalhados — a pílula usa a MESMA cor do kanban de projetos (`CORES_STATUS`),
 * pra não parecer um controle diferente do kanban.
 */
function EtapaSeletor({
  statusAtual,
  rotuloAtual,
  opcoes,
  ocupado,
  onSelecionar,
}: {
  statusAtual: StatusProjeto;
  rotuloAtual: string;
  opcoes: EtapaOpcao[];
  ocupado: boolean;
  onSelecionar: (chave: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (ref.current && !ref.current.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const tonsAtual = tonsDaColuna(CORES_STATUS[statusAtual]);
  const semOpcoes = opcoes.length === 0;

  return (
    <EtapaSeletorWrap ref={ref}>
      <EtapaBotaoAtual
        type="button"
        disabled={ocupado || semOpcoes}
        aria-expanded={aberto}
        aria-haspopup="menu"
        onClick={() => setAberto((v) => !v)}
      >
        <StatusPilula $cor={tonsAtual}>
          <Ponto $cor={tonsAtual.ponto} />
          {rotuloAtual}
        </StatusPilula>
        {!semOpcoes && <ChevronDown size={14} />}
      </EtapaBotaoAtual>
      {aberto && !semOpcoes && (
        <EtapaMenu role="menu">
          {opcoes.map((opcao) => {
            const tons: TonsColuna | null = opcao.cor ? tonsDaColuna(opcao.cor) : null;
            return (
              <EtapaOpcaoBotao
                key={opcao.chave}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAberto(false);
                  onSelecionar(opcao.chave);
                }}
              >
                {tons ? (
                  <StatusPilula $cor={tons}>
                    <Ponto $cor={tons.ponto} />
                    {opcao.rotulo}
                  </StatusPilula>
                ) : (
                  opcao.rotulo
                )}
              </EtapaOpcaoBotao>
            );
          })}
        </EtapaMenu>
      )}
    </EtapaSeletorWrap>
  );
}
