import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCompatibilidade, getFaixasDisponiveis } from "@/lib/grade-horaria";
import { chaveFaixa } from "@/lib/grade-horaria";
import type { Compatibilidade, FaixaDisponivel } from "@/types/grade";
import { DIAS_GRADE } from "@/types/grade";
import type { UsuarioResumo } from "@/types/auth";
import {
  Bloco,
  Topo,
  Titulo,
  Selo,
  Texto,
  Aviso,
  MiniQuadro,
  MiniCabecalho,
  MiniHora,
  MiniCelula,
  type Teor,
} from "./CompatibilidadeHorarios.styled";

const ROTULO_TEOR: Record<Teor, string> = {
  alta: "Compatibilidade alta",
  boa: "Compatibilidade boa",
  media: "Compatibilidade média",
  baixa: "Compatibilidade baixa",
  nenhuma: "Sem horário em comum",
  desconhecida: "Sem dados",
};

interface Props {
  /** Os consultores escolhidos. O coordenador não entra, a comparação é
   *  entre quem foi marcado como consultor. */
  consultorIds: number[];
  usuarios: UsuarioResumo[];
}

/**
 * Quanto os consultores escolhidos conseguem se encontrar.
 *
 * Verde = todos livres naquela faixa. É a janela onde a reunião semanal
 * cabe, por isso o quadro mostra o cruzamento, e não a grade de cada
 * um: quem monta equipe não precisa saber a que horas cada pessoa tem aula.
 */
export function CompatibilidadeHorarios({ consultorIds, usuarios }: Props) {
  const { token } = useAuth();
  const [faixas, setFaixas] = useState<FaixaDisponivel[]>([]);
  // Guardado junto da chave que o produziu: assim trocar de consultor já
  // invalida o resultado antigo sem precisar de setState no corpo do efeito.
  const [resultado, setResultado] = useState<{
    chave: string;
    dados: Compatibilidade;
  } | null>(null);

  // Ordenado e em texto: o efeito não pode redisparar só porque o array mudou
  // de identidade, ou clicar em qualquer campo do formulário refaria a busca.
  const chaveIds = [...consultorIds].sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    getFaixasDisponiveis(token)
      .then((r) => {
        if (ativo) setFaixas(r);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || chaveIds === "") return;
    let ativo = true;
    getCompatibilidade(chaveIds.split(",").map(Number), token)
      .then((r) => {
        if (ativo) setResultado({ chave: chaveIds, dados: r });
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [token, chaveIds]);

  if (consultorIds.length < 2) return null;

  const dados = resultado?.chave === chaveIds ? resultado.dados : null;
  if (!dados) {
    return (
      <Bloco>
        <Texto>Comparando horários…</Texto>
      </Bloco>
    );
  }

  const livres = new Set(
    dados.livres_em_comum.map((f) => chaveFaixa(f.dia_semana, f.hora_inicio)),
  );
  const teor = dados.teor as Teor;
  const nomesSemGrade = dados.sem_grade
    .map((id) => usuarios.find((u) => u.id === id)?.nome)
    .filter((n): n is string => !!n);

  return (
    <Bloco>
      <Topo>
        <Titulo>Horários livres em comum</Titulo>
        <Selo $teor={teor}>
          {ROTULO_TEOR[teor]}
          {teor !== "desconhecida" && ` · ${dados.total_livres}`}
        </Selo>
      </Topo>

      <Texto>{dados.teor_texto}</Texto>

      {teor !== "desconhecida" && (
        <MiniQuadro>
          <thead>
            <tr>
              <MiniHora as="th" />
              {DIAS_GRADE.map((dia) => (
                <MiniCabecalho key={dia} scope="col">
                  {dia.slice(0, 3)}
                </MiniCabecalho>
              ))}
            </tr>
          </thead>
          <tbody>
            {faixas.map((faixa) => (
              <tr key={faixa.hora_inicio}>
                <MiniHora>{faixa.hora_inicio}</MiniHora>
                {DIAS_GRADE.map((dia, indice) => {
                  const livre = livres.has(chaveFaixa(indice, faixa.hora_inicio));
                  return (
                    <MiniCelula
                      key={dia}
                      $livre={livre}
                      title={`${dia}, ${faixa.hora_inicio}, ${
                        livre ? "todos livres" : "alguém tem aula"
                      }`}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </MiniQuadro>
      )}

      {/* Ninguém preencheu nenhuma: o `teor_texto` acima já cobre esse caso.
          Só entra aqui quando é ALGUÉM, não todo mundo, é a parte que o
          texto genérico não sabe dizer: quem exatamente. */}
      {nomesSemGrade.length > 0 && nomesSemGrade.length < dados.considerados.length && (
        <Aviso>
          {`${nomesSemGrade.join(", ")} ainda não preencheu a grade, ${
            nomesSemGrade.length === 1 ? "entrou" : "entraram"
          } na conta como livre em todos os horários.`}
        </Aviso>
      )}
    </Bloco>
  );
}
