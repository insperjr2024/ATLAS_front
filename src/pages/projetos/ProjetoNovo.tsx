import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { createProjeto, DIAS_REUNIAO, uploadAnexoProposta } from "@/lib/projetos";
import { getUsuarios } from "@/lib/usuarios";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import { getEscopos } from "@/lib/escopos";
import {
  MemberPicker,
  montarEquipePayload,
  validarEquipe,
  type EquipeSelecionada,
} from "@/components/membros/MemberPicker";
import { CompatibilidadeHorarios } from "@/components/grade/CompatibilidadeHorarios";
import {
  EscopoPicker,
  montarEscoposPayload,
  validarEscopos,
  type EscopoEmEdicao,
} from "@/components/escopos/EscopoPicker";
import type { UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { Escopo, Frente } from "@/types/banca";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  FormStack,
  FieldGroup,
  FieldLabel,
  Required,
  FieldInput,
  FieldTextarea,
  FieldSelect,
  CheckboxGrid,
  CheckboxLabel,
  FormErrorText,
  FormFields,
  ModoPropostaRow,
  ModalFooter,
  VoltarLink,
} from "./Projetos.styled";

const MAX_FRENTES = 2;

/**
 * O cadastro do §6.3.
 *
 * ⚠ Kickoff **não** entra aqui: o projeto nasce Vendido, sem data. Ela é
 * marcada depois, na página do projeto, e é isso que dispara a mudança de
 * status. Os **escopos vendidos** também não — são a fatia F4.
 */
export function ProjetoNovo() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [catalogo, setCatalogo] = useState<Escopo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [usuariosFrentes, setUsuariosFrentes] = useState<UsuarioFrente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState("");

  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [descricao, setDescricao] = useState("");
  const [modoProposta, setModoProposta] = useState<"link" | "anexo">("link");
  const [linkProposta, setLinkProposta] = useState("");
  const [anexoProposta, setAnexoProposta] = useState<File | null>(null);
  const [erroAnexo, setErroAnexo] = useState("");
  const [frenteIds, setFrenteIds] = useState<number[]>([]);
  const [diasAmbientacao, setDiasAmbientacao] = useState("5");
  const [diaReuniao, setDiaReuniao] = useState("");
  const [equipe, setEquipe] = useState<EquipeSelecionada>({ coordenadorId: null, consultorIds: [] });
  const [escopos, setEscopos] = useState<EscopoEmEdicao[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  // Guardado para a tentativa de reenvio do anexo não criar um segundo
  // projeto se o upload falhar depois que o projeto já foi criado.
  const [projetoCriadoId, setProjetoCriadoId] = useState<number | null>(null);

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErroCarga("");
    try {
      const [frentesResp, usuariosResp, catalogoResp, usuariosFrentesResp] = await Promise.all([
        getFrentes(token),
        getUsuarios(token),
        getEscopos(token),
        getUsuariosFrentes(token),
      ]);
      setFrentes(frentesResp);
      setCatalogo(catalogoResp.filter((e) => e.ativo));
      setUsuarios(
        usuariosResp.filter((u) => u.ativo).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      );
      setUsuariosFrentes(usuariosFrentesResp);
    } catch (err) {
      setErroCarga(err instanceof Error ? err.message : "Erro ao carregar o formulário");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function toggleFrente(id: number) {
    setFrenteIds((atual) => {
      if (atual.includes(id)) {
        const novas = atual.filter((x) => x !== id);
        // Desmarcar a frente tem que levar os escopos dela junto — senão o
        // formulário envia um escopo de uma frente que o projeto não tem
        // mais, e o backend recusa com uma mensagem confusa.
        setEscopos((lista) => lista.filter((e) => novas.includes(e.frente_id)));
        return novas;
      }
      if (atual.length >= MAX_FRENTES) return atual;
      return [...atual, id];
    });
  }

  function handleArquivoProposta(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0] ?? null;
    if (arquivo && arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")) {
      setErroAnexo("O anexo da proposta precisa ser um PDF.");
      setAnexoProposta(null);
      e.target.value = "";
      return;
    }
    setErroAnexo("");
    setAnexoProposta(arquivo);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (frenteIds.length === 0) {
      setErro("Escolha pelo menos uma frente.");
      return;
    }
    const erroEscopos = validarEscopos(escopos);
    if (erroEscopos) {
      setErro(erroEscopos);
      return;
    }
    const erroEquipe = validarEquipe(equipe);
    if (erroEquipe) {
      setErro(erroEquipe);
      return;
    }

    setSalvando(true);
    setErro("");
    // Local, não o state: o state só reflete no próximo render, e o catch
    // logo abaixo precisa saber JÁ nesta chamada se a criação passou.
    let projetoId = projetoCriadoId;
    try {
      // Se o projeto já foi criado numa tentativa anterior (e só o upload do
      // anexo falhou), não cria de novo — só reenvia o anexo.
      if (!projetoId) {
        const projeto = await createProjeto(
          {
            nome: nome.trim(),
            cliente: cliente.trim() || null,
            descricao: descricao.trim() || null,
            link_proposta: modoProposta === "link" ? linkProposta.trim() || null : null,
            frente_ids: frenteIds,
            dias_ambientacao: Number(diasAmbientacao) || 5,
            equipe: montarEquipePayload(equipe),
            dia_reuniao_padrao: diaReuniao ? Number(diaReuniao) : null,
            escopos: montarEscoposPayload(escopos),
          },
          token,
        );
        projetoId = projeto.id;
        setProjetoCriadoId(projeto.id);
      }

      if (modoProposta === "anexo" && anexoProposta) {
        await uploadAnexoProposta(projetoId, anexoProposta, token);
      }

      navigate(`/projetos/${projetoId}`, { replace: true });
    } catch (err) {
      setErro(
        projetoId
          ? `O projeto foi criado, mas o anexo da proposta falhou: ${err instanceof Error ? err.message : "erro desconhecido"}. Tente enviar de novo.`
          : err instanceof Error
            ? err.message
            : "Erro ao criar o projeto",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (erroCarga) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível abrir o formulário: {erroCarga}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <VoltarLink to="/projetos">
            <ArrowLeft size={14} />
            Voltar para projetos
          </VoltarLink>
          <PageHeading>Criar projeto</PageHeading>
        </PageHeaderText>
      </PageHeaderRow>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Dados do projeto</PageCardTitle>
        </PageCardHeader>
        <FormStack onSubmit={handleSubmit}>
          <PageCardContent>
            <FormFields>
              <FieldGroup>
                <FieldLabel htmlFor="projeto-nome">
                  Nome do projeto<Required>*</Required>
                </FieldLabel>
                <FieldInput
                  id="projeto-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Projeto Alfa"
                  required
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="projeto-cliente">Cliente</FieldLabel>
                <FieldInput
                  id="projeto-cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Padaria do Zé"
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>
                  Frente(s)<Required>*</Required>
                </FieldLabel>
                <CheckboxGrid>
                  {frentes.length === 0 && <EmptyText>Nenhuma frente cadastrada.</EmptyText>}
                  {frentes.map((frente) => {
                    const marcada = frenteIds.includes(frente.id);
                    return (
                      <CheckboxLabel key={frente.id}>
                        <input
                          type="checkbox"
                          checked={marcada}
                          disabled={!marcada && frenteIds.length >= MAX_FRENTES}
                          onChange={() => toggleFrente(frente.id)}
                        />
                        {frente.nome}
                      </CheckboxLabel>
                    );
                  })}
                </CheckboxGrid>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>
                  Escopos vendidos<Required>*</Required>
                </FieldLabel>
                <EscopoPicker
                  catalogo={catalogo}
                  frentes={frentes}
                  frentesMarcadas={frenteIds}
                  valor={escopos}
                  onChange={setEscopos}
                  desabilitado={salvando}
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="projeto-ambientacao">
                  Dias de ambientação (dias úteis)<Required>*</Required>
                </FieldLabel>
                <FieldInput
                  id="projeto-ambientacao"
                  type="number"
                  min={0}
                  max={60}
                  value={diasAmbientacao}
                  onChange={(e) => setDiasAmbientacao(e.target.value)}
                  required
                />
              </FieldGroup>

              <MemberPicker
                usuarios={usuarios}
                valor={equipe}
                onChange={setEquipe}
                desabilitado={salvando}
                usuariosFrentes={usuariosFrentes}
                frentes={frentes}
                frenteIdsProjeto={frenteIds}
              />

              {/* Logo abaixo da escolha: serve para rever o time ANTES de
                  fechar, não para descobrir o problema depois. */}
              <CompatibilidadeHorarios
                consultorIds={equipe.consultorIds}
                usuarios={usuarios}
              />

              <FieldGroup>
                <FieldLabel htmlFor="projeto-dia-reuniao">Dia padrão da reunião semanal</FieldLabel>
                <FieldSelect
                  id="projeto-dia-reuniao"
                  value={diaReuniao}
                  onChange={(e) => setDiaReuniao(e.target.value)}
                >
                  <option value="">Sem dia definido</option>
                  {DIAS_REUNIAO.map((dia) => (
                    <option key={dia.valor} value={dia.valor}>
                      {dia.rotulo}
                    </option>
                  ))}
                </FieldSelect>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Proposta</FieldLabel>
                <ModoPropostaRow>
                  <PageButtonSm
                    type="button"
                    $variant={modoProposta === "link" ? "primary" : "outline"}
                    onClick={() => {
                      setModoProposta("link");
                      setAnexoProposta(null);
                      setErroAnexo("");
                    }}
                  >
                    Link
                  </PageButtonSm>
                  <PageButtonSm
                    type="button"
                    $variant={modoProposta === "anexo" ? "primary" : "outline"}
                    onClick={() => {
                      setModoProposta("anexo");
                      setLinkProposta("");
                    }}
                  >
                    Anexar PDF
                  </PageButtonSm>
                </ModoPropostaRow>

                {modoProposta === "link" ? (
                  <FieldInput
                    id="projeto-proposta"
                    type="url"
                    value={linkProposta}
                    onChange={(e) => setLinkProposta(e.target.value)}
                    placeholder="https://…"
                  />
                ) : (
                  <>
                    <FieldInput
                      id="projeto-proposta-anexo"
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleArquivoProposta}
                    />
                    {erroAnexo && <FormErrorText>{erroAnexo}</FormErrorText>}
                  </>
                )}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="projeto-descricao">Descrição</FieldLabel>
                <FieldTextarea
                  id="projeto-descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="O que o cliente contratou, em uma linha ou duas."
                />
              </FieldGroup>

              {erro && <FormErrorText>{erro}</FormErrorText>}
            </FormFields>
          </PageCardContent>

          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={() => navigate("/projetos")}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Criando…" : "Criar projeto"}
            </PageButton>
          </ModalFooter>
        </FormStack>
      </PageCard>
    </PageStack>
  );
}
