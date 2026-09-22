import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { abrirDocumento } from "@/lib/contratos";
import { createProjetoInstitucional, getProjetos } from "@/lib/projetos";
import type { TipoDocumentoContratual } from "@/types/contratos";
import { ROTULO_TIPO_DOCUMENTO } from "@/types/contratos";
import type { ProjetoResumo } from "@/types/projeto";
import { ModalOverlay } from "@/styles/ModalOverlay";
import { ModalContent, ModalHeader, ModalTitle, ModalClose, ModalBody } from "@/styles/modal.styled";
import { PageButton, ErrorText, EmptyText } from "@/styles/page.styled";
import { FieldGroup, FieldLabel, FieldInput } from "./Bancas.styled";

const TIPOS: TipoDocumentoContratual[] = ["contrato", "tep", "nda", "uso_imagem", "aditivo"];

type Passo = "tipo" | "projeto" | "institucional";

/**
 * ⭐ 2026-09-21 — a pedido: criar projeto deixou de existir como ação solta
 * em `/projetos` — todo projeto nasce de um contrato. Este assistente é o
 * único ponto de entrada: escolhe o TIPO de contrato primeiro, e só depois
 * pergunta o que ele precisa. Contrato de Prestação também pode ser
 * institucional (Agro etc. às vezes formaliza a parceria com um Contrato
 * de PS de verdade, não só NDA/TEP) — por isso ele ganha as MESMAS três
 * opções dos outros tipos: projeto de entrega novo, projeto já existente
 * (TEP/NDA/Uso de Imagem/Aditivo apenas — um Contrato de PS não se pendura
 * num projeto que já tem um), ou institucional (só um nome).
 */
export function NovoContratoModal({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [passo, setPasso] = useState<Passo>("tipo");
  const [tipo, setTipo] = useState<TipoDocumentoContratual | null>(null);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(false);

  const [projetos, setProjetos] = useState<ProjetoResumo[] | null>(null);
  const [busca, setBusca] = useState("");

  const [nomeInstitucional, setNomeInstitucional] = useState("");
  const [clienteInstitucional, setClienteInstitucional] = useState("");

  useEffect(() => {
    if (passo !== "projeto" || tipo === "contrato" || !token || projetos !== null) return;
    getProjetos(token)
      .then((lista) => setProjetos(lista.filter((p) => !p.institucional)))
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar projetos"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, token]);

  function escolherTipo(tipoEscolhido: TipoDocumentoContratual) {
    setErro("");
    setTipo(tipoEscolhido);
    setPasso("projeto");
  }

  async function abrirNoProjeto(projetoId: number) {
    if (!token || !tipo) return;
    setProcessando(true);
    setErro("");
    try {
      const documento = await abrirDocumento(projetoId, tipo, token);
      navigate(`/contratos/${documento.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao abrir o documento");
    } finally {
      setProcessando(false);
    }
  }

  async function criarInstitucionalEAbrir() {
    if (!token || !tipo || !nomeInstitucional.trim()) return;
    setProcessando(true);
    setErro("");
    try {
      const projeto = await createProjetoInstitucional(
        { nome: nomeInstitucional.trim(), cliente: clienteInstitucional.trim() || null },
        token,
      );
      const documento = await abrirDocumento(projeto.id, tipo, token);
      navigate(`/contratos/${documento.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar o contrato institucional");
    } finally {
      setProcessando(false);
    }
  }

  const projetosFiltrados = (projetos ?? []).filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <ModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="novo-contrato-titulo">
        <ModalHeader>
          <ModalTitle id="novo-contrato-titulo">
            {passo === "tipo" ? "Novo contrato" : `${ROTULO_TIPO_DOCUMENTO[tipo!]}`}
          </ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            ×
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          {erro && <ErrorText>{erro}</ErrorText>}

          {passo === "tipo" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted-foreground, inherit)" }}>
                Que tipo de contrato?
              </p>
              {TIPOS.map((t) => (
                <PageButton key={t} type="button" $variant="outline" onClick={() => escolherTipo(t)}>
                  {ROTULO_TIPO_DOCUMENTO[t]}
                </PageButton>
              ))}
            </div>
          )}

          {passo === "projeto" && tipo === "contrato" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <PageButton type="button" $variant="outline" onClick={() => navigate("/projetos/novo")}>
                Projeto de entrega novo (frentes, equipe, escopos)
              </PageButton>
              <PageButton type="button" $variant="outline" onClick={() => setPasso("institucional")}>
                É um contrato institucional (sem projeto de entrega)
              </PageButton>
              <PageButton type="button" $variant="outline" onClick={() => setPasso("tipo")}>
                Voltar
              </PageButton>
            </div>
          )}

          {passo === "projeto" && tipo !== "contrato" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <FieldInput
                placeholder="Buscar projeto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoFocus
              />
              <div style={{ maxHeight: "16rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {projetos === null ? (
                  <EmptyText>Carregando...</EmptyText>
                ) : projetosFiltrados.length === 0 ? (
                  <EmptyText>Nenhum projeto encontrado.</EmptyText>
                ) : (
                  projetosFiltrados.map((p) => (
                    <PageButton
                      key={p.id}
                      type="button"
                      $variant="outline"
                      disabled={processando}
                      onClick={() => abrirNoProjeto(p.id)}
                      style={{ justifyContent: "flex-start" }}
                    >
                      {p.nome}
                      {p.cliente ? ` · ${p.cliente}` : ""}
                    </PageButton>
                  ))
                )}
              </div>
              <PageButton type="button" $variant="outline" onClick={() => setPasso("institucional")}>
                É um contrato institucional (sem projeto de entrega)
              </PageButton>
              <PageButton type="button" $variant="outline" onClick={() => setPasso("tipo")}>
                Voltar
              </PageButton>
            </div>
          )}

          {passo === "institucional" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <FieldGroup>
                <FieldLabel htmlFor="nome-institucional">Nome do projeto</FieldLabel>
                <FieldInput
                  id="nome-institucional"
                  value={nomeInstitucional}
                  onChange={(e) => setNomeInstitucional(e.target.value)}
                  autoFocus
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="cliente-institucional">Cliente (opcional)</FieldLabel>
                <FieldInput
                  id="cliente-institucional"
                  value={clienteInstitucional}
                  onChange={(e) => setClienteInstitucional(e.target.value)}
                />
              </FieldGroup>
              <PageButton
                type="button"
                disabled={processando || !nomeInstitucional.trim()}
                onClick={criarInstitucionalEAbrir}
              >
                {processando ? "Criando..." : "Criar e preencher o contrato"}
              </PageButton>
              <PageButton type="button" $variant="outline" onClick={() => setPasso("projeto")}>
                Voltar
              </PageButton>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}
