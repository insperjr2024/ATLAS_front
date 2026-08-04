import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getExecucao, type Execucao } from "@/lib/monitoramento";
import { formatarData, formatarDataHora } from "@/lib/projetos";
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
  DataTable,
  Pilula,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "./Monitoramento.styled";
import { useMonitoramento } from "./MonitoramentoLayout";

/** §7.2 — ver quem não está distribuindo tarefa nem fazendo reunião, sem
 *  precisar abrir projeto por projeto. */
export function ExecucaoAba() {
  const { token } = useAuth();
  const { frenteId } = useMonitoramento();
  const [dados, setDados] = useState<Execucao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      setDados(await getExecucao(token, frenteId));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar a execução");
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
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Tarefas · semana de {formatarData(dados.semana.inicio)} a{" "}
            {formatarData(dados.semana.fim)}
          </PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.tarefas.length === 0 ? (
            <EmptyText>Nenhum projeto na sua visão.</EmptyText>
          ) : (
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Projeto</TableHeadCell>
                  <TableHeadCell>Distribuiu na semana</TableHeadCell>
                  <TableHeadCell>Ativas</TableHeadCell>
                  <TableHeadCell>Vencidas</TableHeadCell>
                  <TableHeadCell>Última movimentação</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.tarefas.map((linha) => (
                  <TableRow key={linha.projeto_id}>
                    <TableCell>
                      <Link to={`/projetos/${linha.projeto_id}/tarefas`}>{linha.projeto_nome}</Link>
                    </TableCell>
                    <TableCell>
                      <Pilula $tom={linha.distribuiu_na_semana ? "ok" : "alerta"}>
                        {linha.distribuiu_na_semana ? "sim" : "não"}
                      </Pilula>
                    </TableCell>
                    <TableCell>{linha.ativas}</TableCell>
                    <TableCell>
                      {linha.vencidas > 0 ? (
                        <Pilula $tom="alerta">{linha.vencidas}</Pilula>
                      ) : (
                        <Pilula $tom="neutro">0</Pilula>
                      )}
                    </TableCell>
                    <TableCell>
                      {linha.ultima_movimentacao ? formatarDataHora(linha.ultima_movimentacao) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
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
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Projeto</TableHeadCell>
                  <TableHeadCell>Realizou</TableHeadCell>
                  <TableHeadCell>Dias registrados</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.reunioes.map((linha) => (
                  <TableRow key={linha.projeto_id}>
                    <TableCell>
                      <Link to={`/projetos/${linha.projeto_id}/reunioes`}>{linha.projeto_nome}</Link>
                    </TableCell>
                    <TableCell>
                      {/* 🧮 "Não realizou" é AUSÊNCIA de linha na janela
                          seg–dom, não um campo. */}
                      <Pilula $tom={linha.realizou ? "ok" : "alerta"}>
                        {linha.realizou ? "sim" : "não"}
                      </Pilula>
                    </TableCell>
                    <TableCell>
                      {linha.dias.length > 0 ? linha.dias.map(formatarData).join(", ") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
