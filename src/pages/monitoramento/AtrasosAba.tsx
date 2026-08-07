import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAtrasos, type Atrasos } from "@/lib/monitoramento";
import { formatarData, ROTULO_STATUS } from "@/lib/projetos";
import type { StatusProjeto } from "@/types/projeto";

type LinhaProjeto = Atrasos["por_projeto"][number];
type Motivo = LinhaProjeto["motivos"][number];
import { ConteudoPaginado, Paginacao, usePaginacao } from "./Paginacao";
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
  EmptyText,
} from "@/styles/page.styled";
import {
  AtrasoCorpo,
  AtrasoDias,
  AtrasoTitulo,
  BarraCelula,
  BarraCelulaPreenchida,
  BarraCelulaTrilho,
  DataTable,
  EstadoLimpo,
  EstadoLimpoIcone,
  FaixaResumo,
  Legenda,
  LegendaItem,
  LinhaAtraso,
  LinkProjeto,
  ListaSimples,
  MotivoData,
  MotivoDias,
  MotivoItem,
  MotivoLista,
  MotivoTag,
  Pilula,
  PiorCaso,
  ResumoItem,
  ResumoRotulo,
  ResumoValor,
  SemDado,
  TabelaRolagem,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  type NivelSeveridade,
} from "./Monitoramento.styled";
import { useFiltroFrente } from "./FiltroFrente";

const ROTULO_MOTIVO: Record<string, string> = {
  banca: "banca",
  entrega_interna: "entrega",
  entrega_externa: "agenda do cliente",
};

/**
 * §7.4 — o pilar é a BANCA: "um escopo está atrasado quando passa da data da
 * sua banca sem que ela tenha acontecido". A entrega ao cliente é acompanhada
 * à parte, com a distinção interno/externo, para não penalizar o time pelo
 * que não é dele.
 *
 * Os dias aqui são ÚTEIS, pelo calendário do Insper — a mesma régua da aba de
 * Execução. O texto do §7.4 dizia "corridos", mas a diretoria confirmou em
 * 2026-08-04 que são úteis: cobrar fim de semana, feriado e semana de provas
 * seria cobrar tempo em que o time não tinha como trabalhar. Não há mais duas
 * réguas no sistema, então os números das duas abas se comparam.
 *
 * ⭐ **A tela mostra o PIOR CASO, não a soma** — decisão de 2026-08-06.
 *
 * `dias_totais` continua existindo e é uma SOMA: três escopos com 4 dias cada
 * somam 12 sem que nada esteja parado há 12 dias. Serve para volume acumulado,
 * mas não responde "qual é o maior buraco", que é a pergunta desta aba.
 *
 * Antes o número grande era a soma e a COR vinha do pior motivo isolado — dois
 * elementos do mesmo bloco falando de coisas diferentes. Hoje os dois saem do
 * pior caso, e a lista é ordenada por ele: o número em destaque é o mesmo que
 * define a ordem, então ninguém precisa adivinhar o critério.
 */
export function AtrasosAba() {
  const { token } = useAuth();
  const { frenteId, seletor } = useFiltroFrente();
  const [dados, setDados] = useState<Atrasos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getAtrasos(token, frenteId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os atrasos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId]);

  const projetos = dados?.por_projeto ?? [];
  const coordenadores = dados?.por_coordenador ?? [];

  /* A régua das barras da tabela de coordenadores: o maior pior-caso dela.
     Comparar coordenador com coordenador é o ponto — o §7.4 quer padrão
     recorrente, e padrão só aparece na comparação entre pares. */
  const piorCoordenador = useMemo(
    () => Math.max(1, ...coordenadores.map((c) => c.pior_dias)),
    [coordenadores],
  );

  /* Os números da faixa vêm PRONTOS do backend. A divisão banca/entrega é
     classificação de motivo, e recontá-la aqui a partir das descrições seria
     reimplementar no front uma regra que o §7.4 já define no servidor. */
  const resumo = dados?.resumo;

  // Ordenada por gravidade, então o corte esconde a cauda. Antes dos `return`
  // cedo de erro e carregando — hook depois deles seria condicional.
  const listaProjetos = usePaginacao(projetos);

  if (erro) {
    return (
      <PageStack>
        {seletor}
        <ErrorBlock>
          <ErrorText>{erro}</ErrorText>
          <PageButton $variant="outline" onClick={carregar}>
            Tentar novamente
          </PageButton>
        </ErrorBlock>
      </PageStack>
    );
  }

  if (carregando || !dados) {
    return (
      <PageStack>
        {seletor}
        <PageLoadingBlock />
      </PageStack>
    );
  }

  return (
    <PageStack>
      {seletor}
      {resumo && projetos.length > 0 && (
        <FaixaResumo>
          <ResumoItem>
            {/* A contagem fica neutra de propósito. Tingi-la com a gravidade do
                PIOR projeto diria que os 12 estão críticos quando só um está. */}
            <ResumoValor>{resumo.projetos}</ResumoValor>
            <ResumoRotulo>
              {resumo.projetos === 1 ? "projeto atrasado" : "projetos atrasados"}
            </ResumoRotulo>
          </ResumoItem>
          <ResumoItem>
            <ResumoValor $nivel={nivel(resumo.pior_caso)}>
              {resumo.pior_caso}
              <small>dias</small>
            </ResumoValor>
            <ResumoRotulo>pior atraso isolado</ResumoRotulo>
          </ResumoItem>
          {/* 🤝 A entrega travada do lado do CLIENTE.
              O §7.4 tira isso do que se cobra do time, e por isso ela some das
              outras leituras — mas é o caso mais delicado do portfólio: é o
              cliente esperando, e quem resolve é a diretoria falando com ele,
              não o coordenador trabalhando mais. Sem um número próprio, esses
              casos ficavam diluídos no total de atrasados. */}
          <ResumoItem>
            <ResumoValor $nivel={resumo.com_externo > 0 ? nivel(resumo.pior_externo) : undefined}>
              {resumo.com_externo}
            </ResumoValor>
            <ResumoRotulo>esperando o cliente</ResumoRotulo>
          </ResumoItem>
        </FaixaResumo>
      )}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Por projeto</PageCardTitle>
          {projetos.length > 0 && (
            <Legenda>
              <LegendaItem $nivel="leve">até 3 dias</LegendaItem>
              <LegendaItem $nivel="media">4 a 10</LegendaItem>
              <LegendaItem $nivel="critica">mais de 10</LegendaItem>
            </Legenda>
          )}
        </PageCardHeader>
        <PageCardContent>
          {projetos.length === 0 ? (
            <EstadoLimpo>
              <EstadoLimpoIcone aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m4 12.5 5.5 5.5L20 6.5" />
                </svg>
              </EstadoLimpoIcone>
              <strong>Nenhum projeto atrasado</strong>
              <span>
                Todas as bancas e entregas da sua visão estão dentro da data planejada.
              </span>
            </EstadoLimpo>
          ) : (
            <>
            <ConteudoPaginado estado={listaProjetos}>
              <ListaSimples>
                {listaProjetos.visiveis.map((p) => {
                  const externo = apenasExterno(p);
                  /* A cor vem do pior motivo isolado — os cortes do `nivel()`
                     foram escritos sobre o cronograma de UM escopo (§5.6), não
                     sobre a soma do projeto. Quando o atraso é todo externo a
                     cor sai de cena: §7.4 não cobra isso do time. */
                  const grau = nivel(pior(p.motivos.filter((m) => !ehExterno(m))));
                  return (
                    <LinhaAtraso key={p.projeto_id}>
                      {/* O PIOR motivo isolado, não a soma dos motivos. Três
                          escopos com 4 dias cada somavam 12 sem que nada
                          estivesse parado há 12 dias — e a soma aparecia aqui
                          ao lado de uma COR tirada do pior caso, então o número
                          e a cor falavam de coisas diferentes. Agora falam do
                          mesmo, e a lista é ordenada por ele. */}
                      <AtrasoDias $nivel={grau} $externo={externo}>
                        <strong>{p.pior_motivo}</strong>
                        <span>dias</span>
                      </AtrasoDias>
  
                      <AtrasoCorpo>
                        <AtrasoTitulo>
                          <LinkProjeto to={`/projetos/${p.projeto_id}`}>{p.projeto_nome}</LinkProjeto>
                          <Pilula $tom="neutro">
                            {ROTULO_STATUS[p.status as StatusProjeto] ?? p.status}
                          </Pilula>
                          {externo && <Pilula $tom="atencao">espera do cliente</Pilula>}
                        </AtrasoTitulo>
  
                        <MotivoLista>
                          {/* Os motivos descem do pior para o menor: numa lista
                              de 5 escopos, é o primeiro que explica a linha. */}
                          {[...p.motivos]
                            .sort((a, b) => b.dias - a.dias)
                            .map((m, i) => (
                              /* O escopo sozinho NÃO é chave única: o mesmo
                                 escopo pode entrar duas vezes, uma pela banca e
                                 outra pela entrega. O par tipo+escopo é. */
                              <MotivoItem key={`${m.tipo}-${m.projeto_escopo_id ?? i}`}>
                                <MotivoTag $externo={ehExterno(m)}>
                                  {ROTULO_MOTIVO[m.tipo] ?? m.tipo}
                                </MotivoTag>
                                <span>{m.escopo}</span>
                                <MotivoDias $nivel={nivel(m.dias)} $externo={ehExterno(m)}>
                                  {m.dias} {m.dias === 1 ? "dia" : "dias"}
                                </MotivoDias>
                                {m.data_referencia && (
                                  <MotivoData>vencia {formatarData(m.data_referencia)}</MotivoData>
                                )}
                              </MotivoItem>
                            ))}
                        </MotivoLista>
                      </AtrasoCorpo>
                    </LinhaAtraso>
                  );
                })}
              </ListaSimples>
</ConteudoPaginado>
            <Paginacao estado={listaProjetos} />
            </>
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Por coordenador</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {coordenadores.length === 0 ? (
            <EmptyText>Nenhum coordenador na sua visão.</EmptyText>
          ) : (
            <TabelaRolagem $min="34rem" $max="26rem">
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Coordenador</TableHeadCell>
                    <TableHeadCell>Projetos</TableHeadCell>
                    <TableHeadCell>Atrasados</TableHeadCell>
                    <TableHeadCell>Pior caso</TableHeadCell>
                    <TableHeadCell>Qual é</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coordenadores.map((c) => (
                    <TableRow key={c.usuario_id}>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell>{c.projetos}</TableCell>
                      <TableCell>
                        {c.atrasados > 0 ? (
                          <Pilula $tom="alerta">
                            {c.atrasados} de {c.projetos}
                          </Pilula>
                        ) : (
                          <Pilula $tom="ok">nenhum</Pilula>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.pior_dias === 0 ? (
                          <SemDado>—</SemDado>
                        ) : (
                          /* A barra é decorativa: o número ao lado já diz o
                             valor, e sem `aria-hidden` o leitor de tela
                             anuncia uma div vazia no meio da célula. */
                          <BarraCelula>
                            <strong>{c.pior_dias}</strong>
                            <BarraCelulaTrilho aria-hidden="true">
                              <BarraCelulaPreenchida
                                $pct={(c.pior_dias / piorCoordenador) * 100}
                                $nivel={nivel(c.pior_dias)}
                              />
                            </BarraCelulaTrilho>
                          </BarraCelula>
                        )}
                      </TableCell>
                      {/* O contexto do pior caso: sem ele o número obriga a
                          procurar na tabela de cima qual dos projetos dele é o
                          tal, e o motivo fica sem resposta. */}
                      <TableCell>
                        {c.pior_dias === 0 ? (
                          <SemDado>—</SemDado>
                        ) : (
                          <PiorCaso>
                            <strong>{c.pior_projeto}</strong>
                            <span>{c.pior_motivo}</span>
                          </PiorCaso>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </TabelaRolagem>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}

/**
 * Os cortes: até 3 dias ainda cabe em reagendar dentro da semana; até 10 é uma
 * banca perdida que dá para recuperar no mês; acima disso o cronograma do
 * escopo já não fecha sem reajuste formal (§5.6).
 *
 * Repare que a régua é o cronograma de UM escopo. Por isso ela se aplica ao
 * atraso de um motivo isolado, e não à soma do projeto — ver `pior()`.
 */
function nivel(dias: number): NivelSeveridade {
  if (dias > 10) return "critica";
  if (dias > 3) return "media";
  return "leve";
}

/** §7.4: a entrega que escorregou por agenda do cliente não é atraso do time. */
function ehExterno(m: Motivo): boolean {
  return m.tipo === "entrega_externa";
}

/** O maior atraso da lista. Zero quando não há motivo — um projeto atrasado
 *  só por agenda do cliente cai aqui, e "leve" é o degrau certo: a cor dele é
 *  desligada de qualquer forma pelo `$externo`. */
function pior(motivos: Motivo[]): number {
  return Math.max(0, ...motivos.map((m) => m.dias));
}

/** Todo o atraso do projeto vem da agenda do cliente. */
function apenasExterno(p: LinhaProjeto): boolean {
  return p.motivos.length > 0 && p.motivos.every(ehExterno);
}
