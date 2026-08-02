import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { getAvaliacoes } from "@/lib/avaliacoes";
import { getBancas, getBancasFrentes, getFrentes } from "@/lib/bancas";
import type { Avaliacao, Banca, BancaFrente, Desempenho as DesempenhoDados, Frente } from "@/types/banca";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DesempenhoChart, type FatiaDonut } from "@/components/DesempenhoChart";
import {
  PageStack,
  EmptyText,
  PageLoadingSkeleton,
  ErrorState,
  ErrorMessage,
  TopGrid,
  ListCardContent,
  ListRow,
  RowGroup,
  RowDot,
  RowLabel,
  RowMeta,
} from "@/styles/shared.styled";
import { GreetingHeader, GreetingTitle, GreetingSubtitle, ChartCaption } from "./Desempenho.styled";

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function Desempenho() {
  const { usuario, token } = useAuth();
  const [dados, setDados] = useState<DesempenhoDados | null>(null);
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [bancasFrentes, setBancasFrentes] = useState<BancaFrente[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function buscar() {
    if (!usuario || !token) return;
    setCarregando(true);
    setErro("");
    try {
      const [desempenho, bancasResp, bancasFrentesResp, frentesResp, avaliacoesResp] = await Promise.all([
        apiFetch<DesempenhoDados>(`/usuarios/${usuario.id}/desempenho`, { token }),
        getBancas(token),
        getBancasFrentes(token),
        getFrentes(token),
        getAvaliacoes(token),
      ]);
      setDados(desempenho);
      setBancas(bancasResp);
      setBancasFrentes(bancasFrentesResp);
      setFrentes(frentesResp);
      setAvaliacoes(avaliacoesResp);
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
      <ErrorState>
        <ErrorMessage>Não foi possível carregar o desempenho: {erro}</ErrorMessage>
        <Button variant="outline" onClick={buscar}>
          Tentar novamente
        </Button>
      </ErrorState>
    );
  }

  if (carregando || !dados) return <PageLoadingSkeleton />;

  const bancasPorId = new Map(bancas.map((b) => [b.id, b]));

  const avaliacoesSubmetidas = avaliacoes
    .filter((a) => a.avaliador_id === usuario?.id && a.status === "submetida")
    .map((a) => ({ avaliacao: a, banca: bancasPorId.get(a.banca_id) }))
    .filter((item): item is { avaliacao: Avaliacao; banca: Banca } => !!item.banca)
    .sort((a, b) => new Date(b.banca.data_hora).getTime() - new Date(a.banca.data_hora).getTime());

  const avaliacoesDoSemestre = avaliacoesSubmetidas.filter((item) => item.banca.semestre_id === dados.semestre_id);

  // Cada banca conta 1 ponto, dividido igualmente entre suas frentes (uma
  // banca com 2 frentes vale 0.5 pra cada) — assim as fatias do donut sempre
  // somam ao total de bancas atendidas no semestre.
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
        <Card>
          <CardHeader>
            <CardTitle>Porcentagem de bancas atendidas — {dados.semestre_nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <DesempenhoChart fatias={fatias} percentual={dados.percentual} />
            <ChartCaption>
              {dados.bancas_atendidas} de {dados.total_bancas_realizadas} bancas no semestre
            </ChartCaption>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas bancas atendidas</CardTitle>
          </CardHeader>
          <ListCardContent>
            {ultimasBancas.length === 0 && <EmptyText>Nenhuma banca atendida ainda.</EmptyText>}
            {ultimasBancas.map(({ avaliacao, banca }) => (
              <ListRow key={avaliacao.id}>
                <RowGroup>
                  <RowDot aria-hidden />
                  <RowLabel>{banca.nome_projeto}</RowLabel>
                </RowGroup>
                <RowMeta>{new Date(banca.data_hora).toLocaleDateString("pt-BR")}</RowMeta>
              </ListRow>
            ))}
          </ListCardContent>
        </Card>
      </TopGrid>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de avaliações</CardTitle>
        </CardHeader>
        <ListCardContent>
          {avaliacoesSubmetidas.length === 0 && <EmptyText>Nenhuma avaliação enviada ainda.</EmptyText>}
          {avaliacoesSubmetidas.map(({ avaliacao, banca }) => (
            <ListRow key={avaliacao.id}>
              <RowGroup>
                <RowDot aria-hidden />
                <RowMeta>{new Date(banca.data_hora).toLocaleDateString("pt-BR")}</RowMeta>
                <RowLabel>{banca.nome_projeto}</RowLabel>
              </RowGroup>
              <Badge variant="outline">Formulário</Badge>
            </ListRow>
          ))}
        </ListCardContent>
      </Card>
    </PageStack>
  );
}
