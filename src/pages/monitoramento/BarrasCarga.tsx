import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ROTULO_STATUS } from "@/lib/projetos";
import type { LinhaCarga } from "@/lib/monitoramento";
import type { StatusProjeto } from "@/types/projeto";
import { EmptyText } from "@/styles/page.styled";
import {
  BotaoAlternativa,
  CaixaGrafico,
  ControlesGrafico,
  FieldSelect,
  FiltroAtivo,
  GrupoBotoes,
} from "./Monitoramento.styled";
import { theme } from "@/styles/theme";

type Papel = "consultor" | "coordenador";

/** As etapas que podem aparecer no filtro. Sai dos dados, não de uma lista
 *  fixa: oferecer "Envio do TEP" quando ninguém tem projeto nessa etapa produz
 *  um gráfico vazio e a impressão de que quebrou. */
function etapasPresentes(linhas: LinhaCarga[]): StatusProjeto[] {
  const vistas = new Set<StatusProjeto>();
  for (const l of linhas) for (const p of l.projetos) vistas.add(p.status);
  return (Object.keys(ROTULO_STATUS) as StatusProjeto[]).filter((s) => vistas.has(s));
}

/**
 * Carga por pessoa (§7.3), filtrável por etapa.
 *
 * Responde o que as tabelas abaixo não respondem: "quem está cheio **de projeto
 * em validação de bancas**". A carga total já está na tabela; aqui a pergunta é
 * a fatia dela.
 *
 * ⚠ **O filtro muda a barra, nunca a situação.** `total` e `situacao` da linha
 * são do backend, sobre a carga inteira. Recalcular a situação sobre o
 * subconjunto faria a mesma pessoa aparecer "Disponível" no gráfico filtrado e
 * "Carga alta" na tabela logo abaixo.
 *
 * A frente NÃO tem seletor aqui: ela vem do filtro global do topo do
 * monitoramento. Dois seletores de frente na mesma tela podem discordar, e aí a
 * tela passa a dizer duas coisas ao mesmo tempo.
 */
export function BarrasCarga({
  coordenadores,
  consultores,
}: {
  coordenadores: LinhaCarga[];
  consultores: LinhaCarga[];
}) {
  const [papel, setPapel] = useState<Papel>("consultor");
  const [etapa, setEtapa] = useState<StatusProjeto | "">("");

  const linhas = papel === "consultor" ? consultores : coordenadores;
  const etapas = useMemo(() => etapasPresentes(linhas), [linhas]);

  const dados = useMemo(() => {
    return linhas
      .map((l) => ({
        nome: l.nome,
        // Sem filtro o valor é o `total` do backend. Com filtro, a contagem do
        // subconjunto — e é só isso que o filtro pode mexer.
        valor: etapa ? l.projetos.filter((p) => p.status === etapa).length : l.total,
      }))
      // Quem tem zero no recorte sai: uma barra de altura zero só ocupa espaço
      // e empurra para baixo quem realmente tem carga.
      .filter((d) => d.valor > 0)
      // Do mais carregado para o menos: é a pergunta que um gráfico de carga
      // responde. As tabelas abaixo ordenam ao contrário, porque respondem
      // outra ("quem pega o próximo projeto?").
      .sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome));
  }, [linhas, etapa]);

  // Uma barra ocupa ~1.75rem; o container precisa de altura fixa porque o
  // ResponsiveContainer mede o pai e em altura `auto` calcula zero.
  const altura = `${Math.max(8, dados.length * 1.75 + 2)}rem`;

  return (
    <div>
      <ControlesGrafico>
        <GrupoBotoes role="group" aria-label="Papel">
          <BotaoAlternativa
            type="button"
            $ativo={papel === "consultor"}
            aria-pressed={papel === "consultor"}
            onClick={() => setPapel("consultor")}
          >
            Consultores
          </BotaoAlternativa>
          <BotaoAlternativa
            type="button"
            $ativo={papel === "coordenador"}
            aria-pressed={papel === "coordenador"}
            onClick={() => setPapel("coordenador")}
          >
            Coordenadores
          </BotaoAlternativa>
        </GrupoBotoes>

        <FieldSelect
          value={etapa}
          onChange={(e) => setEtapa(e.target.value as StatusProjeto | "")}
          aria-label="Filtrar por etapa"
        >
          <option value="">Todas as etapas</option>
          {etapas.map((s) => (
            <option key={s} value={s}>
              {ROTULO_STATUS[s]}
            </option>
          ))}
        </FieldSelect>

        {/* Sem este aviso o gráfico mostra números menores que a tabela logo
            abaixo e parece bug — o filtro fica escondido num select que
            ninguém relê depois de escolher. */}
        {etapa && <FiltroAtivo>contando só {ROTULO_STATUS[etapa].toLowerCase()}</FiltroAtivo>}
      </ControlesGrafico>

      {dados.length === 0 ? (
        <EmptyText>
          {etapa
            ? `Nenhum ${papel} com projeto em ${ROTULO_STATUS[etapa].toLowerCase()}.`
            : `Nenhum ${papel} com projeto ativo.`}
        </EmptyText>
      ) : (
        <CaixaGrafico $altura={altura}>
          <ResponsiveContainer>
            {/* Horizontal: nome de pessoa não cabe no eixo X sem girar o texto,
                e texto girado é ilegível numa lista longa. */}
            <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke={theme.colors.border} />
              <XAxis
                type="number"
                allowDecimals={false}
                stroke={theme.colors.mutedForeground}
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="nome"
                width={140}
                stroke={theme.colors.mutedForeground}
                fontSize={12}
              />
              <Tooltip cursor={{ fill: theme.colors.muted }} />
              {/* O `name` é o que o tooltip escreve ao lado do número. Sem ele
                  sairia "valor", que é nome de campo, não de coisa. */}
              <Bar
                dataKey="valor"
                name="projetos"
                fill={theme.colors.primary}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CaixaGrafico>
      )}
    </div>
  );
}

export default BarrasCarga;
