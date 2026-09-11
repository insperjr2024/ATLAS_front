import { useState } from "react";
import {
  baixarEntregaArquivoBanca,
  registrarEntregaLinkBanca,
  registrarLocalBanca,
  removerEntregaBanca,
  subirEntregaArquivoBanca,
} from "@/lib/bancas";
import { paraDataUtc } from "@/lib/projetos";
import { PageButtonSm } from "@/styles/page.styled";
import { FieldGroup, FieldInput, FieldLabel, FormErrorText } from "@/pages/Bancas.styled";
import {
  AcoesLinha,
  Ajuda,
  Campo,
  CampoRotulo,
  CampoValor,
  MeuVoto,
  SecaoTitulo,
} from "@/pages/projetos/ProjetoBanca.styled";

/** O mínimo que o bloco precisa da banca — serve tanto o `Banca` da lista
 *  quanto o `BancaDetalhes` da ficha. */
export interface BancaLocalEntrega {
  id: number;
  local: string | null;
  entrega_link: string | null;
  entrega_arquivo_nome: string | null;
  data_hora: string | null;
}

/**
 * ⭐ Local da banca + anexo da entrega (2026-09-10, a pedido).
 *
 * **Local** é texto livre: só quem é do projeto avaliado (`podeMexer`, a
 * mesma conta que o backend faz em `pessoas_do_projeto_da_banca`) registra,
 * e só até 1h antes da banca — depois disso vira leitura pura. Aparece para
 * todo mundo que abre a ficha.
 *
 * **Entrega** é um link OU um arquivo (até 10 MB), um substitui o outro,
 * anexável a qualquer momento (antes ou depois da banca) por consultor/coord
 * do projeto. O arquivo baixa com o Bearer no header, por isso é botão e não
 * `<a href>`.
 *
 * Compartilhado pela aba Banca do projeto (`ProjetoBanca`) e pelo "ver mais"
 * de `/bancas` (`Bancas`).
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
  const [salvandoLocal, setSalvandoLocal] = useState(false);
  const [salvandoEntrega, setSalvandoEntrega] = useState(false);
  const [erro, setErro] = useState("");

  // O local se tranca 1h antes da banca — a MESMA regra do backend
  // (`RegistrarLocalBancaUseCase`). Banca sem data marcada ainda: registra à
  // vontade. `Date.now()` num inicializador preguiçoso pra não reprovar na
  // regra `react-hooks/purity`.
  const [agoraMs] = useState(() => Date.now());
  const localTrancado =
    !!banca.data_hora && paraDataUtc(banca.data_hora).getTime() - agoraMs < 60 * 60 * 1000;
  const localMudou = local.trim() !== (banca.local ?? "").trim();
  const temEntrega = !!banca.entrega_link || !!banca.entrega_arquivo_nome;

  async function salvarLocal() {
    if (!token) return;
    setSalvandoLocal(true);
    setErro("");
    try {
      await registrarLocalBanca(banca.id, local.trim(), token);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar o local");
    } finally {
      setSalvandoLocal(false);
    }
  }

  async function salvarLink() {
    if (!token) return;
    setSalvandoEntrega(true);
    setErro("");
    try {
      await registrarEntregaLinkBanca(banca.id, linkEntrega.trim(), token);
      setLinkEntrega("");
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar o link");
    } finally {
      setSalvandoEntrega(false);
    }
  }

  async function enviarArquivo(arquivo: File) {
    if (!token) return;
    setSalvandoEntrega(true);
    setErro("");
    try {
      await subirEntregaArquivoBanca(banca.id, arquivo, token);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o arquivo");
    } finally {
      setSalvandoEntrega(false);
    }
  }

  async function removerEntrega() {
    if (!token) return;
    setSalvandoEntrega(true);
    setErro("");
    try {
      await removerEntregaBanca(banca.id, token);
      await onMudou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível remover a entrega");
    } finally {
      setSalvandoEntrega(false);
    }
  }

  return (
    <MeuVoto>
      <SecaoTitulo>Local e entrega</SecaoTitulo>

      <Campo>
        <CampoRotulo>Local da banca</CampoRotulo>
        {podeMexer && !localTrancado ? (
          <>
            <FieldGroup>
              <FieldInput
                id={`local-${banca.id}`}
                value={local}
                maxLength={500}
                placeholder="Onde a banca vai acontecer (ex.: Sala 401, prédio 2)"
                onChange={(e) => setLocal(e.target.value)}
              />
            </FieldGroup>
            <AcoesLinha>
              <PageButtonSm
                type="button"
                disabled={salvandoLocal || !localMudou || local.trim() === ""}
                onClick={salvarLocal}
              >
                {salvandoLocal ? "Salvando..." : "Salvar local"}
              </PageButtonSm>
              <Ajuda>Pode editar até 1h antes da banca.</Ajuda>
            </AcoesLinha>
          </>
        ) : (
          <>
            <CampoValor>{banca.local?.trim() || "ainda não registrado"}</CampoValor>
            {podeMexer && localTrancado && (
              <Ajuda>O local não pode mais ser alterado — falta menos de 1h para a banca.</Ajuda>
            )}
          </>
        )}
      </Campo>

      <Campo style={{ marginTop: "0.75rem" }}>
        <CampoRotulo>Entrega</CampoRotulo>
        {temEntrega ? (
          <AcoesLinha>
            {banca.entrega_link ? (
              <CampoValor>
                <a href={banca.entrega_link} target="_blank" rel="noreferrer">
                  {banca.entrega_link}
                </a>
              </CampoValor>
            ) : (
              <PageButtonSm
                type="button"
                $variant="outline"
                onClick={() => {
                  if (token && banca.entrega_arquivo_nome) {
                    void baixarEntregaArquivoBanca(banca.id, banca.entrega_arquivo_nome, token);
                  }
                }}
              >
                Baixar {banca.entrega_arquivo_nome}
              </PageButtonSm>
            )}
            {podeMexer && (
              <PageButtonSm
                type="button"
                $variant="outline"
                disabled={salvandoEntrega}
                onClick={removerEntrega}
              >
                Remover
              </PageButtonSm>
            )}
          </AcoesLinha>
        ) : (
          <CampoValor>nada anexado</CampoValor>
        )}

        {podeMexer && (
          <>
            <FieldGroup style={{ marginTop: "0.5rem" }}>
              <FieldLabel htmlFor={`entrega-link-${banca.id}`}>Anexar por link</FieldLabel>
              <FieldInput
                id={`entrega-link-${banca.id}`}
                value={linkEntrega}
                maxLength={1000}
                placeholder="https://..."
                onChange={(e) => setLinkEntrega(e.target.value)}
              />
            </FieldGroup>
            <AcoesLinha>
              <PageButtonSm
                type="button"
                disabled={salvandoEntrega || linkEntrega.trim() === ""}
                onClick={salvarLink}
              >
                {salvandoEntrega ? "Enviando..." : "Salvar link"}
              </PageButtonSm>
              <FieldLabel htmlFor={`entrega-arquivo-${banca.id}`} style={{ margin: 0 }}>
                ou enviar arquivo:
              </FieldLabel>
              <input
                id={`entrega-arquivo-${banca.id}`}
                type="file"
                disabled={salvandoEntrega}
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (arquivo) void enviarArquivo(arquivo);
                  e.target.value = "";
                }}
              />
            </AcoesLinha>
            <Ajuda>
              Link ou arquivo (até 10 MB). Um substitui o outro. Pode anexar a qualquer momento,
              antes ou depois da banca.
            </Ajuda>
          </>
        )}
      </Campo>

      {erro && <FormErrorText>{erro}</FormErrorText>}
    </MeuVoto>
  );
}
