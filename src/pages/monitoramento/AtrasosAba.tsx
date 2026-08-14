import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getAtrasos, type Atrasos } from "@/lib/monitoramento";
import { formatarData, registrarJustificativaAtraso } from "@/lib/projetos";
import { useFiltroFrente } from "./FiltroFrente";
import { useFiltroEscopo } from "./FiltroEscopo";
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
import { EstadoVazio } from "@/components/EstadoVazio";
import {
  AprovacaoCitacao,
  AprovacaoMeta,
  AtrasoTitulo,
  DataTable,
  Legenda,
  LegendaItem,
  LinkProjeto,
  ListaSimples,
  NotaRodape,
  Pilula,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "./Monitoramento.styled";
import { AprovacaoLinha, FormDecisao } from "./AprovacaoLinha";

/**
 * §7.4 — o que já devia ter acontecido e não aconteceu.
 *
 * ⭐ **UMA régua carrega a palavra "atrasado", e é a banca.** O §7.4 é
 * explícito: "um escopo está atrasado quando passa da data da sua banca sem
 * que ela tenha acontecido — o marco sob controle do time".
 *
 * ⚠ **A aba media DUAS coisas e chamava as duas de atraso**, e era a raiz de
 * todo o resto. Ela dizia "Nenhum projeto atrasado" logo acima de "Escopos que
 * passaram da janela (4)": uma pergunta é *o marco não aconteceu*, a outra é
 * *o trabalho custou mais dias do que foi vendido*. Um escopo pode estourar a
 * janela com a banca feita e em dia, e vice-versa — os números nunca se somam
 * e nunca se contradizem, mas ninguém tinha como saber isso olhando a tela.
 *
 * A separação aqui é deliberada e vale em quatro camadas, porque só o título
 * não bastava:
 * , o pilar é a BANCA: "um escopo está atrasado quando passa da data da
 * sua banca sem que ela tenha acontecido".
 *
 * Desde 2026-08-12 é o único pilar: o atraso da ENTREGA ao cliente saiu dos
 * insights por decisão da diretoria. Ele media a agenda do cliente e não o
 * trabalho do time, e deixava vermelho um projeto cuja banca aconteceu no
 * prazo. Sumiram com ele a pílula "Espera do cliente", o item "Esperando o
 * cliente" da faixa e a distinção interno/externo na cor.
 *
 * Os dias aqui são ÚTEIS, pelo calendário do Insper, a mesma régua da aba de
 * Execução. O texto do  dizia "corridos", mas a diretoria confirmou em
 * 2026-08-04 que são úteis: cobrar fim de semana, feriado e semana de provas
 * seria cobrar tempo em que o time não tinha como trabalhar. Não há mais duas
 * réguas no sistema, então os números das duas abas se comparam.
 *
 * **A tela mostra o PIOR CASO, não a soma**, decisão de 2026-08-06.
 *
 * | | Bancas vencidas | Além do vendido |
 * |---|---|---|
 * | pergunta | o marco não aconteceu | o trabalho custou mais |
 * | conta | **bancas** | **escopos** |
 * | unidade | "N dias vencida" | "+N dias além" |
 * | fecha quando | a banca acontece | nunca (é histórico do escopo) |
 *
 * ⭐ **A palavra "atraso" só aparece do lado esquerdo dessa tabela.** O card da
 * direita se chama "Além do vendido" e o número dele vem com `+`.
 * Antes o número grande era a soma e a COR vinha do pior motivo isolado, dois
 * elementos do mesmo bloco falando de coisas diferentes. Hoje os dois saem do
 * pior caso, e a lista é ordenada por ele: o número em destaque é o mesmo que
 * define a ordem, então ninguém precisa adivinhar o critério.
 */
export function AtrasosAba() {
  const { token } = useAuth();
  const [dados, setDados] = useState<Atrasos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // Mesmo par de hooks das outras abas: eles guardam o estado, montam o
  // seletor e cuidam do recorte de visão (o gerente não escolhe frente).
  const { frenteId, seletor: seletorFrente } = useFiltroFrente();
  const { escopoId, seletor: seletorEscopo } = useFiltroEscopo(frenteId);
  // , o alerta é automático; só a diretoria digita o porquê aqui. A
  // justificativa é POR MOTIVO (escopo + tipo), e não por projeto: uma nota
  // genérica não diria a qual dos motivos do projeto ela responde.
  const podeJustificar = pode(usuario, "registrar_justificativa_atraso");
  const [justificando, setJustificando] = useState<{ projeto: LinhaProjeto; motivo: Motivo } | null>(
    null,
  );

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      setDados(await getAtrasos(token, frenteId, escopoId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os atrasos");
    } finally {
      setCarregando(false);
    }
  }, [token, frenteId, escopoId]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId, escopoId]);

  const projetos = dados?.por_projeto ?? [];
  const coordenadores = dados?.por_coordenador ?? [];

  /* A régua das barras da tabela de coordenadores: o maior pior-caso dela.
     Comparar coordenador com coordenador é o ponto, o  quer padrão
     recorrente, e padrão só aparece na comparação entre pares. */
  const piorCoordenador = useMemo(
    () => Math.max(1, ...coordenadores.map((c) => c.pior_dias)),
    [coordenadores],
  );

  /* Os números da faixa vêm PRONTOS do backend. A divisão banca/entrega é
     classificação de motivo, e recontá-la aqui a partir das descrições seria
     reimplementar no front uma regra que o  já define no servidor. */
  const resumo = dados?.resumo;

  // Ordenada por gravidade, então o corte esconde a cauda. Antes dos `return`
  // cedo de erro e carregando, hook depois deles seria condicional.
  const listaProjetos = usePaginacao(projetos);

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  // Uma linha por BANCA vencida, não por projeto: é a banca que venceu, e é
  // sobre ela que a nota da diretoria é escrita. O aninhamento projeto →
  // motivos existia para acomodar dois tipos de motivo, e sobrou um só.
  const bancasVencidas = dados.por_projeto.flatMap((p) =>
    p.motivos.map((m) => ({ ...m, projeto_id: p.projeto_id, projeto_nome: p.projeto_nome, status: p.status })),
  );
  const alemDoVendido = dados.escopos_atrasados;
  // Só quem tem algo em alguma das duas réguas. A tabela listava TODO
  // coordenador, e por isso "Pior caso" e "Qual é" ficavam sempre em branco.
  const coordenadores = dados.por_coordenador.filter((c) => c.atrasados > 0);

  return (
    <PageStack>
      <>
        {seletorFrente}
        {seletorEscopo}
      </>

      <CardBancasVencidas itens={bancasVencidas} onJustificou={carregar} />
      <CardAlemDoVendido itens={alemDoVendido} onJustificou={carregar} />
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
          {/* Havia aqui um "Esperando o cliente", contando os projetos com
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
                  /* A cor vem do pior motivo isolado, os cortes do `nivel()`
                     foram escritos sobre o cronograma de UM escopo, não
                     sobre a soma do projeto.

                     Havia aqui um filtro tirando os motivos externos da
                     conta. Com a entrega fora dos insights, todo motivo que
                     chega é banca, trabalho do time, e nenhum sai da cor. */
                  const grau = nivel(pior(p.motivos));
                  return (
                    <LinhaAtraso key={p.projeto_id}>
                      {/* O PIOR motivo isolado, não a soma dos motivos. Três
                          escopos com 4 dias cada somavam 12 sem que nada
                          estivesse parado há 12 dias, e a soma aparecia aqui
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
                                 tem conteúdo. MotivoItem é uma grade de 5
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
                                {/* por MOTIVO, não por projeto, o mesmo
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
            <EmptyText>Nenhum coordenador com banca vencida no recorte.</EmptyText>
            <EstadoVazio
              causa="acesso"
              titulo="Nenhum coordenador para mostrar"
              motivo="Esta tabela lista os coordenadores dos projetos das frentes que você acompanha. Vazia significa que nenhum projeto seu tem coordenador definido, ou que você ainda não acompanha frente nenhuma."
            />
          ) : (
            <>
              <EmptyText style={{ marginBottom: "0.75rem" }}>
                §7.4: o objetivo é achar padrão recorrente, não julgar um caso isolado. Só
                aparece quem tem banca vencida agora.
              </EmptyText>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Coordenador</TableHeadCell>
                    <TableHeadCell>Projetos em curso</TableHeadCell>
                    <TableHeadCell>Com banca vencida</TableHeadCell>
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
                        <Pilula $tom={c.atrasados > 1 ? "alerta" : "atencao"}>
                          {c.atrasados}
                        </Pilula>
                      </TableCell>
                      <TableCell>{c.pior_dias} dias</TableCell>
                      <TableCell>
                        {c.pior_projeto}
                        {c.pior_motivo ? ` — ${c.pior_motivo}` : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </>
          )}
        </PageCardContent>
      </PageCard>

      {/* ⭐ A nota que impede a leitura errada de voltar. Sem ela, quem vê
          "0 bancas vencidas" e "2 escopos além do vendido" na mesma tela lê
          contradição — foi exatamente o que a tela antiga produzia. */}
      <NotaRodape>
        <strong>Atrasado</strong> = a data da banca passou e ela não foi registrada como
        realizada. Dias úteis pelo calendário do Insper; dias de projeto pausado não contam.{" "}
        <strong>Além do vendido</strong> = dias úteis consumidos acima de vendidos + ajustados;
        não é atraso de marco, para de correr quando a banca acontece, e não entra na conta de
        projetos atrasados. Os dois números medem coisas diferentes e não se somam. Projeto
        finalizado, pausado ou arquivado, escopo cancelado, entregue ou ainda sem reunião
        inicial ficam de fora das duas listas.
      </NotaRodape>
    </PageStack>
  );
}

/* ------------------------------------------------------------------ */

type BancaVencida = Atrasos["por_projeto"][number]["motivos"][number] & {
  projeto_id: number;
  projeto_nome: string;
  status: string;
};

/** Os mesmos cortes do resto do Monitoramento. */
function nivel(dias: number) {
  if (dias > 10) return "critica" as const;
  if (dias > 3) return "media" as const;
  return "leve" as const;
}

function CardBancasVencidas({
  itens,
  onJustificou,
}: {
  itens: BancaVencida[];
  onJustificou: () => void;
}) {
  const { token } = useAuth();
  const [justificando, setJustificando] = useState<BancaVencida | null>(null);

  return (
    <PageCard id="bancas-vencidas">
      <PageCardHeader>
        <PageCardTitle>Bancas vencidas{itens.length > 0 && ` (${itens.length})`}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          // ⚠ O texto antigo dizia "Todas as bancas E ENTREGAS da sua visão
          // estão dentro da data planejada" — afirmava duas coisas falsas: que
          // a aba mede entregas (deixou de medir em 12/08) e que estava tudo
          // em dia, com escopos além do vendido logo abaixo.
          <EmptyText>
            Nenhuma banca venceu sem acontecer. Escopos que passaram do tempo vendido, se
            houver, aparecem no card abaixo — é outra medida.
          </EmptyText>
        ) : (
          <>
            <EmptyText style={{ marginBottom: "0.5rem" }}>
              A data passou e a banca não foi registrada como realizada. O alerta é automático;
              o porquê é você quem escreve, e ele fica no histórico do projeto.
            </EmptyText>
            <Legenda>
              <LegendaItem $nivel="leve">até 3 dias</LegendaItem>
              <LegendaItem $nivel="media">4 a 10</LegendaItem>
              <LegendaItem $nivel="critica">mais de 10</LegendaItem>
            </Legenda>
          Sem botão de justificar aqui: quem escreve é quem conduz o escopo, na
          Visão geral do projeto. Esta é a leitura da diretoria, e o que falta
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
              {itens.map((m) => (
                <AprovacaoLinha
                  key={`${m.projeto_id}-${m.projeto_escopo_id}-${m.tipo}`}
                  dias={m.dias}
                  unidade={m.dias === 1 ? "dia" : "dias"}
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto to={`/projetos/${m.projeto_id}/cronograma`}>
                        {m.projeto_nome} — {m.escopo}
                      </LinkProjeto>
                      <Pilula $tom={nivel(m.dias) === "critica" ? "alerta" : "atencao"}>
                        banca vencida
                      </Pilula>
                    </AtrasoTitulo>
                  }
                  acoes={
                    justificando === m ? (
                      <FormDecisao
                        rotuloConfirmar="Registrar o porquê"
                        onCancelar={() => setJustificando(null)}
                        onConfirmar={async (texto) => {
                          if (!token) return;
                          await registrarJustificativaAtraso(
                            m.projeto_id,
                            texto,
                            token,
                            m.projeto_escopo_id ?? undefined,
                            m.tipo,
                          );
                          setJustificando(null);
                          onJustificou();
                        }}
                      />
                    ) : m.justificado ? (
                      <PageButtonSm
                        as={Link}
                        to={`/projetos/${m.projeto_id}/historico`}
                        $variant="ghost"
                      >
                        ✓ já justificado
                      </PageButtonSm>
                    <MotivoData>
                      {e.dias_vendidos} dias vendidos
                      {e.dias_ajustados > 0 && ` · ${e.dias_ajustados} ajustados`}
                    </MotivoData>
                    {e.justificativa ? (
                      <MotivoData>
                        {e.justificativa}
                        {e.registrado_por && `, ${e.registrado_por}`}
                      </MotivoData>
                    ) : (
                      <PageButtonSm
                        type="button"
                        $variant="outline"
                        onClick={() => setJustificando(m)}
                      >
                        Justificar
                      </PageButtonSm>
                    )
                  }
                >
                  <AprovacaoMeta>
                    <span>
                      venceu em <strong>{m.data_referencia ? formatarData(m.data_referencia) : "—"}</strong>
                    </span>
                    <span>projeto em {m.status.replace(/_/g, " ")}</span>
                  </AprovacaoMeta>
                </AprovacaoLinha>
              ))}
            </ListaSimples>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}

/* ------------------------------------------------------------------ */

function CardAlemDoVendido({
  itens,
  onJustificou,
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
            // histórico inteiro, e "Voltar" de lá cai aqui, não em /projetos.
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
 * o alerta de atraso é automático, ninguém digita nada pra ele
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
  itens: Atrasos["escopos_atrasados"];
  onJustificou: () => void;
}) {
  const { token } = useAuth();
  const [justificando, setJustificando] = useState<number | null>(null);

  return (
    <PageCard id="alem-do-vendido">
      <PageCardHeader>
        <PageCardTitle>Além do vendido{itens.length > 0 && ` (${itens.length})`}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {itens.length === 0 ? (
          <EmptyText>Nenhum escopo passou do tempo que foi vendido.</EmptyText>
        ) : (
          <>
            <EmptyText style={{ marginBottom: "0.5rem" }}>
              Dias úteis consumidos acima de vendidos + ajustados, descontando pausas. A
              contagem congela quando a banca acontece. <strong>Não é atraso de marco</strong> —
              nenhum destes escopos entra na conta de projetos atrasados.
            </EmptyText>
            <ListaSimples>
              {itens.map((e) => (
                <AprovacaoLinha
                  key={e.projeto_escopo_id}
                  dias={e.dias}
                  // A unidade que separa esta régua da outra, no próprio número.
                  unidade="além"
                  titulo={
                    <AtrasoTitulo>
                      <LinkProjeto to={`/projetos/${e.projeto_id}/cronograma`}>
                        {e.projeto_nome} — {e.escopo_nome}
                      </LinkProjeto>
                      <Pilula $tom="neutro">
                        +{e.dias} sobre {e.dias_vendidos + e.dias_ajustados}
                      </Pilula>
                    </AtrasoTitulo>
                  }
                  acoes={
                    justificando === e.projeto_escopo_id ? (
                      <FormDecisao
                        rotuloConfirmar="Registrar o porquê"
                        onCancelar={() => setJustificando(null)}
                        onConfirmar={async (texto) => {
                          if (!token) return;
                          await registrarJustificativaAtraso(
                            e.projeto_id,
                            texto,
                            token,
                            e.projeto_escopo_id,
                            "escopo",
                          );
                          setJustificando(null);
                          onJustificou();
                        }}
                      />
                    ) : e.justificativa ? (
                      <PageButtonSm
                        as={Link}
                        to={`/projetos/${e.projeto_id}/historico`}
                        $variant="ghost"
                      >
                        ✓ já justificado
                      </PageButtonSm>
                    ) : (
                      <PageButtonSm
                        type="button"
                        $variant="outline"
                        onClick={() => setJustificando(e.projeto_escopo_id)}
                      >
                        Justificar
                      </PageButtonSm>
                    )
                  }
                >
                  <AprovacaoMeta>
                    {/* Vendidos e ajustados nunca somados num número só: a
                        diferença entre ter vendido 30 e ter vendido 20 e
                        precisado de mais 10 é a informação inteira. */}
                    <span>
                      <strong>{e.dias_vendidos}</strong> vendidos
                      {e.dias_ajustados > 0 && (
                        <>
                          {" "}
                          + <strong>{e.dias_ajustados}</strong> ajustados
                        </>
                      )}
                    </span>
                    {e.registrado_em && (
                      <span>explicado em {formatarData(e.registrado_em)}</span>
                    )}
                  </AprovacaoMeta>

                  {e.justificativa && (
                    <AprovacaoCitacao>
                      {e.justificativa}
                      {e.registrado_por ? ` — ${e.registrado_por}` : ""}
                    </AprovacaoCitacao>
                  )}
                </AprovacaoLinha>
              ))}
            </ListaSimples>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
    <ModalOverlay onClick={onClose} role="presentation">
      <ModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <ModalHeader>
          <ModalTitle>
            Justificar atraso, {projeto.projeto_nome}
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
            Pergunte ao coordenador o motivo e registre aqui, fica salvo no histórico do projeto.
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
 * escopo já não fecha sem reajuste formal.
 *
 * Repare que a régua é o cronograma de UM escopo. Por isso ela se aplica ao
 * atraso de um motivo isolado, e não à soma do projeto, ver `pior()`.
 */
function nivel(dias: number): NivelSeveridade {
  if (dias > 10) return "critica";
  if (dias > 3) return "media";
  return "leve";
}

/** O maior atraso da lista. Zero quando não há motivo, `nivel()` trata isso
 *  como "leve", que é o degrau certo para ausência de atraso. */
function pior(motivos: Motivo[]): number {
  return Math.max(0, ...motivos.map((m) => m.dias));
}
