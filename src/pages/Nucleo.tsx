import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getBancasFrentes, getEscopos, getFrentes } from "@/lib/bancas";
import { getHistoricoBancas } from "@/lib/historico";
import { getSemestres, semestreAtual } from "@/lib/semestres";
import { getUsuarios } from "@/lib/usuarios";
import { nomeEscopo, nomeUsuario } from "@/lib/nucleo";
import type { BancaFrente, Escopo, Frente, HistoricoBanca, Semestre } from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";
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
  ListRow,
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
  CardHeaderRow,
  FilterGroup,
  FilterLabel,
  FieldSelect,
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  NameCell,
  TableCell,
  NotaCell,
  TableScrollWrap,
} from "./Nucleo.styled";

type DistribuicaoModo = "frentes" | "escopos";
type ResultadosModo = "coordenador" | "escopo" | "frente";

interface ResultadoAgregado {
  id: number;
  nome: string;
  bancas: number;
  notaMedia: number | null;
}

function formatNota(nota: number | null): string {
  if (nota == null) return "—";
  return nota.toFixed(1);
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function agregarNotas(
  mapa: Map<number, { bancas: number; soma: number; comNota: number }>,
  id: number,
  nota: number | null,
) {
  const cur = mapa.get(id) ?? { bancas: 0, soma: 0, comNota: 0 };
  cur.bancas += 1;
  if (nota != null) {
    cur.soma += nota;
    cur.comNota += 1;
  }
  mapa.set(id, cur);
}

function mapaParaResultados(
  mapa: Map<number, { bancas: number; soma: number; comNota: number }>,
  nomeDe: (id: number) => string,
): ResultadoAgregado[] {
  return Array.from(mapa.entries())
    .map(([id, dados]) => ({
      id,
      nome: nomeDe(id),
      bancas: dados.bancas,
      notaMedia: dados.comNota > 0 ? dados.soma / dados.comNota : null,
    }))
    .sort((a, b) => b.bancas - a.bancas);
}

export function Nucleo() {
  const { usuario, token } = useAuth();
  const [historico, setHistorico] = useState<HistoricoBanca[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [escopos, setEscopos] = useState<Escopo[]>([]);
  const [bancasFrentes, setBancasFrentes] = useState<BancaFrente[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [distribuicaoModo, setDistribuicaoModo] = useState<DistribuicaoModo>("frentes");
  const [distribuicaoFrenteId, setDistribuicaoFrenteId] = useState<string>("");
  const [resultadosModo, setResultadosModo] = useState<ResultadosModo>("coordenador");

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [historicoResp, semestresResp, usuariosResp, escoposResp, bancasFrentesResp, frentesResp] =
        await Promise.all([
          getHistoricoBancas(token),
          getSemestres(token),
          getUsuarios(token),
          getEscopos(token),
          getBancasFrentes(token),
          getFrentes(token),
        ]);
      setHistorico(historicoResp);
      setSemestres(semestresResp);
      setUsuarios(usuariosResp);
      setEscopos(escoposResp);
      setBancasFrentes(bancasFrentesResp);
      setFrentes(frentesResp);
      if (frentesResp.length > 0) {
        setDistribuicaoFrenteId(String(frentesResp[0].id));
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar visão do núcleo");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const semestre = useMemo(() => semestreAtual(semestres), [semestres]);

  const historicoSemestre = useMemo(() => {
    if (!semestre) return historico;
    return historico.filter((b) => b.semestre_id === semestre.id);
  }, [historico, semestre]);

  const fatias: FatiaDonut[] = useMemo(() => {
    if (distribuicaoModo === "frentes") {
      const pontosPorFrente = new Map<string, number>();
      for (const banca of historicoSemestre) {
        const frentesDaBanca = bancasFrentes.filter((bf) => bf.banca_id === banca.id);
        const peso = frentesDaBanca.length > 0 ? 1 / frentesDaBanca.length : 0;
        if (frentesDaBanca.length === 0) {
          pontosPorFrente.set("Sem frente", (pontosPorFrente.get("Sem frente") ?? 0) + 1);
          continue;
        }
        for (const bf of frentesDaBanca) {
          const nome = frentes.find((f) => f.id === bf.frente_id)?.nome ?? "—";
          pontosPorFrente.set(nome, (pontosPorFrente.get(nome) ?? 0) + peso);
        }
      }
      return Array.from(pontosPorFrente.entries()).map(([nome, valor]) => ({
        nome,
        valor: Math.round(valor * 10) / 10,
      }));
    }

    const frenteId = Number(distribuicaoFrenteId);
    if (!frenteId) return [];

    const pontosPorEscopo = new Map<string, number>();
    for (const banca of historicoSemestre) {
      const pertence = bancasFrentes.some((bf) => bf.banca_id === banca.id && bf.frente_id === frenteId);
      if (!pertence) continue;
      const nome = nomeEscopo(escopos, banca.escopo_id);
      pontosPorEscopo.set(nome, (pontosPorEscopo.get(nome) ?? 0) + 1);
    }
    return Array.from(pontosPorEscopo.entries()).map(([nome, valor]) => ({ nome, valor }));
  }, [historicoSemestre, bancasFrentes, frentes, escopos, distribuicaoModo, distribuicaoFrenteId]);

  const totalDistribuicao = useMemo(() => {
    if (distribuicaoModo === "frentes") return historicoSemestre.length;
    const frenteId = Number(distribuicaoFrenteId);
    if (!frenteId) return 0;
    return historicoSemestre.filter((b) =>
      bancasFrentes.some((bf) => bf.banca_id === b.id && bf.frente_id === frenteId),
    ).length;
  }, [historicoSemestre, bancasFrentes, distribuicaoModo, distribuicaoFrenteId]);

  const ultimasRealizadas = useMemo(
    () =>
      [...historicoSemestre]
        .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
        .slice(0, 5),
    [historicoSemestre],
  );

  const resultados = useMemo((): ResultadoAgregado[] => {
    if (resultadosModo === "coordenador") {
      const mapa = new Map<number, { bancas: number; soma: number; comNota: number }>();
      for (const banca of historicoSemestre) {
        agregarNotas(mapa, banca.coordenador_id, banca.nota_final);
      }
      return mapaParaResultados(mapa, (id) => nomeUsuario(usuarios, id));
    }

    if (resultadosModo === "escopo") {
      const mapa = new Map<number, { bancas: number; soma: number; comNota: number }>();
      for (const banca of historicoSemestre) {
        agregarNotas(mapa, banca.escopo_id, banca.nota_final);
      }
      return mapaParaResultados(mapa, (id) => nomeEscopo(escopos, id));
    }

    const mapa = new Map<number, { bancas: number; soma: number; comNota: number }>();
    for (const banca of historicoSemestre) {
      const frentesIds = bancasFrentes.filter((bf) => bf.banca_id === banca.id).map((bf) => bf.frente_id);
      const ids = frentesIds.length > 0 ? frentesIds : [0];
      for (const frenteId of ids) {
        agregarNotas(mapa, frenteId, banca.nota_final);
      }
    }
    return mapaParaResultados(mapa, (id) =>
      id === 0 ? "Sem frente" : (frentes.find((f) => f.id === id)?.nome ?? "—"),
    );
  }, [historicoSemestre, usuarios, escopos, frentes, bancasFrentes, resultadosModo]);

  const rotuloResultados =
    resultadosModo === "coordenador" ? "Coordenador" : resultadosModo === "escopo" ? "Escopo" : "Frente";

  const captionDistribuicao =
    distribuicaoModo === "frentes"
      ? `${totalDistribuicao} ${totalDistribuicao === 1 ? "banca realizada" : "bancas realizadas"} no semestre`
      : distribuicaoFrenteId
        ? `${totalDistribuicao} ${totalDistribuicao === 1 ? "banca" : "bancas"} na frente selecionada`
        : "Selecione uma frente para ver a distribuição por escopos";

  if (usuario?.posicao !== "diretor") {
    return <Navigate to="/dashboard" replace />;
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar a visão do núcleo: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  const semestreNome = semestre?.nome ?? "semestre atual";
  const primeiroNome = usuario.nome.split(" ")[0];
  const frenteSelecionadaNome = frentes.find((f) => f.id === Number(distribuicaoFrenteId))?.nome;

  return (
    <PageStack>
      <GreetingHeader>
        <GreetingTitle>
          {saudacao()}
          {primeiroNome ? `, ${primeiroNome}!` : "!"}
        </GreetingTitle>
        <GreetingSubtitle>Visão geral do núcleo em {semestreNome}.</GreetingSubtitle>
      </GreetingHeader>

      <TopGrid>
        <PageCard>
          <PageCardHeader>
            <CardHeaderRow>
              <PageCardTitle>Distribuição de bancas — {semestreNome}</PageCardTitle>
              <FilterGroup>
                <FilterLabel htmlFor="dist-modo">Ver por</FilterLabel>
                <FieldSelect
                  id="dist-modo"
                  value={distribuicaoModo}
                  onChange={(e) => setDistribuicaoModo(e.target.value as DistribuicaoModo)}
                >
                  <option value="frentes">Frentes</option>
                  <option value="escopos">Escopos de uma frente</option>
                </FieldSelect>
                {distribuicaoModo === "escopos" && (
                  <>
                    <FilterLabel htmlFor="dist-frente">Frente</FilterLabel>
                    <FieldSelect
                      id="dist-frente"
                      value={distribuicaoFrenteId}
                      onChange={(e) => setDistribuicaoFrenteId(e.target.value)}
                    >
                      {frentes.length === 0 && <option value="">Nenhuma frente</option>}
                      {frentes.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                    </FieldSelect>
                  </>
                )}
              </FilterGroup>
            </CardHeaderRow>
          </PageCardHeader>
          <PageCardContent>
            {distribuicaoModo === "escopos" && !distribuicaoFrenteId ? (
              <EmptyText>Selecione uma frente para ver a distribuição por escopos.</EmptyText>
            ) : fatias.length === 0 ? (
              <EmptyText>Nenhuma banca para exibir neste recorte.</EmptyText>
            ) : (
              <DesempenhoChart
                fatias={fatias}
                valorCentral={String(totalDistribuicao)}
                ariaLabel={
                  distribuicaoModo === "frentes"
                    ? `${totalDistribuicao} bancas realizadas no semestre`
                    : `${totalDistribuicao} bancas na frente ${frenteSelecionadaNome ?? ""}`
                }
              />
            )}
            <ChartCaption>{captionDistribuicao}</ChartCaption>
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <CardHeaderRow>
              <PageCardTitle>Resultados — {semestreNome}</PageCardTitle>
              <FilterGroup>
                <FilterLabel htmlFor="res-modo">Ver por</FilterLabel>
                <FieldSelect
                  id="res-modo"
                  value={resultadosModo}
                  onChange={(e) => setResultadosModo(e.target.value as ResultadosModo)}
                >
                  <option value="coordenador">Coordenador</option>
                  <option value="escopo">Escopo</option>
                  <option value="frente">Frente</option>
                </FieldSelect>
              </FilterGroup>
            </CardHeaderRow>
          </PageCardHeader>
          <PageCardContent>
            {resultados.length === 0 && <EmptyText>Nenhum resultado neste semestre.</EmptyText>}
            {resultados.length > 0 && (
              <TableScrollWrap $scrollable={resultados.length > LIST_MAX_VISIVEIS}>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>{rotuloResultados}</TableHeadCell>
                    <TableHeadCell>Bancas</TableHeadCell>
                    <TableHeadCell>Nota média</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultados.map((item) => (
                    <TableRow key={`${resultadosModo}-${item.id}`}>
                      <NameCell>{item.nome}</NameCell>
                      <TableCell>{item.bancas}</TableCell>
                      <NotaCell>{formatNota(item.notaMedia)}</NotaCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
              </TableScrollWrap>
            )}
          </PageCardContent>
        </PageCard>
      </TopGrid>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Últimas bancas realizadas</PageCardTitle>
        </PageCardHeader>
        <ListCardContent>
          {ultimasRealizadas.length === 0 && <EmptyText>Nenhuma banca realizada neste semestre.</EmptyText>}
          {ultimasRealizadas.length > 0 && (
            <ListScrollWrap $scrollable={ultimasRealizadas.length > LIST_MAX_VISIVEIS}>
              {ultimasRealizadas.map((banca) => (
                <ListRow key={banca.id}>
                  <RowGroup>
                    <RowDot aria-hidden />
                    <RowLabel>{banca.nome_projeto}</RowLabel>
                  </RowGroup>
                  <RowMeta>
                    {new Date(banca.data_hora).toLocaleDateString("pt-BR")}
                    {banca.nota_final != null ? ` · Nota ${formatNota(banca.nota_final)}` : ""}
                  </RowMeta>
                </ListRow>
              ))}
            </ListScrollWrap>
          )}
        </ListCardContent>
      </PageCard>
    </PageStack>
  );
}
