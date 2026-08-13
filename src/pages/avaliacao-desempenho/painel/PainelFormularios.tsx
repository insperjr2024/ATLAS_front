import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFormulario, updateFormulario } from "@/lib/desempenho-formularios";
import type { DesempenhoPapel, DesempenhoTipo, DesempenhoTipoResposta } from "@/types/desempenho";
import {
  ErrorBlock,
  ErrorText,
  PageButton,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageHeader,
  PageHeaderText,
  PageLoadingBlock,
  PageStack,
  PageSubtitle,
  PageTitle,
} from "@/styles/page.styled";
import { FieldGroup, FieldInput, FieldLabel, FieldSelect, FieldTextarea, FormStack } from "@/pages/Bancas.styled";
import {
  AbaButton,
  CriteriosLista,
  CriterioEditorBlock,
  CriterioEditorRow,
  CriterioLabelInput,
  FormularioAbasRow,
  SecaoCamposProprios,
  SecaoEditorBlock,
  VoltarLink,
} from "./Painel.styled";

interface CriterioEditavel {
  id?: number;
  label: string;
  descricao: string;
  tipo_resposta: DesempenhoTipoResposta;
  limite_caracteres: string;
}

interface SecaoEditavel {
  id?: number;
  titulo: string;
  descricao: string;
  criterios: CriterioEditavel[];
}

const ABAS: { tipo: DesempenhoTipo; papel: DesempenhoPapel; rotulo: string }[] = [
  { tipo: "periodico", papel: "consultor", rotulo: "Periódica · Consultor" },
  { tipo: "periodico", papel: "coordenador", rotulo: "Periódica · Coordenador" },
  { tipo: "finalizacao", papel: "consultor", rotulo: "Finalização · Consultor" },
  { tipo: "finalizacao", papel: "coordenador", rotulo: "Finalização · Coordenador" },
];

export function PainelFormularios() {
  const { token } = useAuth();
  const [aba, setAba] = useState(ABAS[0]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [notaGeralTitulo, setNotaGeralTitulo] = useState("");
  const [notaGeralDescricao, setNotaGeralDescricao] = useState("");
  const [comentariosTitulo, setComentariosTitulo] = useState("");
  const [comentariosDescricao, setComentariosDescricao] = useState("");
  const [comentariosAviso, setComentariosAviso] = useState("");
  const [secoes, setSecoes] = useState<SecaoEditavel[]>([]);

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const formulario = await getFormulario(aba.tipo, aba.papel, token);
      setNotaGeralTitulo(formulario.nota_geral_titulo);
      setNotaGeralDescricao(formulario.nota_geral_descricao);
      setComentariosTitulo(formulario.comentarios_titulo);
      setComentariosDescricao(formulario.comentarios_descricao);
      setComentariosAviso(formulario.comentarios_aviso);
      setSecoes(
        formulario.secoes.map((s) => ({
          id: s.id,
          titulo: s.titulo,
          descricao: s.descricao ?? "",
          criterios: s.criterios.map((c) => ({
            id: c.id,
            label: c.label,
            descricao: c.descricao ?? "",
            tipo_resposta: c.tipo_resposta,
            limite_caracteres: c.limite_caracteres != null ? String(c.limite_caracteres) : "",
          })),
        })),
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o formulário");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, token]);

  function atualizarSecao(index: number, campo: "titulo" | "descricao", valor: string) {
    setSecoes((atual) => atual.map((s, i) => (i === index ? { ...s, [campo]: valor } : s)));
  }

  function adicionarSecao() {
    setSecoes((atual) => [...atual, { titulo: "", descricao: "", criterios: [] }]);
  }

  function removerSecao(index: number) {
    setSecoes((atual) => atual.filter((_, i) => i !== index));
  }

  function atualizarCriterio(secaoIndex: number, criterioIndex: number, campo: keyof CriterioEditavel, valor: string) {
    setSecoes((atual) =>
      atual.map((s, i) =>
        i !== secaoIndex
          ? s
          : { ...s, criterios: s.criterios.map((c, j) => (j === criterioIndex ? { ...c, [campo]: valor } : c)) },
      ),
    );
  }

  function adicionarCriterio(secaoIndex: number) {
    setSecoes((atual) =>
      atual.map((s, i) =>
        i !== secaoIndex
          ? s
          : { ...s, criterios: [...s.criterios, { label: "", descricao: "", tipo_resposta: "nota", limite_caracteres: "" }] },
      ),
    );
  }

  function removerCriterio(secaoIndex: number, criterioIndex: number) {
    setSecoes((atual) =>
      atual.map((s, i) => (i !== secaoIndex ? s : { ...s, criterios: s.criterios.filter((_, j) => j !== criterioIndex) })),
    );
  }

  async function handleSalvar() {
    if (!token) return;
    setSalvando(true);
    setErro("");
    try {
      await updateFormulario(
        aba.tipo,
        aba.papel,
        {
          nota_geral_titulo: notaGeralTitulo,
          nota_geral_descricao: notaGeralDescricao,
          comentarios_titulo: comentariosTitulo,
          comentarios_descricao: comentariosDescricao,
          comentarios_aviso: comentariosAviso,
          secoes: secoes.map((s) => ({
            id: s.id,
            titulo: s.titulo,
            descricao: s.descricao || null,
            criterios: s.criterios.map((c) => ({
              id: c.id,
              label: c.label,
              descricao: c.descricao || null,
              tipo_resposta: c.tipo_resposta,
              limite_caracteres: c.limite_caracteres ? Number(c.limite_caracteres) : null,
            })),
          })),
        },
        token,
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar o formulário");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <VoltarLink to="/avaliacao-desempenho/painel/lotes">
            <ArrowLeft size={14} />
            Voltar para Formulários
          </VoltarLink>
          <PageTitle>Editar formulário de avaliação</PageTitle>
          <PageSubtitle>Seções e critérios de cada combinação de tipo e papel.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <FormularioAbasRow>
        {ABAS.map((a) => (
          <AbaButton
            key={`${a.tipo}-${a.papel}`}
            type="button"
            $active={aba.tipo === a.tipo && aba.papel === a.papel}
            onClick={() => setAba(a)}
          >
            {a.rotulo}
          </AbaButton>
        ))}
      </FormularioAbasRow>

      {erro && (
        <ErrorBlock>
          <ErrorText>{erro}</ErrorText>
          <PageButton $variant="outline" onClick={carregar}>
            Tentar novamente
          </PageButton>
        </ErrorBlock>
      )}

      {carregando ? (
        <PageLoadingBlock />
      ) : (
        <>
          <PageCard>
            <PageCardHeader>
              <PageCardTitle>Seções e critérios</PageCardTitle>
              <PageButtonSm type="button" onClick={adicionarSecao}>
                <Plus size={14} /> Nova seção
              </PageButtonSm>
            </PageCardHeader>
            <PageCardContent>
              <FormStack onSubmit={(e) => e.preventDefault()}>
                {secoes.map((secao, secaoIndex) => (
                  <SecaoEditorBlock key={secao.id ?? `nova-${secaoIndex}`}>
                    <SecaoCamposProprios>
                      <CriterioEditorRow>
                        <CriterioLabelInput
                          placeholder="Título da seção"
                          value={secao.titulo}
                          onChange={(e) => atualizarSecao(secaoIndex, "titulo", e.target.value)}
                        />
                        <PageButtonSm $variant="ghost" type="button" onClick={() => removerSecao(secaoIndex)}>
                          <X size={14} /> Remover seção
                        </PageButtonSm>
                      </CriterioEditorRow>
                      <FieldTextarea
                        placeholder="Descrição da seção (opcional)"
                        value={secao.descricao}
                        onChange={(e) => atualizarSecao(secaoIndex, "descricao", e.target.value)}
                      />
                    </SecaoCamposProprios>

                    <CriteriosLista>
                      {secao.criterios.map((criterio, criterioIndex) => (
                        <CriterioEditorBlock key={criterio.id ?? `novo-${criterioIndex}`}>
                          <CriterioEditorRow>
                            <CriterioLabelInput
                              placeholder="Rótulo do critério"
                              value={criterio.label}
                              onChange={(e) => atualizarCriterio(secaoIndex, criterioIndex, "label", e.target.value)}
                            />
                            <FieldSelect
                              value={criterio.tipo_resposta}
                              onChange={(e) => atualizarCriterio(secaoIndex, criterioIndex, "tipo_resposta", e.target.value)}
                            >
                              <option value="nota">Nota (1-5)</option>
                              <option value="texto">Texto</option>
                            </FieldSelect>
                            {criterio.tipo_resposta === "texto" && (
                              <FieldInput
                                type="number"
                                placeholder="Limite de caracteres"
                                value={criterio.limite_caracteres}
                                onChange={(e) => atualizarCriterio(secaoIndex, criterioIndex, "limite_caracteres", e.target.value)}
                              />
                            )}
                            <PageButtonSm
                              $variant="ghost"
                              type="button"
                              onClick={() => removerCriterio(secaoIndex, criterioIndex)}
                            >
                              <X size={14} />
                            </PageButtonSm>
                          </CriterioEditorRow>
                          <FieldTextarea
                            placeholder="Descrição do critério, o texto que a pessoa vê ao responder (opcional)"
                            value={criterio.descricao}
                            onChange={(e) => atualizarCriterio(secaoIndex, criterioIndex, "descricao", e.target.value)}
                          />
                        </CriterioEditorBlock>
                      ))}
                    </CriteriosLista>
                    <PageButtonSm $variant="outline" type="button" onClick={() => adicionarCriterio(secaoIndex)}>
                      <Plus size={14} /> Novo critério
                    </PageButtonSm>
                  </SecaoEditorBlock>
                ))}
              </FormStack>
            </PageCardContent>
          </PageCard>

          <PageCard>
            <PageCardHeader>
              <PageCardTitle>Nota geral e comentários</PageCardTitle>
            </PageCardHeader>
            <PageCardContent>
              <FormStack onSubmit={(e) => e.preventDefault()}>
                <FieldGroup>
                  <FieldLabel htmlFor="ng-titulo">Título da nota geral</FieldLabel>
                  <FieldInput id="ng-titulo" value={notaGeralTitulo} onChange={(e) => setNotaGeralTitulo(e.target.value)} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="ng-desc">Descrição da nota geral</FieldLabel>
                  <FieldTextarea id="ng-desc" value={notaGeralDescricao} onChange={(e) => setNotaGeralDescricao(e.target.value)} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="com-titulo">Título dos comentários</FieldLabel>
                  <FieldInput id="com-titulo" value={comentariosTitulo} onChange={(e) => setComentariosTitulo(e.target.value)} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="com-desc">Descrição dos comentários</FieldLabel>
                  <FieldTextarea id="com-desc" value={comentariosDescricao} onChange={(e) => setComentariosDescricao(e.target.value)} />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="com-aviso">Aviso dos comentários</FieldLabel>
                  <FieldTextarea id="com-aviso" value={comentariosAviso} onChange={(e) => setComentariosAviso(e.target.value)} />
                </FieldGroup>
              </FormStack>
            </PageCardContent>
          </PageCard>

          <PageButton type="button" onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar formulário"}
          </PageButton>
        </>
      )}
    </PageStack>
  );
}
