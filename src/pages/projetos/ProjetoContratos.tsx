import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { abrirDocumento, getDocumentosDoProjeto, getTiposDisponiveis } from "@/lib/contratos";
import type { DocumentoContratual, TipoDocumentoContratual } from "@/types/contratos";
import { ROTULO_STATUS_DOCUMENTO, ROTULO_TIPO_DOCUMENTO } from "@/types/contratos";
import { useProjeto } from "./ProjetoPage";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageBadge,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import { DocumentoLinha, DocumentoLista, DocumentoMeta, DocumentoTipo, TiposDisponiveisRow } from "./ProjetoContratos.styled";

function tomDoStatus(status: DocumentoContratual["status"]): "default" | "success" | "muted" | "warning" | "danger" {
  if (status === "assinado_e_arquivado") return "success";
  if (status === "aprovado_pelo_cliente") return "success";
  if (status === "alteracao_solicitada") return "warning";
  if (status === "aguardando_preenchimento") return "muted";
  return "default";
}

/**
 * ⭐ 2026-09-17/21 — aba Contratos (§ integração com a antiga plataforma
 * Contratos): a lista de documentos jurídicos do projeto. Abrir um documento
 * navega pra `DocumentoContratualPage.tsx`, uma página própria — não um
 * modal — pelo mesmo motivo que o Contratos antigo tinha uma tela cheia por
 * fluxo, não tudo espremido num diálogo genérico.
 */
export function ProjetoContratos() {
  const { projeto } = useProjeto();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoContratual[]>([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<TipoDocumentoContratual[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [abrindo, setAbrindo] = useState<TipoDocumentoContratual | null>(null);

  async function carregar() {
    if (!token) return;
    setErro("");
    try {
      const [{ documentos: docs }, { tipos }] = await Promise.all([
        getDocumentosDoProjeto(projeto.id, token),
        getTiposDisponiveis(projeto.id, token),
      ]);
      setDocumentos(docs);
      setTiposDisponiveis(tipos);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar documentos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto.id, token]);

  async function handleAbrir(tipo: TipoDocumentoContratual) {
    if (!token) return;
    setAbrindo(tipo);
    setErro("");
    try {
      const documento = await abrirDocumento(projeto.id, tipo, token);
      navigate(`/projetos/${projeto.id}/contratos/${documento.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao abrir documento");
    } finally {
      setAbrindo(null);
    }
  }

  if (carregando) return <PageLoadingBlock />;

  if (erro && documentos.length === 0 && tiposDisponiveis.length === 0) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  return (
    <PageStack>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Documentos jurídicos</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {erro && <ErrorText>{erro}</ErrorText>}
          {documentos.length === 0 ? (
            <EmptyText>Nenhum documento aberto neste projeto ainda.</EmptyText>
          ) : (
            <DocumentoLista>
              {documentos.map((doc) => (
                <DocumentoLinha
                  key={doc.id}
                  type="button"
                  onClick={() => navigate(`/projetos/${projeto.id}/contratos/${doc.id}`)}
                >
                  <DocumentoTipo>{ROTULO_TIPO_DOCUMENTO[doc.tipo]}</DocumentoTipo>
                  <DocumentoMeta>
                    {!!doc.ultima_versao && <span>v{doc.ultima_versao}</span>}
                    <PageBadge $tone={tomDoStatus(doc.status)}>{ROTULO_STATUS_DOCUMENTO[doc.status]}</PageBadge>
                  </DocumentoMeta>
                </DocumentoLinha>
              ))}
            </DocumentoLista>
          )}
        </PageCardContent>
      </PageCard>

      {tiposDisponiveis.length > 0 && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Adicionar documento</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <TiposDisponiveisRow>
              {tiposDisponiveis.map((tipo) => (
                <PageButton
                  key={tipo}
                  type="button"
                  $variant="outline"
                  disabled={abrindo === tipo}
                  onClick={() => handleAbrir(tipo)}
                >
                  {abrindo === tipo ? "Abrindo..." : `+ ${ROTULO_TIPO_DOCUMENTO[tipo]}`}
                </PageButton>
              ))}
            </TiposDisponiveisRow>
          </PageCardContent>
        </PageCard>
      )}
    </PageStack>
  );
}
