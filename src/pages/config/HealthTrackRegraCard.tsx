import { useEffect, useMemo, useState, type FormEvent } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { CorSelo } from "@/components/health-track/CorSelo";
import { formatarDataHora } from "@/lib/projetos";
import { ehDiretoriaDeProjetos } from "@/utils/permissoes";
import {
  atualizarRegra,
  getHistoricoRegra,
  getRegra,
  type EditarRegra,
  type RegraStatus,
} from "@/lib/health-track";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  EmptyText,
  ErrorText,
} from "@/styles/page.styled";

const Grade = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Bloco = styled.fieldset`
  margin: 0;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  min-width: 0;

  legend {
    padding: 0 0.25rem;
  }
`;

const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  label {
    font-size: ${theme.fontSize.xs};
    font-weight: ${theme.fontWeight.medium};
    color: ${theme.colors.mutedForeground};
  }
`;

const Resumo = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  line-height: 1.5;
  color: ${theme.colors.foreground};
`;

const Rodape = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
`;

const Versoes = styled.details`
  margin-top: ${theme.spacing.lg};

  summary {
    cursor: pointer;
    width: fit-content;
    font-size: ${theme.fontSize.sm};
    color: ${theme.colors.mutedForeground};
  }

  summary:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }

  ol {
    margin: ${theme.spacing.sm} 0 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.xs};
    font-size: ${theme.fontSize.sm};
  }
`;

function paraFormulario(regra: RegraStatus): EditarRegra {
  return {
    verde_max_amarelos: regra.verde.max_amarelos,
    verde_max_vermelhos: regra.verde.max_vermelhos,
    vermelho_min_amarelos: regra.vermelho.min_amarelos,
    vermelho_min_vermelhos: regra.vermelho.min_vermelhos,
  };
}

function plural(n: number, singular: string, pluralizado: string) {
  return n === 1 ? singular : pluralizado;
}

/**
 * O que o amarelo cobre com os números do formulário, em português.
 *
 * Calculado aqui, e não lido do backend, para a diretoria ver o efeito de um
 * número ANTES de salvar (salvar cria uma versão nova da regra). A conta é a
 * de `utils/health_track_status.py`: amarelo é o que não é vermelho nem
 * verde.
 */
function descreverAmarelo(f: EditarRegra): string {
  const minAmarelos = f.verde_max_amarelos + 1;
  const maxAmarelos = f.vermelho_min_amarelos - 1;
  const minVermelhos = f.verde_max_vermelhos + 1;
  const maxVermelhos = f.vermelho_min_vermelhos - 1;

  const porAmarelos = minAmarelos <= maxAmarelos;
  const porVermelhos = minVermelhos <= maxVermelhos;

  const faixa = (min: number, max: number, singular: string, pluralizado: string) =>
    min === max ? `${min} ${plural(min, singular, pluralizado)}` : `de ${min} a ${max} ${pluralizado}`;

  if (!porAmarelos && !porVermelhos) {
    return "Com estes números, nenhum projeto fica amarelo: sai direto de verde para vermelho.";
  }
  const partes: string[] = [];
  if (porAmarelos) {
    const vermelhos =
      f.verde_max_vermelhos === 0
        ? "nenhum vermelho"
        : `até ${f.verde_max_vermelhos} ${plural(f.verde_max_vermelhos, "vermelho", "vermelhos")}`;
    partes.push(`${faixa(minAmarelos, maxAmarelos, "amarelo", "amarelos")} com ${vermelhos}`);
  }
  if (porVermelhos) {
    partes.push(
      `${faixa(minVermelhos, maxVermelhos, "vermelho", "vermelhos")} com até ${maxAmarelos} ${plural(maxAmarelos, "amarelo", "amarelos")}`,
    );
  }
  return `Tudo o que não é verde nem vermelho: ${partes.join(", ou ")}.`;
}

/**
 * A regra do status geral do Health Track (§5).
 *
 * Só a diretoria de projetos edita; o resto de quem chega a Configurações lê.
 * Amarelo não tem campos: é o intervalo entre verde e vermelho, e por isso
 * nenhuma combinação de cores fica sem status.
 *
 * Salva tudo de uma vez num botão, não campo a campo: cada salvamento é uma
 * versão nova da regra, e os ciclos já preenchidos continuam mostrando o
 * status pela versão que valia na época. Salvar no `blur` de cada campo
 * criaria versões intermediárias que ninguém decidiu.
 */
export function HealthTrackRegraCard() {
  const { token, usuario } = useAuth();
  const podeEditar = ehDiretoriaDeProjetos(usuario);
  const [regra, setRegra] = useState<RegraStatus | null>(null);
  const [versoes, setVersoes] = useState<RegraStatus[]>([]);
  const [form, setForm] = useState<EditarRegra | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  function aplicar([atual, historico]: [RegraStatus | null, RegraStatus[]]) {
    setRegra(atual);
    setVersoes(historico);
    setForm(atual ? paraFormulario(atual) : null);
    setErro("");
  }

  function falhar(err: unknown) {
    setErro(err instanceof Error ? err.message : "Erro ao carregar a regra");
  }

  // O estado só muda quando a resposta chega.
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    Promise.all([getRegra(token), getHistoricoRegra(token)])
      .then((r) => ativo && aplicar(r))
      .catch((err) => ativo && falhar(err))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [token]);

  /** Depois de salvar. */
  async function buscar() {
    if (!token) return;
    try {
      aplicar(await Promise.all([getRegra(token), getHistoricoRegra(token)]));
    } catch (err) {
      falhar(err);
    }
  }

  const alterado = useMemo(() => {
    if (!regra || !form) return false;
    const salva = paraFormulario(regra);
    return (Object.keys(salva) as (keyof EditarRegra)[]).some((k) => salva[k] !== form[k]);
  }, [regra, form]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!token || !form || !alterado) return;
    setSalvando(true);
    setSalvo(false);
    try {
      await atualizarRegra(form, token);
      setSalvo(true);
      await buscar();
    } catch (err) {
      // Mantém o que a pessoa digitou: a recusa explica o que ajustar.
      setErro(err instanceof Error ? err.message : "Erro ao salvar a regra");
    } finally {
      setSalvando(false);
    }
  }

  function campo(chave: keyof EditarRegra, rotulo: string, minimo: number) {
    const id = `ht-regra-${chave}`;
    return (
      <Campo>
        <label htmlFor={id}>{rotulo}</label>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={minimo}
          value={form?.[chave] ?? ""}
          disabled={!podeEditar || salvando}
          onChange={(e) => {
            setSalvo(false);
            setErro("");
            const valor = e.target.value === "" ? minimo : Math.max(minimo, Math.trunc(Number(e.target.value)));
            setForm((f) => (f ? { ...f, [chave]: valor } : f));
          }}
        />
      </Campo>
    );
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Health Track: status geral do projeto</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        <EmptyText>
          Como as cores dos pilares viram o status do projeto. O vermelho é checado primeiro, depois
          o verde, e o resto é amarelo.
          {!podeEditar && " Só a diretoria de projetos altera estes números."}
        </EmptyText>

        {carregando && <EmptyText>Carregando...</EmptyText>}
        {!carregando && !form && !erro && <EmptyText>Nenhuma regra cadastrada.</EmptyText>}

        {form && (
          <form onSubmit={salvar} noValidate>
            <Grade>
              <Bloco>
                <legend>
                  <CorSelo cor="vermelho" />
                </legend>
                <Resumo>Basta atingir um dos dois mínimos.</Resumo>
                {campo("vermelho_min_amarelos", "A partir de quantos amarelos", 1)}
                {campo("vermelho_min_vermelhos", "A partir de quantos vermelhos", 1)}
              </Bloco>

              <Bloco>
                <legend>
                  <CorSelo cor="verde" />
                </legend>
                <Resumo>Precisa respeitar os dois máximos.</Resumo>
                {campo("verde_max_amarelos", "No máximo quantos amarelos", 0)}
                {campo("verde_max_vermelhos", "No máximo quantos vermelhos", 0)}
              </Bloco>

              <Bloco>
                <legend>
                  <CorSelo cor="amarelo" />
                </legend>
                <Resumo aria-live="polite">{descreverAmarelo(form)}</Resumo>
              </Bloco>
            </Grade>

            <Rodape>
              <EmptyText>
                {regra &&
                  (regra.criado_por_nome
                    ? `Em vigor desde ${formatarDataHora(regra.vigente_desde)}, definida por ${regra.criado_por_nome}.`
                    : "Regra inicial da plataforma.")}
              </EmptyText>
              {podeEditar && (
                <PageButton type="submit" disabled={!alterado || salvando}>
                  {salvando ? "Salvando..." : "Salvar regra"}
                </PageButton>
              )}
            </Rodape>
            {erro && <ErrorText role="alert">{erro}</ErrorText>}
            {salvo && (
              <EmptyText role="status">
                Regra salva. Vale para as próximas avaliações; as anteriores mostram também o status
                pela regra da época.
              </EmptyText>
            )}
          </form>
        )}

        {erro && !form && <ErrorText role="alert">{erro}</ErrorText>}

        {versoes.length > 1 && (
          <Versoes>
            <summary>
              {versoes.length - 1} {plural(versoes.length - 1, "alteração anterior", "alterações anteriores")}
            </summary>
            <ol>
              {versoes.map((v) => (
                <li key={v.id}>
                  {v.criado_por_nome
                    ? `${formatarDataHora(v.vigente_desde)}, ${v.criado_por_nome}`
                    : "Regra inicial"}
                  : verde até {v.verde.max_amarelos} {plural(v.verde.max_amarelos, "amarelo", "amarelos")} e{" "}
                  {v.verde.max_vermelhos} {plural(v.verde.max_vermelhos, "vermelho", "vermelhos")}; vermelho a
                  partir de {v.vermelho.min_amarelos}{" "}
                  {plural(v.vermelho.min_amarelos, "amarelo", "amarelos")} ou {v.vermelho.min_vermelhos}{" "}
                  {plural(v.vermelho.min_vermelhos, "vermelho", "vermelhos")}.
                </li>
              ))}
            </ol>
          </Versoes>
        )}
      </PageCardContent>
    </PageCard>
  );
}
