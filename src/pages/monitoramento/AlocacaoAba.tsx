import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAlocacao, type Alocacao, type LinhaCarga } from "@/lib/monitoramento";

// Sob demanda pelo mesmo motivo da Visão geral: o recharts não pode entrar no
// bundle que a tela de login carrega.
const BarrasCarga = lazy(() => import("./BarrasCarga"));
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
import { ConteudoPaginado, Paginacao, usePaginacao } from "./Paginacao";
import {
  BarraCarga,
  BarraFiltros,
  BotaoAlternativa,
  BarraCargaPreenchida,
  BarraCargaTrilho,
  ChipProjeto,
  ChipsProjetos,
  ConteudoCarregando,
  DataTable,
  DemandaAltaLista,
  DemandaAltaPessoa,
  DemandaAltaProjetos,
  GrupoBotoes,
  Pilula,
  SemDado,
  TabelaRolagem,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  VagaLivre,
} from "./Monitoramento.styled";
import { Th, useOrdenacao, type Colunas } from "@/components/tabela/ordenacao";
import { useFiltroFrente } from "./FiltroFrente";
import { useFiltroEscopo } from "./FiltroEscopo";
import { useFiltroStatus } from "./FiltroStatus";

/** Pra "voltar" do projeto cair de novo aqui, não em `/projetos`. */
const VOLTAR_PARA_AQUI = { voltarPara: "/monitoramento/alocacao", voltarRotulo: "Voltar para Alocação" };

type Papel = "consultor" | "coordenador";

const ROTULO_PAPEL: Record<Papel, { singular: string; plural: string }> = {
  consultor: { singular: "consultor", plural: "Consultores" },
  coordenador: { singular: "coordenador", plural: "Coordenadores" },
};

/** , carga por pessoa.
 *
 *  A aba fala de UM papel por vez, escolhido no filtro que aparece no
 *  cabeçalho de cada card. Antes eram duas tabelas empilhadas mais um toggle
 *  só do gráfico: a mesma pergunta respondida três vezes. */
export function AlocacaoAba() {
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
  const [papel, setPapel] = useState<Papel>("consultor");
  const [dados, setDados] = useState<Alocacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getAlocacao(token, frenteId, escopoId, status));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar a alocação");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId, escopoId, status]);

  // O seletor fica FORA do early return de erro e de carregando. Se ele
  // sumisse durante uma falha, quem filtrasse numa frente que dá erro ficaria
  // sem como voltar para "Todas", a tela travaria no estado quebrado.
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

  if (!dados) {
    return (
      <PageStack>
        {seletor}
        <PageLoadingBlock />
      </PageStack>
    );
  }

  const linhas = papel === "consultor" ? dados.consultores : dados.coordenadores;
  const destacados =
    papel === "consultor" ? dados.demanda_alta.consultores : dados.demanda_alta.coordenadores;
  const rotulo = ROTULO_PAPEL[papel];

  /* O controle aparece DENTRO de cada card, mas o estado é UM só.
     Três estados independentes deixariam o gráfico em "Consultores" e a tabela
     em "Coordenadores" ao mesmo tempo, três recortes da mesma pergunta se
     contradizendo na mesma tela. Assim ele fica à mão em qualquer ponto da
     página e os cards nunca discordam. */
  const filtro = (
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
  );

  return (
    <ConteudoCarregando $carregando={carregando}>
    <PageStack>
      {seletor}
      {/* Quem são as pessoas, a lista completa abre a aba. */}
      <TabelaCarga
        titulo={rotulo.plural}
        linhas={linhas}
        vazio={`Nenhum ${rotulo.singular} na sua visão.`}
        filtro={filtro}
      />

      {/* Quem dentro dessa lista precisa de atenção. Vem logo depois porque é
          o recorte do card acima, não um assunto novo. */}
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            {rotulo.plural} com demanda alta{destacados.length > 0 && ` (${destacados.length})`}
          </PageCardTitle>
          {filtro}
        </PageCardHeader>
        <PageCardContent>
          {destacados.length === 0 ? (
            <EmptyText>Ninguém na faixa mais alta da escala.</EmptyText>
          ) : (
            <ColunaDemandaAlta linhas={destacados} />
          )}
        </PageCardContent>
      </PageCard>

      {/* Sem filtro de papel: as duas colunas são os DOIS papéis lado a lado, e
          é essa comparação que responde "de qual deles falta gente". */}
      <CapacidadePorFrente capacidade={dados.capacidade} />

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Carga por {rotulo.singular}</PageCardTitle>
          {filtro}
        </PageCardHeader>
        <PageCardContent>
          <Suspense fallback={<PageLoadingBlock />}>
            <BarrasCarga papel={papel} linhas={linhas} />
          </Suspense>
        </PageCardContent>
      </PageCard>
    </PageStack>
    </ConteudoCarregando>
  );
}

const COLUNAS_CARGA: Colunas<LinhaCarga> = {
  nome: { valor: (l) => l.nome, inicial: "asc" },
  total: { valor: (l) => l.total, inicial: "desc" },
};

const COLUNAS_CAPACIDADE: Colunas<Alocacao["capacidade"]["por_frente"][number]> = {
  frente: { valor: (f) => f.frente_nome, inicial: "asc" },
  pessoas: { valor: (f) => f.pessoas, inicial: "desc" },
  consultor: { valor: (f) => f.consultor, inicial: "desc" },
  coordenador: { valor: (f) => f.coordenador, inicial: "desc" },
};

/**
 * Quanto ainda dá para vender, por frente.
 *
 * A conta é `max(0, teto − projetos da pessoa)`, somada. O `max(0)` é o ponto:
 * um consultor com 3 projetos conta 0, nunca −1, ele está sobrecarregado, mas
 * isso não tira do núcleo a chance de vender para outra pessoa.
 *
 * **Duas colunas, uma por papel, nunca somadas.** Um número único de "projetos
 * vendáveis" precisaria assumir o tamanho da equipe, e a suposição sumiria
 * dentro dele: 0 vagas de consultor e 8 de coordenador não são 8 projetos —
 * são zero, porque todo projeto precisa dos dois.
 */
function CapacidadePorFrente({ capacidade }: { capacidade: Alocacao["capacidade"] }) {
  const { por_frente, total, teto } = capacidade;
  const semNenhuma = total.consultor === 0 && total.coordenador === 0;
  // Sem coluna inicial: a ordem do backend já é a das frentes, e a
  // ordenação entra como ferramenta ("onde ainda cabe coordenador?").
  const { itens: frentes, ordem, ordenarPor } = useOrdenacao(por_frente, COLUNAS_CAPACIDADE);

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Capacidade para novos projetos</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {semNenhuma ? (
          <EmptyText>Nenhuma vaga livre, todo mundo está no limite ou acima.</EmptyText>
        ) : (
          <TabelaRolagem $min="30rem" $max="22rem">
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th coluna="frente" ordem={ordem} onOrdenar={ordenarPor}>
                    Frente
                  </Th>
                  <Th coluna="pessoas" ordem={ordem} onOrdenar={ordenarPor}>
                    Pessoas
                  </Th>
                  {/* O teto vai no cabeçalho, e não num parágrafo acima: sem
                      ele em lugar nenhum, "vagas" fica sem régua, cabe mais
                      quanto? O número vem do backend, para as duas pontas não
                      divergirem. */}
                  <Th coluna="consultor" ordem={ordem} onOrdenar={ordenarPor}>
                    Vagas de consultor (até {teto.consultor})
                  </Th>
                  <Th coluna="coordenador" ordem={ordem} onOrdenar={ordenarPor}>
                    Vagas de coordenador (até {teto.coordenador})
                  </Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {frentes.map((f) => (
                  <TableRow key={f.frente_id ?? "sem-frente"}>
                    <TableCell>{f.frente_nome}</TableCell>
                    <TableCell>{f.pessoas}</TableCell>
                    <TableCell>
                      <VagaLivre $vazio={f.consultor === 0}>{f.consultor}</VagaLivre>
                    </TableCell>
                    <TableCell>
                      <VagaLivre $vazio={f.coordenador === 0}>{f.coordenador}</VagaLivre>
                    </TableCell>
                  </TableRow>
                ))}
                {/* O total NÃO é a soma da coluna. Quem está em duas frentes
                    aparece nas duas linhas, e a vaga dela é uma só, o backend
                    conta por pessoa. Sem esta nota, quem somasse na mão acharia
                    que a tabela está errada. */}
                <TableRow>
                  <TableCell>
                    <strong>Total do núcleo</strong>
                  </TableCell>
                  <TableCell>
                    <SemDado>—</SemDado>
                  </TableCell>
                  <TableCell>
                    <strong>{total.consultor}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{total.coordenador}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </DataTable>
          </TabelaRolagem>
        )}
      </PageCardContent>
    </PageCard>
  );
}

/** Uma coluna do card: o papel, e quem dele caiu na faixa mais alta.
 *
 *  Quem entra na lista é decisão do backend (`demanda_alta`), tomada pela
 *  POSIÇÃO da faixa na escala, não pelo nome nem pela cor, que a diretoria
 *  edita à vontade. Se a tela procurasse por "Carga alta" ou por vermelho, uma
 *  renomeada esvaziaria o card sem ninguém perceber. */
function ColunaDemandaAlta({ linhas }: { linhas: LinhaCarga[] }) {
  const lista = usePaginacao(linhas);

  return (
    <div>
      {linhas.length === 0 ? (
        <EmptyText>Ninguém com demanda alta.</EmptyText>
      ) : (
        <>
          <ConteudoPaginado estado={lista}>
            <DemandaAltaLista>
              {lista.visiveis.map((linha) => (
                <DemandaAltaPessoa key={linha.usuario_id}>
                  <strong>
                    {linha.nome}
                    {linha.projetos.length > 0 && (
                      <DemandaAltaProjetos>
                        {/* `.map(p => p.nome)` e não `.join` direto: `projetos`
                            virou lista de objetos quando o gráfico passou a
                            precisar do status, e juntar objetos imprime
                            "[object Object]". O TypeScript não pega, `join`
                            aceita array de qualquer coisa. */}
                        {linha.projetos.map((p) => p.nome).join(", ")}
                      </DemandaAltaProjetos>
                    )}
                  </strong>
                  {/* A pílula usa a cor que a diretoria deu à faixa. Se ela pintou
                      de verde, fica verde: quem manda na cor é a configuração, e
                      não a tela decidir que estar no topo é ruim. */}
                  <Pilula $tom={linha.situacao?.tom ?? "neutro"}>
                    {linha.total} {linha.total === 1 ? "projeto" : "projetos"}
                  </Pilula>
                </DemandaAltaPessoa>
              ))}
            </DemandaAltaLista>
</ConteudoPaginado>
          <Paginacao estado={lista} />
        </>
      )}
    </div>
  );
}

function TabelaCarga({
  titulo,
  linhas,
  vazio,
  filtro,
}: {
  titulo: string;
  linhas: LinhaCarga[];
  vazio: string;
  /** O seletor de papel, renderizado à direita do título. */
  filtro?: ReactNode;
}) {
  /* A escala é POR TABELA, não global: coordenador e consultor carregam
     volumes diferentes por natureza, e uma régua só faria a tabela dos
     consultores parecer vazia ao lado da dos coordenadores.
     ⚠ Sai de `linhas`, e não da lista ordenada: a barra tem que medir contra
     o maior da tabela inteira, não contra o maior da ordem do momento. */
  const maiorCarga = Math.max(1, ...linhas.map((l) => l.total));
  // Sem coluna inicial: a lista já chega do backend na ordem de carga.
  const { itens: ordenadas, ordem, ordenarPor } = useOrdenacao(linhas, COLUNAS_CARGA);

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>{titulo}</PageCardTitle>
        {filtro}
      </PageCardHeader>
      <PageCardContent>
        {linhas.length === 0 ? (
          <EmptyText>{vazio}</EmptyText>
        ) : (
          /* Rolagem, e não páginas como nos cards de alerta: aqui a pessoa está
             procurando ALGUÉM ESPECÍFICO. Num núcleo de 60 consultores, mandá-la
             adivinhar em qual das 5 páginas está o colega é pior do que rolar.
             O cabeçalho gruda no topo. */
          <TabelaRolagem $min="40rem" $max="28rem">
              <DataTable>
              <TableHead>
                <TableRow>
                  <Th coluna="nome" ordem={ordem} onOrdenar={ordenarPor}>
                    Nome
                  </Th>
                  <Th coluna="total" ordem={ordem} onOrdenar={ordenarPor}>
                    Projetos ativos
                  </Th>
                  {/* "Quais" é uma lista de chips e "Situação" é derivada de
                      "Projetos ativos" pela escala das Configurações — ordenar
                      por ela daria exatamente a mesma ordem da coluna ao lado.
                      Nenhuma das duas vira botão. */}
                  <TableHeadCell>Quais</TableHeadCell>
                  <TableHeadCell>Situação</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordenadas.map((linha) => (
                  <TableRow key={linha.usuario_id}>
                    <TableCell>{linha.nome}</TableCell>
                    <TableCell>
                      {/* 4 projetos é muito ou pouco depende de quantos os
                          colegas carregam, daí a barra contra o maior da
                          tabela, e não o número solto. */}
                      <BarraCarga>
                        <strong>{linha.total}</strong>
                        <BarraCargaTrilho aria-hidden="true">
                          <BarraCargaPreenchida
                            $pct={(linha.total / maiorCarga) * 100}
                            $alta={linha.demanda_alta}
                          />
                        </BarraCargaTrilho>
                      </BarraCarga>
                    </TableCell>
                    <TableCell>
                      {linha.projetos.length > 0 ? (
                        <ChipsProjetos>
                          {/* O chip agora leva ao projeto: o id veio junto
                              quando o gráfico passou a precisar do status. */}
                          {linha.projetos.map((p) => (
                            <ChipProjeto key={p.id} to={`/projetos/${p.id}`} state={VOLTAR_PARA_AQUI}>
                              {p.nome}
                            </ChipProjeto>
                          ))}
                        </ChipsProjetos>
                      ) : (
                        <SemDado>—</SemDado>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Nome e cor vêm da escala que a diretoria definiu em
                          Configurações, a tela não decide o que é "carga
                          alta". */}
                      {linha.situacao ? (
                        <Pilula $tom={linha.situacao.tom}>{linha.situacao.nome}</Pilula>
                      ) : (
                        <SemDado>—</SemDado>
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
  );
}
