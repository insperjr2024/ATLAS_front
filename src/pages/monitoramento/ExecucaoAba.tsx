import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getExecucao, type Execucao, type LinhaTarefas } from "@/lib/monitoramento";
import { formatarData, formatarDataHora } from "@/lib/projetos";
import { ConteudoPaginado, POR_PAGINA_TABELA, Paginacao, usePaginacao } from "./Paginacao";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  CelulaDias,
  ConteudoCarregando,
  DataTable,
  FaixaResumo,
  ItemAtencao,
  LinkProjeto,
  ListaSimples,
  NavegacaoSemana,
  ValorDeHoje,
  ResumoItem,
  ResumoRotulo,
  ResumoValor,
  Pilula,
  SemDado,
  TabelaRolagem,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  type NivelSeveridade,
  type TomPilula,
} from "./Monitoramento.styled";
import { useFiltroFrente } from "./FiltroFrente";
import { useFiltroEscopo } from "./FiltroEscopo";

/**
 * §7.2 — ver quem não está distribuindo tarefa nem fazendo reunião, sem
 * precisar abrir projeto por projeto.
 *
 * **Os dias desta aba são ÚTEIS**, pelo calendário do Insper: mede-se quanto
 * tempo de TRABALHO passou, e fim de semana, feriado e semana de provas não
 * são tempo que o time deixou passar. Desde 2026-08-04 a aba de Atrasos usa a
 * mesma régua, então os números das duas se comparam.
 */
export function ExecucaoAba() {
  const { token } = useAuth();
  const { frenteId, seletor: seletorFrente } = useFiltroFrente();
  const { escopoId, seletor: seletorEscopo } = useFiltroEscopo(frenteId);
  const seletor = (
    <>
      {seletorFrente}
      {seletorEscopo}
    </>
  );
  const [dados, setDados] = useState<Execucao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  /* `null` = semana de hoje. Guardamos um DIA, não a semana: o servidor
     normaliza para a segunda, então o front não precisa saber onde a semana
     começa — e não corre o risco de discordar dele. */
  const [referencia, setReferencia] = useState<string | null>(null);

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getExecucao(token, frenteId, referencia ?? undefined, escopoId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar a execução");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId, referencia, escopoId]);

  /** Anda `dias` a partir do início da semana exibida. */
  function navegar(dias: number) {
    if (!dados) return;
    const base = new Date(`${dados.semana.inicio}T12:00:00`);
    base.setDate(base.getDate() + dias);
    setReferencia(base.toISOString().slice(0, 10));
  }

  /* Quem precisa de ação sobe. Sem isso a diretoria varre uma tabela de 30
     linhas para achar as 3 que importam. */
  const tarefasOrdenadas = useMemo(
    () => [...(dados?.tarefas ?? [])].sort((a, b) => severidade(b) - severidade(a)),
    [dados],
  );
  /* "Sem tarefa atribuída HOJE" são duas situações, não uma: o projeto que
     nunca recebeu tarefa e o que zerou o quadro e não recebeu o próximo lote.
     Os dois estão parados agora, que é o que a diretoria precisa ver — filtrar
     só por `sem_tarefas` escondia o segundo caso atrás de um título que
     prometia os dois. Continuam distinguidos na linha, porque a ação é
     diferente: um nunca foi destrinchado, o outro terminou e parou. */
  const semTarefa = useMemo(
    () => tarefasOrdenadas.filter((t) => t.sem_tarefas || t.sem_tarefas_ativas),
    [tarefasOrdenadas],
  );
  // Ordenada por severidade logo acima, então cortar esconde a cauda e não o
  // que pede ação. Fica antes dos `return` de erro e carregando — hook depois
  // deles seria condicional.
  const listaSemTarefa = usePaginacao(semTarefa);
  // As duas tabelas da aba passam de 50 linhas com o núcleo cheio. Rolagem
  // interna dava ~5 telas dentro do card, capturando a roda do mouse; página
  // resolve sem aninhar rolagem.
  const paginaTarefas = usePaginacao(tarefasOrdenadas, POR_PAGINA_TABELA);
  const paginaReunioes = usePaginacao(dados?.reunioes ?? [], POR_PAGINA_TABELA);

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

  /* Esqueleto SÓ na primeira carga. Ao trocar de semana os dados anteriores
     ficam na tela até os novos chegarem — trocar tudo por um bloco vazio
     desmonta a tabela, e o navegador perde a posição do scroll: a pessoa
     clica em "anterior" e é jogada de volta pro topo da página. */
  if (!dados) {
    return (
      <PageStack>
        {seletor}
        <PageLoadingBlock />
      </PageStack>
    );
  }

  const resumo = dados.resumo_tarefas;

  return (
    <ConteudoCarregando $carregando={carregando}>
    <PageStack>
      {seletor}
      {/* Faixa, e não grade de cards: são cinco recortes da MESMA população de
          projetos, então precisam ser lidos lado a lado. Cinco cartões
          idênticos sugeririam cinco assuntos independentes. É o mesmo padrão
          da aba de Atrasos. */}
      <FaixaResumo>
        <ResumoItem>
          <ResumoValor>{resumo.projetos}</ResumoValor>
          <ResumoRotulo>projetos na gestão</ResumoRotulo>
        </ResumoItem>
        <ResumoItem>
          <ResumoValor $nivel={resumo.sem_tarefas > 0 ? "critica" : undefined}>
            {resumo.sem_tarefas}
          </ResumoValor>
          <ResumoRotulo>sem tarefa atribuída</ResumoRotulo>
        </ResumoItem>
        <ResumoItem>
          <ResumoValor $nivel={resumo.sem_tarefas_ativas > 0 ? "leve" : undefined}>
            {resumo.sem_tarefas_ativas}
          </ResumoValor>
          <ResumoRotulo>quadro zerado</ResumoRotulo>
        </ResumoItem>
        <ResumoItem>
          <ResumoValor>{resumo.sem_distribuir_na_semana}</ResumoValor>
          <ResumoRotulo>não distribuiu na semana</ResumoRotulo>
        </ResumoItem>
        <ResumoItem>
          <ResumoValor $nivel={resumo.com_vencidas > 0 ? "media" : undefined}>
            {resumo.com_vencidas}
          </ResumoValor>
          <ResumoRotulo>com tarefa vencida</ResumoRotulo>
        </ResumoItem>
      </FaixaResumo>

      {semTarefa.length > 0 && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Projetos sem tarefa atribuída ({semTarefa.length})</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <ConteudoPaginado estado={listaSemTarefa}>
              <ListaSimples>
                {listaSemTarefa.visiveis.map((linha) => (
                  <ItemAtencao key={linha.projeto_id} $nivel={nivelSemTarefa(linha)}>
                    <strong>
                      <LinkProjeto to={`/projetos/${linha.projeto_id}/tarefas`}>{linha.projeto_nome}</LinkProjeto>{" "}
                      {/* Mesmos tons da coluna "Ativas" da tabela abaixo, para as
                          duas leituras da mesma situação não se contradizerem. */}
                      {linha.sem_tarefas ? (
                        <Pilula $tom="alerta">nunca recebeu tarefa</Pilula>
                      ) : (
                        <Pilula $tom="atencao">quadro zerado</Pilula>
                      )}
                    </strong>
                    <span>{motivoSemTarefa(linha)}</span>
                  </ItemAtencao>
                ))}
              </ListaSimples>
            </ConteudoPaginado>
            <Paginacao estado={listaSemTarefa} />
          </PageCardContent>
        </PageCard>
      )}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Tarefas · semana de {formatarData(dados.semana.inicio)} a{" "}
            {formatarData(dados.semana.fim)}
            {dados.semana.eh_passada && (
              <Pilula $tom="neutro">{rotuloSemana(dados.semana.semanas_atras)}</Pilula>
            )}
          </PageCardTitle>
          <NavegacaoSemana>
            <PageButtonSm $variant="outline" onClick={() => navegar(-7)} disabled={carregando}>
              ← Anterior
            </PageButtonSm>
            {/* "Hoje" some na semana atual: botão que não faz nada só ocupa
                espaço e faz a pessoa clicar para descobrir isso. */}
            {dados.semana.eh_passada && (
              <PageButtonSm $variant="outline" onClick={() => setReferencia(null)} disabled={carregando}>
                Hoje
              </PageButtonSm>
            )}
            <PageButtonSm
              $variant="outline"
              onClick={() => navegar(7)}
              /* O backend recusa data futura com 422 — travar aqui evita o
                 erro em vez de deixar a pessoa provocá-lo. */
              disabled={carregando || dados.semana.eh_atual}
            >
              Próxima →
            </PageButtonSm>
          </NavegacaoSemana>
        </PageCardHeader>
        <PageCardContent>
          {dados.tarefas.length === 0 ? (
            <EmptyText>Nenhum projeto na sua visão.</EmptyText>
          ) : (
            <>
              {/* 7 colunas não cabem num celular. Rolar na horizontal preserva
                  a leitura da linha; espremer quebraria cada célula em três. */}
              <ConteudoPaginado estado={paginaTarefas}>
                <TabelaRolagem $min="52rem">
                <DataTable>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>Projeto</TableHeadCell>
                      <TableHeadCell>Distribuiu na semana</TableHeadCell>
                      <TableHeadCell>Ativas</TableHeadCell>
                      <TableHeadCell>Vencidas</TableHeadCell>
                      <TableHeadCell>Atraso</TableHeadCell>
                      <TableHeadCell>Sem tarefa nova há</TableHeadCell>
                      <TableHeadCell>Última movimentação</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginaTarefas.visiveis.map((linha) => (
                      <TableRow key={linha.projeto_id}>
                        <TableCell>
                          <LinkProjeto to={`/projetos/${linha.projeto_id}/tarefas`}>
                            {linha.projeto_nome}
                          </LinkProjeto>
                        </TableCell>
                        <TableCell>
                          <Pilula $tom={linha.distribuiu_na_semana ? "ok" : "alerta"}>
                            {linha.distribuiu_na_semana ? "sim" : "não"}
                          </Pilula>
                        </TableCell>
                        <TableCell>
                          {/* Zero ativas tem duas causas distintas, e a pílula
                              precisa dizer qual: nunca teve tarefa (alerta) ou
                              terminou todas e não recebeu mais (atenção). */}
                          {linha.sem_tarefas ? (
                            <Pilula $tom="alerta">nenhuma tarefa</Pilula>
                          ) : linha.sem_tarefas_ativas ? (
                            <Pilula $tom="atencao">quadro zerado</Pilula>
                          ) : dados.semana.eh_passada ? (
                            /* A explicação vai no tooltip, não em parágrafo:
                               interessa a quem estranhar o selo, e é a minoria
                               das visitas à tela. */
                            <ValorDeHoje title="Depende de onde a tarefa está no quadro agora — o sistema não guarda o histórico de movimentação entre colunas.">
                              {linha.ativas}
                            </ValorDeHoje>
                          ) : (
                            linha.ativas
                          )}
                        </TableCell>
                        <TableCell>
                          {linha.vencidas > 0 ? (
                            <Pilula $tom="alerta">{linha.vencidas}</Pilula>
                          ) : (
                            <Pilula $tom="neutro">0</Pilula>
                          )}
                        </TableCell>
                        <TableCell>
                          {linha.atraso_maximo_dias_uteis > 0 ? (
                            <CelulaDias $tom="alerta">
                              {linha.atraso_maximo_dias_uteis}
                              <small>{plural(linha.atraso_maximo_dias_uteis)} úteis</small>
                            </CelulaDias>
                          ) : (
                            <SemDado>—</SemDado>
                          )}
                        </TableCell>
                        <TableCell>
                          {linha.dias_uteis_sem_tarefa === null ? (
                            <Pilula $tom="neutro">sem kickoff</Pilula>
                          ) : (
                            /* A MESMA coluna conta de dois lugares: da última
                               tarefa criada, ou do kickoff quando o projeto
                               nunca recebeu nenhuma. Só o número não diz qual,
                               e a diferença muda o que se cobra — por isso a
                               origem vai no `title`, onde cabe sem espremer
                               uma tabela de 7 colunas. */
                            <CelulaDias
                              $tom={tomDiasSemTarefa(linha.dias_uteis_sem_tarefa)}
                              title={origemDoMarco(linha)}
                            >
                              {linha.dias_uteis_sem_tarefa}
                              <small>{plural(linha.dias_uteis_sem_tarefa)} úteis</small>
                            </CelulaDias>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* Sem selo "hoje": o backend corta em `<= fim da
                              semana`, então a data sempre cai dentro da janela
                              do cabeçalho. */}
                          {linha.ultima_movimentacao ? (
                            formatarDataHora(linha.ultima_movimentacao)
                          ) : (
                            <SemDado>—</SemDado>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </TabelaRolagem>
            </ConteudoPaginado>
            <Paginacao estado={paginaTarefas} />
            </>
          )}
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Reuniões da semana</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.reunioes.length === 0 ? (
            <EmptyText>Nenhum projeto na sua visão.</EmptyText>
          ) : (
            <>
              <ConteudoPaginado estado={paginaReunioes}>
                <TabelaRolagem $min="30rem">
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Projeto</TableHeadCell>
                    <TableHeadCell>Realizou</TableHeadCell>
                    <TableHeadCell>Dias registrados</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginaReunioes.visiveis.map((linha) => (
                    <TableRow key={linha.projeto_id}>
                      <TableCell>
                        <LinkProjeto to={`/projetos/${linha.projeto_id}/reunioes`}>{linha.projeto_nome}</LinkProjeto>
                      </TableCell>
                      <TableCell>
                        {/* "Não realizou" é AUSÊNCIA de linha na janela
                            seg–dom, não um campo. */}
                        <Pilula $tom={linha.realizou ? "ok" : "alerta"}>
                          {linha.realizou ? "sim" : "não"}
                        </Pilula>
                      </TableCell>
                      <TableCell>
                        {linha.dias.length > 0 ? (
                          linha.dias.map(formatarData).join(", ")
                        ) : (
                          <SemDado>—</SemDado>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
                </TabelaRolagem>
              </ConteudoPaginado>
              <Paginacao estado={paginaReunioes} />
            </>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
    </ConteudoCarregando>
  );
}

/** "semana passada", "2 semanas atrás", "3 semanas atrás"... */
function rotuloSemana(semanasAtras: number): string {
  return semanasAtras === 1 ? "semana passada" : `${semanasAtras} semanas atrás`;
}

function plural(dias: number): string {
  return dias === 1 ? " dia" : " dias";
}

/** 5 dias úteis é uma semana de trabalho inteira sem tarefa nova — o limiar em
 *  que deixa de ser ritmo normal e vira sinal. 10 são duas semanas. */
function tomDiasSemTarefa(dias: number): TomPilula {
  if (dias >= 10) return "alerta";
  if (dias >= 5) return "atencao";
  return "neutro";
}

/** Sem kickoff não há o que cobrar ainda (§5.2) — a execução nem começou, e
 *  o item já aparece na Visão geral com o motivo certo. */
function nivelSemTarefa(linha: LinhaTarefas): NivelSeveridade {
  if (linha.dias_uteis_sem_tarefa === null) return "leve";
  if (linha.dias_uteis_sem_tarefa >= 10) return "critica";
  if (linha.dias_uteis_sem_tarefa >= 5) return "media";
  return "leve";
}

/**
 * O marco em palavras: "o kickoff (11/09)" ou "a última tarefa criada (14/09)".
 *
 * Vem do backend (`_marco_sem_tarefa`), não é deduzido aqui: o mesmo número de
 * dias pode contar de qualquer um dos dois, e só quem leu o banco sabe qual.
 * Antes o front escrevia "desde o kickoff" fixo e acertava só porque a lista
 * que exibia o texto é filtrada por `sem_tarefas` — bastava mudar o filtro para
 * ele passar a mentir com um número plausível e o rótulo errado.
 *
 * As duas leituras da tela (a frase da lista e o `title` da tabela) saem daqui,
 * para não divergirem uma da outra com o tempo.
 */
function marcoEmPalavras(linha: LinhaTarefas): string {
  const desde =
    linha.marco_sem_tarefa === "ultima_tarefa" ? "a última tarefa criada" : "o kickoff";
  const quando = linha.data_marco_sem_tarefa
    ? ` (${formatarData(linha.data_marco_sem_tarefa)})`
    : "";
  return `${desde}${quando}`;
}

/** O `title` da coluna "Sem tarefa nova há", que sozinha não diz de onde conta. */
function origemDoMarco(linha: LinhaTarefas): string {
  return `Contado desde ${marcoEmPalavras(linha)}`;
}

/**
 * O motivo em uma frase, no card "Projetos sem tarefa atribuída".
 *
 * As duas situações do card pedem frases diferentes porque a causa é diferente:
 * um projeto nunca foi destrinchado em tarefa; o outro terminou o que tinha e
 * não recebeu o próximo lote. Para o segundo, o marco é a última tarefa criada,
 * e escrever "nenhuma tarefa criada desde a última tarefa criada" seria
 * circular.
 */
function motivoSemTarefa(linha: LinhaTarefas): string {
  if (linha.dias_uteis_sem_tarefa === null) {
    return "kickoff ainda não marcado — a execução não começou";
  }
  const ha = `há ${linha.dias_uteis_sem_tarefa}${plural(linha.dias_uteis_sem_tarefa)} úteis`;
  if (linha.sem_tarefas_ativas) {
    return `todas as tarefas foram encerradas e nenhuma nova entrou desde ${marcoEmPalavras(
      linha,
    )}, ${ha}`;
  }
  return `nenhuma tarefa criada desde ${marcoEmPalavras(linha)}, ${ha}`;
}

/** Ordena a tabela por gravidade. Os pesos são arbitrários de propósito: o que
 *  importa é a ORDEM das faixas (sem tarefa > vencida > quadro zerado > não
 *  distribuiu), não o número em si. */
function severidade(linha: LinhaTarefas): number {
  let peso = 0;
  if (linha.sem_tarefas) peso += 1000 + (linha.dias_uteis_sem_tarefa ?? 0);
  if (linha.vencidas > 0) peso += 500 + linha.atraso_maximo_dias_uteis;
  if (linha.sem_tarefas_ativas) peso += 200;
  if (!linha.distribuiu_na_semana) peso += 50;
  return peso;
}
