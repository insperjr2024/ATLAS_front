import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { getProjetos, ROTULO_STATUS, tomDoStatus } from "@/lib/projetos";
import { getUsuarios } from "@/lib/usuarios";
import type { UsuarioResumo } from "@/types/auth";
import type { Frente } from "@/types/banca";
import type { ProjetoResumo } from "@/types/projeto";
import { pode, rotuloProjetos } from "@/utils/permissoes";
import {
  PageStack,
  PageButton,
  PageBadge,
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
  FieldSelect,
  CardGrid,
  ProjetoCard,
  CardTitle,
  CardCliente,
  TagRow,
  FrenteTag,
  CardEquipe,
  CardAlerta,
  FiltersRow,
  CheckboxLabel,
} from "./Projetos.styled";

export function ProjetosList() {
  const { usuario, token } = useAuth();
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [filtroFrente, setFiltroFrente] = useState("");
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeFiltrar = pode(usuario, "filtrar_por_frente");
  const podeCriar = pode(usuario, "criar_projeto");
  const podeArquivar = pode(usuario, "arquivar_projeto");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      // O recorte de visão é do backend: `GET /projetos` já vem filtrado pelo
      // token. O `?frente_id=` só refina, e só o diretor enxerga o seletor.
      const [projetosResp, frentesResp, usuariosResp] = await Promise.all([
        getProjetos(
          token,
          podeFiltrar && filtroFrente ? Number(filtroFrente) : null,
          podeArquivar && mostrarArquivados,
        ),
        getFrentes(token),
        getUsuarios(token),
      ]);
      setProjetos(projetosResp);
      setFrentes(frentesResp);
      setUsuarios(usuariosResp);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar projetos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filtroFrente, mostrarArquivados]);

  const nomeFrente = (id: number) => frentes.find((f) => f.id === id)?.nome ?? `Frente ${id}`;
  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar os projetos: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  const pendentes = projetos.filter((p) => p.kickoff_pendente).length;

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>{rotuloProjetos(usuario)}</PageHeading>
          <PageSubheading>
            {projetos.length} {projetos.length === 1 ? "projeto" : "projetos"}
            {pendentes > 0 && ` · ${pendentes} com kickoff pendente`}
          </PageSubheading>
        </PageHeaderText>

        <FiltersRow>
          {podeFiltrar && (
            <FieldSelect
              value={filtroFrente}
              onChange={(e) => setFiltroFrente(e.target.value)}
              aria-label="Filtrar por frente"
            >
              <option value="">Todas as frentes</option>
              {frentes.map((frente) => (
                <option key={frente.id} value={frente.id}>
                  {frente.nome}
                </option>
              ))}
            </FieldSelect>
          )}
          {podeArquivar && (
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={mostrarArquivados}
                onChange={(e) => setMostrarArquivados(e.target.checked)}
              />
              Mostrar arquivados
            </CheckboxLabel>
          )}
          {podeCriar && (
            <PageButton type="button" onClick={() => navigate("/projetos/novo")}>
              <Plus size={16} />
              Criar projeto
            </PageButton>
          )}
        </FiltersRow>
      </PageHeaderRow>

      {projetos.length === 0 ? (
        <EmptyText>
          {filtroFrente
            ? "Nenhum projeto nesta frente."
            : podeCriar
              ? "Nenhum projeto ainda. Crie o primeiro."
              : "Você ainda não está alocado em nenhum projeto."}
        </EmptyText>
      ) : (
        <CardGrid>
          {projetos.map((projeto) => (
            <ProjetoCard key={projeto.id} to={`/projetos/${projeto.id}`}>
              <div>
                <CardTitle>{projeto.nome}</CardTitle>
                <CardCliente>{projeto.cliente}</CardCliente>
              </div>

              <TagRow>
                {projeto.frente_ids.map((id) => (
                  <FrenteTag key={id}>{nomeFrente(id)}</FrenteTag>
                ))}
                {projeto.sinergico && <FrenteTag>🔗 sinérgico</FrenteTag>}
              </TagRow>

              <div>
                <PageBadge $tone={tomDoStatus(projeto.status)}>
                  {ROTULO_STATUS[projeto.status]}
                </PageBadge>
                {projeto.arquivado_em && <PageBadge $tone="muted">📦 Arquivado</PageBadge>}
              </div>

              <CardEquipe>
                <strong>Coord:</strong>{" "}
                {projeto.coordenador_id ? nomeUsuario(projeto.coordenador_id) : "—"}
                <br />
                <strong>Cons:</strong>{" "}
                {projeto.consultor_ids.length > 0
                  ? projeto.consultor_ids.map(nomeUsuario).join(", ")
                  : "—"}
              </CardEquipe>

              {projeto.kickoff_pendente && (
                <CardAlerta>
                  <AlertTriangle size={14} />
                  Kickoff pendente
                </CardAlerta>
              )}
            </ProjetoCard>
          ))}
        </CardGrid>
      )}
    </PageStack>
  );
}
