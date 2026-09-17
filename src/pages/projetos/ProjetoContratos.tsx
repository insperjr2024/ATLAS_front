import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  abrirDocumento,
  atualizarDadosDocumento,
  confirmarPreenchimento,
  gerarDocumento,
  getDocumento,
  getDocumentosDoProjeto,
  getTiposDisponiveis,
} from "@/lib/contratos";
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
import { ModalOverlay } from "@/styles/ModalOverlay";
import { ModalContent, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from "@/styles/modal.styled";
import {
  AcoesLinha,
  DadosTextarea,
  DocumentoLinha,
  DocumentoLista,
  DocumentoMeta,
  DocumentoTipo,
  TiposDisponiveisRow,
  VersaoLinha,
} from "./ProjetoContratos.styled";

function tomDoStatus(status: DocumentoContratual["status"]): "default" | "success" | "muted" | "warning" | "danger" {
  if (status === "assinado_e_arquivado") return "success";
  if (status === "aprovado_pelo_cliente") return "success";
  if (status === "alteracao_solicitada") return "warning";
  if (status === "aguardando_preenchimento") return "muted";
  return "default";
}

/**
 * ⭐ 2026-09-17 — primeira versão da aba Contratos (§ integração com a
 * antiga plataforma Contratos, ainda Fase 1). `dados` não tem form
 * campo-a-campo ainda — o shape muda por tipo (ver `render_template.py` no
 * backend) — então esta tela edita como JSON cru por enquanto. Suficiente
 * pra exercitar o ciclo completo (abrir → preencher → confirmar → gerar) de
 * ponta a ponta; um formulário de verdade por tipo é o próximo passo.
 */
export function ProjetoContratos() {
  const { projeto } = useProjeto();
  const { token } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoContratual[]>([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<TipoDocumentoContratual[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [abrindo, setAbrindo] = useState<TipoDocumentoContratual | null>(null);
  const [documentoAberto, setDocumentoAberto] = useState<DocumentoContratual | null>(null);

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
      await carregar();
      setDocumentoAberto(documento);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao abrir documento");
    } finally {
      setAbrindo(null);
    }
  }

  async function handleAbrirCard(documentoId: number) {
    if (!token) return;
    try {
      const documento = await getDocumento(documentoId, token);
      setDocumentoAberto(documento);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar documento");
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
                <DocumentoLinha key={doc.id} type="button" onClick={() => handleAbrirCard(doc.id)}>
                  <DocumentoTipo>{ROTULO_TIPO_DOCUMENTO[doc.tipo]}</DocumentoTipo>
                  <DocumentoMeta>
                    {doc.confirmado && <PageBadge $tone="success">confirmado</PageBadge>}
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

      {documentoAberto && token && (
        <DocumentoModal
          documento={documentoAberto}
          token={token}
          onClose={() => setDocumentoAberto(null)}
          onMudou={async () => {
            await carregar();
          }}
        />
      )}
    </PageStack>
  );
}

function DocumentoModal({
  documento,
  token,
  onClose,
  onMudou,
}: {
  documento: DocumentoContratual;
  token: string;
  onClose: () => void;
  onMudou: () => Promise<void>;
}) {
  const [atual, setAtual] = useState(documento);
  const [dadosTexto, setDadosTexto] = useState(() => JSON.stringify(documento.dados ?? {}, null, 2));
  const [erroDados, setErroDados] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSalvar() {
    let dados: Record<string, unknown>;
    try {
      dados = JSON.parse(dadosTexto);
    } catch {
      setErroDados("JSON inválido — confira vírgulas e aspas.");
      return;
    }
    setErroDados("");
    setSalvando(true);
    setErro("");
    try {
      const atualizado = await atualizarDadosDocumento(atual.id, dados, token);
      setAtual(atualizado);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar dados");
    } finally {
      setSalvando(false);
    }
  }

  async function handleConfirmar() {
    setConfirmando(true);
    setErro("");
    try {
      const atualizado = await confirmarPreenchimento(atual.id, token);
      setAtual(atualizado);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao confirmar");
    } finally {
      setConfirmando(false);
    }
  }

  async function handleGerar() {
    setGerando(true);
    setErro("");
    try {
      await gerarDocumento(atual.id, token);
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar documento");
    } finally {
      setGerando(false);
    }
  }

  const podeConfirmar = atual.status === "aguardando_preenchimento" && !atual.confirmado;

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <ModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="documento-titulo">
        <ModalHeader>
          <ModalTitle id="documento-titulo">{ROTULO_TIPO_DOCUMENTO[atual.tipo]}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            ×
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <AcoesLinha style={{ marginBottom: "0.75rem" }}>
            <PageBadge $tone={tomDoStatus(atual.status)}>{ROTULO_STATUS_DOCUMENTO[atual.status]}</PageBadge>
            {atual.confirmado && <PageBadge $tone="success">confirmado</PageBadge>}
          </AcoesLinha>

          {erro && <ErrorText>{erro}</ErrorText>}

          <p style={{ fontSize: "0.8rem", color: "inherit", opacity: 0.7 }}>
            Dados do formulário (JSON) — ainda sem campo-a-campo, edite direto aqui.
          </p>
          <DadosTextarea value={dadosTexto} onChange={(e) => setDadosTexto(e.target.value)} spellCheck={false} />
          {erroDados && <ErrorText>{erroDados}</ErrorText>}

          {!!atual.ultima_versao && (
            <div style={{ marginTop: "1rem" }}>
              <strong style={{ fontSize: "0.85rem" }}>Última versão gerada</strong>
              <VersaoLinha>
                <span>v{atual.ultima_versao}</span>
              </VersaoLinha>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <AcoesLinha>
            <PageButton type="button" $variant="outline" onClick={onClose}>
              Fechar
            </PageButton>
            <PageButton type="button" $variant="outline" disabled={salvando} onClick={handleSalvar}>
              {salvando ? "Salvando..." : "Salvar dados"}
            </PageButton>
            {podeConfirmar && (
              <PageButton type="button" disabled={confirmando} onClick={handleConfirmar}>
                {confirmando ? "Confirmando..." : "Confirmar preenchimento"}
              </PageButton>
            )}
            <PageButton type="button" disabled={gerando} onClick={handleGerar}>
              {gerando ? "Gerando..." : "Gerar rascunho"}
            </PageButton>
          </AcoesLinha>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
