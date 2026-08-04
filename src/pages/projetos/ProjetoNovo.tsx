import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { createProjeto } from "@/lib/projetos";
import { getUsuarios } from "@/lib/usuarios";
import {
  MemberPicker,
  montarEquipePayload,
  validarEquipe,
  type EquipeSelecionada,
} from "@/components/membros/MemberPicker";
import type { UsuarioResumo } from "@/types/auth";
import type { Frente } from "@/types/banca";
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
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  FormStack,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FieldTextarea,
  FieldSelect,
  CheckboxGrid,
  CheckboxLabel,
  FormErrorText,
  FormFields,
  ModalFooter,
  VoltarLink,
} from "./Projetos.styled";

const MAX_FRENTES = 2;

const DIAS_REUNIAO = [
  { valor: 1, rotulo: "Segunda-feira" },
  { valor: 2, rotulo: "Terça-feira" },
  { valor: 3, rotulo: "Quarta-feira" },
  { valor: 4, rotulo: "Quinta-feira" },
  { valor: 5, rotulo: "Sexta-feira" },
];

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
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState("");

  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [descricao, setDescricao] = useState("");
  const [linkProposta, setLinkProposta] = useState("");
  const [frenteIds, setFrenteIds] = useState<number[]>([]);
  const [diasAmbientacao, setDiasAmbientacao] = useState("5");
  const [diaReuniao, setDiaReuniao] = useState("");
  const [equipe, setEquipe] = useState<EquipeSelecionada>({ coordenadorId: null, consultorIds: [] });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setCarregando(true);
    setErroCarga("");
    try {
      const [frentesResp, usuariosResp] = await Promise.all([getFrentes(token), getUsuarios(token)]);
      setFrentes(frentesResp);
      setUsuarios(
        usuariosResp.filter((u) => u.ativo).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      );
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
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      if (atual.length >= MAX_FRENTES) return atual;
      return [...atual, id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (frenteIds.length === 0) {
      setErro("Escolha pelo menos uma frente.");
      return;
    }
    const erroEquipe = validarEquipe(equipe);
    if (erroEquipe) {
      setErro(erroEquipe);
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      const projeto = await createProjeto(
        {
          nome: nome.trim(),
          cliente: cliente.trim(),
          descricao: descricao.trim() || null,
          link_proposta: linkProposta.trim() || null,
          frente_ids: frenteIds,
          dias_ambientacao: Number(diasAmbientacao) || 5,
          equipe: montarEquipePayload(equipe),
          dia_reuniao_padrao: diaReuniao ? Number(diaReuniao) : null,
        },
        token,
      );
      navigate(`/projetos/${projeto.id}`, { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar o projeto");
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

  const sinergico = frenteIds.length === MAX_FRENTES;

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <VoltarLink to="/projetos">
            <ArrowLeft size={14} />
            Voltar para projetos
          </VoltarLink>
          <PageHeading>Criar projeto</PageHeading>
          <PageSubheading>
            O projeto nasce como <strong>Vendido</strong>. O kickoff é marcado depois, na página do
            projeto — é ele que move o status para Ambientação.
          </PageSubheading>
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
                <FieldLabel htmlFor="projeto-nome">Nome do projeto</FieldLabel>
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
                  required
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Frente(s)</FieldLabel>
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
                <PageSubheading>
                  {sinergico
                    ? "🔗 Duas frentes marcadas: o projeto é sinérgico e aparece para os dois gerentes."
                    : "Até 2 frentes. Duas marcadas = projeto sinérgico."}
                </PageSubheading>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor="projeto-ambientacao">Dias de ambientação (dias úteis)</FieldLabel>
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
                <FieldLabel htmlFor="projeto-proposta">Link da proposta</FieldLabel>
                <FieldInput
                  id="projeto-proposta"
                  type="url"
                  value={linkProposta}
                  onChange={(e) => setLinkProposta(e.target.value)}
                  placeholder="https://…"
                />
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
