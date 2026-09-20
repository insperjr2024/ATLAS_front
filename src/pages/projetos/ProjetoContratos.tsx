import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { camposFaltandoDoErro } from "@/lib/api";
import {
  abrirDocumento,
  analisarSolicitacao,
  atualizarDadosDocumento,
  baixarArquivoDocumento,
  baixarModeloColeta,
  confirmarPreenchimento,
  considerarAceitoPorPrazo,
  deletarDocumento,
  editarTexto,
  exportarAprovacao,
  extrairColeta,
  gerarDocumento,
  getDocumento,
  getDocumentosDoProjeto,
  getParagrafosEditaveis,
  getSolicitacoesAlteracao,
  getTiposDisponiveis,
  marcarAssinado,
  reanexarDocumento,
  recusarAssinaturaTep,
} from "@/lib/contratos";
import type {
  DocumentoContratual,
  LinkAprovacao,
  ParagrafoEditavel,
  SolicitacaoAlteracao,
  TipoDocumentoContratual,
} from "@/types/contratos";
import { ROTULO_STATUS_DOCUMENTO, ROTULO_TIPO_DOCUMENTO } from "@/types/contratos";
import { useProjeto } from "./ProjetoPage";
import { DadosDocumentoForm } from "./DadosDocumentoForm";
import { ConfirmarModal } from "@/components/ConfirmarModal";
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
import { FieldTextarea } from "../Bancas.styled";
import { ModalOverlay } from "@/styles/ModalOverlay";
import { ModalContent, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from "@/styles/modal.styled";
import {
  AcoesLinha,
  ArquivoBotao,
  ArquivoLinha,
  ArquivoNome,
  DocumentoLinha,
  DocumentoLista,
  DocumentoMeta,
  DocumentoTipo,
  LinkCaixa,
  LinkLinha,
  ParagrafoEditavelBloco,
  SolicitacaoCard,
  TiposDisponiveisRow,
  TrechoCitado,
  VersaoLinha,
} from "./ProjetoContratos.styled";

function tomDoStatus(status: DocumentoContratual["status"]): "default" | "success" | "muted" | "warning" | "danger" {
  if (status === "assinado_e_arquivado") return "success";
  if (status === "aprovado_pelo_cliente") return "success";
  if (status === "alteracao_solicitada") return "warning";
  if (status === "aguardando_preenchimento") return "muted";
  return "default";
}

//: A partir daqui os dados ficam travados — mesmo `STATUS_DADOS_TRAVADOS`
//: do backend (`status_documento_contratual.py`), pra esconder "Salvar
//: dados" antes de o backend precisar recusar.
const STATUS_DADOS_TRAVADOS = new Set(["aprovado_pelo_cliente", "assinado_e_arquivado"]);
//: Editar texto/reanexar só faz sentido com um rascunho em revisão — mesmo
//: `STATUS_EDICAO_TEXTO` do backend.
const STATUS_EDICAO_TEXTO = new Set(["em_revisao_interna", "alteracao_solicitada"]);

/**
 * ⭐ 2026-09-17/18 — aba Contratos (§ integração com a antiga plataforma
 * Contratos). `dados` é editado campo a campo por `DadosDocumentoForm.tsx` —
 * o shape muda por tipo (ver `render_template.py` no backend). A partir da
 * Fase 2, o modal também cobre o resto do ciclo: exportar pro cliente
 * aprovar, solicitação de alteração, edição manual do rascunho, marcar
 * assinado e Coleta de Dados.
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
          projetoId={projeto.id}
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
  projetoId,
  token,
  onClose,
  onMudou,
}: {
  documento: DocumentoContratual;
  projetoId: number;
  token: string;
  onClose: () => void;
  onMudou: () => Promise<void>;
}) {
  const [atual, setAtual] = useState(documento);
  const [dados, setDados] = useState<Record<string, unknown>>(() => documento.dados ?? {});
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  // Os caminhos ("assinatura.dia", "contratante.cnpj"...) da última recusa
  // de "campos obrigatórios" — destaca o campo certo no formulário em vez
  // de só listar o nome dele na mensagem de erro acima.
  const [camposFaltando, setCamposFaltando] = useState<string[]>([]);

  const [linkAprovacao, setLinkAprovacao] = useState<LinkAprovacao | null>(null);
  const [exportando, setExportando] = useState(false);
  const [recusandoAssinatura, setRecusandoAssinatura] = useState(false);
  const [marcandoAssinado, setMarcandoAssinado] = useState(false);
  const [considerandoAceito, setConsiderandoAceito] = useState(false);
  const [mostrarConfirmarApagar, setMostrarConfirmarApagar] = useState(false);
  const [baixando, setBaixando] = useState<"pdf" | "docx" | null>(null);

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAlteracao[]>([]);
  const [analisando, setAnalisando] = useState<number | null>(null);

  const [mostrarEditorTexto, setMostrarEditorTexto] = useState(false);
  const reanexarRef = useRef<HTMLInputElement>(null);
  const [reanexando, setReanexando] = useState(false);
  const coletaRef = useRef<HTMLInputElement>(null);
  const [extraindoColeta, setExtraindoColeta] = useState(false);
  const [pendenciasColeta, setPendenciasColeta] = useState<string[] | null>(null);

  useEffect(() => {
    if (atual.status === "alteracao_solicitada" || atual.status === "aguardando_aprovacao_cliente") {
      getSolicitacoesAlteracao(atual.id, token)
        .then(({ solicitacoes: s }) => setSolicitacoes(s))
        .catch(() => {});
    } else {
      setSolicitacoes([]);
    }
  }, [atual.status, atual.id, token]);

  async function handleSalvar() {
    setSalvando(true);
    setErro("");
    setCamposFaltando([]);
    try {
      const atualizado = await atualizarDadosDocumento(atual.id, dados, token);
      setAtual(atualizado);
      setDados(atualizado.dados ?? {});
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
    setCamposFaltando([]);
    try {
      const atualizado = await confirmarPreenchimento(atual.id, token);
      setAtual(atualizado);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao confirmar");
      setCamposFaltando(camposFaltandoDoErro(err) ?? []);
    } finally {
      setConfirmando(false);
    }
  }

  async function handleGerar() {
    setGerando(true);
    setErro("");
    setCamposFaltando([]);
    try {
      await gerarDocumento(atual.id, token);
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
      setLinkAprovacao(null);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar documento");
      setCamposFaltando(camposFaltandoDoErro(err) ?? []);
    } finally {
      setGerando(false);
    }
  }

  async function handleExportar() {
    setExportando(true);
    setErro("");
    try {
      const link = await exportarAprovacao(atual.id, token);
      setLinkAprovacao(link);
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao exportar para aprovação");
    } finally {
      setExportando(false);
    }
  }

  async function handleRecusarAssinatura() {
    setRecusandoAssinatura(true);
    setErro("");
    try {
      const link = await recusarAssinaturaTep(atual.id, token);
      setLinkAprovacao(link);
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar recusa de assinatura");
    } finally {
      setRecusandoAssinatura(false);
    }
  }

  async function handleMarcarAssinado() {
    setMarcandoAssinado(true);
    setErro("");
    try {
      const atualizado = await marcarAssinado(atual.id, token);
      setAtual(atualizado);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao marcar como assinado");
    } finally {
      setMarcandoAssinado(false);
    }
  }

  async function handleConsiderarAceito() {
    setConsiderandoAceito(true);
    setErro("");
    try {
      const atualizado = await considerarAceitoPorPrazo(atual.id, token);
      setAtual(atualizado);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao considerar aceito");
    } finally {
      setConsiderandoAceito(false);
    }
  }

  async function handleDeletar() {
    // Erro e "processando" ficam a cargo do próprio ConfirmarModal — ele
    // captura o que `onConfirmar` lançar e mostra dentro do modal.
    await deletarDocumento(atual.id, token);
    await onMudou();
    onClose();
  }

  async function handleAnalisar(solicitacaoId: number) {
    setAnalisando(solicitacaoId);
    try {
      const atualizada = await analisarSolicitacao(solicitacaoId, token);
      setSolicitacoes((atuais) => atuais.map((s) => (s.id === atualizada.id ? atualizada : s)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao analisar solicitação");
    } finally {
      setAnalisando(null);
    }
  }

  async function handleBaixar(formato: "pdf" | "docx") {
    setBaixando(formato);
    setErro("");
    try {
      await baixarArquivoDocumento(atual.id, formato, `${atual.tipo}_v${atual.ultima_versao}.${formato}`, token);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao baixar arquivo");
    } finally {
      setBaixando(null);
    }
  }

  async function handleReanexar(arquivo: File) {
    setReanexando(true);
    setErro("");
    try {
      await reanexarDocumento(atual.id, arquivo, token);
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
      setLinkAprovacao(null);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao reanexar documento");
    } finally {
      setReanexando(false);
      if (reanexarRef.current) reanexarRef.current.value = "";
    }
  }

  async function handleExtrairColeta(arquivo: File) {
    setExtraindoColeta(true);
    setErro("");
    setPendenciasColeta(null);
    try {
      const resultado = await extrairColeta(projetoId, atual.tipo, arquivo, token);
      setDados(resultado.dados);
      setPendenciasColeta(resultado.pendencias);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao extrair dados da Coleta");
    } finally {
      setExtraindoColeta(false);
      if (coletaRef.current) coletaRef.current.value = "";
    }
  }

  const dadosTravados = STATUS_DADOS_TRAVADOS.has(atual.status);
  const podeConfirmar = atual.status === "aguardando_preenchimento" && !atual.confirmado;
  const podeApagar = atual.status === "aguardando_preenchimento" && !atual.confirmado;
  const podeExportar = atual.status === "em_revisao_interna" && !!atual.ultima_versao;
  const podeEditarRascunho = STATUS_EDICAO_TEXTO.has(atual.status) && !!atual.ultima_versao;
  const ehTep = atual.tipo === "tep";
  const podeRecusarAssinatura = ehTep && atual.status === "aprovado_pelo_cliente";
  const podeMarcarAssinado = atual.status === "aprovado_pelo_cliente";
  const podeConsiderarAceito =
    ehTep && atual.status === "aprovado_pelo_cliente" && (atual.dias_restantes_aceite_tacito ?? 1) <= 0;

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <ModalContent $expandido onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="documento-titulo">
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
            {podeConsiderarAceito && <PageBadge $tone="warning">prazo de aceite tácito vencido</PageBadge>}
          </AcoesLinha>

          {erro && <ErrorText>{erro}</ErrorText>}

          {!dadosTravados && (
            <ArquivoLinha style={{ marginBottom: "1rem" }}>
              <PageButtonSm
                type="button"
                $variant="outline"
                onClick={() =>
                  baixarModeloColeta(token).catch((err) =>
                    setErro(err instanceof Error ? err.message : "Erro ao baixar o modelo"),
                  )
                }
              >
                Baixar modelo da Coleta de Dados
              </PageButtonSm>
              <ArquivoBotao htmlFor="coleta-dados-upload">
                {extraindoColeta ? "Extraindo..." : "Preencher a partir da Coleta de Dados"}
                <input
                  ref={coletaRef}
                  id="coleta-dados-upload"
                  type="file"
                  accept=".docx"
                  disabled={extraindoColeta}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) handleExtrairColeta(arquivo);
                  }}
                />
              </ArquivoBotao>
              <ArquivoNome $vazio>.docx preenchido pelo cliente — só pré-preenche, você ainda revisa e confirma</ArquivoNome>
            </ArquivoLinha>
          )}

          {pendenciasColeta && pendenciasColeta.length > 0 && (
            <ErrorBlock style={{ marginBottom: "1rem" }}>
              <strong style={{ fontSize: "0.85rem" }}>A Coleta não trouxe {pendenciasColeta.length} campo(s):</strong>
              {pendenciasColeta.map((p, i) => (
                <ErrorText key={i}>{p}</ErrorText>
              ))}
            </ErrorBlock>
          )}

          {dadosTravados ? (
            <EmptyText>O cliente já aprovou este documento — os dados não podem mais ser editados.</EmptyText>
          ) : (
            <DadosDocumentoForm
              tipo={atual.tipo}
              dados={dados}
              onChange={setDados}
              camposFaltando={camposFaltando}
            />
          )}

          {!!atual.ultima_versao && (
            <div style={{ marginTop: "1rem" }}>
              <strong style={{ fontSize: "0.85rem" }}>Última versão gerada</strong>
              <VersaoLinha>
                <span>v{atual.ultima_versao}</span>
                <AcoesLinha>
                  <PageButtonSm type="button" $variant="outline" disabled={baixando === "pdf"} onClick={() => handleBaixar("pdf")}>
                    {baixando === "pdf" ? "Baixando..." : "Baixar PDF"}
                  </PageButtonSm>
                  <PageButtonSm type="button" $variant="outline" disabled={baixando === "docx"} onClick={() => handleBaixar("docx")}>
                    {baixando === "docx" ? "Baixando..." : "Baixar .docx"}
                  </PageButtonSm>
                </AcoesLinha>
              </VersaoLinha>
            </div>
          )}

          {linkAprovacao && (
            <LinkCaixa style={{ marginTop: "1rem" }}>
              <strong style={{ fontSize: "0.85rem" }}>Link de aprovação pronto para enviar</strong>
              <CopiarLinkLinha rotulo="Link de aprovação" valor={linkAprovacao.link_aprovacao} />
              {linkAprovacao.link_whatsapp ? (
                <PageButton
                  as="a"
                  href={linkAprovacao.link_whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  $variant="outline"
                  type="button"
                >
                  Abrir mensagem pronta no WhatsApp
                </PageButton>
              ) : (
                <EmptyText>
                  Sem telefone do representante cadastrado — copie o link acima e envie por conta própria.
                </EmptyText>
              )}
            </LinkCaixa>
          )}

          {solicitacoes.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <strong style={{ fontSize: "0.85rem" }}>Pedidos de alteração do cliente</strong>
              {solicitacoes.map((s) => (
                <SolicitacaoCard key={s.id} style={{ marginTop: "0.5rem" }}>
                  <AcoesLinha>
                    <PageBadge $tone={s.status === "pendente" ? "warning" : "success"}>
                      {s.status === "pendente" ? "pendente" : "analisada"}
                    </PageBadge>
                  </AcoesLinha>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>{s.texto}</p>
                  {s.trechos.map((t, i) => (
                    <TrechoCitado key={i}>{t}</TrechoCitado>
                  ))}
                  {s.status === "pendente" && (
                    <PageButtonSm
                      type="button"
                      $variant="outline"
                      disabled={analisando === s.id}
                      onClick={() => handleAnalisar(s.id)}
                      style={{ alignSelf: "flex-start" }}
                    >
                      {analisando === s.id ? "Marcando..." : "Marcar como analisada"}
                    </PageButtonSm>
                  )}
                </SolicitacaoCard>
              ))}
            </div>
          )}

          {podeEditarRascunho && (
            <AcoesLinha style={{ marginTop: "1rem" }}>
              <PageButtonSm type="button" $variant="outline" onClick={() => setMostrarEditorTexto(true)}>
                Editar texto do rascunho
              </PageButtonSm>
              <ArquivoBotao htmlFor="reanexar-docx">
                {reanexando ? "Enviando..." : "Reanexar .docx editado"}
                <input
                  ref={reanexarRef}
                  id="reanexar-docx"
                  type="file"
                  accept=".docx"
                  disabled={reanexando}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) handleReanexar(arquivo);
                  }}
                />
              </ArquivoBotao>
            </AcoesLinha>
          )}
        </ModalBody>
        <ModalFooter>
          <AcoesLinha>
            <PageButton type="button" $variant="outline" onClick={onClose}>
              Fechar
            </PageButton>
            {!dadosTravados && (
              <PageButton type="button" $variant="outline" disabled={salvando} onClick={handleSalvar}>
                {salvando ? "Salvando..." : "Salvar dados"}
              </PageButton>
            )}
            {podeConfirmar && (
              <PageButton type="button" disabled={confirmando} onClick={handleConfirmar}>
                {confirmando ? "Confirmando..." : "Confirmar preenchimento"}
              </PageButton>
            )}
            {podeApagar && (
              <PageButton type="button" $variant="outline" onClick={() => setMostrarConfirmarApagar(true)}>
                Apagar documento
              </PageButton>
            )}
            {!dadosTravados && (
              <PageButton type="button" disabled={gerando} onClick={handleGerar}>
                {gerando ? "Gerando..." : "Gerar rascunho"}
              </PageButton>
            )}
            {podeExportar && (
              <PageButton type="button" disabled={exportando} onClick={handleExportar}>
                {exportando ? "Preparando..." : "Preparar envio ao cliente"}
              </PageButton>
            )}
            {podeRecusarAssinatura && (
              <PageButton type="button" $variant="outline" disabled={recusandoAssinatura} onClick={handleRecusarAssinatura}>
                {recusandoAssinatura ? "Registrando..." : "Cliente recusou assinar"}
              </PageButton>
            )}
            {podeMarcarAssinado && (
              <PageButton type="button" disabled={marcandoAssinado} onClick={handleMarcarAssinado}>
                {marcandoAssinado ? "Marcando..." : "Marcar como assinado"}
              </PageButton>
            )}
            {podeConsiderarAceito && (
              <PageButton type="button" disabled={considerandoAceito} onClick={handleConsiderarAceito}>
                {considerandoAceito ? "Marcando..." : "Considerar assinado (prazo vencido)"}
              </PageButton>
            )}
          </AcoesLinha>
        </ModalFooter>
      </ModalContent>

      {mostrarEditorTexto && (
        <EditarTextoModal documentoId={atual.id} token={token} onClose={() => setMostrarEditorTexto(false)} />
      )}

      {mostrarConfirmarApagar && (
        <ConfirmarModal
          titulo="Apagar documento"
          mensagem={`Isso apaga o ${ROTULO_TIPO_DOCUMENTO[atual.tipo]} deste projeto — só é possível porque ele ainda não foi confirmado. Não tem como desfazer.`}
          rotuloConfirmar="Apagar"
          rotuloProcessando="Apagando…"
          onConfirmar={handleDeletar}
          onCancelar={() => setMostrarConfirmarApagar(false)}
        />
      )}
    </ModalOverlay>
  );
}

function CopiarLinkLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(valor);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <LinkLinha>
      <code>{valor}</code>
      <PageButtonSm type="button" $variant="outline" onClick={copiar} aria-label={`Copiar ${rotulo}`}>
        {copiado ? "Copiado!" : "Copiar"}
      </PageButtonSm>
    </LinkLinha>
  );
}

function EditarTextoModal({
  documentoId,
  token,
  onClose,
}: {
  documentoId: number;
  token: string;
  onClose: () => void;
}) {
  const [paragrafos, setParagrafos] = useState<ParagrafoEditavel[] | null>(null);
  const [edicoes, setEdicoes] = useState<Record<number, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getParagrafosEditaveis(documentoId, token)
      .then(({ paragrafos: p }) => setParagrafos(p))
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar o texto"))
      .finally(() => setCarregando(false));
  }, [documentoId, token]);

  async function handleSalvar() {
    if (Object.keys(edicoes).length === 0) {
      onClose();
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await editarTexto(documentoId, edicoes, token);
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar o texto");
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <ModalContent $expandido onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="editar-texto-titulo">
        <ModalHeader>
          <ModalTitle id="editar-texto-titulo">Editar texto do rascunho</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            ×
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          {erro && <ErrorText>{erro}</ErrorText>}
          {carregando ? (
            <PageLoadingBlock />
          ) : (
            paragrafos?.map((p) => (
              <ParagrafoEditavelBloco key={p.ref}>
                <FieldTextarea
                  rows={3}
                  value={edicoes[p.ref] ?? p.texto}
                  onChange={(e) => setEdicoes((atuais) => ({ ...atuais, [p.ref]: e.target.value }))}
                />
              </ParagrafoEditavelBloco>
            ))
          )}
        </ModalBody>
        <ModalFooter>
          <AcoesLinha>
            <PageButton type="button" $variant="outline" onClick={onClose} disabled={salvando}>
              Cancelar
            </PageButton>
            <PageButton type="button" disabled={salvando || carregando} onClick={handleSalvar}>
              {salvando ? "Salvando..." : "Salvar texto"}
            </PageButton>
          </AcoesLinha>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
