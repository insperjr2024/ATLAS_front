import { useState } from "react";
import styled from "styled-components";
import { Paperclip } from "lucide-react";
import { theme } from "@/styles/theme";
import {
  baixarEntregaArquivoBanca,
  registrarEntregaLinkBanca,
  registrarLocalBanca,
  removerEntregaBanca,
  subirEntregaArquivoBanca,
} from "@/lib/bancas";
import { paraDataUtc } from "@/lib/projetos";
import { PageButtonSm } from "@/styles/page.styled";
import { FieldInput, FormErrorText } from "@/pages/Bancas.styled";
import { ArquivoBotao } from "@/pages/projetos/ProjetoNovo.styled";

/** O mínimo que o bloco precisa da banca — serve tanto o `Banca` da lista
 *  quanto o `BancaDetalhes` da ficha. */
export interface BancaLocalEntrega {
  id: number;
  local: string | null;
  entrega_link: string | null;
  entrega_arquivo_nome: string | null;
  data_hora: string | null;
}

const Secao = styled.section`
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: ${theme.fontSize.sm};
`;

const Titulo = styled.strong`
  font-size: ${theme.fontSize.xs};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

const Linha = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const Rotulo = styled.span`
  color: ${theme.colors.mutedForeground};
  flex-shrink: 0;
`;

const Valor = styled.span`
  color: ${theme.colors.foreground};
  min-width: 0;
  word-break: break-word;
`;

/** Ação secundária, discreta — "anexar", "trocar", "remover". */
const Acao = styled.button`
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.primary};
  text-decoration: underline;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const InputCurto = styled(FieldInput)`
  flex: 1;
  min-width: 11rem;
`;

/**
 * ⭐ Local da banca + anexo da entrega (2026-09-10, a pedido).
 *
 * Editam: quem é do PROJETO avaliado (consultor/coordenador) e a DIRETORIA de
 * projetos (`podeMexer`, a mesma conta do backend `_exigir_pode_mexer`). O
 * local tranca 1h antes da banca; a entrega vai a qualquer momento. O resto
 * vê em leitura.
 *
 * Compacto de propósito: uma linha por campo, controles de anexo atrás de um
 * toggle. Compartilhado pela aba Banca do projeto e pelo "ver mais" de
 * `/bancas`.
 */
export function LocalEEntregaBloco({
  banca,
  podeMexer,
  token,
  onMudou,
}: {
  banca: BancaLocalEntrega;
  podeMexer: boolean;
  token: string | null;
  onMudou: () => Promise<void>;
}) {
  const [local, setLocal] = useState(banca.local ?? "");
  const [linkEntrega, setLinkEntrega] = useState("");
  const [anexoAberto, setAnexoAberto] = useState(false);
  const [salvandoLocal, setSalvandoLocal] = useState(false);
  const [salvandoEntrega, setSalvandoEntrega] = useState(false);
  const [erro, setErro] = useState("");

  // Tranca 1h antes — mesma regra do backend. Sem data marcada: livre.
  // `Date.now()` num inicializador preguiçoso (regra `react-hooks/purity`).
  const [agoraMs] = useState(() => Date.now());
  const localTrancado =
    !!banca.data_hora && paraDataUtc(banca.data_hora).getTime() - agoraMs < 60 * 60 * 1000;
  const localMudou = local.trim() !== (banca.local ?? "").trim();
  const temEntrega = !!banca.entrega_link || !!banca.entrega_arquivo_nome;
  const podeEditarLocal = podeMexer && !localTrancado;

  async function comErro(fn: () => Promise<unknown>, setBusy: (v: boolean) => void, fallback: string) {
    if (!token) return;
    setBusy(true);
    setErro("");
    try {
      await fn();
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Secao>
      <Titulo>Local e entrega</Titulo>

      <Linha>
        <Rotulo>Local:</Rotulo>
        {podeEditarLocal ? (
          <>
            <InputCurto
              value={local}
              maxLength={500}
              placeholder="Ex.: Sala 401, prédio 2"
              onChange={(e) => setLocal(e.target.value)}
            />
            <PageButtonSm
              type="button"
              disabled={salvandoLocal || !localMudou || local.trim() === ""}
              onClick={() =>
                comErro(
                  () => registrarLocalBanca(banca.id, local.trim(), token as string),
                  setSalvandoLocal,
                  "Não foi possível salvar o local",
                )
              }
            >
              {salvandoLocal ? "..." : "Salvar"}
            </PageButtonSm>
          </>
        ) : (
          <Valor>
            {banca.local?.trim() || "não informado"}
            {podeMexer && localTrancado && " · trancado (falta < 1h)"}
          </Valor>
        )}
      </Linha>

      <Linha>
        <Rotulo>Entrega:</Rotulo>
        {banca.entrega_link ? (
          <Valor>
            <a href={banca.entrega_link} target="_blank" rel="noreferrer">
              {banca.entrega_link}
            </a>
          </Valor>
        ) : banca.entrega_arquivo_nome ? (
          <Acao
            type="button"
            onClick={() => {
              if (token && banca.entrega_arquivo_nome) {
                void baixarEntregaArquivoBanca(banca.id, banca.entrega_arquivo_nome, token);
              }
            }}
          >
            baixar {banca.entrega_arquivo_nome}
          </Acao>
        ) : (
          <Valor>nada anexado</Valor>
        )}

        {podeMexer && (
          <>
            {temEntrega && (
              <Acao
                type="button"
                disabled={salvandoEntrega}
                onClick={() =>
                  comErro(
                    () => removerEntregaBanca(banca.id, token as string),
                    setSalvandoEntrega,
                    "Não foi possível remover a entrega",
                  )
                }
              >
                remover
              </Acao>
            )}
            <Acao type="button" onClick={() => setAnexoAberto((v) => !v)}>
              {anexoAberto ? "fechar" : temEntrega ? "trocar" : "anexar"}
            </Acao>
          </>
        )}
      </Linha>

      {podeMexer && anexoAberto && (
        <Linha>
          <InputCurto
            value={linkEntrega}
            maxLength={1000}
            placeholder="https://... (link da entrega)"
            onChange={(e) => setLinkEntrega(e.target.value)}
          />
          <PageButtonSm
            type="button"
            disabled={salvandoEntrega || linkEntrega.trim() === ""}
            onClick={() =>
              comErro(
                async () => {
                  await registrarEntregaLinkBanca(banca.id, linkEntrega.trim(), token as string);
                  setLinkEntrega("");
                  setAnexoAberto(false);
                },
                setSalvandoEntrega,
                "Não foi possível salvar o link",
              )
            }
          >
            Salvar link
          </PageButtonSm>
          <Rotulo>ou</Rotulo>
          <ArquivoBotao htmlFor={`entrega-arq-${banca.id}`}>
            <Paperclip size={13} aria-hidden="true" />
            Escolher arquivo
            <input
              id={`entrega-arq-${banca.id}`}
              type="file"
              disabled={salvandoEntrega}
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) {
                  void comErro(
                    async () => {
                      await subirEntregaArquivoBanca(banca.id, arquivo, token as string);
                      setAnexoAberto(false);
                    },
                    setSalvandoEntrega,
                    "Não foi possível enviar o arquivo",
                  );
                }
                e.target.value = "";
              }}
            />
          </ArquivoBotao>
        </Linha>
      )}

      {erro && <FormErrorText>{erro}</FormErrorText>}
    </Secao>
  );
}
