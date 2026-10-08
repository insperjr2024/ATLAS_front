import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProjeto, ROTULO_STATUS } from "@/lib/projetos";
import { desfazerJustificativa, getRodadaAtual, justificarProjeto, type Rodada } from "@/lib/health-track";
import { ehDiretoriaDeProjetos } from "@/utils/permissoes";
import type { ProjetoCompleto } from "@/types/projeto";
import {
  ErrorText,
  PageButtonSm,
  PageHeader,
  PageHeaderText,
  PageLoadingBlock,
  PageStack,
  PageSubtitle,
  PageTitle,
} from "@/styles/page.styled";
import { PainelHealthTrack } from "./PainelHealthTrack";
import { JustificarModal } from "./JustificarModal";
import { FaixaRodada, Voltar } from "./HealthTrack.styled";

/**
 * O Health Track de um projeto, aberto a partir do mapa da carteira.
 *
 * Só o cabeçalho é daqui; o conteúdo é o `PainelHealthTrack`, o mesmo que
 * era a aba dentro do projeto. O nome do projeto vem de `/projetos/{id}`,
 * que já aplica o recorte de visão: quem não enxerga o projeto cai no erro.
 *
 * Com rodada aberta, uma faixa no topo diz a situação deste projeto nela e
 * leva ao PRÓXIMO pendente: é o "projeto por projeto até acabar" que a
 * diretoria pediu, sem voltar ao mapa a cada avaliação.
 */
export function HealthTrackProjeto() {
  const { id } = useParams();
  const { token, usuario } = useAuth();
  const projetoId = Number(id);
  const [projeto, setProjeto] = useState<ProjetoCompleto | null>(null);
  const [rodada, setRodada] = useState<Rodada | null>(null);
  const [erro, setErro] = useState("");
  const [justificando, setJustificando] = useState(false);
  const [erroRodada, setErroRodada] = useState("");

  const carregarRodada = useCallback(() => {
    if (!token) return Promise.resolve();
    return getRodadaAtual(token)
      .then(setRodada)
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (!token || !projetoId) return;
    let vivo = true;
    getProjeto(projetoId, token)
      .then((p) => vivo && setProjeto(p))
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : "Projeto não encontrado"));
    getRodadaAtual(token)
      .then((r) => vivo && setRodada(r))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [token, projetoId]);

  if (erro) return <ErrorText>Não foi possível abrir o projeto: {erro}</ErrorText>;
  if (!projeto) return <PageLoadingBlock />;

  const item = rodada?.projetos.find((p) => p.projeto_id === projetoId) ?? null;
  const pendentes = rodada?.projetos.filter((p) => p.situacao === "pendente" && p.projeto_id !== projetoId) ?? [];
  // O próximo da fila depois deste, dando a volta no fim.
  const posicao = rodada?.projetos.findIndex((p) => p.projeto_id === projetoId) ?? -1;
  const proximo =
    rodada && pendentes.length > 0
      ? [...rodada.projetos.slice(posicao + 1), ...rodada.projetos.slice(0, Math.max(posicao, 0))].find(
          (p) => p.situacao === "pendente" && p.projeto_id !== projetoId,
        ) ?? pendentes[0]
      : null;
  const diretoria = ehDiretoriaDeProjetos(usuario);

  return (
    <PageStack>
      <Voltar to="/health-track">
        <ArrowLeft aria-hidden="true" />
        Mapa da carteira
      </Voltar>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>{projeto.nome}</PageTitle>
          <PageSubtitle>
            Health Track
            {projeto.cliente && ` · ${projeto.cliente}`}
            {" · "}
            {ROTULO_STATUS[projeto.status as keyof typeof ROTULO_STATUS] ?? projeto.status}
          </PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      {rodada && (
        <FaixaRodada $pendente={item?.situacao === "pendente"}>
          <span>
            <strong>Rodada em andamento:</strong>{" "}
            {item
              ? item.situacao === "pendente"
                ? "este projeto ainda não foi avaliado nesta rodada."
                : item.situacao === "avaliada"
                  ? "este projeto já foi avaliado nesta rodada."
                  : `este projeto ficou de fora nesta rodada ("${item.justificativa}").`
              : "este projeto não faz parte desta rodada."}
            {" "}
            {rodada.pendente > 0
              ? `${rodada.pendente} pendente${rodada.pendente > 1 ? "s" : ""} no total.`
              : "Nenhum pendente: a rodada pode ser concluída no mapa."}
          </span>
          <span className="acoes">
            {diretoria && item?.situacao === "pendente" && (
              <PageButtonSm type="button" $variant="outline" onClick={() => setJustificando(true)}>
                Não avaliar nesta rodada
              </PageButtonSm>
            )}
            {diretoria && item?.situacao === "justificada" && (
              <PageButtonSm
                type="button"
                $variant="ghost"
                onClick={() =>
                  desfazerJustificativa(rodada.id, projetoId, token!)
                    .then(setRodada)
                    .catch((err) => setErroRodada(err instanceof Error ? err.message : "Não foi possível desfazer"))
                }
              >
                Desfazer justificativa
              </PageButtonSm>
            )}
            {proximo && (
              <PageButtonSm as={Link} to={`/health-track/projetos/${proximo.projeto_id}`}>
                Próximo pendente: {proximo.projeto_nome}
                <ArrowRight aria-hidden="true" style={{ width: "0.9rem", height: "0.9rem", marginLeft: "0.3rem" }} />
              </PageButtonSm>
            )}
          </span>
          {erroRodada && <ErrorText>{erroRodada}</ErrorText>}
        </FaixaRodada>
      )}

      <PainelHealthTrack projetoId={projetoId} onSalvo={carregarRodada} />

      {justificando && rodada && (
        <JustificarModal
          projetoNome={projeto.nome}
          inicial={item?.justificativa}
          onConfirmar={async (texto) => {
            setRodada(await justificarProjeto(rodada.id, projetoId, texto, token!));
            setJustificando(false);
          }}
          onCancelar={() => setJustificando(false)}
        />
      )}
    </PageStack>
  );
}
