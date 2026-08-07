import { useEffect, useState } from "react";
import { ArrowLeft, ArchiveRestore } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { CORES_STATUS, formatarDataHora, getProjetos, ROTULO_STATUS } from "@/lib/projetos";
import { getUsuarios } from "@/lib/usuarios";
import { ColunaPilula, Ponto } from "@/components/kanban/Kanban.styled";
import { tonsDaColuna } from "@/lib/colunas-tarefa";
import type { UsuarioResumo } from "@/types/auth";
import type { Frente } from "@/types/banca";
import type { ProjetoResumo } from "@/types/projeto";
import { PageStack, PageLoadingBlock, ErrorBlock, ErrorText, PageButton, EmptyText } from "@/styles/page.styled";
import {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  VoltarLink,
  CardGrid,
  ProjetoCard,
  CardTitle,
  TagRow,
  FrenteTag,
  CardEquipe,
  ArquivadoEmLinha,
} from "./Projetos.styled";

/**
 * Lugar próprio pros projetos arquivados (§6.2) — antes só dava pra ver
 * misturado na lista viva, atrás de um checkbox "mostrar arquivados". Sem
 * kanban nem ordenação por etapa aqui: arquivado não está mais em fluxo, o
 * que importa é achar e, se for o caso, desarquivar — o que se faz dentro do
 * projeto (`ProjetoPage`), não aqui.
 */
export function ProjetosArquivados() {
  const { token } = useAuth();
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [projetosResp, frentesResp, usuariosResp] = await Promise.all([
        getProjetos(token, null, true),
        getFrentes(token),
        getUsuarios(token),
      ]);
      setProjetos(projetosResp.filter((p) => p.arquivado_em));
      setFrentes(frentesResp);
      setUsuarios(usuariosResp);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar projetos arquivados");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const nomeFrente = (id: number) => frentes.find((f) => f.id === id)?.nome ?? `Frente ${id}`;
  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;

  // Mais recém-arquivado primeiro — é o que alguém procurando "cadê aquele
  // projeto que arquivei semana passada" normalmente quer ver no topo.
  const projetosOrdenados = [...projetos].sort((a, b) =>
    (b.arquivado_em ?? "").localeCompare(a.arquivado_em ?? ""),
  );

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar os projetos arquivados: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageStack>
      <VoltarLink to="/projetos">
        <ArrowLeft size={14} />
        Voltar para Projetos
      </VoltarLink>

      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Projetos arquivados</PageHeading>
          <PageSubheading>
            {projetosOrdenados.length} {projetosOrdenados.length === 1 ? "projeto" : "projetos"}
          </PageSubheading>
        </PageHeaderText>
      </PageHeaderRow>

      {projetosOrdenados.length === 0 ? (
        <EmptyText>Nenhum projeto arquivado.</EmptyText>
      ) : (
        <CardGrid>
          {projetosOrdenados.map((projeto) => {
            const tonsStatus = tonsDaColuna(CORES_STATUS[projeto.status]);
            return (
              <ProjetoCard
                key={projeto.id}
                to={`/projetos/${projeto.id}`}
                state={{ voltarPara: "/projetos/arquivados", voltarRotulo: "Voltar para arquivados" }}
              >
                <div>
                  <CardTitle>{projeto.nome}</CardTitle>
                </div>

                <TagRow>
                  {projeto.frente_ids.map((id) => (
                    <FrenteTag key={id}>{nomeFrente(id)}</FrenteTag>
                  ))}
                  {projeto.sinergico && <FrenteTag>🔗 sinérgico</FrenteTag>}
                </TagRow>

                <ColunaPilula $cor={tonsStatus}>
                  <Ponto $cor={tonsStatus.ponto} />
                  {ROTULO_STATUS[projeto.status]}
                </ColunaPilula>

                <CardEquipe>
                  <strong>Coord:</strong>{" "}
                  {projeto.coordenador_id ? nomeUsuario(projeto.coordenador_id) : "—"}
                  <br />
                  <ArquivadoEmLinha>
                    <ArchiveRestore size={12} />
                    Arquivado em {formatarDataHora(projeto.arquivado_em)}
                  </ArquivadoEmLinha>
                </CardEquipe>
              </ProjetoCard>
            );
          })}
        </CardGrid>
      )}
    </PageStack>
  );
}
