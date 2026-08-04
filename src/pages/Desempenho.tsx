import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { getAvaliacoes, getAvaliacoesNotas, getPerguntas, isPerguntaNota } from "@/lib/avaliacoes";
import { getBancas, getBancasFrentes, getFrentes } from "@/lib/bancas";
import type {
  Avaliacao,
  AvaliacaoNota,
  Banca,
  BancaFrente,
  Desempenho as DesempenhoDados,
  Frente,
  Pergunta,
} from "@/types/banca";
import { DesempenhoChart, type FatiaDonut } from "@/components/DesempenhoChart";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
} from "@/styles/page.styled";
import {
  TopGrid,
  ListCardContent,
  ListScrollWrap,
  LIST_MAX_VISIVEIS,
  RowGroup,
  RowDot,
  RowLabel,
  RowMeta,
  EmptyText,
} from "@/styles/shared.styled";
import {
  GreetingHeader,
  GreetingTitle,
  GreetingSubtitle,
  ChartCaption,
  HistoricoRow,
  HistoricoVerLabel,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  DetailList,
  DetailRow,
  DetailTerm,
  DetailValue,
  SectionTitle,
  RespostaItem,
  RespostaPergunta,
  RespostaValor,
  ComentarioBlock,
} from "./Desempenho.styled";

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function formatNota(nota: number | null | undefined): string {
  if (nota == null) return "—";
  return nota.toFixed(1);
}

function formatResposta(nota: AvaliacaoNota, pergunta?: Pergunta): string {
  if (pergunta && !isPerguntaNota(pergunta.tipo_resposta)) {
    return nota.resposta_texto?.trim() || "—";
  }
  if (nota.nota != null) return formatNota(nota.nota);
  return nota.resposta_texto?.trim() || "—";
}

export function Desempenho() {
  const { usuario, token } = useAuth();
  const [dados, setDados] = useState<DesempenhoDados | null>(null);
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [bancasFrentes, setBancasFrentes] = useState<BancaFrente[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [avaliacoesNotas, setAvaliacoesNotas] = useState<AvaliacaoNota[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<{
    avaliacao: Avaliacao;
    banca: Banca;
  } | null>(null);

  async function buscar() {
    if (!usuario || !token) return;
    setCarregando(true);
    setErro("");
    try {
      const [desempenho, bancasResp, bancasFrentesResp, frentesResp, avaliacoesResp, notasResp, perguntasResp] =
        await Promise.all([
          apiFetch<DesempenhoDados>(`/usuarios/${usuario.id}/desempenho`, { token }),
          getBancas(token),
          getBancasFrentes(token),
          getFrentes(token),
          getAvaliacoes(token),
          getAvaliacoesNotas(token),
          getPerguntas(token),
        ]);
      setDados(desempenho);
      setBancas(bancasResp);
      setBancasFrentes(bancasFrentesResp);
      setFrentes(frentesResp);
      setAvaliacoes(avaliacoesResp);
      setAvaliacoesNotas(notasResp);
      setPerguntas(perguntasResp);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar desempenho");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, token]);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar o desempenho: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  const bancasPorId = new Map(bancas.map((b) => [b.id, b]));
  const perguntasPorId = new Map(perguntas.map((p) => [p.id, p]));

  const avaliacoesSubmetidas = avaliacoes
    .filter((a) => a.avaliador_id === usuario?.id && a.status === "submetida")
    .map((a) => ({ avaliacao: a, banca: bancasPorId.get(a.banca_id) }))
    .filter((item): item is { avaliacao: Avaliacao; banca: Banca } => !!item.banca)
    .sort((a, b) => new Date(b.banca.data_hora).getTime() - new Date(a.banca.data_hora).getTime());

  const avaliacoesDoSemestre = avaliacoesSubmetidas.filter((item) => item.banca.semestre_id === dados.semestre_id);

  const pontosPorFrente = new Map<string, number>();
  for (const { banca } of avaliacoesDoSemestre) {
    const frentesDaBanca = bancasFrentes.filter((bf) => bf.banca_id === banca.id);
    const peso = frentesDaBanca.length > 0 ? 1 / frentesDaBanca.length : 0;
    for (const bf of frentesDaBanca) {
      const nome = frentes.find((f) => f.id === bf.frente_id)?.nome ?? "—";
      pontosPorFrente.set(nome, (pontosPorFrente.get(nome) ?? 0) + peso);
    }
  }
  const fatias: FatiaDonut[] = Array.from(pontosPorFrente.entries()).map(([nome, valor]) => ({
    nome,
    valor: Math.round(valor * 10) / 10,
  }));

  const ultimasBancas = avaliacoesSubmetidas.slice(0, 3);
  const primeiroNome = usuario?.nome.split(" ")[0];

  return (
    <PageStack>
      <GreetingHeader>
        <GreetingTitle>
          {saudacao()}
          {primeiroNome ? `, ${primeiroNome}!` : "!"}
        </GreetingTitle>
        <GreetingSubtitle>Confira seu desempenho em {dados.semestre_nome}.</GreetingSubtitle>
      </GreetingHeader>

      <TopGrid>
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Porcentagem de bancas atendidas — {dados.semestre_nome}</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <DesempenhoChart fatias={fatias} percentual={dados.percentual} />
            <ChartCaption>
              {dados.bancas_atendidas} de {dados.total_bancas_realizadas} bancas no semestre
            </ChartCaption>
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Últimas bancas atendidas</PageCardTitle>
          </PageCardHeader>
          <ListCardContent>
            {ultimasBancas.length === 0 && <EmptyText>Nenhuma banca atendida ainda.</EmptyText>}
            {ultimasBancas.length > 0 && (
              <ListScrollWrap $scrollable={ultimasBancas.length > LIST_MAX_VISIVEIS}>
                {ultimasBancas.map(({ avaliacao, banca }) => (
                  <HistoricoRow key={avaliacao.id} type="button" onClick={() => setAvaliacaoSelecionada({ avaliacao, banca })}>
                    <RowGroup>
                      <RowDot aria-hidden />
                      <RowLabel>{banca.nome_projeto}</RowLabel>
                    </RowGroup>
                    <RowMeta>{new Date(banca.data_hora).toLocaleDateString("pt-BR")}</RowMeta>
                  </HistoricoRow>
                ))}
              </ListScrollWrap>
            )}
          </ListCardContent>
        </PageCard>
      </TopGrid>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Histórico de avaliações</PageCardTitle>
        </PageCardHeader>
        <ListCardContent>
          {avaliacoesSubmetidas.length === 0 && <EmptyText>Nenhuma avaliação enviada ainda.</EmptyText>}
          {avaliacoesSubmetidas.length > 0 && (
            <ListScrollWrap $scrollable={avaliacoesSubmetidas.length > LIST_MAX_VISIVEIS}>
              {avaliacoesSubmetidas.map(({ avaliacao, banca }) => (
                <HistoricoRow
                  key={avaliacao.id}
                  type="button"
                  onClick={() => setAvaliacaoSelecionada({ avaliacao, banca })}
                  aria-label={`Ver formulário enviado para ${banca.nome_projeto}`}
                >
                  <RowGroup>
                    <RowDot aria-hidden />
                    <RowMeta>{new Date(banca.data_hora).toLocaleDateString("pt-BR")}</RowMeta>
                    <RowLabel>{banca.nome_projeto}</RowLabel>
                  </RowGroup>
                  <HistoricoVerLabel>Ver respostas</HistoricoVerLabel>
                </HistoricoRow>
              ))}
            </ListScrollWrap>
          )}
        </ListCardContent>
      </PageCard>

      {avaliacaoSelecionada && (
        <VerMinhaAvaliacaoModal
          avaliacao={avaliacaoSelecionada.avaliacao}
          banca={avaliacaoSelecionada.banca}
          notas={avaliacoesNotas.filter((n) => n.avaliacao_id === avaliacaoSelecionada.avaliacao.id)}
          perguntasPorId={perguntasPorId}
          onClose={() => setAvaliacaoSelecionada(null)}
        />
      )}
    </PageStack>
  );
}

function VerMinhaAvaliacaoModal({
  avaliacao,
  banca,
  notas,
  perguntasPorId,
  onClose,
}: {
  avaliacao: Avaliacao;
  banca: Banca;
  notas: AvaliacaoNota[];
  perguntasPorId: Map<number, Pergunta>;
  onClose: () => void;
}) {
  const respostasOrdenadas = notas
    .map((nota) => ({
      nota,
      pergunta: perguntasPorId.get(nota.pergunta_id),
    }))
    .sort((a, b) => (a.pergunta?.ordem ?? a.nota.pergunta_id) - (b.pergunta?.ordem ?? b.nota.pergunta_id));

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="minha-avaliacao-titulo">
        <ModalHeader>
          <ModalTitle id="minha-avaliacao-titulo">Meu formulário — {banca.nome_projeto}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <DetailList>
            <DetailRow>
              <DetailTerm>Projeto</DetailTerm>
              <DetailValue>{banca.nome_projeto}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailTerm>Data da banca</DetailTerm>
              <DetailValue>{new Date(banca.data_hora).toLocaleDateString("pt-BR")}</DetailValue>
            </DetailRow>
            {avaliacao.submetida_em && (
              <DetailRow>
                <DetailTerm>Enviado em</DetailTerm>
                <DetailValue>{new Date(avaliacao.submetida_em).toLocaleString("pt-BR")}</DetailValue>
              </DetailRow>
            )}
          </DetailList>

          <SectionTitle>Suas respostas</SectionTitle>
          {respostasOrdenadas.length === 0 && <EmptyText>Nenhuma resposta registrada.</EmptyText>}
          {respostasOrdenadas.map(({ nota, pergunta }) => (
            <RespostaItem key={nota.id}>
              <RespostaPergunta>{pergunta?.texto ?? `Pergunta ${nota.pergunta_id}`}</RespostaPergunta>
              <RespostaValor>{formatResposta(nota, pergunta)}</RespostaValor>
            </RespostaItem>
          ))}

          {avaliacao.comentario_feedback && (
            <>
              <SectionTitle>Comentário adicional</SectionTitle>
              <ComentarioBlock>{avaliacao.comentario_feedback}</ComentarioBlock>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <PageButton $variant="outline" type="button" onClick={onClose}>
            Fechar
          </PageButton>
        </ModalFooter>
      </WideModalContent>
    </ModalOverlay>
  );
}
