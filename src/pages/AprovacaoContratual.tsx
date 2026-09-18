import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import insperJrLogo from "@/assets/insperjr2.png";
import { getAprovacao, responderAprovacao, urlArquivoAprovacao } from "@/lib/contratos";
import type { AprovacaoPublica } from "@/types/contratos";
import { ROTULO_TIPO_DOCUMENTO } from "@/types/contratos";
import { PageButton, PageButtonSm, ErrorText, PageLoadingBlock } from "@/styles/page.styled";
import { FieldGroup, FieldLabel, FieldTextarea } from "./Bancas.styled";
import { ListaLinha, ListaRemoverBotao, ListaAdicionarBotao } from "./projetos/ProjetoContratos.styled";
import {
  AprovacaoWrapper,
  AprovacaoHeader,
  AprovacaoLogo,
  AprovacaoTitulo,
  AprovacaoCorpo,
  VisualizadorPdf,
  AprovacaoPainel,
  AprovacaoAcoes,
  AprovacaoCentro,
} from "./AprovacaoContratual.styled";

/**
 * ⭐ 2026-09-18 — a tela pública de aprovação (§ Contratos), sem login: quem
 * recebe o link (o representante do cliente) vê o PDF gerado e decide
 * aprovar ou pedir ajuste, citando trechos livres do texto (o PDF num
 * `<iframe>` não expõe seleção pra recorte automático — mesma limitação do
 * sistema antigo).
 *
 * Precisa estar registrada como rota PÚBLICA no `App.tsx`, acima do
 * `PrivateRoute` — é o destino do link que vai no WhatsApp/e-mail, e quem
 * abre não tem conta no ATLAS.
 */
export function AprovacaoContratual() {
  const { token = "" } = useParams<{ token: string }>();
  const [info, setInfo] = useState<AprovacaoPublica | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [respondido, setRespondido] = useState<"aprovado" | "alteracao" | null>(null);

  const [modo, setModo] = useState<"nenhum" | "alteracao">("nenhum");
  const [texto, setTexto] = useState("");
  const [trechos, setTrechos] = useState<string[]>([""]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    getAprovacao(token)
      .then(setInfo)
      .catch((err) => setErro(err instanceof Error ? err.message : "Link inválido"))
      .finally(() => setCarregando(false));
  }, [token]);

  async function handleAprovar() {
    setEnviando(true);
    setErro("");
    try {
      await responderAprovacao(token, { acao: "aprovar" });
      setRespondido("aprovado");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar aprovação");
    } finally {
      setEnviando(false);
    }
  }

  async function handleSolicitarAlteracao() {
    if (!texto.trim()) {
      setErro("Descreva o que precisa ser ajustado.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      await responderAprovacao(token, {
        acao: "alteracao",
        texto: texto.trim(),
        trechos: trechos.map((t) => t.trim()).filter(Boolean),
      });
      setRespondido("alteracao");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar o pedido de alteração");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <PageLoadingBlock />;

  if (erro && !info) {
    return (
      <AprovacaoWrapper>
        <AprovacaoCentro>
          <ErrorText>{erro}</ErrorText>
        </AprovacaoCentro>
      </AprovacaoWrapper>
    );
  }

  if (!info) return null;

  const jaRespondido = info.usado || respondido !== null;

  return (
    <AprovacaoWrapper>
      <AprovacaoHeader>
        <AprovacaoLogo src={insperJrLogo} alt="Insper Jr." />
        <AprovacaoTitulo>
          <h1>{info.nome_projeto}</h1>
          <span>{ROTULO_TIPO_DOCUMENTO[info.tipo_documento]}</span>
        </AprovacaoTitulo>
      </AprovacaoHeader>

      <AprovacaoCorpo>
        <VisualizadorPdf src={urlArquivoAprovacao(token)} title="Documento para aprovação" />

        {jaRespondido ? (
          <AprovacaoPainel>
            {respondido === "aprovado" ? (
              <p>Documento aprovado. Obrigado! A Insper Jr já foi avisada.</p>
            ) : respondido === "alteracao" ? (
              <p>Pedido de alteração enviado. A Insper Jr vai revisar e enviar uma nova versão em breve.</p>
            ) : (
              <p>Este link já foi usado — a resposta já foi registrada anteriormente.</p>
            )}
          </AprovacaoPainel>
        ) : (
          <AprovacaoPainel>
            {erro && <ErrorText>{erro}</ErrorText>}

            {modo === "nenhum" ? (
              <AprovacaoAcoes>
                <PageButton type="button" disabled={enviando} onClick={handleAprovar}>
                  {enviando ? "Enviando..." : "Aprovar documento"}
                </PageButton>
                <PageButton type="button" $variant="outline" onClick={() => setModo("alteracao")}>
                  Solicitar alteração
                </PageButton>
              </AprovacaoAcoes>
            ) : (
              <>
                <FieldGroup>
                  <FieldLabel htmlFor="texto-alteracao">O que precisa ser ajustado?</FieldLabel>
                  <FieldTextarea
                    id="texto-alteracao"
                    rows={4}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    autoFocus
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel as="span">Trechos do documento que você quer citar (opcional)</FieldLabel>
                  {trechos.map((trecho, i) => (
                    <ListaLinha key={i}>
                      <FieldTextarea
                        rows={2}
                        value={trecho}
                        onChange={(e) =>
                          setTrechos((atuais) => atuais.map((t, j) => (j === i ? e.target.value : t)))
                        }
                      />
                      {trechos.length > 1 && (
                        <ListaRemoverBotao
                          type="button"
                          aria-label="Remover trecho"
                          onClick={() => setTrechos((atuais) => atuais.filter((_, j) => j !== i))}
                        >
                          ×
                        </ListaRemoverBotao>
                      )}
                    </ListaLinha>
                  ))}
                  {trechos.length < 20 && (
                    <ListaAdicionarBotao type="button" onClick={() => setTrechos((atuais) => [...atuais, ""])}>
                      + Citar outro trecho
                    </ListaAdicionarBotao>
                  )}
                </FieldGroup>

                <AprovacaoAcoes>
                  <PageButtonSm type="button" $variant="outline" onClick={() => setModo("nenhum")} disabled={enviando}>
                    Voltar
                  </PageButtonSm>
                  <PageButton type="button" disabled={enviando} onClick={handleSolicitarAlteracao}>
                    {enviando ? "Enviando..." : "Enviar pedido de alteração"}
                  </PageButton>
                </AprovacaoAcoes>
              </>
            )}
          </AprovacaoPainel>
        )}
      </AprovacaoCorpo>
    </AprovacaoWrapper>
  );
}
