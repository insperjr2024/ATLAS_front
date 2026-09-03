import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getExecucao, type Execucao, type LinhaTarefas } from "@/lib/monitoramento";
import { formatarData, formatarDataHora } from "@/lib/projetos";
import { ConteudoPaginado, POR_PAGINA_TABELA, Paginacao, usePaginacao } from "./Paginacao";
import { Th, useOrdenacao, type Colunas } from "@/components/tabela/ordenacao";
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
} from "@/styles/page.styled";
import { EstadoVazio } from "@/components/EstadoVazio";
import {
  BarraFiltros,
  BotaoAlternativa,
  CelulaDias,
  ConteudoCarregando,
  DataTable,
  FaixaResumo,
  GrupoBotoes,
  ItemAtencao,
  LinkProjeto,
  ListaAtencaoGrid,
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
import { useFiltroStatus } from "./FiltroStatus";

/** Pra "voltar" do projeto cair de novo aqui, não em `/projetos`. */
const VOLTAR_PARA_AQUI = { voltarPara: "/monitoramento/execucao", voltarRotulo: "Voltar para Execução" };

const COLUNAS_TAREFAS: Colunas<Execucao["tarefas"][number]> = {
  projeto: { valor: (l) => l.projeto_nome, inicial: "asc" },
  // Booleano ordena com o problema no topo: "Não" (0) antes de "Sim" (1).
  distribuiu: { valor: (l) => (l.distribuiu_na_semana ? 1 : 0), inicial: "asc" },
  ativas: { valor: (l) => l.ativas, inicial: "desc" },
  vencidas: { valor: (l) => l.vencidas, inicial: "desc" },
  atraso: { valor: (l) => l.atraso_maximo_dias_uteis, inicial: "desc" },
  sem_tarefa: { valor: (l) => l.dias_uteis_sem_tarefa, inicial: "desc" },
  // ISO ordena como texto — é justamente para isso que o formato serve.
  movimentacao: { valor: (l) => l.ultima_movimentacao, inicial: "desc" },
};

const COLUNAS_REUNIOES: Colunas<Execucao["reunioes"][number]> = {
  projeto: { valor: (l) => l.projeto_nome, inicial: "asc" },
  realizou: { valor: (l) => (l.realizou ? 1 : 0), inicial: "asc" },
};

/**
 * , ver quem não está distribuindo tarefa nem fazendo reunião, sem
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
  const { status, seletor: seletorStatus } = useFiltroStatus();
  const seletor = (
    <BarraFiltros>
      {seletorFrente}
      {seletorEscopo}
      {seletorStatus}
    </BarraFiltros>
  );
  const [dados, setDados] = useState<Execucao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  /* `null` = semana de hoje. Guardamos um DIA, não a semana: o servidor
     normaliza para a segunda, então o front não precisa saber onde a semana
     começa, e não corre o risco de discordar dele. */
  const [referencia, setReferencia] = useState<string | null>(null);
  /* Qual lado do card de projetos está aberto. Abre em "sem" porque é o que
     pede ação: quem entra no Monitoramento quer saber o que está parado, não
     conferir quem está indo bem. O "com" existe para a pergunta seguinte —
     "e o resto, está andando?" — que antes só era respondível varrendo a
     tabela de sete colunas linha a linha. */
  const [recorte, setRecorte] = useState<"sem" | "com">("sem");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getExecucao(token, frenteId, referencia ?? undefined, escopoId, status));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar a execução");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId, referencia, escopoId, status]);

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
     Os dois estão parados agora, que é o que a diretoria precisa ver, filtrar
     só por `sem_tarefas` escondia o segundo caso atrás de um título que
     prometia os dois. Continuam distinguidos na linha, porque a ação é
     diferente: um nunca foi destrinchado, o outro terminou e parou. */
  const semTarefa = useMemo(
    () => tarefasOrdenadas.filter((t) => t.sem_tarefas || t.sem_tarefas_ativas),
    [tarefasOrdenadas],
  );
  /* O complemento exato do de cima: os dois recortes somados são sempre a
     população inteira da tabela, nunca um projeto nos dois nem em nenhum.
     Por isso a condição é a NEGAÇÃO da outra, e não uma regra própria
     ("ativas > 0") que pareceria igual e sairia do lugar no dia em que o
     backend mudasse de ideia sobre o que conta como quadro zerado. */
  const comTarefa = useMemo(
    () => tarefasOrdenadas.filter((t) => !t.sem_tarefas && !t.sem_tarefas_ativas),
    [tarefasOrdenadas],
  );
  const listaDoRecorte = recorte === "sem" ? semTarefa : comTarefa;
  // Ordenada por severidade logo acima, então cortar esconde a cauda e não o
  // que pede ação. Fica antes dos `return` de erro e carregando, hook depois
  // deles seria condicional.
  const listaProjetos = usePaginacao(listaDoRecorte);

  /* Trocar de lado volta para a primeira página. A página é derivada (o
     `Math.min` de `usePaginacao` só corrige quando a lista nova é MENOR), então
     alternando na página 3 de uma lista longa para outra igualmente longa a
     pessoa cairia no meio da lista nova, sem ter rolado até lá, e leria o
     começo dela como se não existisse. */
  function trocarRecorte(qual: "sem" | "com") {
    setRecorte(qual);
    listaProjetos.irPara(0);
  }
  // As duas tabelas da aba passam de 50 linhas com o núcleo cheio. Rolagem
  // interna dava ~5 telas dentro do card, capturando a roda do mouse; página
  // resolve sem aninhar rolagem.
  /* Ordena ANTES de paginar, senão o clique no cabeçalho reordenaria só as
     linhas da página aberta e a "maior vencida" ficaria escondida na página 3.
     Sem coluna inicial de propósito: a lista chega ordenada por severidade
     (ver `tarefasOrdenadas`), curadoria que nenhuma coluna sozinha reproduz —
     a ordenação entra por cima dela, quando a pessoa pedir. */
  const tarefas = useOrdenacao(tarefasOrdenadas, COLUNAS_TAREFAS);
  const reunioes = useOrdenacao(dados?.reunioes ?? [], COLUNAS_REUNIOES);
  const paginaTarefas = usePaginacao(tarefas.itens, POR_PAGINA_TABELA);
  const paginaReunioes = usePaginacao(reunioes.itens, POR_PAGINA_TABELA);

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
     ficam na tela até os novos chegarem, trocar tudo por um bloco vazio
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
          <ResumoRotulo>Projetos na gestão</ResumoRotulo>
        </ResumoItem>
        <ResumoItem>
          <ResumoValor $nivel={resumo.sem_tarefas > 0 ? "critica" : undefined}>
            {resumo.sem_tarefas}
          </ResumoValor>
          <ResumoRotulo>Sem tarefa atribuída</ResumoRotulo>
        </ResumoItem>
        <ResumoItem>
          <ResumoValor $nivel={resumo.sem_tarefas_ativas > 0 ? "leve" : undefined}>
            {resumo.sem_tarefas_ativas}
          </ResumoValor>
          <ResumoRotulo>Quadro zerado</ResumoRotulo>
        </ResumoItem>
        <ResumoItem>
          <ResumoValor>{resumo.sem_distribuir_na_semana}</ResumoValor>
          <ResumoRotulo>Não distribuiu na semana</ResumoRotulo>
        </ResumoItem>
        <ResumoItem>
          <ResumoValor $nivel={resumo.com_vencidas > 0 ? "media" : undefined}>
            {resumo.com_vencidas}
          </ResumoValor>
          <ResumoRotulo>Com tarefa vencida</ResumoRotulo>
        </ResumoItem>
      </FaixaResumo>

      {/* UM card com dois lados, não dois cards empilhados: os recortes são
          complementares e a pessoa alterna entre eles para responder a mesma
          pergunta ("como está a execução?"). Dois cards colocariam um deles
          fora da tela e fariam rolar para comparar. O card só some quando não
          há projeto nenhum — aí a tabela abaixo já explica o porquê. */}
      {dados.tarefas.length > 0 && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>
              {recorte === "sem"
                ? `Projetos sem tarefa atribuída (${semTarefa.length})`
                : `Projetos com tarefa atribuída (${comTarefa.length})`}
            </PageCardTitle>
            {/* Os números vão NO botão: sem eles, ver quantos estão do outro
                lado exigiria clicar para descobrir, e o par de contagens é
                metade da informação (11 parados de 19 é uma leitura bem
                diferente de 11 de 200). */}
            <GrupoBotoes role="group" aria-label="Recorte dos projetos">
              <BotaoAlternativa
                type="button"
                $ativo={recorte === "sem"}
                aria-pressed={recorte === "sem"}
                onClick={() => trocarRecorte("sem")}
              >
                Sem tarefa ({semTarefa.length})
              </BotaoAlternativa>
              <BotaoAlternativa
                type="button"
                $ativo={recorte === "com"}
                aria-pressed={recorte === "com"}
                onClick={() => trocarRecorte("com")}
              >
                Com tarefa ({comTarefa.length})
              </BotaoAlternativa>
            </GrupoBotoes>
          </PageCardHeader>
          <PageCardContent>
            {listaDoRecorte.length === 0 ? (
              /* Lado vazio é notícia, não defeito: nenhum projeto parado é o
                 objetivo da tela. O texto aponta o outro botão, senão a pessoa
                 lê "nenhum" achando que o filtro de frente escondeu tudo. */
              recorte === "sem" ? (
                <EstadoVazio
                  causa="vazio"
                  titulo="Nenhum projeto sem tarefa atribuída"
                  motivo="Todos os projetos desta visão têm tarefa ativa no quadro. Veja como estão em “Com tarefa”, aqui em cima."
                />
              ) : (
                <EstadoVazio
                  causa="vazio"
                  titulo="Nenhum projeto com tarefa ativa"
                  motivo="Todos os projetos desta visão estão parados — eles aparecem em “Sem tarefa”, aqui em cima."
                />
              )
            ) : (
              <>
                <ConteudoPaginado estado={listaProjetos}>
                  <ListaAtencaoGrid>
                    {listaProjetos.visiveis.map((linha) => (
                      <ItemAtencao
                        key={linha.projeto_id}
                        $nivel={recorte === "sem" ? nivelSemTarefa(linha) : nivelComTarefa(linha)}
                      >
                        <strong>
                          <LinkProjeto
                            to={`/projetos/${linha.projeto_id}/tarefas`}
                            state={VOLTAR_PARA_AQUI}
                          >
                            {linha.projeto_nome}
                          </LinkProjeto>{" "}
                          {/* Mesmos tons da coluna "Ativas" da tabela abaixo, para as
                              duas leituras da mesma situação não se contradizerem. */}
                          {recorte === "sem" ? (
                            linha.sem_tarefas ? (
                              <Pilula $tom="alerta">Nunca recebeu tarefa</Pilula>
                            ) : (
                              <Pilula $tom="atencao">Quadro zerado</Pilula>
                            )
                          ) : linha.vencidas > 0 ? (
                            <Pilula $tom="alerta">
                              {linha.vencidas} vencida{linha.vencidas === 1 ? "" : "s"}
                            </Pilula>
                          ) : (
                            <Pilula $tom="neutro">
                              {linha.ativas} ativa{linha.ativas === 1 ? "" : "s"}
                            </Pilula>
                          )}
                        </strong>
                        <span>
                          {recorte === "sem" ? motivoSemTarefa(linha) : resumoComTarefa(linha)}
                        </span>
                      </ItemAtencao>
                    ))}
                  </ListaAtencaoGrid>
                </ConteudoPaginado>
                <Paginacao estado={listaProjetos} />
              </>
            )}
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
              /* O backend recusa data futura com 422, travar aqui evita o
                 erro em vez de deixar a pessoa provocá-lo. */
              disabled={carregando || dados.semana.eh_atual}
            >
              Próxima →
            </PageButtonSm>
          </NavegacaoSemana>
        </PageCardHeader>
        <PageCardContent>
          {dados.tarefas.length === 0 ? (
            /* "Na sua visão" é jargão de quem construiu a tela: descreve o
               recorte de permissão sem dizer qual é nem o que fazer com ele. */
            <EstadoVazio
              causa="acesso"
              titulo="Nenhum projeto para mostrar nesta semana"
              motivo="Esta tabela cobre os projetos das frentes que você acompanha. Se falta algum, peça à diretoria para conferir a sua frente no cadastro de membros."
            />
          ) : (
            <>
              {/* 7 colunas não cabem num celular. Rolar na horizontal preserva
                  a leitura da linha; espremer quebraria cada célula em três. */}
              <ConteudoPaginado estado={paginaTarefas}>
                <TabelaRolagem $min="52rem">
                <DataTable>
                  <TableHead>
                    <TableRow>
                      <Th coluna="projeto" ordem={tarefas.ordem} onOrdenar={tarefas.ordenarPor}>
                        Projeto
                      </Th>
                      <Th coluna="distribuiu" ordem={tarefas.ordem} onOrdenar={tarefas.ordenarPor}>
                        Distribuiu na semana
                      </Th>
                      <Th coluna="ativas" ordem={tarefas.ordem} onOrdenar={tarefas.ordenarPor}>
                        Ativas
                      </Th>
                      <Th coluna="vencidas" ordem={tarefas.ordem} onOrdenar={tarefas.ordenarPor}>
                        Vencidas
                      </Th>
                      <Th coluna="atraso" ordem={tarefas.ordem} onOrdenar={tarefas.ordenarPor}>
                        Atraso
                      </Th>
                      <Th coluna="sem_tarefa" ordem={tarefas.ordem} onOrdenar={tarefas.ordenarPor}>
                        Sem tarefa nova há
                      </Th>
                      <Th coluna="movimentacao" ordem={tarefas.ordem} onOrdenar={tarefas.ordenarPor}>
                        Última movimentação
                      </Th>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginaTarefas.visiveis.map((linha) => (
                      <TableRow key={linha.projeto_id}>
                        <TableCell>
                          <LinkProjeto to={`/projetos/${linha.projeto_id}/tarefas`} state={VOLTAR_PARA_AQUI}>
                            {linha.projeto_nome}
                          </LinkProjeto>
                        </TableCell>
                        <TableCell>
                          <Pilula $tom={linha.distribuiu_na_semana ? "ok" : "alerta"}>
                            {linha.distribuiu_na_semana ? "Sim" : "Não"}
                          </Pilula>
                        </TableCell>
                        <TableCell>
                          {/* Zero ativas tem duas causas distintas, e a pílula
                              precisa dizer qual: nunca teve tarefa (alerta) ou
                              terminou todas e não recebeu mais (atenção). */}
                          {linha.sem_tarefas ? (
                            <Pilula $tom="alerta">Nenhuma tarefa</Pilula>
                          ) : linha.sem_tarefas_ativas ? (
                            <Pilula $tom="atencao">Quadro zerado</Pilula>
                          ) : dados.semana.eh_passada ? (
                            /* A explicação vai no tooltip, não em parágrafo:
                               interessa a quem estranhar o selo, e é a minoria
                               das visitas à tela. */
                            <ValorDeHoje title="Depende de onde a tarefa está no quadro agora, o sistema não guarda o histórico de movimentação entre colunas.">
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
                            <Pilula $tom="neutro">Sem kickoff</Pilula>
                          ) : (
                            /* A MESMA coluna conta de dois lugares: da última
                               tarefa criada, ou do kickoff quando o projeto
                               nunca recebeu nenhuma. Só o número não diz qual,
                               e a diferença muda o que se cobra, por isso a
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
            <EstadoVazio
              causa="vazio"
              titulo="Nenhuma reunião registrada nesta semana"
              motivo="As reuniões semanais são marcadas no cronograma de cada projeto. Se a semana já passou e nada aparece, é sinal de que ninguém registrou."
            />
          ) : (
            <>
              <ConteudoPaginado estado={paginaReunioes}>
                <TabelaRolagem $min="30rem">
              <DataTable>
                <TableHead>
                  <TableRow>
                    <Th coluna="projeto" ordem={reunioes.ordem} onOrdenar={reunioes.ordenarPor}>
                      Projeto
                    </Th>
                    <Th coluna="realizou" ordem={reunioes.ordem} onOrdenar={reunioes.ordenarPor}>
                      Realizou
                    </Th>
                    {/* Lista de datas: não há "maior" nem "menor" que ordene. */}
                    <TableHeadCell>Dias registrados</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginaReunioes.visiveis.map((linha) => (
                    <TableRow key={linha.projeto_id}>
                      <TableCell>
                        {/* A aba Reuniões deixou de existir: as reuniões
                            passaram a ser marcadas no calendário do
                            cronograma, que é para onde este link leva. */}
                        <LinkProjeto to={`/projetos/${linha.projeto_id}/cronograma`} state={VOLTAR_PARA_AQUI}>
                          {linha.projeto_nome}
                        </LinkProjeto>
                      </TableCell>
                      <TableCell>
                        {/* "Não realizou" é AUSÊNCIA de linha na janela
                            seg–dom, não um campo. */}
                        <Pilula $tom={linha.realizou ? "ok" : "alerta"}>
                          {linha.realizou ? "Sim" : "Não"}
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

/** "Semana passada", "2 semanas atrás", "3 semanas atrás"... */
function rotuloSemana(semanasAtras: number): string {
  return semanasAtras === 1 ? "Semana passada" : `${semanasAtras} semanas atrás`;
}

function plural(dias: number): string {
  return dias === 1 ? " dia" : " dias";
}

/** 5 dias úteis é uma semana de trabalho inteira sem tarefa nova, o limiar em
 *  que deixa de ser ritmo normal e vira sinal. 10 são duas semanas. */
function tomDiasSemTarefa(dias: number): TomPilula {
  if (dias >= 10) return "alerta";
  if (dias >= 5) return "atencao";
  return "neutro";
}

/** Sem kickoff não há o que cobrar ainda, a execução nem começou, e
 *  o item já aparece na Visão geral com o motivo certo. */
function nivelSemTarefa(linha: LinhaTarefas): NivelSeveridade {
  if (linha.dias_uteis_sem_tarefa === null) return "leve";
  if (linha.dias_uteis_sem_tarefa >= 10) return "critica";
  if (linha.dias_uteis_sem_tarefa >= 5) return "media";
  return "leve";
}

/** O ponto do item no recorte "com tarefa": só sobe por tarefa VENCIDA, pela
 *  mesma régua de dias úteis da tabela. Quem tem o quadro andando fica no
 *  degrau mais baixo. */
function nivelComTarefa(linha: LinhaTarefas): NivelSeveridade {
  if (linha.vencidas === 0) return "leve";
  if (linha.atraso_maximo_dias_uteis >= 10) return "critica";
  if (linha.atraso_maximo_dias_uteis >= 5) return "media";
  return "leve";
}

/** A frase do item no recorte "com tarefa": se a semana teve distribuição e,
 *  quando houver, os números que a pílula não dá (o pior atraso e há quantos
 *  dias úteis não entra tarefa nova). */
function resumoComTarefa(linha: LinhaTarefas): string {
  const partes = [
    linha.distribuiu_na_semana ? "distribuiu na semana" : "não distribuiu na semana",
  ];
  if (linha.vencidas > 0) {
    const dias = linha.atraso_maximo_dias_uteis;
    partes.push(`maior atraso de ${dias}${plural(dias)} úteis`);
  }
  /* Só a partir de 5 (uma semana de trabalho): abaixo disso é ritmo normal, e
     anunciar "sem tarefa nova há 2 dias úteis" em todo item treina a pessoa a
     ignorar a linha justamente onde ela diz 14. */
  if (linha.dias_uteis_sem_tarefa !== null && linha.dias_uteis_sem_tarefa >= 5) {
    const dias = linha.dias_uteis_sem_tarefa;
    partes.push(`sem tarefa nova há ${dias}${plural(dias)} úteis`);
  }
  return partes.join(" · ");
}

/**
 * O marco em palavras: "o kickoff (11/09)" ou "a última tarefa criada (14/09)".
 *
 * Vem do backend (`_marco_sem_tarefa`), não é deduzido aqui: o mesmo número de
 * dias pode contar de qualquer um dos dois, e só quem leu o banco sabe qual.
 * Antes o front escrevia "desde o kickoff" fixo e acertava só porque a lista
 * que exibia o texto é filtrada por `sem_tarefas`, bastava mudar o filtro para
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
    return "Kickoff ainda não marcado: a execução não começou";
  }
  const ha = `há ${linha.dias_uteis_sem_tarefa}${plural(linha.dias_uteis_sem_tarefa)} úteis`;
  if (linha.sem_tarefas_ativas) {
    return `Todas as tarefas foram encerradas e nenhuma nova entrou desde ${marcoEmPalavras(
      linha,
    )}, ${ha}`;
  }
  return `Nenhuma tarefa criada desde ${marcoEmPalavras(linha)}, ${ha}`;
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
