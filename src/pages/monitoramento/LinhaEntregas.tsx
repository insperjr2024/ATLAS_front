import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CaixaGrafico } from "./Monitoramento.styled";
import { theme } from "@/styles/theme";

/** O teto do eixo Y.
 *
 *  **Fixo, e não ajustado ao maior mês.** Escalando pelo máximo, um mês com
 *  2 entregas desenharia o ponto no topo por ser o melhor da série, o card
 *  diria "ótimo" num semestre fraco. Com teto fixo, a mesma altura significa a
 *  mesma coisa toda vez que a tela abre.
 *
 *  Só sobe se algum mês passar dele, arredondando de 4 em 4: cortar a linha
 *  seria mentir por omissão, e um teto que muda a cada entrega não seria fixo. */
const TETO_PADRAO = 12;

function nomeDoMes(iso: string): string {
  return new Date(`${iso}T12:00:00`)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
}

function mesComAno(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${nomeDoMes(iso)}/${d.getFullYear()}`;
}

/**
 * As entregas de escopo por mês nos últimos 6.
 *
 * **Linha, e não barras.** A pergunta do card é "o ritmo está subindo ou
 * caindo?", e linha responde isso de relance, barras convidam a comparar mês
 * contra mês, que é a leitura errada num intervalo curto onde o volume oscila
 * por acaso.
 *
 * O último ponto é o mês CORRENTE e vem incompleto, então o eixo o chama de
 * "hoje": sem isso a linha parece despencar no fim, quando na verdade o mês
 * ainda está acontecendo.
 */
export function LinhaEntregas({ meses }: { meses: { inicio: string; total: number }[] }) {
  const pico = Math.max(0, ...meses.map((m) => m.total));
  const teto = Math.max(TETO_PADRAO, Math.ceil(pico / 4) * 4);

  const dados = meses.map((m, i) => ({
    // O último rótulo é "hoje", ver o docstring. Os outros levam o mês.
    rotulo: i === meses.length - 1 ? "hoje" : nomeDoMes(m.inicio),
    mes: mesComAno(m.inicio),
    total: m.total,
  }));

  return (
    <CaixaGrafico $altura="13rem">
      <ResponsiveContainer>
        {/* Margem simétrica nos dois lados. Encolher o espaço do eixo Y com
            `left` negativo desloca a ÁREA INTEIRA do gráfico e ele para de
            ficar centralizado no card, quem controla esse espaço é a `width`
            do próprio eixo, logo abaixo. */}
        <LineChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
          <CartesianGrid stroke={theme.colors.border} vertical={false} />
          <XAxis
            dataKey="rotulo"
            stroke={theme.colors.mutedForeground}
            fontSize={12}
            tickLine={false}
          />
          {/* `domain` fixo e `allowDecimals` desligado: entrega é contagem, e
              meio escopo entregue não existe. */}
          <YAxis
            domain={[0, teto]}
            allowDecimals={false}
            width={28}
            stroke={theme.colors.mutedForeground}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          {/* O tooltip mostra o mês DE VERDADE, inclusive no ponto rotulado
              "hoje", senão o último ponto ficaria sem data nenhuma. */}
          <Tooltip
            labelFormatter={(_, carga) => carga?.[0]?.payload?.mes ?? ""}
            cursor={{ stroke: theme.colors.border }}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="entregas"
            stroke={theme.colors.success}
            strokeWidth={2}
            dot={{ r: 3, fill: theme.colors.success }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </CaixaGrafico>
  );
}

export default LinhaEntregas;
