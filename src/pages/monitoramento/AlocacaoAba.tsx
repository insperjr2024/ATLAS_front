import { lazy, Suspense, useEffect, useState } from "react";
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
import { MostrarTodos, useLimite } from "./ListaLimitada";
import {
  BarraCarga,
  BarraCargaPreenchida,
  BarraCargaTrilho,
  ChipProjeto,
  ChipsProjetos,
  DataTable,
  DemandaAltaGrupo,
  DemandaAltaLista,
  DemandaAltaPessoa,
  DemandaAltaProjetos,
  DemandaAltaTitulo,
  Pilula,
  SemDado,
  TabelaRolagem,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "./Monitoramento.styled";
import { useMonitoramento } from "./MonitoramentoLayout";

/** §7.3 — carga por pessoa. "Os coordenadores costumam ser gargalo, então
 *  acompanhar a carga deles é essencial" — por isso vêm primeiro. */
export function AlocacaoAba() {
  const { token } = useAuth();
  const { frenteId } = useMonitoramento();
  const [dados, setDados] = useState<Alocacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getAlocacao(token, frenteId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar a alocação");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, frenteId]);

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

  const { demanda_alta } = dados;
  const total = demanda_alta.coordenadores.length + demanda_alta.consultores.length;

  return (
    <PageStack>
      {/* Abre a aba: leitura de relance, e é o único lugar que responde "quem
          está cheio DE PROJETO EM TAL ETAPA" — as tabelas mostram só a carga
          inteira. Depois vêm elas, com o detalhe, e o card de demanda alta
          fecha. */}
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Carga por pessoa</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <Suspense fallback={<PageLoadingBlock />}>
            <BarrasCarga coordenadores={dados.coordenadores} consultores={dados.consultores} />
          </Suspense>
        </PageCardContent>
      </PageCard>

      <TabelaCarga
        titulo="Coordenadores"
        linhas={dados.coordenadores}
        vazio="Nenhum coordenador na sua visão."
      />
      <TabelaCarga
        titulo="Consultores"
        linhas={dados.consultores}
        vazio="Nenhum consultor na sua visão."
      />
      {!dados.grade_horaria_disponivel && (
        <EmptyText>Carga medida em projetos ativos — grade horária ainda não disponível.</EmptyText>
      )}

      {/* Fecha a aba porque é a conclusão dela: as tabelas acima ordenam do
          menos carregado para o mais, então quem está sobrecarregado cai no
          fim das duas. Este card é onde ele aparece junto — sem isso, inverter
          a ordem das tabelas teria escondido o gargalo do §7.3. */}
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Consultores e coordenadores com demanda alta{total > 0 && ` (${total})`}
          </PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {total === 0 ? (
            <EmptyText>Ninguém na faixa mais alta da escala.</EmptyText>
          ) : (
            <DemandaAltaGrupo>
              <ColunaDemandaAlta papel="Consultores" linhas={demanda_alta.consultores} />
              <ColunaDemandaAlta papel="Coordenadores" linhas={demanda_alta.coordenadores} />
            </DemandaAltaGrupo>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}

/** Uma coluna do card: o papel, e quem dele caiu na faixa mais alta.
 *
 *  Quem entra na lista é decisão do backend (`demanda_alta`), tomada pela
 *  POSIÇÃO da faixa na escala — não pelo nome nem pela cor, que a diretoria
 *  edita à vontade. Se a tela procurasse por "Carga alta" ou por vermelho, uma
 *  renomeada esvaziaria o card sem ninguém perceber. */
function ColunaDemandaAlta({ papel, linhas }: { papel: string; linhas: LinhaCarga[] }) {
  const lista = useLimite(linhas);

  return (
    <div>
      <DemandaAltaTitulo>{papel}</DemandaAltaTitulo>
      {linhas.length === 0 ? (
        <EmptyText>Ninguém com demanda alta.</EmptyText>
      ) : (
        <>
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
                          "[object Object]". O TypeScript não pega — `join`
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
          <MostrarTodos estado={lista} total={linhas.length} />
        </>
      )}
    </div>
  );
}

function TabelaCarga({
  titulo,
  linhas,
  vazio,
}: {
  titulo: string;
  linhas: LinhaCarga[];
  vazio: string;
}) {
  /* A escala é POR TABELA, não global: coordenador e consultor carregam
     volumes diferentes por natureza, e uma régua só faria a tabela dos
     consultores parecer vazia ao lado da dos coordenadores. */
  const maiorCarga = Math.max(1, ...linhas.map((l) => l.total));

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>{titulo}</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {linhas.length === 0 ? (
          <EmptyText>{vazio}</EmptyText>
        ) : (
          /* Rolagem, e não corte com "mostrar todos" como nos cards de alerta:
             aqui a pessoa está procurando ALGUÉM ESPECÍFICO. Num núcleo de 70
             consultores, cortar em 8 esconderia justamente quem ela quer e
             obrigaria a expandir toda vez. O cabeçalho gruda no topo. */
          <TabelaRolagem $min="40rem" $max="28rem">
              <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Nome</TableHeadCell>
                  <TableHeadCell>Projetos ativos</TableHeadCell>
                  <TableHeadCell>Quais</TableHeadCell>
                  <TableHeadCell>Situação</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linhas.map((linha) => (
                  <TableRow key={linha.usuario_id}>
                    <TableCell>{linha.nome}</TableCell>
                    <TableCell>
                      {/* 4 projetos é muito ou pouco depende de quantos os
                          colegas carregam — daí a barra contra o maior da
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
                            <ChipProjeto key={p.id} to={`/projetos/${p.id}`}>
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
                          Configurações — a tela não decide o que é "carga
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
