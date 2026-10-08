import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ICONE_COR } from "@/components/health-track/icones";
import type { CorHealthTrack, Pilar, ProjetoNaCarteira } from "@/lib/health-track";
import {
  EmptyText,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
} from "@/styles/page.styled";
import {
  Celula,
  Contagem,
  FaixaBarra,
  Faixas,
  GradeCoordenadores,
  Mapa,
  Rolagem,
  Secundario,
  SubTitulo,
  CartaoCoordenador,
} from "./HealthTrack.styled";
import { SOLIDO_COR } from "@/components/health-track/HealthTrack.styled";

const PESO_COR: Record<CorHealthTrack, number> = { verde: 0, amarelo: 1, vermelho: 2 };

interface Coordenador {
  id: number;
  nome: string;
  projetos: ProjetoNaCarteira[];
  verde: number;
  amarelo: number;
  vermelho: number;
  persistentes: number;
}

function agrupar(projetos: ProjetoNaCarteira[]): Coordenador[] {
  const por = new Map<number, Coordenador>();
  for (const p of projetos) {
    for (const c of p.coordenadores) {
      const linha = por.get(c.id) ?? { id: c.id, nome: c.nome, projetos: [], verde: 0, amarelo: 0, vermelho: 0, persistentes: 0 };
      linha.projetos.push(p);
      if (p.status_geral) linha[p.status_geral.pela_regra_atual] += 1;
      linha.persistentes += p.alertas_persistentes;
      por.set(c.id, linha);
    }
  }
  return [...por.values()].sort(
    (a, b) => b.vermelho - a.vermelho || b.amarelo - a.amarelo || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/** A cor mais crítica entre os projetos do coordenador naquele pilar. */
function piorCor(c: Coordenador, pilarId: number): { cor: CorHealthTrack | null; contagem: Record<CorHealthTrack, number> } {
  const contagem: Record<CorHealthTrack, number> = { verde: 0, amarelo: 0, vermelho: 0 };
  let pior: CorHealthTrack | null = null;
  for (const p of c.projetos) {
    const cor = p.pilares[String(pilarId)]?.cor;
    if (!cor) continue;
    contagem[cor] += 1;
    if (pior === null || PESO_COR[cor] > PESO_COR[pior]) pior = cor;
  }
  return { cor: pior, contagem };
}

function pct(parte: number, total: number) {
  return total ? `${Math.round((parte / total) * 100)}%` : "0%";
}

/**
 * Visão por coordenador (§10, §11 e §14): a carteira de cada um em
 * números, o heatmap coordenador x projeto e o cruzamento coordenador x
 * pilar (a cor mais crítica dos projetos dele em cada pilar). É o que
 * responde "os projetos desse coordenador estão majoritariamente com
 * problema de cronograma" e "desenvolvimento aparece em todo mundo".
 */
export function CoordenadoresCard({
  projetos,
  pilares,
  nomeDaCor,
  coordenadorId,
  onEscolher,
}: {
  projetos: ProjetoNaCarteira[];
  pilares: Pilar[];
  nomeDaCor: (c: CorHealthTrack) => string;
  coordenadorId: number | null;
  /** Clicar num coordenador filtra o mapa por ele (ou tira o filtro). */
  onEscolher: (id: number | null) => void;
}) {
  const navigate = useNavigate();
  const coordenadores = useMemo(() => agrupar(projetos), [projetos]);
  const maisProjetos = Math.max(0, ...coordenadores.map((c) => c.projetos.length));

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Por coordenador</PageCardTitle>
        <Secundario as="span">Clique num coordenador pra filtrar o mapa; num projeto, pra abrir.</Secundario>
      </PageCardHeader>
      <PageCardContent>
        {coordenadores.length === 0 ? (
          <EmptyText>Nenhum projeto em acompanhamento com coordenador.</EmptyText>
        ) : (
          <>
            <GradeCoordenadores>
              {coordenadores.map((c) => {
                const avaliados = c.verde + c.amarelo + c.vermelho;
                return (
                  <CartaoCoordenador
                    key={c.id}
                    type="button"
                    $ativo={coordenadorId === c.id}
                    onClick={() => onEscolher(coordenadorId === c.id ? null : c.id)}
                  >
                    <strong>{c.nome}</strong>
                    <Secundario as="span">
                      {c.projetos.length} projeto{c.projetos.length !== 1 && "s"}
                      {avaliados < c.projetos.length && ` · ${c.projetos.length - avaliados} sem avaliação`}
                    </Secundario>
                    <Faixas>
                      <FaixaBarra aria-hidden="true">
                        <i style={{ width: `${(c.verde / Math.max(1, avaliados)) * 100}%`, background: SOLIDO_COR.verde }} />
                        <i style={{ width: `${(c.amarelo / Math.max(1, avaliados)) * 100}%`, background: SOLIDO_COR.amarelo }} />
                        <i style={{ width: `${(c.vermelho / Math.max(1, avaliados)) * 100}%`, background: SOLIDO_COR.vermelho }} />
                      </FaixaBarra>
                      <Contagem $cor="verde">{c.verde}</Contagem>
                      <Contagem $cor="amarelo">{c.amarelo}</Contagem>
                      <Contagem $cor="vermelho">{c.vermelho}</Contagem>
                    </Faixas>
                    <Secundario as="span">
                      {pct(c.verde, avaliados)} saudável
                      {c.persistentes > 0 && ` · ${c.persistentes} alerta${c.persistentes > 1 ? "s" : ""} persistente${c.persistentes > 1 ? "s" : ""}`}
                    </Secundario>
                  </CartaoCoordenador>
                );
              })}
            </GradeCoordenadores>

            <SubTitulo>Projetos de cada coordenador</SubTitulo>
            <Rolagem>
              <Mapa>
                <thead>
                  <tr>
                    <th>Coordenador</th>
                    {Array.from({ length: maisProjetos }, (_, i) => (
                      <th key={i} className="pilar">
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coordenadores.map((c) => (
                    <tr key={c.id} style={{ cursor: "default" }}>
                      <td>{c.nome}</td>
                      {Array.from({ length: maisProjetos }, (_, i) => {
                        const p = c.projetos[i];
                        if (!p) return <td key={i} className="pilar" />;
                        const cor = p.status_geral?.pela_regra_atual ?? null;
                        const Icone = cor ? ICONE_COR[cor] : null;
                        const rotulo = `${p.nome}: ${cor ? nomeDaCor(cor) : "sem avaliação"}`;
                        return (
                          <td key={i} className="pilar">
                            <Celula
                              as="button"
                              type="button"
                              $cor={cor}
                              title={rotulo}
                              aria-label={rotulo}
                              style={{ cursor: "pointer" }}
                              onClick={() => navigate(`/health-track/projetos/${p.id}`)}
                            >
                              {Icone ? <Icone aria-hidden="true" /> : "·"}
                            </Celula>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Mapa>
            </Rolagem>

            <SubTitulo>Pilares de cada coordenador (a cor mais crítica entre os projetos dele)</SubTitulo>
            <Rolagem>
              <Mapa>
                <thead>
                  <tr>
                    <th>Coordenador</th>
                    {pilares.map((p) => (
                      <th key={p.id} className="pilar" title={p.descricao ?? undefined}>
                        {p.nome.split(/\s*[&/]\s*/)[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coordenadores.map((c) => (
                    <tr key={c.id} style={{ cursor: "default" }}>
                      <td>{c.nome}</td>
                      {pilares.map((pilar) => {
                        const { cor, contagem } = piorCor(c, pilar.id);
                        const Icone = cor ? ICONE_COR[cor] : null;
                        const rotulo = cor
                          ? `${pilar.nome}: ${contagem.verde} ${nomeDaCor("verde").toLowerCase()}, ${contagem.amarelo} ${nomeDaCor("amarelo").toLowerCase()}, ${contagem.vermelho} ${nomeDaCor("vermelho").toLowerCase()}`
                          : `${pilar.nome}: sem avaliação`;
                        return (
                          <td key={pilar.id} className="pilar">
                            <Celula $cor={cor} title={rotulo} aria-label={rotulo}>
                              {Icone ? <Icone aria-hidden="true" /> : "·"}
                            </Celula>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Mapa>
            </Rolagem>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}
