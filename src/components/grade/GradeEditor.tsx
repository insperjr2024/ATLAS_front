import { useMemo, useState } from "react";
import { chaveFaixa } from "@/lib/grade-horaria";
import type { FaixaDisponivel, FaixaGrade } from "@/types/grade";
import { DIAS_GRADE } from "@/types/grade";
import { PageButton, EmptyText } from "@/styles/page.styled";
import {
  QuadroWrap,
  Quadro,
  CabecalhoCelula,
  CabecalhoHora,
  CelulaHora,
  CelulaDia,
  BotaoCelula,
  Rodape,
  Resumo,
  Acoes,
} from "./GradeEditor.styled";

interface Props {
  faixasDisponiveis: FaixaDisponivel[];
  /** O que está gravado hoje, é a partir daqui que se sabe o que mudou. */
  salvas: FaixaGrade[];
  onSalvar: (faixas: FaixaGrade[]) => Promise<void>;
}

/**
 * O quadro da grade de aulas.
 *
 * Marca ocupado, e só. Não guarda nome de matéria: o que a plataforma
 * precisa saber é quando a pessoa NÃO pode ser escalada, e nome de disciplina
 * não muda essa resposta, só daria trabalho de digitar em 10 células.
 *
 * O estado vive aqui e é comparado com `salvas` para saber se há mudança
 * pendente. Gravar é explícito: clique errado no quadro não vira escrita no
 * banco.
 */
export function GradeEditor({ faixasDisponiveis, salvas, onSalvar }: Props) {
  const [marcadas, setMarcadas] = useState<Set<string>>(
    () => new Set(salvas.map((f) => chaveFaixa(f.dia_semana, f.hora_inicio))),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const gravadas = useMemo(
    () => new Set(salvas.map((f) => chaveFaixa(f.dia_semana, f.hora_inicio))),
    [salvas],
  );

  // Mudou = conjuntos diferentes. Comparar tamanho e pertencimento evita
  // depender da ordem, que o backend devolve ordenada e o clique não.
  const mudou =
    marcadas.size !== gravadas.size || [...marcadas].some((k) => !gravadas.has(k));

  function alternar(dia: number, horaInicio: string) {
    const chave = chaveFaixa(dia, horaInicio);
    setMarcadas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(chave)) proximo.delete(chave);
      else proximo.add(chave);
      return proximo;
    });
  }

  async function salvar() {
    setErro("");
    setSalvando(true);
    try {
      const faixas: FaixaGrade[] = [];
      for (let dia = 0; dia < DIAS_GRADE.length; dia += 1) {
        for (const faixa of faixasDisponiveis) {
          if (marcadas.has(chaveFaixa(dia, faixa.hora_inicio))) {
            faixas.push({
              dia_semana: dia,
              hora_inicio: faixa.hora_inicio,
              hora_fim: faixa.hora_fim,
            });
          }
        }
      }
      await onSalvar(faixas);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar a grade");
    } finally {
      setSalvando(false);
    }
  }

  if (faixasDisponiveis.length === 0) {
    return <EmptyText>Não foi possível carregar as faixas de horário.</EmptyText>;
  }

  return (
    <>
      <QuadroWrap>
        <Quadro>
          <thead>
            <tr>
              <CabecalhoHora scope="col">Horário Início</CabecalhoHora>
              <CabecalhoHora scope="col">Horário Término</CabecalhoHora>
              {DIAS_GRADE.map((dia) => (
                <CabecalhoCelula key={dia} scope="col">
                  {dia}
                </CabecalhoCelula>
              ))}
            </tr>
          </thead>
          <tbody>
            {faixasDisponiveis.map((faixa) => (
              <tr key={faixa.hora_inicio}>
                <CelulaHora>{faixa.hora_inicio}</CelulaHora>
                <CelulaHora>{faixa.hora_fim}</CelulaHora>
                {DIAS_GRADE.map((dia, indice) => {
                  const marcada = marcadas.has(chaveFaixa(indice, faixa.hora_inicio));
                  return (
                    <CelulaDia key={dia}>
                      <BotaoCelula
                        type="button"
                        $marcada={marcada}
                        aria-pressed={marcada}
                        aria-label={`${dia}, ${faixa.hora_inicio} às ${faixa.hora_fim}${
                          marcada ? ", com aula" : ", livre"
                        }`}
                        onClick={() => alternar(indice, faixa.hora_inicio)}
                      />
                    </CelulaDia>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Quadro>
      </QuadroWrap>

      <Rodape>
        <Resumo>
          {marcadas.size === 0
            ? "Nenhum horário marcado. Clique nos blocos em que você tem aula."
            : `${marcadas.size} ${marcadas.size === 1 ? "horário" : "horários"} com aula.`}
          {erro && ` · ${erro}`}
        </Resumo>
        <Acoes>
          {marcadas.size > 0 && (
            <PageButton
              type="button"
              $variant="outline"
              disabled={salvando}
              onClick={() => setMarcadas(new Set())}
            >
              Limpar
            </PageButton>
          )}
          <PageButton type="button" disabled={salvando || !mudou} onClick={salvar}>
            {salvando ? "Salvando…" : mudou ? "Salvar grade" : "Grade salva"}
          </PageButton>
        </Acoes>
      </Rodape>
    </>
  );
}
