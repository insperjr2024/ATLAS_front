import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import {
  getDadosGrafico,
  getFontesGrafico,
  type FonteGrafico,
  type Granularidade,
  type Operacao,
  type ResultadoGrafico,
} from "@/lib/graficos";
import { PALETA } from "@/components/cronograma-pintado/cores";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButtonSm,
  PageLoadingBlock,
  EmptyText,
  ErrorBlock,
  ErrorText,
  PageButton,
} from "@/styles/page.styled";
import { CaixaGrafico } from "./Monitoramento.styled";
import {
  MontadorGrid,
  CampoMontador,
  RotuloMontador,
  SelectMontador,
  DescricaoFonte,
  TipoBotoes,
  ResumoLinha,
} from "./Graficos.styled";

const TIPOS = [
  { chave: "barra", rotulo: "Barras" },
  { chave: "linha", rotulo: "Linha" },
  { chave: "rosca", rotulo: "Rosca" },
] as const;

type TipoGrafico = (typeof TIPOS)[number]["chave"];

const CORES = PALETA.map((p) => p.amostra);

/**
 * Montador de gráficos do monitoramento (§7).
 *
 * 📐 As tabelas oferecidas vêm de um catálogo curado no backend — o front não
 * conhece o banco nem tem cópia da lista. Coluna de credencial, texto sobre
 * pessoas e tabela de ligação ficam de fora de propósito; ver o aviso no topo
 * de `graficos.py`.
 *
 * 📐 Nada fica salvo. O gráfico existe enquanto a tela está aberta — foi a
 * escolha do núcleo, para ver se o formato serve antes de virar tabela nova.
 */
export function GraficosAba() {
  const { token } = useAuth();
  const [fontes, setFontes] = useState<FonteGrafico[]>([]);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const [tabela, setTabela] = useState("");
  const [dimensao, setDimensao] = useState("");
  const [operacao, setOperacao] = useState<Operacao>("contagem");
  const [metrica, setMetrica] = useState("");
  const [granularidade, setGranularidade] = useState<Granularidade>("mes");
  const [tipo, setTipo] = useState<TipoGrafico>("barra");

  const [resultado, setResultado] = useState<{ chave: string; dados: ResultadoGrafico } | null>(
    null,
  );

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    getFontesGrafico(token)
      .then((lista) => {
        if (!ativo) return;
        setFontes(lista);
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar as tabelas");
      });
    return () => {
      ativo = false;
    };
  }, [token, tentativa]);

  const fonte = fontes.find((f) => f.tabela === tabela) ?? null;
  const dimensoes = fonte?.colunas.filter((c) => c.papel !== "metrica") ?? [];
  const metricas = fonte?.colunas.filter((c) => c.papel === "metrica") ?? [];
  const colunaDim = fonte?.colunas.find((c) => c.nome === dimensao) ?? null;
  const ehData = colunaDim?.papel === "data";
  // Junção só conta registros: somar por frente contaria o mesmo projeto uma
  // vez por frente dele. O backend recusa, então nem oferecemos.
  const ehRelacao = colunaDim?.papel === "relacao";
  const podeMedir = metricas.length > 0 && !ehRelacao;

  // Só busca quando a combinação está completa. `operacao` diferente de
  // contagem exige métrica — sem ela o backend recusaria e a tela piscaria
  // erro enquanto a pessoa ainda está montando.
  const pronto = !!tabela && !!dimensao && (operacao === "contagem" || !!metrica);
  const chave = pronto
    ? [tabela, dimensao, operacao, metrica, ehData ? granularidade : ""].join("|")
    : "";

  useEffect(() => {
    if (!token || !chave) return;
    let ativo = true;
    getDadosGrafico(
      { tabela, dimensao, operacao, metrica: metrica || null, granularidade },
      token,
    )
      .then((r) => {
        if (!ativo) return;
        setResultado({ chave, dados: r });
        setErro("");
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao montar o gráfico");
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, chave]);

  function trocarTabela(nova: string) {
    setTabela(nova);
    // Coluna de uma tabela não existe na outra: manter a escolha anterior
    // mandaria uma combinação que o backend recusa.
    setDimensao("");
    setMetrica("");
    setOperacao("contagem");
    setResultado(null);
  }

  const dados = resultado?.chave === chave ? resultado.dados : null;

  const conteudo = useMemo(() => {
    if (!dados || dados.dados.length === 0) return null;
    const pontos = dados.dados;

    if (tipo === "rosca") {
      return (
        <PieChart>
          <Pie data={pontos} dataKey="valor" nameKey="rotulo" innerRadius="55%" outerRadius="80%">
            {pontos.map((p, i) => (
              <Cell key={p.rotulo} fill={CORES[i % CORES.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    }

    if (tipo === "linha") {
      return (
        <LineChart data={pontos} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="rotulo" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="valor" stroke={CORES[0]} strokeWidth={2} />
        </LineChart>
      );
    }

    return (
      <BarChart data={pontos} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="rotulo" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
          {pontos.map((p, i) => (
            <Cell key={p.rotulo} fill={CORES[i % CORES.length]} />
          ))}
        </Bar>
      </BarChart>
    );
  }, [dados, tipo]);

  if (erro && fontes.length === 0) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => setTentativa((n) => n + 1)}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (fontes.length === 0) return <PageLoadingBlock />;

  return (
    <>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Montar gráfico</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <MontadorGrid>
            <CampoMontador>
              <RotuloMontador htmlFor="g-tabela">Tabela</RotuloMontador>
              <SelectMontador
                id="g-tabela"
                value={tabela}
                onChange={(e) => trocarTabela(e.target.value)}
              >
                <option value="">Escolha uma tabela...</option>
                {fontes.map((f) => (
                  <option key={f.tabela} value={f.tabela}>
                    {f.rotulo}
                  </option>
                ))}
              </SelectMontador>
            </CampoMontador>

            <CampoMontador>
              <RotuloMontador htmlFor="g-dimensao">Agrupar por</RotuloMontador>
              <SelectMontador
                id="g-dimensao"
                value={dimensao}
                disabled={!fonte}
                onChange={(e) => {
                  setDimensao(e.target.value);
                  const nova = fonte?.colunas.find((c) => c.nome === e.target.value);
                  if (nova?.papel === "relacao") {
                    setOperacao("contagem");
                    setMetrica("");
                  }
                }}
              >
                <option value="">{fonte ? "Escolha..." : "Escolha a tabela antes"}</option>
                {dimensoes.map((c) => (
                  <option key={c.nome} value={c.nome}>
                    {c.rotulo}
                    {c.papel === "data" ? " (por período)" : ""}
                  </option>
                ))}
              </SelectMontador>
            </CampoMontador>

            <CampoMontador>
              <RotuloMontador htmlFor="g-operacao">Medir</RotuloMontador>
              <SelectMontador
                id="g-operacao"
                value={operacao}
                disabled={!fonte}
                onChange={(e) => {
                  const nova = e.target.value as Operacao;
                  setOperacao(nova);
                  if (nova === "contagem") setMetrica("");
                }}
              >
                <option value="contagem">Quantidade de registros</option>
                {podeMedir && <option value="soma">Soma de...</option>}
                {podeMedir && <option value="media">Média de...</option>}
              </SelectMontador>
            </CampoMontador>

            {operacao !== "contagem" && (
              <CampoMontador>
                <RotuloMontador htmlFor="g-metrica">Coluna numérica</RotuloMontador>
                <SelectMontador
                  id="g-metrica"
                  value={metrica}
                  onChange={(e) => setMetrica(e.target.value)}
                >
                  <option value="">Escolha...</option>
                  {metricas.map((c) => (
                    <option key={c.nome} value={c.nome}>
                      {c.rotulo}
                    </option>
                  ))}
                </SelectMontador>
              </CampoMontador>
            )}

            {ehData && (
              <CampoMontador>
                <RotuloMontador htmlFor="g-granularidade">Período</RotuloMontador>
                <SelectMontador
                  id="g-granularidade"
                  value={granularidade}
                  onChange={(e) => setGranularidade(e.target.value as Granularidade)}
                >
                  <option value="mes">Por mês</option>
                  <option value="ano">Por ano</option>
                </SelectMontador>
              </CampoMontador>
            )}
          </MontadorGrid>

          {fonte && <DescricaoFonte>{fonte.descricao}</DescricaoFonte>}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>{dados ? dados.titulo : "Gráfico"}</PageCardTitle>
          <TipoBotoes>
            {TIPOS.map((t) => (
              <PageButtonSm
                key={t.chave}
                type="button"
                $variant={tipo === t.chave ? "primary" : "outline"}
                aria-pressed={tipo === t.chave}
                onClick={() => setTipo(t.chave)}
              >
                {t.rotulo}
              </PageButtonSm>
            ))}
          </TipoBotoes>
        </PageCardHeader>
        <PageCardContent>
          {!pronto ? (
            <EmptyText>
              Escolha uma tabela e por onde agrupar. O gráfico aparece sozinho.
            </EmptyText>
          ) : erro ? (
            <ErrorText>{erro}</ErrorText>
          ) : !dados ? (
            <EmptyText>Carregando...</EmptyText>
          ) : dados.dados.length === 0 ? (
            <EmptyText>Nenhum dado para esse recorte.</EmptyText>
          ) : (
            <>
              <CaixaGrafico $altura="22rem">
                <ResponsiveContainer width="100%" height="100%">
                  {conteudo ?? <div />}
                </ResponsiveContainer>
              </CaixaGrafico>
              <ResumoLinha>
                {dados.dados.length} {dados.dados.length === 1 ? "fatia" : "fatias"} · total{" "}
                {Number.isInteger(dados.total) ? dados.total : dados.total.toFixed(1)}
              </ResumoLinha>
            </>
          )}
        </PageCardContent>
      </PageCard>
    </>
  );
}
