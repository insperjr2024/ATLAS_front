import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { pode } from "@/utils/permissoes";
import { getAtrasos, type Atrasos } from "@/lib/monitoramento";
import {
  formatarData,
  registrarJustificativaAtraso,
  ROTULO_MOTIVO_ATRASO,
  ROTULO_STATUS,
} from "@/lib/projetos";
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
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from "@/styles/modal.styled";
import { FieldTextarea, FormErrorText } from "@/pages/Bancas.styled";
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
  MotivoEscopoNome,
  MotivoItem,
  MotivoJustificadoBadge,
  MotivoJustificarBtn,
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
import { useFiltroEscopo } from "./FiltroEscopo";

/**
 * §7.4 — o pilar é a BANCA: "um escopo está atrasado quando passa da data da
 * sua banca sem que ela tenha acontecido".
 *
 * ⚠ Desde 2026-08-12 é o único pilar: o atraso da ENTREGA ao cliente saiu dos
 * insights por decisão da diretoria. Ele media a agenda do cliente e não o
 * trabalho do time, e deixava vermelho um projeto cuja banca aconteceu no
 * prazo. Sumiram com ele a pílula "Espera do cliente", o item "Esperando o
 * cliente" da faixa e a distinção interno/externo na cor.
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
// Mesmo padrão de `TarefasGeraisAba`/`CronogramasGeraisAba`: sem isto, o link
// "Voltar" da página do projeto caía sempre em `/projetos`, perdendo a aba de
// Monitoramento de onde a pessoa realmente veio.
const VOLTAR_PARA_AQUI = { voltarPara: "/monitoramento/atrasos", voltarRotulo: "Voltar para Atrasos" };

export function AtrasosAba() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  const { frenteId, seletor: seletorFrente } = useFiltroFrente();
  const { escopoId, seletor: seletorEscopo } = useFiltroEscopo(frenteId);
  const seletor = (
    <>
      {seletorFrente}
      {seletorEscopo}
    </>
  );
  const [dados, setDados] = useState<Atrasos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // §7.4 — o alerta é automático; só a diretoria digita o porquê aqui. A
  // justificativa é POR MOTIVO (escopo + tipo), e não por projeto: uma nota
  // genérica não diria a qual dos motivos do projeto ela responde.
  const podeJustificar = pode(usuario, "registrar_justificativa_atraso");
  const [justificando, setJustificando] = useState<{ projeto: LinhaProjeto; motivo: Motivo } | null>(
    null,
  );

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getAtrasos(token, frenteId, escopoId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os atrasos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId, escopoId]);

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
              {resumo.projetos === 1 ? "Projeto atrasado" : "Projetos atrasados"}
            </ResumoRotulo>
          </ResumoItem>
          <ResumoItem>
            <ResumoValor $nivel={nivel(resumo.pior_caso)}>
              {resumo.pior_caso}
              <small>dias</small>
            </ResumoValor>
            <ResumoRotulo>Pior atraso isolado</ResumoRotulo>
          </ResumoItem>
          {/* ⚠ Havia aqui um "Esperando o cliente", contando os projetos com
              entrega travada do lado dele. Saiu junto com o motivo que o
              alimentava (2026-08-12): o atraso da entrega deixou de ser
              insight, e o número viraria um zero permanente. */}
        </FaixaResumo>
      )}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Por projeto</PageCardTitle>
          {projetos.length > 0 && (
            <Legenda>
              <LegendaItem $nivel="leve">Até 3 dias</LegendaItem>
              <LegendaItem $nivel="media">4 a 10 dias</LegendaItem>
              <LegendaItem $nivel="critica">Mais de 10 dias</LegendaItem>
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
                  /* A cor vem do pior motivo isolado — os cortes do `nivel()`
                     foram escritos sobre o cronograma de UM escopo (§5.6), não
                     sobre a soma do projeto.

                     ⚠ Havia aqui um filtro tirando os motivos externos da
                     conta. Com a entrega fora dos insights, todo motivo que
                     chega é banca — trabalho do time — e nenhum sai da cor. */
                  const grau = nivel(pior(p.motivos));
                  return (
                    <LinhaAtraso key={p.projeto_id}>
                      {/* O PIOR motivo isolado, não a soma dos motivos. Três
                          escopos com 4 dias cada somavam 12 sem que nada
                          estivesse parado há 12 dias — e a soma aparecia aqui
                          ao lado de uma COR tirada do pior caso, então o número
                          e a cor falavam de coisas diferentes. Agora falam do
                          mesmo, e a lista é ordenada por ele. */}
                      <AtrasoDias $nivel={grau}>
                        <strong>{p.pior_motivo}</strong>
                        <span>dias</span>
                      </AtrasoDias>
  
                      <AtrasoCorpo>
                        <AtrasoTitulo>
                          <LinkProjeto to={`/projetos/${p.projeto_id}`} state={VOLTAR_PARA_AQUI}>
                            {p.projeto_nome}
                          </LinkProjeto>
                          <Pilula $tom="neutro">
                            {ROTULO_STATUS[p.status as StatusProjeto] ?? p.status}
                          </Pilula>
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
                              /* 5 filhos SEMPRE, mesmo quando um deles não
                                 tem conteúdo — MotivoItem é uma grade de 5
                                 colunas fixas por posição; se um filho sumir
                                 do DOM (em vez de ficar vazio), os de depois
                                 escorregam pra coluna errada. */
                              <MotivoItem key={`${m.tipo}-${m.projeto_escopo_id ?? i}`}>
                                <MotivoTag>
                                  {ROTULO_MOTIVO_ATRASO[m.tipo] ?? m.tipo}
                                </MotivoTag>
                                <MotivoEscopoNome title={m.escopo}>{m.escopo}</MotivoEscopoNome>
                                <MotivoDias $nivel={nivel(m.dias)}>
                                  {m.dias} {m.dias === 1 ? "dia" : "dias"}
                                </MotivoDias>
                                <MotivoData>
                                  {m.data_referencia && `vencia ${formatarData(m.data_referencia)}`}
                                </MotivoData>
                                {/* §7.4: por MOTIVO, não por projeto — o mesmo
                                    escopo pode estar atrasado em banca e
                                    entrega ao mesmo tempo, cada um com sua
                                    própria nota. Já justificado vira selo, não
                                    fica reabrindo pra "adicionar mais uma". */}
                                {m.justificado && m.justificativa_id != null ? (
                                  <MotivoJustificadoBadge
                                    to={`/projetos/${p.projeto_id}/historico#justificativa-${m.justificativa_id}`}
                                    state={VOLTAR_PARA_AQUI}
                                  >
                                    Justificado
                                  </MotivoJustificadoBadge>
                                ) : podeJustificar ? (
                                  <MotivoJustificarBtn type="button" onClick={() => setJustificando({ projeto: p, motivo: m })}>
                                    Justificar
                                  </MotivoJustificarBtn>
                                ) : (
                                  <span />
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
                          <Pilula $tom="ok">Nenhum</Pilula>
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

      {/* ⭐ §10: escopos que passaram da JANELA — outra pergunta que a lista
          acima não responde.

          Os `motivos` de cima perguntam "o que venceu e não aconteceu?" e
          fecham quando o fato acontece. Este pergunta "o trabalho passou do
          tempo que foi vendido?": um escopo pode estourar a janela com a banca
          já realizada e a entrega em dia, e aí o projeto nem aparece lá em
          cima.

          Sem botão de justificar aqui: quem escreve é quem conduz o escopo, na
          Visão geral do projeto. Esta é a leitura da diretoria — e o que falta
          explicação vem primeiro, porque é o que ela precisa cobrar. */}
      {dados.escopos_atrasados.length > 0 && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>
              Escopos que passaram da janela ({dados.escopos_atrasados.length})
            </PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <ListaSimples>
              {dados.escopos_atrasados.map((e) => (
                <LinhaAtraso key={e.projeto_escopo_id}>
                  <AtrasoDias $nivel={nivel(e.dias)}>{e.dias}</AtrasoDias>
                  <AtrasoCorpo>
                    <AtrasoTitulo>
                      <LinkProjeto to={`/projetos/${e.projeto_id}`}>
                        {e.projeto_nome}
                      </LinkProjeto>
                      <MotivoEscopoNome>{e.escopo_nome}</MotivoEscopoNome>
                    </AtrasoTitulo>
                    <MotivoData>
                      {e.dias_vendidos} dias vendidos
                      {e.dias_ajustados > 0 && ` · ${e.dias_ajustados} ajustados`}
                    </MotivoData>
                    {e.justificativa ? (
                      <MotivoData>
                        {e.justificativa}
                        {e.registrado_por && ` — ${e.registrado_por}`}
                      </MotivoData>
                    ) : (
                      /* Sem selo verde: o vazio aqui é uma pendência, e é o
                         coordenador que a resolve na tela do projeto. */
                      <SemDado>Ainda sem justificativa do coordenador.</SemDado>
                    )}
                  </AtrasoCorpo>
                </LinhaAtraso>
              ))}
            </ListaSimples>
          </PageCardContent>
        </PageCard>
      )}

      {justificando && token && (
        <JustificarAtrasoModal
          projeto={justificando.projeto}
          motivo={justificando.motivo}
          token={token}
          onClose={() => setJustificando(null)}
          onSalvo={(criadaId) => {
            const projetoId = justificando.projeto.projeto_id;
            setJustificando(null);
            // Direto pra nota que acabou de ser escrita, não pro topo do
            // histórico inteiro — e "Voltar" de lá cai aqui, não em /projetos.
            navigate(`/projetos/${projetoId}/historico#justificativa-${criadaId}`, {
              state: VOLTAR_PARA_AQUI,
            });
          }}
        />
      )}
    </PageStack>
  );
}

/**
 * §7.4: o alerta de atraso é automático — ninguém digita nada pra ele
 * acontecer. O "porquê" é outra coisa: a diretoria pergunta ao coordenador e
 * registra a nota aqui, que fica gravada pra sempre no histórico do projeto
 * (`ProjetoHistorico.tsx`). Por MOTIVO (escopo + tipo), não por projeto: o
 * mesmo escopo pode estar atrasado em banca e entrega ao mesmo tempo.
 */
function JustificarAtrasoModal({
  projeto,
  motivo,
  token,
  onClose,
  onSalvo,
}: {
  projeto: LinhaProjeto;
  motivo: Motivo;
  token: string;
  onClose: () => void;
  onSalvo: (criadaId: number) => void;
}) {
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!texto.trim()) {
      setErro("Digite a justificativa antes de salvar");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const criada = await registrarJustificativaAtraso(
        projeto.projeto_id,
        texto.trim(),
        token,
        motivo.projeto_escopo_id ?? undefined,
        motivo.tipo,
      );
      onSalvo(Number(criada.id));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao registrar a justificativa");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <ModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <ModalHeader>
          <ModalTitle>
            Justificar atraso — {projeto.projeto_nome}
            <br />
            <small>
              {ROTULO_MOTIVO_ATRASO[motivo.tipo] ?? motivo.tipo} de {motivo.escopo}
            </small>
          </ModalTitle>
          <ModalClose type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <EmptyText style={{ marginBottom: "0.75rem" }}>
            Pergunte ao coordenador o motivo e registre aqui — fica salvo no histórico do projeto.
          </EmptyText>
          <FieldTextarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Por que este atraso aconteceu"
            aria-label="Justificativa do atraso"
            autoFocus
            required
          />
          {erro && <FormErrorText>{erro}</FormErrorText>}
        </ModalBody>
        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </PageButton>
          <PageButton type="button" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar justificativa"}
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
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

/** O maior atraso da lista. Zero quando não há motivo — `nivel()` trata isso
 *  como "leve", que é o degrau certo para ausência de atraso. */
function pior(motivos: Motivo[]): number {
  return Math.max(0, ...motivos.map((m) => m.dias));
}
