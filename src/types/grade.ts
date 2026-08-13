/** Uma faixa de horário da grade, sempre uma das 6 do Insper. */
export interface FaixaGrade {
  /** 0 = segunda … 4 = sexta. Sábado e domingo não existem na grade. */
  dia_semana: number;
  /** "HH:MM", o backend serializa assim, não em ISO. */
  hora_inicio: string;
  hora_fim: string;
}

/** As faixas disponíveis, como o backend as define. */
export interface FaixaDisponivel {
  hora_inicio: string;
  hora_fim: string;
}

export interface MinhaGrade {
  semestre_id: number;
  /** Só o que está OCUPADO por aula. Livre é ausência na lista. */
  faixas: FaixaGrade[];
}

export const DIAS_GRADE = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

/** O cruzamento das grades de várias pessoas. */
export interface Compatibilidade {
  semestre_id: number;
  /** As faixas em que TODOS os comparados estão livres. */
  livres_em_comum: FaixaGrade[];
  total_livres: number;
  /** O teto realista contra o qual o percentual é medido (20, não 30). */
  teto: number;
  percentual: number;
  /** "desconhecida" quando ninguém preencheu a grade, aí não há o que medir. */
  teor: "alta" | "boa" | "media" | "baixa" | "nenhuma" | "desconhecida";
  teor_texto: string;
  /** Quem entrou na conta como livre por não ter grade preenchida. */
  sem_grade: number[];
  considerados: number[];
}
