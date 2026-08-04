import { useCallback, useEffect, useState } from "react";
import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play, SkipForward } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import {
  getProjeto,
  mudarStatus,
  podePausar,
  proximoStatusManual,
  ROTULO_STATUS,
  tomDoStatus,
} from "@/lib/projetos";
import { getUsuarios } from "@/lib/usuarios";
import type { UsuarioResumo } from "@/types/auth";
import type { Frente } from "@/types/banca";
import type { ProjetoCompleto } from "@/types/projeto";
import { pode } from "@/utils/permissoes";
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
export function ProjetoPage() {
  const { id } = useParams();
  const { usuario, token } = useAuth();
  const projetoId = Number(id);

  const [projeto, setProjeto] = useState<ProjetoCompleto | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroStatus, setErroStatus] = useState("");
  const [mudandoStatus, setMudandoStatus] = useState(false);

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
  const proximo = proximoStatusManual(projeto.status);
  const contexto: ProjetoContexto = { projeto, usuarios, frentes, recarregar: carregar };

  return (
    <ProjetoShell>
      <ShellHeader>
        <PageHeaderText>
          <VoltarLink to="/projetos">
            <ArrowLeft size={14} />
            Voltar para projetos
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
          <PageBadge $tone={tomDoStatus(projeto.status)}>{ROTULO_STATUS[projeto.status]}</PageBadge>

          {/* ✋ As transições manuais: só a próxima da fila, nunca pula etapa.
              Vendido → Ambientação não aparece aqui de propósito — quem move
              esse é o kickoff. */}
          {podeMudarStatus && projeto.status === "pausado" && (
            <PageButtonSm type="button" disabled={mudandoStatus} onClick={() => aplicarStatus("retomar")}>
              <Play size={14} />
              Retomar
            </PageButtonSm>
          )}
          {podeMudarStatus && proximo && (
            <PageButtonSm type="button" disabled={mudandoStatus} onClick={() => aplicarStatus(proximo)}>
              <SkipForward size={14} />
              Avançar para {ROTULO_STATUS[proximo]}
            </PageButtonSm>
          )}
          {podeMudarStatus && podePausar(projeto.status) && (
            <PageButtonSm
              type="button"
              $variant="outline"
              disabled={mudandoStatus}
              onClick={() => aplicarStatus("pausado")}
            >
              <Pause size={14} />
              Pausar
            </PageButtonSm>
          )}
        </StatusRow>
      </ShellHeader>

      {erroStatus && <FormErrorText>{erroStatus}</FormErrorText>}

      {projeto.kickoff_pendente && (
        <AvisoBanner>
          ⚠ Kickoff pendente — combine a data com o cliente e marque na aba Visão geral.
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
    </ProjetoShell>
  );
}
