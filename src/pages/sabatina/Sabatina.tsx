import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMinhasEleicoes, votar } from "@/lib/sabatina";
import type { MinhaEleicao } from "@/types/sabatina";
import {
  EmptyText,
  ErrorText,
  PageBadge,
  PageButton,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageHeader,
  PageHeaderText,
  PageLoadingBlock,
  PageStack,
  PageSubtitle,
  PageTitle,
} from "@/styles/page.styled";
import { Acoes, Aviso, Intro, Lista, Opcao } from "./Sabatina.styled";

/** Voto em branco na cédula: `candidato_id` nulo no envio. */
const BRANCO = "branco";

/**
 * A cédula (2026-10-05). Aparece no menu só enquanto existe eleição aberta
 * em que a pessoa vota (ou é candidata, pra saber por que não vota). Um voto
 * por eleição, sem volta, então o envio pede confirmação.
 */
export function Sabatina() {
  const { token } = useAuth();
  const [eleicoes, setEleicoes] = useState<MinhaEleicao[] | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      setEleicoes(await getMinhasEleicoes(token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, [token]);

  // Carga inicial inline (não via `carregar`): a regra `set-state-in-effect`
  // só aceita setState dentro do callback da promise.
  useEffect(() => {
    if (!token) return;
    getMinhasEleicoes(token)
      .then(setEleicoes)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar"));
  }, [token]);

  if (eleicoes === null && !erro) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Sabatina</PageTitle>
          <PageSubtitle>Vote nas eleições abertas. Cada voto é único e não pode ser alterado.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      {erro && <ErrorText>{erro}</ErrorText>}

      {eleicoes && eleicoes.length === 0 && (
        <PageCard>
          <PageCardContent>
            <EmptyText>Nenhuma sabatina aberta no momento.</EmptyText>
          </PageCardContent>
        </PageCard>
      )}

      <Lista>
        {eleicoes?.map((e) => (
          <Cedula key={e.id} eleicao={e} token={token} onVotou={carregar} />
        ))}
      </Lista>
    </PageStack>
  );
}

function Cedula({
  eleicao,
  token,
  onVotou,
}: {
  eleicao: MinhaEleicao;
  token: string | null;
  onVotou: () => Promise<void>;
}) {
  const [escolha, setEscolha] = useState<string>("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const nomeEscolha =
    escolha === BRANCO ? "voto em branco" : eleicao.candidatos.find((c) => String(c.id) === escolha)?.nome;

  async function enviar() {
    if (!token || !escolha) return;
    setEnviando(true);
    setErro("");
    try {
      await votar(eleicao.id, escolha === BRANCO ? null : Number(escolha), token);
      await onVotou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível registrar o voto");
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>{eleicao.nome}</PageCardTitle>
        {eleicao.ja_votei && <PageBadge $tone="success">Voto registrado</PageBadge>}
        {eleicao.sou_candidato && <PageBadge $tone="muted">Você é candidato(a)</PageBadge>}
      </PageCardHeader>
      <PageCardContent>
        {eleicao.sou_candidato ? (
          <Aviso>Quem concorre não vota na própria eleição. Aguarde a apuração pela diretoria.</Aviso>
        ) : eleicao.ja_votei ? (
          <Aviso>Seu voto nesta eleição já foi registrado. O resultado sai quando a diretoria fechar a votação.</Aviso>
        ) : (
          <>
            <Intro>Escolha uma opção. O voto é secreto para os demais membros.</Intro>
            <Lista style={{ marginTop: "0.75rem", gap: "0.5rem" }}>
              {eleicao.candidatos.map((c) => (
                <Opcao key={c.id} $marcada={escolha === String(c.id)}>
                  <input
                    type="radio"
                    name={`eleicao-${eleicao.id}`}
                    value={c.id}
                    checked={escolha === String(c.id)}
                    onChange={() => {
                      setEscolha(String(c.id));
                      setConfirmando(false);
                    }}
                  />
                  {c.nome}
                </Opcao>
              ))}
              <Opcao $marcada={escolha === BRANCO}>
                <input
                  type="radio"
                  name={`eleicao-${eleicao.id}`}
                  value={BRANCO}
                  checked={escolha === BRANCO}
                  onChange={() => {
                    setEscolha(BRANCO);
                    setConfirmando(false);
                  }}
                />
                Voto em branco
              </Opcao>
            </Lista>

            <Acoes>
              {confirmando ? (
                <>
                  <Aviso>
                    Confirmar <strong>{nomeEscolha}</strong>? Depois de enviado não dá pra mudar.
                  </Aviso>
                  <PageButton type="button" disabled={enviando} onClick={enviar}>
                    {enviando ? "Enviando..." : "Confirmar voto"}
                  </PageButton>
                  <PageButton type="button" $variant="outline" disabled={enviando} onClick={() => setConfirmando(false)}>
                    Voltar
                  </PageButton>
                </>
              ) : (
                <PageButton type="button" disabled={!escolha} onClick={() => setConfirmando(true)}>
                  Enviar voto
                </PageButton>
              )}
            </Acoes>
            {erro && <ErrorText>{erro}</ErrorText>}
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}
