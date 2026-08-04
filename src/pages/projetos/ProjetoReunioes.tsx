import { useCallback, useEffect, useMemo, useState } from "react";
import { addWeeks, format, isToday, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chaveData, diasDaSemana } from "@/components/calendario/semanas";
import { createReuniao, deleteReuniao, getReunioes } from "@/lib/tarefas";
import { rotuloDiaSemana } from "@/lib/projetos";
import type { ReunioesResposta } from "@/types/tarefa";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButton,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  DiaMarca,
  DiaNumero,
  DiaRotulo,
  DiaSemana,
  FaixaSemana,
  NavegacaoSemana,
  SemanaRotulo,
} from "@/components/kanban/Kanban.styled";
import { FormErrorText } from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

/** §6.4 pede a semana de segunda a domingo. */
const INICIO_SEMANA = 1;

export function ProjetoReunioes() {
  const { projeto, usuarios } = useProjeto();
  const { token } = useAuth();
  const [dados, setDados] = useState<ReunioesResposta | null>(null);
  const [semana, setSemana] = useState(() => startOfWeek(new Date(), { weekStartsOn: INICIO_SEMANA }));
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      setDados(await getReunioes(projeto.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as reuniões");
    } finally {
      setCarregando(false);
    }
  }, [projeto.id, token]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  const porData = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const r of dados?.reunioes ?? []) mapa.set(r.data_reuniao.slice(0, 10), r.id);
    return mapa;
  }, [dados]);

  async function alternar(chave: string) {
    if (!token) return;
    setAviso("");
    const existente = porData.get(chave);
    try {
      if (existente) await deleteReuniao(existente, token);
      else await createReuniao(projeto.id, chave, token);
      await carregar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao registrar a reunião");
    }
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>Não foi possível carregar as reuniões: {erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => carregar()}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando || !dados) return <PageLoadingBlock />;

  const dias = diasDaSemana(semana, INICIO_SEMANA);
  const temNestaSemana = dias.some((d) => porData.has(chaveData(d)));
  const historico = [...(dados.reunioes ?? [])].slice(0, 8);

  return (
    <PageStack>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Reunião semanal</PageCardTitle>
          <PageBadge $tone={temNestaSemana ? "success" : "warning"}>
            {temNestaSemana ? "registrada nesta semana" : "sem reunião nesta semana"}
          </PageBadge>
        </PageCardHeader>
        <PageCardContent>
          <NavegacaoSemana>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => setSemana((s) => addWeeks(s, -1))}
            >
              <ChevronLeft size={14} />
              Semana anterior
            </PageButtonSm>
            <SemanaRotulo>
              {format(dias[0], "dd 'de' MMM", { locale: ptBR })} –{" "}
              {format(dias[6], "dd 'de' MMM", { locale: ptBR })}
            </SemanaRotulo>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => setSemana((s) => addWeeks(s, 1))}
            >
              Próxima semana
              <ChevronRight size={14} />
            </PageButtonSm>
          </NavegacaoSemana>

          <FaixaSemana>
            {dias.map((dia, indice) => {
              const chave = chaveData(dia);
              const registrado = porData.has(chave);
              // O dia padrão do projeto fica destacado mesmo vazio — é a
              // sugestão do §6.4, não uma obrigação.
              const ehPadrao = projeto.dia_reuniao_padrao === indice + 1;
              return (
                <DiaSemana
                  key={chave}
                  type="button"
                  $registrado={registrado}
                  $padrao={ehPadrao}
                  title={
                    registrado
                      ? "Clique para desfazer o registro"
                      : ehPadrao
                        ? "Dia padrão sugerido — clique para registrar"
                        : "Clique para registrar a reunião neste dia"
                  }
                  onClick={() => alternar(chave)}
                >
                  <DiaRotulo>{format(dia, "EEEEEE", { locale: ptBR })}</DiaRotulo>
                  <DiaNumero $hoje={isToday(dia)}>{format(dia, "d")}</DiaNumero>
                  <DiaMarca>{registrado ? <Check size={12} /> : ehPadrao ? "·" : ""}</DiaMarca>
                </DiaSemana>
              );
            })}
          </FaixaSemana>

          {aviso && <FormErrorText>{aviso}</FormErrorText>}

          <EmptyText style={{ marginTop: "1rem" }}>
            Dia padrão do projeto: <strong>{rotuloDiaSemana(projeto.dia_reuniao_padrao)}</strong>. A
            reunião pode ser movida e pode haver mais de uma na mesma semana — cada dia marcado é um
            registro.
          </EmptyText>
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Últimas reuniões</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {historico.length === 0 ? (
            <EmptyText>Nenhuma reunião registrada ainda.</EmptyText>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {historico.map((r) => (
                <li key={r.id} style={{ fontSize: "0.875rem", lineHeight: 1.9 }}>
                  {format(new Date(`${r.data_reuniao.slice(0, 10)}T12:00:00`), "EEEE, dd/MM/yyyy", {
                    locale: ptBR,
                  })}{" "}
                  — registrada por{" "}
                  {usuarios.find((u) => u.id === r.registrado_por)?.nome ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
