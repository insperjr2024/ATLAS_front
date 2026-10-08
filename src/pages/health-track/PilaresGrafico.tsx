import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SOLIDO_COR } from "@/components/health-track/HealthTrack.styled";
import type { CorHealthTrack } from "@/lib/health-track";
import { theme } from "@/styles/theme";
import type { LinhaRanking } from "./HealthTrack";
import { CaixaGrafico } from "./HealthTrack.styled";

const eixo = { stroke: theme.colors.mutedForeground, fontSize: 12, tickLine: false } as const;

/** Barras empilhadas por pilar: quantos projetos estão em cada cor. É o
 *  mesmo dado do ranking ao lado, visto de uma vez. */
export function PilaresGrafico({
  linhas,
  nomeDaCor,
}: {
  linhas: LinhaRanking[];
  nomeDaCor: (c: CorHealthTrack) => string;
}) {
  const dados = linhas.map((l) => ({
    nome: l.nome.split(/\s*[&/]\s*/)[0],
    [nomeDaCor("verde")]: l.verde,
    [nomeDaCor("amarelo")]: l.amarelo,
    [nomeDaCor("vermelho")]: l.vermelho,
  }));
  return (
    <CaixaGrafico $altura={`${Math.max(10, linhas.length * 2 + 3)}rem`}>
      <ResponsiveContainer>
        <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={theme.colors.border} horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...eixo} axisLine={false} />
          <YAxis type="category" dataKey="nome" width={110} {...eixo} axisLine={false} />
          <Tooltip cursor={{ fill: theme.colors.muted }} />
          <Legend iconType="circle" verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
          <Bar dataKey={nomeDaCor("verde")} stackId="p" fill={SOLIDO_COR.verde} isAnimationActive={false} />
          <Bar dataKey={nomeDaCor("amarelo")} stackId="p" fill={SOLIDO_COR.amarelo} isAnimationActive={false} />
          <Bar dataKey={nomeDaCor("vermelho")} stackId="p" fill={SOLIDO_COR.vermelho} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </CaixaGrafico>
  );
}
