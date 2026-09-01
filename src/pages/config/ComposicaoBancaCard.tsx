import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getComposicaoBanca,
  listarCombinacoesComposicao,
  salvarComposicaoBanca,
  type CombinacaoComposicao,
  type ComposicaoDaCombinacao,
} from "@/lib/configuracao";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageBadge,
  EmptyText,
} from "@/styles/page.styled";
import { SegmentedButton, SegmentedGroup, TableScrollWrap } from "@/styles/shared.styled";
import {
  DataTable,
  TableHead,
  TableHeadCell,
  TableRow,
  TableBody,
  TableCell,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FormErrorText,
  ResumoCombinacao,
} from "../Config.styled";

/** Os quatro números editáveis de uma frente, como texto (é o que o input dá). */
type Rascunho = Record<number, {
  min_membros: string;
  max_membros: string;
  min_lideranca: string;
  max_lideranca: string;
}>;

/**
 * ⭐ A composição exigida por COMBINAÇÃO de frentes (§8).
 *
 * 📐 **Uma combinação por vez, escolhida num seletor.** Com 4 frentes são 15
 * combinações e até 4 frentes dentro de cada — 128 campos se todas ficassem
 * na tela ao mesmo tempo. O seletor troca isso por uma decisão de cada vez, e
 * é a única forma de a tela caber sem virar planilha.
 *
 * ⚠ **Combinação não configurada mostra o PADRÃO**, derivado do piso da frente
 * e do mínimo de liderança global. Não é um formulário vazio: são os números
 * que estão valendo agora, e salvar é o que os torna próprios daquela
 * combinação.
 */
export function ComposicaoBancaCard() {
  const { token } = useAuth();
  const [combinacoes, setCombinacoes] = useState<CombinacaoComposicao[]>([]);
  /** As frentes marcadas. A combinação é derivada delas, não escolhida
   *  pronta — é assim que a tela deixa claro o que está sendo montado. */
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [regra, setRegra] = useState<ComposicaoDaCombinacao | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho>({});
  /** O teto de vagas DESTA combinação (2026-09-02) — quantos cabem, não
   *  quantos são exigidos; é ele que faz `create_candidatura` recusar com
   *  "banca lotada".
   *
   *  ⚠ Era global: um número para a plataforma inteira, salvo à parte por
   *  `PATCH /configuracao`. A banca de Direito sozinha (2 pessoas exigidas) e
   *  a de Business + Tech + Processos (9) cabiam o mesmo tanto de gente.
   *  Agora viaja junto com a matriz da combinação; o global continua no banco
   *  como padrão de quem nunca salvou. */
  const [teto, setTeto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!token) return;
    listarCombinacoesComposicao(token)
      .then((lista) => {
        setCombinacoes(lista);
        // Abre na primeira frente sozinha: é a banca mais comum, e uma tela
        // que abre vazia obriga um clique antes de mostrar qualquer coisa.
        setMarcadas((atual) =>
          atual.length ? atual : lista.find((c) => !c.sinergica)?.frente_ids ?? [],
        );
      })
      .catch((err) =>
        setErro(err instanceof Error ? err.message : "Erro ao carregar as combinações"),
      )
      .finally(() => setCarregando(false));
  }, [token]);

  /** A chave da combinação marcada — ids ordenados, unidos por `-`. Espelha
   *  `utils/combinacao_frentes.chave` do backend. */
  const escolhida = useMemo(
    () => [...new Set(marcadas)].sort((a, b) => a - b).join("-"),
    [marcadas],
  );

  useEffect(() => {
    if (!token || !escolhida) {
      setRegra(null);
      return;
    }
    setAviso("");
    setErro("");
    getComposicaoBanca(escolhida, token)
      .then((resp) => {
        setRegra(resp);
        setTeto(String(resp.vagas));
        setRascunho(
          Object.fromEntries(
            resp.frentes.map((f) => [
              f.frente_id,
              {
                min_membros: String(f.min_membros),
                max_membros: String(f.max_membros),
                min_lideranca: String(f.min_lideranca),
                max_lideranca: String(f.max_lideranca),
              },
            ]),
          ),
        );
      })
      .catch((err) =>
        setErro(err instanceof Error ? err.message : "Erro ao carregar a regra"),
      );
  }, [token, escolhida]);

  function mudar(frenteId: number, campo: keyof Rascunho[number], valor: string) {
    setRascunho((atual) => ({
      ...atual,
      [frenteId]: { ...atual[frenteId], [campo]: valor },
    }));
    setAviso("");
  }

  /** O mínimo que a combinação passa a exigir com o que está digitado.
   *  Liderança é vaga A MAIS: entra somada, não dentro dos membros. */
  const minimoDigitado = useMemo(() => {
    return Object.values(rascunho).reduce(
      (soma, r) => soma + (Number(r.min_membros) || 0) + (Number(r.min_lideranca) || 0),
      0,
    );
  }, [rascunho]);

  async function salvar() {
    if (!token || !regra) return;
    const frentes = regra.frentes.map((f) => ({
      frente_id: f.frente_id,
      min_membros: Number(rascunho[f.frente_id].min_membros),
      max_membros: Number(rascunho[f.frente_id].max_membros),
      min_lideranca: Number(rascunho[f.frente_id].min_lideranca),
      max_lideranca: Number(rascunho[f.frente_id].max_lideranca),
    }));
    if (frentes.some((f) => Object.values(f).some((v) => !Number.isInteger(v)))) {
      setErro("Preencha os quatro números de cada frente.");
      return;
    }
    const numeroTeto = Number(teto);
    if (!Number.isInteger(numeroTeto) || numeroTeto < 1) {
      setErro("Informe um teto de vagas por banca válido.");
      return;
    }
    if (numeroTeto < minimoDigitado) {
      // A mesma recusa do backend, dita antes do clique custar uma ida ao
      // servidor: banca com teto abaixo do mínimo nunca fecha a composição —
      // a inscrição recusaria com "banca lotada" antes de completá-la.
      setErro(
        `O teto de ${numeroTeto} vagas é menor que as ${minimoDigitado} pessoas que ` +
          "esta combinação passa a exigir.",
      );
      return;
    }
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      await salvarComposicaoBanca(escolhida, frentes, numeroTeto, token);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
      return;
    } finally {
      // ⚠ O botão volta aqui, com a ESCRITA — não depois das recargas abaixo.
      // Com elas dentro do `try`, ele ficava em "Salvando…" por mais duas
      // idas ao servidor depois de o dado já estar gravado, e parecia travado.
      setSalvando(false);
    }
    setAviso("Salvo.");
    // A lista do seletor carrega o "configurada", o mínimo e o teto de cada
    // combinação — sem recarregar, o selo continuaria dizendo "padrão".
    try {
      const [lista, atualizada] = await Promise.all([
        listarCombinacoesComposicao(token),
        getComposicaoBanca(escolhida, token),
      ]);
      setCombinacoes(lista);
      setRegra(atualizada);
      setTeto(String(atualizada.vagas));
    } catch {
      // Recarregar é conforto, não parte do salvamento: falhar aqui não
      // desfaz nada, e anunciar erro depois do "Salvo." seria mentira.
    }
  }

  const selecionada = combinacoes.find((c) => c.combinacao === escolhida);

  /** As frentes ativas, tiradas das combinações de uma frente só — elas já
   *  vêm na resposta, e uma requisição a mais para `/frentes` traria a mesma
   *  lista (mais as inativas, que não entram em banca nova). */
  const frentesDisponiveis = useMemo(
    () =>
      combinacoes
        .filter((c) => !c.sinergica)
        .map((c) => ({ id: c.frente_ids[0], nome: c.rotulo })),
    [combinacoes],
  );

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Composição por combinação de frentes</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {carregando ? (
          <EmptyText>Carregando…</EmptyText>
        ) : combinacoes.length === 0 ? (
          <EmptyText>Nenhuma frente ativa cadastrada.</EmptyText>
        ) : (
          <>
            {/* 📐 **Monta-se a combinação, não se escolhe uma pronta.**
                Antes era um `<select>` com as 15 combinações em lista corrida:
                para saber se "Business + Direito" existia, era preciso abrir o
                menu e varrer. Aqui as frentes são o controle, e a combinação é
                a consequência — o que também escala, porque uma frente nova
                vira um botão, e não 16 opções novas no menu. */}
            <FieldLabel as="span">Esta banca avalia escopos de</FieldLabel>
            <SegmentedGroup
              $bloco
              role="group"
              aria-label="Frentes desta banca"
              style={{ marginTop: "0.375rem" }}
            >
              {frentesDisponiveis.map((f) => {
                const ativa = marcadas.includes(f.id);
                return (
                  <SegmentedButton
                    key={f.id}
                    type="button"
                    $ativo={ativa}
                    aria-pressed={ativa}
                    onClick={() =>
                      setMarcadas((atual) =>
                        ativa ? atual.filter((id) => id !== f.id) : [...atual, f.id],
                      )
                    }
                  >
                    {ativa && <Check size={13} aria-hidden />}
                    {f.nome}
                  </SegmentedButton>
                );
              })}
            </SegmentedGroup>

            {/* O que foi montado, em uma frase — o rótulo some quando a pessoa
                está olhando só os botões marcados. */}
            {regra && (
              <ResumoCombinacao>
                <strong>{regra.rotulo}</strong>
                <span>
                  {marcadas.length === 1
                    ? "banca de uma frente"
                    : `banca sinérgica · ${marcadas.length} frentes`}
                </span>
              </ResumoCombinacao>
            )}

            {marcadas.length === 0 && (
              <EmptyText style={{ marginTop: "0.75rem" }}>
                Marque ao menos uma frente para ver e editar a composição exigida.
              </EmptyText>
            )}

            {selecionada && !selecionada.configurada && (
              <EmptyText style={{ fontSize: "0.7rem", marginTop: "0.5rem" }}>
                Esta combinação ainda não foi configurada — os números abaixo são o padrão
                herdado do piso de cada frente. Salvar torna-os próprios dela.
              </EmptyText>
            )}

            {regra && (
              <div style={{ marginTop: "0.75rem" }}>
                {/* ⭐ O teto é DA COMBINAÇÃO (2026-09-02), por isso mora aqui
                    dentro, depois do seletor: acima dele parecia — e era — um
                    número global. Responde "quantos cabem nesta banca", e é
                    ele que faz a inscrição recusar com "banca lotada". Não
                    confundir com o mínimo logo abaixo da tabela, que é
                    quantos ela EXIGE. */}
                <FieldGroup style={{ marginBottom: "1rem" }}>
                  <FieldLabel htmlFor="teto-vagas">
                    Teto de vagas nesta banca
                  </FieldLabel>
                  <FieldInput
                    id="teto-vagas"
                    type="number"
                    min={1}
                    value={teto}
                    onChange={(e) => {
                      setTeto(e.target.value);
                      setAviso("");
                    }}
                  />
                  {!regra.vagas_propria && (
                    <EmptyText style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}>
                      Herdado do padrão da plataforma. Salvar torna este teto próprio
                      desta combinação.
                    </EmptyText>
                  )}
                </FieldGroup>

                <TableScrollWrap $min="34rem">
                  <DataTable>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell>Frente</TableHeadCell>
                        <TableHeadCell>Mín. membros</TableHeadCell>
                        <TableHeadCell>Máx. membros</TableHeadCell>
                        <TableHeadCell>Mín. liderança</TableHeadCell>
                        <TableHeadCell>Máx. liderança</TableHeadCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {regra.frentes.map((f) => (
                        <TableRow key={f.frente_id}>
                          <TableCell>{f.frente_nome}</TableCell>
                          {(
                            ["min_membros", "max_membros", "min_lideranca", "max_lideranca"] as const
                          ).map((campo) => (
                            <TableCell key={campo}>
                              <FieldInput
                                type="number"
                                min={0}
                                aria-label={`${campo} de ${f.frente_nome}`}
                                value={rascunho[f.frente_id]?.[campo] ?? ""}
                                onChange={(e) => mudar(f.frente_id, campo, e.target.value)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </TableScrollWrap>

                {/* O número que a diretoria está de fato decidindo. Some do
                    formulário sem isto: são até 16 campos, e o efeito deles é
                    uma soma que ninguém quer fazer de cabeça. */}
                <EmptyText style={{ fontSize: "0.75rem", marginTop: "0.75rem" }}>
                  Esta banca passa a exigir{" "}
                  <PageBadge $tone="default">{minimoDigitado} pessoas</PageBadge> no mínimo —
                  membros e liderança somados, porque a liderança é uma vaga a mais.
                </EmptyText>
                <EmptyText style={{ fontSize: "0.7rem", marginTop: "0.5rem" }}>
                  Liderança é o gerente da frente ou alguém da diretoria; coordenador não conta.
                  A equipe do próprio projeto nunca entra na contagem.
                </EmptyText>
              </div>
            )}

            {erro && <FormErrorText>{erro}</FormErrorText>}
            {aviso && <EmptyText style={{ color: "green" }}>{aviso}</EmptyText>}
            <div style={{ marginTop: "0.75rem" }}>
              <PageButton type="button" disabled={salvando || !regra} onClick={salvar}>
                {salvando ? "Salvando…" : "Salvar"}
              </PageButton>
            </div>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}
