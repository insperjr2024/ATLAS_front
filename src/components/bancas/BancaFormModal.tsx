import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getEscoposVendidos,
  syncBancaFrentes,
  syncEquipeProjeto,
  toDateInputValue,
  toTimeInputValue,
  updateBanca,
} from "@/lib/bancas";
import {
  getProjetos,
  getEscoposProjeto,
  marcarBancaDoEscopo,
  paraDataUtc,
} from "@/lib/projetos";
import { consultoresDoNucleo } from "@/lib/nucleo";
import { ListaMarcavel } from "@/components/ListaMarcavel";
import type {
  Banca,
  BancaFrente,
  EquipeProjeto,
  Escopo,
  Frente,
} from "@/types/banca";
import type { EscopoVendido, ProjetoResumo } from "@/types/projeto";
import type { UsuarioResumo } from "@/types/auth";
import { EmptyText, PageButton, PageButtonSm } from "@/styles/page.styled";
import {
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FieldSelect,
  CheckboxGrid,
  CheckboxLabel,
  DateTimeRow,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  BuscaLista,
  BuscaItem,
  BuscaTexto,
  BuscaNome,
  BuscaMeta,
  EscolhidoBox,
  EscopoIndisponivel,
} from "@/pages/Bancas.styled";

/**
 * As listas do núcleo que o formulário precisa para traduzir id em nome e
 * para saber o que já está marcado nesta banca.
 *
 * Vêm de fora porque as duas telas que abrem o formulário já as têm por
 * motivos próprios (a `/bancas` carrega tudo para desenhar os cards; a aba
 * Banca do projeto busca sob demanda, no clique do Editar) — buscá-las aqui
 * dentro repetiria a chamada em uma das duas.
 */
export interface DadosDoFormularioDeBanca {
  usuarios: UsuarioResumo[];
  /** O catálogo de escopos, para o select de escopo da edição. */
  escopos: Escopo[];
  frentes: Frente[];
  equipesProjeto: EquipeProjeto[];
  bancasFrentes: BancaFrente[];
}

/**
 * O formulário de banca — criar (sem `banca`) e editar (com ela).
 *
 * Vive aqui, e não dentro da tela `/bancas`, porque a aba **Banca** do projeto
 * abre o MESMO formulário: quem está olhando a banca de um projeto edita data,
 * escopo, consultores e frentes ali mesmo, em vez de procurar a banca certa na
 * lista de todas as bancas do semestre.
 */
export function BancaFormModal({
  banca,
  dados,
  token,
  ehDiretor,
  onClose,
  onSalvo,
}: {
  banca?: Banca | null;
  dados: DadosDoFormularioDeBanca;
  token: string;
  ehDiretor: boolean;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const editando = !!banca;

  const [nomeProjeto, setNomeProjeto] = useState(banca?.nome_projeto ?? "");

  // Criar banca parte de um projeto que já existe: nada de digitar o nome.
  // O endpoint `marcarBancaDoEscopo` deriva nome, coordenador e frentes do
  // próprio projeto, os mesmos dados que a tela de cronograma usa.
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [projetoId, setProjetoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [escoposCarregados, setEscoposCarregados] = useState<{
    projetoId: number;
    lista: EscopoVendido[];
  } | null>(null);
  const [escoposMarcados, setEscoposMarcados] = useState<number[]>(
    banca?.projeto_escopo_ids ?? [],
  );
  const [escopoId, setEscopoId] = useState(banca ? String(banca.escopo_id) : "");
  // Banca sem data abre o formulário com os campos VAZIOS, que é justamente o
  // caso de quem entra aqui para marcá-la.
  const [data, setData] = useState(banca?.data_hora ? toDateInputValue(banca.data_hora) : "");
  const [hora, setHora] = useState(banca?.data_hora ? toTimeInputValue(banca.data_hora) : "");
  const [consultorIds, setConsultorIds] = useState<number[]>(() =>
    banca ? dados.equipesProjeto.filter((e) => e.banca_id === banca.id).map((e) => e.usuario_id) : [],
  );
  const [frenteIds, setFrenteIds] = useState<number[]>(() =>
    banca ? dados.bancasFrentes.filter((bf) => bf.banca_id === banca.id).map((bf) => bf.frente_id) : [],
  );
  const [pisoOverride, setPisoOverride] = useState(
    banca?.piso_minimo_override != null ? String(banca.piso_minimo_override) : "",
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const consultores = consultoresDoNucleo(dados.usuarios).sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );

  useEffect(() => {
    if (editando) return;
    let ativo = true;
    getProjetos(token)
      .then((lista) => {
        if (ativo) setProjetos(lista.filter((p) => !p.arquivado_em));
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [editando, token]);

  // ⭐ Editando, o projeto não é escolhido — vem da banca. Como ela guarda só
  // os ids dos escopos, a lista GLOBAL de escopos vendidos é o caminho mais
  // curto para o `projeto_id` deles; buscar escopo a escopo seria uma
  // requisição por escopo para chegar ao mesmo número.
  useEffect(() => {
    if (!editando || !banca || projetoId != null) return;
    const primeiro = banca.projeto_escopo_ids[0];
    if (primeiro == null) return;
    let ativo = true;
    getEscoposVendidos(token)
      .then((todos) => {
        const dono = todos.find((e) => e.id === primeiro);
        if (ativo && dono) setProjetoId(dono.projeto_id);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [editando, banca, projetoId, token]);

  useEffect(() => {
    if (projetoId == null) return;
    let ativo = true;
    getEscoposProjeto(projetoId, token)
      .then((lista) => {
        if (ativo) setEscoposCarregados({ projetoId, lista });
      })
      .catch(() => {
        if (ativo) setEscoposCarregados({ projetoId, lista: [] });
      });
    return () => {
      ativo = false;
    };
  }, [projetoId, token]);

  // Derivados em vez de estado espelhado: a lista só vale para o projeto que
  // a trouxe, então trocar de projeto já a invalida sozinho.
  /** O escopo já pertence à banca que está sendo editada. */
  const ehDestaBanca = (escopo: EscopoVendido) =>
    !!banca && banca.projeto_escopo_ids.includes(escopo.id);

  const escoposDoProjeto =
    escoposCarregados?.projetoId === projetoId ? escoposCarregados.lista : [];
  const carregandoEscopos = projetoId != null && escoposCarregados?.projetoId !== projetoId;

  /** O catálogo do select de edição, em ordem alfabética — o estado cru
   *  guarda a ordem que o backend devolveu, que não é ordem nenhuma. */
  const escoposDoCatalogo = dados.escopos
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const projetoEscolhido = projetos.find((p) => p.id === projetoId) ?? null;

  const projetosFiltrados = (
    busca.trim()
      ? projetos.filter((p) =>
          `${p.nome} ${p.cliente}`.toLowerCase().includes(busca.trim().toLowerCase()),
        )
      : projetos.slice()
  ).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  /** Escopo que já tem banca não pode ser puxado para outra: o backend recusa
   *  (seria apagar em silêncio a data já marcada). */
  const escoposLivres = escoposDoProjeto.filter((e) => !e.banca);

  const frentesDosEscoposMarcados = [
    ...new Set(
      escoposDoProjeto
        .filter((e) => escoposMarcados.includes(e.id))
        .map((e) => dados.frentes.find((f) => f.id === e.frente_id)?.nome)
        .filter((nome): nome is string => !!nome),
    ),
  ];

  function toggleId(lista: number[], id: number): number[] {
    return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !hora) return;
    // Editando, os escopos também são obrigatórios: o backend recusa esvaziar
    // a banca (ela ficaria órfã), e barrar aqui evita o 422 depois do clique.
    if (editando ? !escopoId : escoposMarcados.length === 0) return;
    if (editando && escoposMarcados.length === 0) {
      setErro("A banca precisa cobrir ao menos um escopo.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const dataHora = new Date(`${data}T${hora}:00`).toISOString();
      const pisoMinimoOverride = ehDiretor
        ? pisoOverride.trim() === ""
          ? null
          : Number(pisoOverride)
        : undefined;
      if (editando && banca) {
        await updateBanca(
          banca.id,
          {
            nome_projeto: nomeProjeto.trim(),
            escopo_id: Number(escopoId),
            data_hora: dataHora,
            // ⭐ A lista SUBSTITUI a atual: o que foi desmarcado sai da banca,
            // e o backend recalcula as frentes dela a partir dos escopos que
            // sobraram. Não confundir com `escopo_id`, que é o rótulo do
            // catálogo.
            projeto_escopo_ids: escoposMarcados,
            ...(pisoMinimoOverride !== undefined ? { piso_minimo_override: pisoMinimoOverride } : {}),
          },
          token,
        );
        await syncEquipeProjeto(banca.id, consultorIds, dados.equipesProjeto, token);
        await syncBancaFrentes(banca.id, frenteIds, dados.bancasFrentes, token);
      } else {
        // Uma banca pode cobrir vários escopos do mesmo projeto. O
        // primeiro vai na URL, a lista completa no corpo, o backend deriva
        // dali o nome do projeto, o coordenador e as frentes.
        const criada = await marcarBancaDoEscopo(
          escoposMarcados[0],
          dataHora,
          token,
          undefined,
          escoposMarcados,
        );
        if (consultorIds.length > 0) {
          await syncEquipeProjeto(criada.id, consultorIds, dados.equipesProjeto, token);
        }
        if (pisoMinimoOverride != null) {
          await updateBanca(criada.id, { piso_minimo_override: pisoMinimoOverride }, token);
        }
      }
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : editando ? "Erro ao salvar banca" : "Erro ao criar banca");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="banca-form-titulo">
        <ModalHeader>
          <ModalTitle id="banca-form-titulo">{editando ? "Editar banca" : "Criar banca"}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <FormStack onSubmit={handleSubmit}>
          <ModalBody>
            {editando ? (
              <FieldGroup>
                <FieldLabel htmlFor="nome-projeto">Nome do projeto</FieldLabel>
                <FieldInput
                  id="nome-projeto"
                  value={nomeProjeto}
                  onChange={(e) => setNomeProjeto(e.target.value)}
                  placeholder="Ex.: Portugal 1"
                  required
                />
              </FieldGroup>
            ) : (
              <FieldGroup>
                <FieldLabel htmlFor="busca-projeto">Projeto</FieldLabel>
                {projetoEscolhido ? (
                  <EscolhidoBox>
                    <BuscaTexto>
                      <BuscaNome>{projetoEscolhido.nome}</BuscaNome>
                      <BuscaMeta>{projetoEscolhido.cliente}</BuscaMeta>
                    </BuscaTexto>
                    <PageButtonSm
                      $variant="outline"
                      type="button"
                      onClick={() => {
                        setProjetoId(null);
                        setEscoposMarcados([]);
                        setBusca("");
                      }}
                    >
                      Trocar
                    </PageButtonSm>
                  </EscolhidoBox>
                ) : (
                  <>
                    <FieldInput
                      id="busca-projeto"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Busque pelo nome do projeto ou do cliente"
                      autoComplete="off"
                    />
                    {projetos.length === 0 ? (
                      <EmptyText>Nenhum projeto ativo para marcar banca.</EmptyText>
                    ) : projetosFiltrados.length === 0 ? (
                      <EmptyText>Nenhum projeto encontrado para "{busca}".</EmptyText>
                    ) : (
                      <BuscaLista>
                        {projetosFiltrados.map((projeto) => (
                          <BuscaItem
                            key={projeto.id}
                            type="button"
                            onClick={() => {
                              setProjetoId(projeto.id);
                              setEscoposMarcados([]);
                              // A equipe do projeto é quem apresenta, e por
                              // isso não assiste à própria banca, já
                              // vem marcada para não montar à mão.
                              setConsultorIds(projeto.consultor_ids);
                            }}
                          >
                            <BuscaNome>{projeto.nome}</BuscaNome>
                            <BuscaMeta>{projeto.cliente}</BuscaMeta>
                          </BuscaItem>
                        ))}
                      </BuscaLista>
                    )}
                  </>
                )}
              </FieldGroup>
            )}

            {(editando ? projetoId != null : !!projetoEscolhido) && (
              <FieldGroup>
                <FieldLabel as="span">
                  Escopos que esta banca cobre
                </FieldLabel>
                {carregandoEscopos ? (
                  <EmptyText>Carregando escopos...</EmptyText>
                ) : escoposDoProjeto.length === 0 ? (
                  <EmptyText>Este projeto ainda não tem escopo vendido.</EmptyText>
                ) : escoposLivres.length === 0 ? (
                  <EmptyText>Todos os escopos deste projeto já têm banca marcada.</EmptyText>
                ) : (
                  <CheckboxGrid>
                    {escoposDoProjeto.map((escopo) => (
                      <CheckboxLabel key={escopo.id}>
                        <input
                          type="checkbox"
                          // ⚠ Editando, o escopo que já é DESTA banca aparece
                          // com `escopo.banca` preenchida — desabilitá-lo por
                          // isso travaria justamente o que se veio remover.
                          disabled={!!escopo.banca && !ehDestaBanca(escopo)}
                          checked={escoposMarcados.includes(escopo.id)}
                          onChange={() => setEscoposMarcados((ids) => toggleId(ids, escopo.id))}
                        />
                        <span>
                          {escopo.nome}
                          {escopo.banca && !ehDestaBanca(escopo) && (
                            <>
                              {" "}
                              <EscopoIndisponivel>
                                {escopo.banca.data_hora
                                  ? `já tem banca em ${paraDataUtc(escopo.banca.data_hora).toLocaleDateString("pt-BR")}`
                                  : "já tem banca, sem data"}
                              </EscopoIndisponivel>
                            </>
                          )}
                        </span>
                      </CheckboxLabel>
                    ))}
                  </CheckboxGrid>
                )}
              </FieldGroup>
            )}

            <DateTimeRow>
              <FieldGroup>
                <FieldLabel htmlFor="data-banca">Data</FieldLabel>
                <FieldInput id="data-banca" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel htmlFor="hora-banca">Horário</FieldLabel>
                <FieldInput id="hora-banca" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
              </FieldGroup>
            </DateTimeRow>

            {editando && (
              <FieldGroup>
                <FieldLabel htmlFor="escopo">Escopo</FieldLabel>
                <FieldSelect
                  id="escopo"
                  value={escopoId}
                  onChange={(e) => setEscopoId(e.target.value)}
                  required
                  pesquisavel
                >
                  <option value="">Selecione um escopo</option>
                  {escoposDoCatalogo.map((escopo) => (
                    <option key={escopo.id} value={escopo.id}>
                      {escopo.nome}
                    </option>
                  ))}
                </FieldSelect>
              </FieldGroup>
            )}

            {ehDiretor && (
              <FieldGroup>
                <FieldLabel htmlFor="piso-override">
                  Piso mínimo desta banca (opcional)
                </FieldLabel>
                <FieldInput
                  id="piso-override"
                  type="number"
                  min={0}
                  value={pisoOverride}
                  onChange={(e) => setPisoOverride(e.target.value)}
                  placeholder="Deixe em branco para usar o padrão da(s) frente(s)"
                />
              </FieldGroup>
            )}

            <FieldGroup>
              <FieldLabel>Consultores do projeto</FieldLabel>
              <ListaMarcavel
                opcoes={consultores}
                marcados={(id) => consultorIds.includes(id)}
                onAlternar={(id) => setConsultorIds((ids) => toggleId(ids, id))}
                vazio="Nenhum consultor disponível."
                placeholder="Buscar consultor…"
                aria-label="Buscar consultor"
              />
            </FieldGroup>

            {editando ? (
              <FieldGroup>
                <FieldLabel>Frentes</FieldLabel>
                <CheckboxGrid>
                  {dados.frentes.length === 0 && <EmptyText>Nenhuma frente cadastrada.</EmptyText>}
                  {dados.frentes.map((frente) => (
                    <CheckboxLabel key={frente.id}>
                      <input
                        type="checkbox"
                        checked={frenteIds.includes(frente.id)}
                        onChange={() => setFrenteIds((ids) => toggleId(ids, frente.id))}
                      />
                      {frente.nome}
                    </CheckboxLabel>
                  ))}
                </CheckboxGrid>
              </FieldGroup>
            ) : (
              escoposMarcados.length > 0 && (
                <FieldGroup>
                  <FieldLabel as="span">Frentes</FieldLabel>
                  <BuscaMeta>
                    {frentesDosEscoposMarcados.length > 0
                      ? `${frentesDosEscoposMarcados.join(" · ")}, vêm dos escopos escolhidos.`
                      : "Definidas pelos escopos escolhidos."}
                  </BuscaMeta>
                </FieldGroup>
              )
            )}

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton $variant="outline" type="button" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton
              type="submit"
              disabled={enviando || (!editando && escoposMarcados.length === 0)}
            >
              {enviando ? (editando ? "Salvando..." : "Criando...") : editando ? "Salvar" : "Criar"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </WideModalContent>
    </ModalOverlay>
  );
}
