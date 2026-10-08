import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { CorSelo } from "@/components/health-track/CorSelo";
import { formatarData } from "@/lib/projetos";
import {
  criarAcao,
  getAcoesAbertas,
  type Acao,
  type AcaoPayload,
  type CorHealthTrack,
  type Pilar,
  type ProjetoNaCarteira,
} from "@/lib/health-track";
import {
  EmptyText,
  ErrorText,
  PageBadge,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
} from "@/styles/page.styled";
import { AcaoModal } from "./AcaoModal";
import { Mapa, Motivos, NomeProjeto, Rolagem, Secundario } from "./HealthTrack.styled";

const POSICOES_QUE_AGEM = new Set(["diretor_projetos", "gerente"]);
const PESO_COR: Record<CorHealthTrack, number> = { verde: 0, amarelo: 1, vermelho: 2 };

/** Por que o projeto está na lista (§15): status vermelho, algum pilar
 *  vermelho, alerta persistente, piorou desde o ciclo anterior. */
function motivos(p: ProjetoNaCarteira, pilares: Pilar[], nomeDaCor: (c: CorHealthTrack) => string): string[] {
  const lista: string[] = [];
  if (p.status_geral?.pela_regra_atual === "vermelho") lista.push(`Status ${nomeDaCor("vermelho").toLowerCase()}`);
  for (const pilar of pilares) {
    const c = p.pilares[String(pilar.id)];
    if (!c) continue;
    if (c.cor === "vermelho") lista.push(`${pilar.nome} ${nomeDaCor("vermelho").toLowerCase()}`);
    if (c.persistente) lista.push(`${pilar.nome} ${nomeDaCor(c.cor).toLowerCase()} há ${c.sequencia} avaliações`);
  }
  if (p.status_geral && p.status_anterior && PESO_COR[p.status_geral.pela_regra_atual] > PESO_COR[p.status_anterior]) {
    lista.push(`Piorou (era ${nomeDaCor(p.status_anterior).toLowerCase()})`);
  }
  return [...new Set(lista)];
}

/**
 * Projetos que exigem atenção (§15): entram sozinhos os que estão vermelhos,
 * com pilar vermelho, com alerta persistente ou que pioraram. Pra cada um,
 * as ações abertas (problema, responsável, próxima ação, prazo) e o botão
 * de criar outra. O Health Track não termina no diagnóstico.
 */
export function AtencaoCard({
  projetos,
  pilares,
  nomeDaCor,
}: {
  projetos: ProjetoNaCarteira[];
  pilares: Pilar[];
  nomeDaCor: (c: CorHealthTrack) => string;
}) {
  const { token, usuario } = useAuth();
  const podeAgir = POSICOES_QUE_AGEM.has(usuario?.posicao ?? "");
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [erro, setErro] = useState("");
  const [criandoPara, setCriandoPara] = useState<ProjetoNaCarteira | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getAcoesAbertas(token)
      .then((lista) => vivo && setAcoes(lista))
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : "Erro ao carregar as ações"));
    return () => {
      vivo = false;
    };
  }, [token, versao]);

  const porProjeto = useMemo(() => {
    const mapa = new Map<number, Acao[]>();
    for (const a of acoes) mapa.set(a.projeto_id, [...(mapa.get(a.projeto_id) ?? []), a]);
    return mapa;
  }, [acoes]);

  const linhas = useMemo(
    () =>
      projetos
        .map((p) => ({ projeto: p, motivos: motivos(p, pilares, nomeDaCor), acoes: porProjeto.get(p.id) ?? [] }))
        // Entra quem tem motivo OU quem tem ação aberta (pra ação não sumir
        // da vista só porque o projeto melhorou).
        .filter((l) => l.motivos.length > 0 || l.acoes.length > 0)
        .sort((a, b) => b.motivos.length - a.motivos.length || a.projeto.nome.localeCompare(b.projeto.nome, "pt-BR")),
    [projetos, pilares, nomeDaCor, porProjeto],
  );

  async function criar(dados: AcaoPayload) {
    if (!token || !criandoPara) return;
    await criarAcao(criandoPara.id, dados, token);
    setCriandoPara(null);
    setVersao((v) => v + 1);
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Projetos que exigem atenção</PageCardTitle>
        <Secundario as="span">Status crítico, pilar crítico, alerta persistente ou piora desde o ciclo anterior.</Secundario>
      </PageCardHeader>
      <PageCardContent>
        {erro && <ErrorText>{erro}</ErrorText>}
        {linhas.length === 0 ? (
          <EmptyText>Nenhum projeto em acompanhamento pede atenção agora.</EmptyText>
        ) : (
          <Rolagem>
            <Mapa>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Coordenação</th>
                  <th>Status</th>
                  <th>Por quê</th>
                  <th>Ações abertas</th>
                  {podeAgir && <th />}
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ projeto: p, motivos: m, acoes: lista }) => (
                  <tr key={p.id} style={{ cursor: "default" }}>
                    <td>
                      <NomeProjeto to={`/health-track/projetos/${p.id}`}>{p.nome}</NomeProjeto>
                      <Secundario>{p.frentes.map((f) => f.nome).join(" + ") || "Sem frente"}</Secundario>
                    </td>
                    <td>{p.coordenadores.map((c) => c.nome.split(" ")[0]).join(", ") || <Secundario>Sem coordenador</Secundario>}</td>
                    <td>
                      {p.status_geral ? (
                        <CorSelo cor={p.status_geral.pela_regra_atual} rotulo={nomeDaCor(p.status_geral.pela_regra_atual)} />
                      ) : (
                        <Secundario>Sem status</Secundario>
                      )}
                    </td>
                    <td style={{ whiteSpace: "normal", minWidth: "14rem" }}>
                      <Motivos>
                        {m.map((x) => (
                          <span key={x}>{x}</span>
                        ))}
                      </Motivos>
                    </td>
                    <td style={{ whiteSpace: "normal", minWidth: "18rem" }}>
                      {lista.length === 0 ? (
                        <Secundario>Nenhuma ação ainda</Secundario>
                      ) : (
                        lista.map((a) => (
                          <div key={a.id} style={{ marginBottom: "0.3rem" }}>
                            <strong>{a.proxima_acao}</strong>
                            {a.atrasada && (
                              <PageBadge $tone="danger" style={{ marginLeft: "0.4rem" }}>
                                Atrasada
                              </PageBadge>
                            )}
                            <Secundario>
                              {a.problema} · {a.responsavel_nome ?? "sem responsável"}
                              {a.prazo && ` · até ${formatarData(a.prazo)}`}
                            </Secundario>
                          </div>
                        ))
                      )}
                    </td>
                    {podeAgir && (
                      <td>
                        <PageButtonSm type="button" $variant="outline" onClick={() => setCriandoPara(p)}>
                          Nova ação
                        </PageButtonSm>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Mapa>
          </Rolagem>
        )}
        {linhas.length > 0 && (
          <Secundario style={{ marginTop: "0.5rem" }}>
            Concluir, editar ou excluir uma ação: pela página do projeto (<Link to="/health-track">clique no nome</Link>).
          </Secundario>
        )}
      </PageCardContent>

      {criandoPara && (
        <AcaoModal
          projetoNome={criandoPara.nome}
          equipeIds={[...criandoPara.coordenadores, ...criandoPara.gerentes].map((x) => x.id)}
          onConfirmar={criar}
          onCancelar={() => setCriandoPara(null)}
        />
      )}
    </PageCard>
  );
}
