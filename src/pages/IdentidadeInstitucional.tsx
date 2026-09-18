import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { atualizarIdentidadeInstitucional, getIdentidadeInstitucional } from "@/lib/contratos";
import type { IdentidadeInstitucional as IdentidadeInstitucionalType } from "@/types/contratos";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageLoadingBlock,
  ErrorText,
} from "@/styles/page.styled";
import { FieldGroup, FieldLabel, FieldInput } from "./Bancas.styled";
import { FormGrid, FormSecoes, FormSecaoTitulo } from "./projetos/ProjetoContratos.styled";

const CAMPOS_PRESIDENTE: { campo: keyof IdentidadeInstitucionalType; label: string }[] = [
  { campo: "presidente_nome", label: "Nome" },
  { campo: "presidente_cpf", label: "CPF" },
  { campo: "presidente_rg", label: "RG" },
  { campo: "presidente_orgao_emissor", label: "Órgão emissor" },
  { campo: "presidente_estado_civil", label: "Estado civil" },
  { campo: "presidente_nacionalidade", label: "Nacionalidade" },
  { campo: "presidente_profissao", label: "Profissão" },
  { campo: "presidente_endereco", label: "Endereço" },
];

function camposTestemunha(n: 1 | 2): { campo: keyof IdentidadeInstitucionalType; label: string }[] {
  return [
    { campo: `testemunha${n}_nome` as const, label: "Nome" },
    { campo: `testemunha${n}_cpf` as const, label: "CPF" },
  ];
}

/**
 * ⭐ 2026-09-18 — presidente + as duas testemunhas fixas da Insper Jr,
 * usadas em todo documento jurídico gerado (`render_template.py`). Muda a
 * cada troca de gestão. Gate: `eh_diretoria_de_projetos` (`RequirePosicao`
 * no `App.tsx`) — o equivalente mais próximo do "admin" do sistema antigo.
 */
export function IdentidadeInstitucional() {
  const { token } = useAuth();
  const [identidade, setIdentidade] = useState<IdentidadeInstitucionalType | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!token) return;
    getIdentidadeInstitucional(token)
      .then(setIdentidade)
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setCarregando(false));
  }, [token]);

  function set(campo: keyof IdentidadeInstitucionalType, valor: string) {
    setIdentidade((atual) => (atual ? { ...atual, [campo]: valor } : atual));
    setSalvo(false);
  }

  async function handleSalvar() {
    if (!identidade || !token) return;
    setSalvando(true);
    setErro("");
    try {
      const atualizado = await atualizarIdentidadeInstitucional(identidade, token);
      setIdentidade(atualizado);
      setSalvo(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <PageLoadingBlock />;
  if (!identidade) return <ErrorText>{erro || "Identidade institucional não configurada."}</ErrorText>;

  return (
    <PageStack>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Identidade Institucional</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <p style={{ marginTop: 0, fontSize: "0.85rem", color: "var(--muted-foreground, inherit)" }}>
            Quem assina pela Insper Jr e as duas testemunhas fixas impressas em todo documento jurídico
            gerado. Atualize a cada troca de gestão.
          </p>

          {erro && <ErrorText>{erro}</ErrorText>}

          <FormSecoes>
            <div>
              <FormSecaoTitulo>Presidente</FormSecaoTitulo>
              <FormGrid $colunas={2}>
                {CAMPOS_PRESIDENTE.map(({ campo, label }) => (
                  <FieldGroup key={campo}>
                    <FieldLabel htmlFor={campo}>{label}</FieldLabel>
                    <FieldInput
                      id={campo}
                      value={identidade[campo] ?? ""}
                      onChange={(e) => set(campo, e.target.value)}
                    />
                  </FieldGroup>
                ))}
              </FormGrid>
            </div>

            <div>
              <FormSecaoTitulo>Testemunha 1 (Insper Jr, sempre impressa)</FormSecaoTitulo>
              <FormGrid $colunas={2}>
                {camposTestemunha(1).map(({ campo, label }) => (
                  <FieldGroup key={campo}>
                    <FieldLabel htmlFor={campo}>{label}</FieldLabel>
                    <FieldInput
                      id={campo}
                      value={identidade[campo] ?? ""}
                      onChange={(e) => set(campo, e.target.value)}
                    />
                  </FieldGroup>
                ))}
              </FormGrid>
            </div>

            <div>
              <FormSecaoTitulo>Testemunha 2 (padrão do contratante / 2ª da Insper Jr)</FormSecaoTitulo>
              <FormGrid $colunas={2}>
                {camposTestemunha(2).map(({ campo, label }) => (
                  <FieldGroup key={campo}>
                    <FieldLabel htmlFor={campo}>{label}</FieldLabel>
                    <FieldInput
                      id={campo}
                      value={identidade[campo] ?? ""}
                      onChange={(e) => set(campo, e.target.value)}
                    />
                  </FieldGroup>
                ))}
              </FormGrid>
            </div>
          </FormSecoes>

          <PageButton type="button" disabled={salvando} onClick={handleSalvar} style={{ marginTop: "1rem" }}>
            {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar"}
          </PageButton>
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
