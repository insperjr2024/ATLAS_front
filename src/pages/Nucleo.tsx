import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getBancasFrentes, getFrentes } from "@/lib/bancas";
import { getHistoricoBancas } from "@/lib/historico";
import { getSemestres, semestreAtual } from "@/lib/semestres";
import { getUsuarios } from "@/lib/usuarios";
import { nomeUsuario } from "@/lib/nucleo";
import type { BancaFrente, Frente, HistoricoBanca, Semestre } from "@/types/banca";
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
  TablesGrid,
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  NameCell,
  TableCell,
  NotaCell,
} from "./Nucleo.styled";

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

interface ResultadoCoordenador {
  coordenadorId: number;
  bancas: number;
  notaMedia: number | null;
}

export function Nucleo() {
  const { usuario, token } = useAuth();
  const [historico, setHistorico] = useState<HistoricoBanca[]>([]);
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [bancasFrentes, setBancasFrentes] = useState<BancaFrente[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [historicoResp, semestresResp, usuariosResp, bancasFrentesResp, frentesResp] = await Promise.all([
        getHistoricoBancas(token),
        getSemestres(token),
        getUsuarios(token),
        getBancasFrentes(token),
        getFrentes(token),
      ]);
      setHistorico(historicoResp);
      setSemestres(semestresResp);
      setUsuarios(usuariosResp);
      setBancasFrentes(bancasFrentesResp);
      setFrentes(frentesResp);
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
  }, [historicoSemestre, bancasFrentes, frentes]);

  const ultimasRealizadas = useMemo(
    () =>
      [...historicoSemestre]
        .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
        .slice(0, 5),
    [historicoSemestre],
  );

  const resultadosCoordenador = useMemo(() => {
    const mapa = new Map<number, { bancas: number; soma: number; comNota: number }>();
    for (const banca of historicoSemestre) {
      const cur = mapa.get(banca.coordenador_id) ?? { bancas: 0, soma: 0, comNota: 0 };
      cur.bancas += 1;
      if (banca.nota_final != null) {
        cur.soma += banca.nota_final;
        cur.comNota += 1;
      }
      mapa.set(banca.coordenador_id, cur);
    }
    const lista: ResultadoCoordenador[] = Array.from(mapa.entries()).map(([coordenadorId, dados]) => ({
      coordenadorId,
      bancas: dados.bancas,
      notaMedia: dados.comNota > 0 ? dados.soma / dados.comNota : null,
    }));
    return lista.sort((a, b) => b.bancas - a.bancas);
  }, [historicoSemestre]);

  const resultadosProjeto = useMemo(
    () =>
      [...historicoSemestre].sort(
        (a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime(),
      ),
    [historicoSemestre],
  );

  if (!usuario?.cargo.pode_gerenciar_cargos) {
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
            <PageCardTitle>Distribuição de bancas por frente — {semestreNome}</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <DesempenhoChart
              fatias={fatias}
              valorCentral={String(historicoSemestre.length)}
              ariaLabel={`${historicoSemestre.length} bancas realizadas no semestre`}
            />
            <ChartCaption>
              {historicoSemestre.length}{" "}
              {historicoSemestre.length === 1 ? "banca realizada" : "bancas realizadas"} no semestre
            </ChartCaption>
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Últimas bancas realizadas</PageCardTitle>
          </PageCardHeader>
          <ListCardContent>
            {ultimasRealizadas.length === 0 && <EmptyText>Nenhuma banca realizada neste semestre.</EmptyText>}
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
          </ListCardContent>
        </PageCard>
      </TopGrid>

      <TablesGrid>
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Resultados por coordenador</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {resultadosCoordenador.length === 0 && <EmptyText>Nenhum resultado neste semestre.</EmptyText>}
            {resultadosCoordenador.length > 0 && (
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Coordenador</TableHeadCell>
                    <TableHeadCell>Bancas</TableHeadCell>
                    <TableHeadCell>Nota média</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultadosCoordenador.map((item) => (
                    <TableRow key={item.coordenadorId}>
                      <NameCell>{nomeUsuario(usuarios, item.coordenadorId)}</NameCell>
                      <TableCell>{item.bancas}</TableCell>
                      <NotaCell>{formatNota(item.notaMedia)}</NotaCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            )}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Resultados por projeto</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            {resultadosProjeto.length === 0 && <EmptyText>Nenhum projeto avaliado neste semestre.</EmptyText>}
            {resultadosProjeto.length > 0 && (
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Projeto</TableHeadCell>
                    <TableHeadCell>Coordenador</TableHeadCell>
                    <TableHeadCell>Nota</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultadosProjeto.map((banca) => (
                    <TableRow key={banca.id}>
                      <NameCell>{banca.nome_projeto}</NameCell>
                      <TableCell>{nomeUsuario(usuarios, banca.coordenador_id)}</TableCell>
                      <NotaCell>{formatNota(banca.nota_final)}</NotaCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            )}
          </PageCardContent>
        </PageCard>
      </TablesGrid>
    </PageStack>
  );
}
