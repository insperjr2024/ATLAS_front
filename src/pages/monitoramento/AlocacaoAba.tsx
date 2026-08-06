import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAlocacao, type Alocacao, type LinhaCarga } from "@/lib/monitoramento";
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
  BarraCarga,
  BarraCargaPreenchida,
  BarraCargaTrilho,
  ChipProjeto,
  ChipsProjetos,
  DataTable,
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

  return (
    <PageStack>
      <TabelaCarga
        titulo="Coordenadores (o gargalo)"
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
    </PageStack>
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
          <TabelaRolagem $min="40rem">
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
                            $alta={linha.carga_alta}
                          />
                        </BarraCargaTrilho>
                      </BarraCarga>
                    </TableCell>
                    <TableCell>
                      {linha.projetos.length > 0 ? (
                        <ChipsProjetos>
                          {linha.projetos.map((nome, i) => (
                            <ChipProjeto key={`${nome}-${i}`}>{nome}</ChipProjeto>
                          ))}
                        </ChipsProjetos>
                      ) : (
                        <SemDado>—</SemDado>
                      )}
                    </TableCell>
                    <TableCell>
                      {linha.carga_alta ? (
                        <Pilula $tom="alerta">carga alta</Pilula>
                      ) : linha.disponivel ? (
                        <Pilula $tom="ok">disponível</Pilula>
                      ) : (
                        <Pilula $tom="neutro">alocado</Pilula>
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
