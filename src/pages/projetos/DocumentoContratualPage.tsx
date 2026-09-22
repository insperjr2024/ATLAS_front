import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { camposFaltandoDoErro } from "@/lib/api";
import { ETAPAS_DOCUMENTO, indiceDaEtapaDocumento } from "@/lib/contratos-etapas";
import {
  analisarSolicitacao,
  aprovarInternamente,
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
  getParagrafosEditaveis,
  getSolicitacoesAlteracao,
  marcarAssinado,
  montarLinkWhatsapp,
  reanexarDocumento,
  recusarAssinaturaTep,
} from "@/lib/contratos";
import type { DocumentoContratual, LinkAprovacao, ParagrafoEditavel, SolicitacaoAlteracao } from "@/types/contratos";
import { ROTULO_STATUS_DOCUMENTO, ROTULO_TIPO_DOCUMENTO } from "@/types/contratos";
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
import { FieldInput, FieldLabel, FieldTextarea } from "../Bancas.styled";
import { ModalOverlay } from "@/styles/ModalOverlay";
import { ModalContent, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from "@/styles/modal.styled";
import {
  AcoesLinha,
  AcaoPrincipalBarra,
  AcoesSecundariasLinha,
  ArquivoBotao,
  ArquivoLinha,
  ArquivoNome,
  DocumentoPaginaHeader,
  DocumentoPaginaTitulo,
  VoltarLink,
  Etapas,
  Etapa,
  EtapaMarca,
  LinkCaixa,
  LinkDiscreto,
  LinkLinha,
  ParagrafoEditavelBloco,
  SolicitacaoCard,
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

/** Só um chute inicial pro campo de telefone do WhatsApp — quem manda ainda
 *  pode trocar antes de abrir a mensagem (ver `montarLinkWhatsapp`). */
function telefoneRepresentante(dados: Record<string, unknown>): string {
  const contratante = dados.contratante as Record<string, unknown> | undefined;
  const representante = contratante?.representante as Record<string, unknown> | undefined;
  const telefone = representante?.telefone;
  return typeof telefone === "string" ? telefone : "";
}

const STATUS_DADOS_TRAVADOS = new Set(["aprovado_pelo_cliente", "assinado_e_arquivado"]);
const STATUS_EDICAO_TEXTO = new Set(["em_revisao_interna", "aprovado_internamente", "alteracao_solicitada"]);
const STATUS_GERACAO_PERMITIDA = new Set([
  "aguardando_preenchimento",
  "em_revisao_interna",
  "aprovado_internamente",
  "alteracao_solicitada",
]);

const ETAPAS = ETAPAS_DOCUMENTO;
const indiceDaEtapa = indiceDaEtapaDocumento;

/**
 * ⭐ 2026-09-21 — a tela de um documento jurídico, como página própria (não
 * modal): o Contratos antigo era um produto à parte, com uma tela cheia por
 * fluxo — comprimir tudo isso num modal genérico do resto do ATLAS deixava
 * a experiência mais pobre do que o que já existia. O stepper no topo é a
 * mesma ideia visual do `DetalheContrato.tsx` de lá.
 */
export function DocumentoContratualPage() {
  const { documentoId: documentoIdParam } = useParams<{ documentoId: string }>();
  const documentoId = Number(documentoIdParam);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [atual, setAtual] = useState<DocumentoContratual | null>(null);
  const [dados, setDados] = useState<Record<string, unknown>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [aprovandoInternamente, setAprovandoInternamente] = useState(false);
  const [erro, setErro] = useState("");
  const [camposFaltando, setCamposFaltando] = useState<string[]>([]);

  const [linkAprovacao, setLinkAprovacao] = useState<LinkAprovacao | null>(null);
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState("");
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
    if (!token || !documentoId) return;
    getDocumento(documentoId, token)
      .then((doc) => {
        setAtual(doc);
        setDados(doc.dados ?? {});
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar documento"))
      .finally(() => setCarregando(false));
  }, [documentoId, token]);

  useEffect(() => {
    if (!atual || !token) return;
    if (atual.status === "alteracao_solicitada" || atual.status === "aguardando_aprovacao_cliente") {
      getSolicitacoesAlteracao(atual.id, token)
        .then(({ solicitacoes: s }) => setSolicitacoes(s))
        .catch(() => {});
    } else {
      setSolicitacoes([]);
    }
  }, [atual, token]);

  function voltar() {
    // A aba Contratos por projeto não existe mais — o único ponto de
    // entrada é a Kanban de nível de menu (`/contratos`).
    navigate("/contratos");
  }

  async function handleSalvar() {
    if (!atual || !token) return;
    setSalvando(true);
    setErro("");
    setCamposFaltando([]);
    try {
      const atualizado = await atualizarDadosDocumento(atual.id, dados, token);
      setAtual(atualizado);
      setDados(atualizado.dados ?? {});
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar dados");
    } finally {
      setSalvando(false);
    }
  }

  async function handleConfirmar() {
    if (!atual || !token) return;
    setConfirmando(true);
    setErro("");
    setCamposFaltando([]);
    try {
      const salvo = await atualizarDadosDocumento(atual.id, dados, token);
      const atualizado = await confirmarPreenchimento(salvo.id, token);
      setAtual(atualizado);
      setDados(atualizado.dados ?? {});
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao confirmar");
      setCamposFaltando(camposFaltandoDoErro(err) ?? []);
    } finally {
      setConfirmando(false);
    }
  }

  async function handleGerar() {
    if (!atual || !token) return;
    setGerando(true);
    setErro("");
    setCamposFaltando([]);
    try {
      await atualizarDadosDocumento(atual.id, dados, token);
      await gerarDocumento(atual.id, token);
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
      setDados(recarregado.dados ?? {});
      setLinkAprovacao(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar documento");
      setCamposFaltando(camposFaltandoDoErro(err) ?? []);
    } finally {
      setGerando(false);
    }
  }

  async function handleAprovarInternamente() {
    if (!atual || !token) return;
    setAprovandoInternamente(true);
    setErro("");
    try {
      const atualizado = await aprovarInternamente(atual.id, token);
      setAtual(atualizado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao aprovar internamente");
    } finally {
      setAprovandoInternamente(false);
    }
  }

  async function handleExportar() {
    if (!atual || !token) return;
    setExportando(true);
    setErro("");
    try {
      const link = await exportarAprovacao(atual.id, token);
      setLinkAprovacao(link);
      setTelefoneWhatsapp(telefoneRepresentante(dados));
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao exportar para aprovação");
    } finally {
      setExportando(false);
    }
  }

  async function handleRecusarAssinatura() {
    if (!atual || !token) return;
    setRecusandoAssinatura(true);
    setErro("");
    try {
      const link = await recusarAssinaturaTep(atual.id, token);
      setLinkAprovacao(link);
      setTelefoneWhatsapp(telefoneRepresentante(dados));
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar recusa de assinatura");
    } finally {
      setRecusandoAssinatura(false);
    }
  }

  async function handleMarcarAssinado() {
    if (!atual || !token) return;
    setMarcandoAssinado(true);
    setErro("");
    try {
      const atualizado = await marcarAssinado(atual.id, token);
      setAtual(atualizado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao marcar como assinado");
    } finally {
      setMarcandoAssinado(false);
    }
  }

  async function handleConsiderarAceito() {
    if (!atual || !token) return;
    setConsiderandoAceito(true);
    setErro("");
    try {
      const atualizado = await considerarAceitoPorPrazo(atual.id, token);
      setAtual(atualizado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao considerar aceito");
    } finally {
      setConsiderandoAceito(false);
    }
  }

  async function handleDeletar() {
    if (!atual || !token) return;
    await deletarDocumento(atual.id, token);
    voltar();
  }

  async function handleAnalisar(solicitacaoId: number) {
    if (!token) return;
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
    if (!atual || !token) return;
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
    if (!atual || !token) return;
    setReanexando(true);
    setErro("");
    try {
      await reanexarDocumento(atual.id, arquivo, token);
      const recarregado = await getDocumento(atual.id, token);
      setAtual(recarregado);
      setLinkAprovacao(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao reanexar documento");
    } finally {
      setReanexando(false);
      if (reanexarRef.current) reanexarRef.current.value = "";
    }
  }

  async function handleExtrairColeta(arquivo: File) {
    if (!atual || !token || !atual.projeto_id) return;
    setExtraindoColeta(true);
    setErro("");
    setPendenciasColeta(null);
    try {
      const resultado = await extrairColeta(atual.projeto_id, atual.tipo, arquivo, token);
      setDados(resultado.dados);
      setPendenciasColeta(resultado.pendencias);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao extrair dados da Coleta");
    } finally {
      setExtraindoColeta(false);
      if (coletaRef.current) coletaRef.current.value = "";
    }
  }

  if (carregando) return <PageLoadingBlock />;

  if (!atual) {
    return (
      <ErrorBlock>
        <ErrorText>{erro || "Documento não encontrado."}</ErrorText>
        <PageButton $variant="outline" onClick={voltar}>
          Voltar
        </PageButton>
      </ErrorBlock>
    );
  }

  const dadosTravados = STATUS_DADOS_TRAVADOS.has(atual.status);
  const podeConfirmar = atual.status === "aguardando_preenchimento" && !atual.confirmado;
  const podeApagar = atual.status === "aguardando_preenchimento" && !atual.confirmado;
  const podeAprovarInternamente = atual.status === "em_revisao_interna" && !!atual.ultima_versao;
  const podeExportar = atual.status === "aprovado_internamente" && !!atual.ultima_versao;
  const podeGerar =
    STATUS_GERACAO_PERMITIDA.has(atual.status) && !podeConfirmar && !podeAprovarInternamente && !podeExportar;
  const podeEditarRascunho = STATUS_EDICAO_TEXTO.has(atual.status) && !!atual.ultima_versao;
  const ehTep = atual.tipo === "tep";
  const podeRecusarAssinatura = ehTep && atual.status === "aprovado_pelo_cliente";
  const podeMarcarAssinado = atual.status === "aprovado_pelo_cliente";
  const podeConsiderarAceito =
    ehTep && atual.status === "aprovado_pelo_cliente" && (atual.dias_restantes_aceite_tacito ?? 1) <= 0;
  const etapaAtual = indiceDaEtapa(atual);

  return (
    <PageStack>
      <DocumentoPaginaHeader>
        <DocumentoPaginaTitulo>
          <div>
            <VoltarLink type="button" onClick={voltar}>
              <ArrowLeft size={14} /> Contratos
            </VoltarLink>
            <h1>{ROTULO_TIPO_DOCUMENTO[atual.tipo]}</h1>
            {atual.projeto_id ? (
              <LinkDiscreto as={Link} to={`/projetos/${atual.projeto_id}`}>
                {atual.projeto_nome}
                {atual.projeto_cliente ? ` · ${atual.projeto_cliente}` : ""}
              </LinkDiscreto>
            ) : (
              // Institucional: sem projeto de verdade, sem link — só o texto.
              <span>
                {atual.projeto_nome}
                {atual.projeto_cliente ? ` · ${atual.projeto_cliente}` : ""}
              </span>
            )}
          </div>
        </DocumentoPaginaTitulo>
        <AcoesLinha>
          <PageBadge $tone={tomDoStatus(atual.status)}>{ROTULO_STATUS_DOCUMENTO[atual.status]}</PageBadge>
          {podeConsiderarAceito && <PageBadge $tone="warning">prazo de aceite tácito vencido</PageBadge>}
        </AcoesLinha>
      </DocumentoPaginaHeader>

      <PageCard>
        <PageCardContent>
          <Etapas>
            {ETAPAS.map((rotulo, i) => {
              const estado = i < etapaAtual ? "concluida" : i === etapaAtual ? "atual" : "pendente";
              return (
                <Etapa key={rotulo} $estado={estado}>
                  <EtapaMarca $estado={estado}>{estado === "concluida" ? "✓" : i + 1}</EtapaMarca>
                  {rotulo}
                </Etapa>
              );
            })}
          </Etapas>
        </PageCardContent>
      </PageCard>

      {erro && (
        <ErrorBlock>
          <ErrorText>{erro}</ErrorText>
        </ErrorBlock>
      )}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Dados do documento</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {/* Coleta de Dados é herança da antiga plataforma externa — só faz
              sentido com um projeto de verdade por trás. Institucional
              (sem projeto) não tem de onde vir esse .docx. */}
          {!dadosTravados && atual.projeto_id && (
            <ArquivoLinha style={{ marginBottom: "1rem" }}>
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
              <ArquivoNome $vazio>
                .docx preenchido pelo cliente — só pré-preenche (
                <LinkDiscreto
                  type="button"
                  onClick={() =>
                    baixarModeloColeta(token!).catch((err) =>
                      setErro(err instanceof Error ? err.message : "Erro ao baixar o modelo"),
                    )
                  }
                >
                  baixar modelo em branco
                </LinkDiscreto>
                )
              </ArquivoNome>
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
              projetoId={atual.projeto_id}
              token={token}
            />
          )}
        </PageCardContent>
      </PageCard>

      {!!atual.ultima_versao && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Rascunho gerado</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
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
            {podeEditarRascunho && (
              <AcoesLinha style={{ marginTop: "0.75rem" }}>
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
          </PageCardContent>
        </PageCard>
      )}

      {linkAprovacao && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Link de aprovação pronto para enviar</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <LinkCaixa>
              <CopiarLinkLinha rotulo="Link de aprovação" valor={linkAprovacao.link_aprovacao} />
              <div>
                <FieldLabel htmlFor="telefone-whatsapp">Número de WhatsApp de quem vai receber</FieldLabel>
                <AcoesLinha style={{ marginTop: "0.375rem" }}>
                  <FieldInput
                    id="telefone-whatsapp"
                    style={{ maxWidth: "14rem" }}
                    placeholder="(11) 99999-8888"
                    value={telefoneWhatsapp}
                    onChange={(e) => setTelefoneWhatsapp(e.target.value)}
                  />
                  <PageButton
                    as="a"
                    href={
                      telefoneWhatsapp.replace(/\D/g, "")
                        ? montarLinkWhatsapp(telefoneWhatsapp, linkAprovacao.mensagem_whatsapp)
                        : undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    $variant="outline"
                    type="button"
                    aria-disabled={!telefoneWhatsapp.replace(/\D/g, "")}
                    onClick={(e) => {
                      if (!telefoneWhatsapp.replace(/\D/g, "")) e.preventDefault();
                    }}
                  >
                    Abrir mensagem pronta no WhatsApp
                  </PageButton>
                </AcoesLinha>
              </div>
            </LinkCaixa>
          </PageCardContent>
        </PageCard>
      )}

      {solicitacoes.length > 0 && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Pedidos de alteração do cliente</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {solicitacoes.map((s) => (
              <SolicitacaoCard key={s.id} style={{ marginBottom: "0.5rem" }}>
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
          </PageCardContent>
        </PageCard>
      )}

      <AcaoPrincipalBarra>
        <div>
          {atual.status === "aguardando_aprovacao_cliente" && (
            <EmptyText style={{ margin: 0 }}>Aguardando o cliente responder pelo link enviado.</EmptyText>
          )}
          {atual.status === "assinado_e_arquivado" && <EmptyText style={{ margin: 0 }}>Documento arquivado.</EmptyText>}
        </div>
        <AcoesLinha>
          {podeConfirmar && (
            <PageButton type="button" disabled={confirmando} onClick={handleConfirmar}>
              {confirmando ? "Confirmando..." : "Confirmar preenchimento"}
            </PageButton>
          )}
          {podeGerar && (
            <PageButton type="button" disabled={gerando} onClick={handleGerar}>
              {gerando ? "Gerando..." : "Gerar rascunho"}
            </PageButton>
          )}
          {podeAprovarInternamente && (
            <PageButton type="button" disabled={aprovandoInternamente} onClick={handleAprovarInternamente}>
              {aprovandoInternamente ? "Aprovando..." : "Aprovar internamente"}
            </PageButton>
          )}
          {podeExportar && (
            <PageButton type="button" disabled={exportando} onClick={handleExportar}>
              {exportando ? "Preparando..." : "Preparar envio ao cliente"}
            </PageButton>
          )}
          {podeMarcarAssinado && (
            <PageButton type="button" disabled={marcandoAssinado} onClick={handleMarcarAssinado}>
              {marcandoAssinado ? "Marcando..." : "Marcar como assinado"}
            </PageButton>
          )}
          {podeRecusarAssinatura && (
            <PageButton type="button" $variant="outline" disabled={recusandoAssinatura} onClick={handleRecusarAssinatura}>
              {recusandoAssinatura ? "Registrando..." : "Cliente recusou assinar"}
            </PageButton>
          )}
          {podeConsiderarAceito && (
            <PageButton type="button" disabled={considerandoAceito} onClick={handleConsiderarAceito}>
              {considerandoAceito ? "Marcando..." : "Considerar assinado (prazo vencido)"}
            </PageButton>
          )}
        </AcoesLinha>
      </AcaoPrincipalBarra>

      <AcoesSecundariasLinha>
        <PageButtonSm type="button" $variant="outline" onClick={voltar}>
          Voltar
        </PageButtonSm>
        {!dadosTravados && (
          <PageButtonSm type="button" $variant="outline" disabled={salvando} onClick={handleSalvar}>
            {salvando ? "Salvando..." : "Salvar dados"}
          </PageButtonSm>
        )}
        {podeApagar && (
          <PageButtonSm type="button" $variant="outline" onClick={() => setMostrarConfirmarApagar(true)}>
            Apagar documento
          </PageButtonSm>
        )}
      </AcoesSecundariasLinha>

      {mostrarEditorTexto && (
        <EditarTextoModal documentoId={atual.id} token={token!} onClose={() => setMostrarEditorTexto(false)} />
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
    </PageStack>
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

function EditarTextoModal({ documentoId, token, onClose }: { documentoId: number; token: string; onClose: () => void }) {
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
