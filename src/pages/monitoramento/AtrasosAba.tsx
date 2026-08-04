import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getAtrasos, type Atrasos } from "@/lib/monitoramento";
import { ROTULO_STATUS } from "@/lib/projetos";
import type { StatusProjeto } from "@/types/projeto";
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
  ItemAtencao,
  ListaSimples,
  Pilula,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "./Monitoramento.styled";
import { useMonitoramento } from "./MonitoramentoLayout";

const ROTULO_MOTIVO: Record<string, string> = {
  banca: "banca",
  entrega_interna: "entrega (interno)",
  entrega_externa: "entrega (agenda do cliente)",
};

/**
 * §7.4 — o pilar é a BANCA: "um escopo está atrasado quando passa da data da
 * sua banca sem que ela tenha acontecido". A entrega ao cliente é acompanhada
 * à parte, com a distinção interno/externo, para não penalizar o time pelo
 * que não é dele.
 *
 * ⏱ Os dias são CORRIDOS, não úteis — é a única régua do sistema assim.
 */
export function AtrasosAba() {
  const { token } = useAuth();
  const { frenteId } = useMonitoramento();
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
          <PageCardTitle>Por projeto ({dados.por_projeto.length})</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.por_projeto.length === 0 ? (
            <EmptyText>Nenhum projeto atrasado. 🎉</EmptyText>
          ) : (
            <ListaSimples>
              {dados.por_projeto.map((p) => (
                <ItemAtencao key={p.projeto_id}>
                  <strong>
                    <Link to={`/projetos/${p.projeto_id}`}>{p.projeto_nome}</Link>{" "}
                    <Pilula $tom="neutro">
                      {ROTULO_STATUS[p.status as StatusProjeto] ?? p.status}
                    </Pilula>
                  </strong>
                  {p.motivos.map((m, i) => (
                    <span key={i}>
                      · {m.descricao} <Pilula $tom="alerta">{ROTULO_MOTIVO[m.tipo] ?? m.tipo}</Pilula>
                    </span>
                  ))}
                </ItemAtencao>
              ))}
            </ListaSimples>
          )}
          <EmptyText style={{ marginTop: "0.75rem" }}>
            A justificativa do atraso (o porquê, digitado pela diretoria) entra junto com o módulo de
            governança — o alerta acima é automático, como o §7.4 pede.
          </EmptyText>
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Por coordenador</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {dados.por_coordenador.length === 0 ? (
            <EmptyText>Nenhum coordenador na sua visão.</EmptyText>
          ) : (
            <>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Coordenador</TableHeadCell>
                    <TableHeadCell>Projetos</TableHeadCell>
                    <TableHeadCell>Atrasados</TableHeadCell>
                    <TableHeadCell>Dias acumulados</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dados.por_coordenador.map((c) => (
                    <TableRow key={c.usuario_id}>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell>{c.projetos}</TableCell>
                      <TableCell>
                        {c.atrasados > 0 ? (
                          <Pilula $tom="alerta">{c.atrasados}</Pilula>
                        ) : (
                          <Pilula $tom="ok">0</Pilula>
                        )}
                      </TableCell>
                      <TableCell>{c.dias_acumulados}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
              <EmptyText style={{ marginTop: "0.75rem" }}>
                O objetivo aqui é identificar padrão recorrente, não julgar um caso isolado (§7.4).
              </EmptyText>
            </>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
