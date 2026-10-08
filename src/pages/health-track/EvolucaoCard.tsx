import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { SOLIDO_COR } from "@/components/health-track/HealthTrack.styled";
import { getEvolucao, type Evolucao } from "@/lib/health-track";
import { formatarDataHora } from "@/lib/projetos";
import { theme } from "@/styles/theme";
import {
  EmptyText,
  ErrorText,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageGrid,
} from "@/styles/page.styled";
import { CaixaGrafico, TituloGrafico } from "./HealthTrack.styled";

/** Uma cor por pilar nas linhas do segundo gráfico. */
const PALETA = ["#B91C1C", "#1D4ED8", "#047857", "#B45309", "#6D28D9", "#0E7490", "#BE185D", "#4D7C0F"];

const eixo = { stroke: theme.colors.mutedForeground, fontSize: 12, tickLine: false } as const;

function pct(parte: number, total: number) {
  return total ? Math.round((parte / total) * 100) : 0;
}

/**
 * A evolução da carteira (§16): um ponto por rodada concluída, mais hoje.
 * Dois gráficos: quanto da carteira está verde/amarelo/vermelho, e o % verde
 * de cada pilar. É o que separa "piorou agora" de "vem piorando há três
 * rodadas".
 *
 * Carrega só quando aberto: com uma rodada só, a curva ainda não diz nada.
 */
export function EvolucaoCard() {
  const { token } = useAuth();
  const [dados, setDados] = useState<Evolucao | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getEvolucao(token)
      .then((d) => vivo && setDados(d))
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : "Erro ao carregar a evolução"));
    return () => {
      vivo = false;
    };
  }, [token]);

  const carteira = useMemo(
    () =>
      (dados?.pontos ?? []).map((p) => ({
        rotulo: p.rotulo,
        em: formatarDataHora(p.em),
        Saudável: pct(p.verde, p.avaliados),
        Atenção: pct(p.amarelo, p.avaliados),
        Crítico: pct(p.vermelho, p.avaliados),
        avaliados: p.avaliados,
      })),
    [dados],
  );

  const pilares = useMemo(
    () =>
      (dados?.pontos ?? []).map((p) => ({
        rotulo: p.rotulo,
        ...Object.fromEntries(
          (dados?.pilares ?? []).map((pilar) => {
            const c = p.pilares[String(pilar.id)] ?? { verde: 0, amarelo: 0, vermelho: 0 };
            return [pilar.nome, pct(c.verde, c.verde + c.amarelo + c.vermelho)];
          }),
        ),
      })),
    [dados],
  );

  const poucosPontos = (dados?.pontos.length ?? 0) < 2;

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Evolução</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {erro && <ErrorText>{erro}</ErrorText>}
        {!dados ? (
          <EmptyText>Carregando…</EmptyText>
        ) : poucosPontos ? (
          <EmptyText>
            A evolução aparece a partir da primeira rodada concluída: cada rodada vira um ponto, e "hoje" fecha a curva.
          </EmptyText>
        ) : (
          <PageGrid $columns={2}>
            <div>
              <TituloGrafico>Saúde da carteira, % dos projetos avaliados</TituloGrafico>
              <CaixaGrafico $altura="18rem">
                <ResponsiveContainer>
                  <LineChart data={carteira} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={theme.colors.border} vertical={false} />
                    <XAxis dataKey="rotulo" {...eixo} />
                    <YAxis domain={[0, 100]} width={44} {...eixo} axisLine={false} unit="%" />
                    <Tooltip
                      formatter={(valor, nome) => [`${valor}%`, nome]}
                      wrapperStyle={{ zIndex: 2 }}
                      labelFormatter={(_, carga) => {
                        const p = carga?.[0]?.payload as { rotulo: string; em: string; avaliados: number } | undefined;
                        return p ? `${p.rotulo} · ${p.em} · ${p.avaliados} avaliado(s)` : "";
                      }}
                    />
                    <Legend iconType="circle" verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
                    <Line type="monotone" dataKey="Saudável" stroke={SOLIDO_COR.verde} strokeWidth={2} isAnimationActive={false} />
                    <Line type="monotone" dataKey="Atenção" stroke={SOLIDO_COR.amarelo} strokeWidth={2} isAnimationActive={false} />
                    <Line type="monotone" dataKey="Crítico" stroke={SOLIDO_COR.vermelho} strokeWidth={2} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CaixaGrafico>
            </div>
            <div>
              <TituloGrafico>% saudável de cada pilar</TituloGrafico>
              <CaixaGrafico $altura="18rem">
                <ResponsiveContainer>
                  <LineChart data={pilares} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={theme.colors.border} vertical={false} />
                    <XAxis dataKey="rotulo" {...eixo} />
                    <YAxis domain={[0, 100]} width={44} {...eixo} axisLine={false} unit="%" />
                    <Tooltip formatter={(valor, nome) => [`${valor}%`, nome]} wrapperStyle={{ zIndex: 2 }} />
                    <Legend iconType="circle" verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
                    {dados.pilares.map((pilar, i) => (
                      <Line
                        key={pilar.id}
                        type="monotone"
                        dataKey={pilar.nome}
                        stroke={PALETA[i % PALETA.length]}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CaixaGrafico>
            </div>
          </PageGrid>
        )}
      </PageCardContent>
    </PageCard>
  );
}
