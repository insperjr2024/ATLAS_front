import { ThumbsDown, ThumbsUp } from "lucide-react";
import { VotoAjuda, VotoBotao, VotoBotoesRow, VotoSecao, VotoTitulo } from "./VotoBanca.styled";

interface VotoBancaProps {
  value: boolean | null;
  onChange: (voto: boolean) => void;
  disabled?: boolean;
}

/**
 * ⭐ O voto que decide a banca (§8).
 *
 * Separado da NOTA de propósito, e a distinção não é cosmética: a nota (1 a 5)
 * mede QUÃO BEM o trabalho foi feito; o voto responde outra pergunta, binária —
 * este trabalho pode ir ao cliente? Dá para ir bem na nota e reprovar por um
 * problema pontual, e por isso a média das notas não serve de veredito.
 *
 * O resultado sai da MAIORIA dos votos de quem esteve na banca. Ninguém decide
 * sozinho, e o texto de ajuda diz isso — sem ele, quem vota "não aprovo" fica
 * com a impressão de estar reprovando o projeto por conta própria.
 */
export function VotoBanca({ value, onChange, disabled }: VotoBancaProps) {
  return (
    <VotoSecao>
      <VotoTitulo id="voto-banca-label">Este escopo está aprovado para ir ao cliente?</VotoTitulo>
      <VotoAjuda>
        O resultado da banca sai da maioria dos votos de quem participou. Uma banca não aprovada
        trava a entrega ao cliente até que uma nova banca seja marcada.
      </VotoAjuda>
      <VotoBotoesRow role="radiogroup" aria-labelledby="voto-banca-label">
        <VotoBotao
          type="button"
          role="radio"
          aria-checked={value === true}
          $selecionado={value === true}
          $tom="aprova"
          disabled={disabled}
          onClick={() => onChange(true)}
        >
          <ThumbsUp size={16} /> Aprovo
        </VotoBotao>
        <VotoBotao
          type="button"
          role="radio"
          aria-checked={value === false}
          $selecionado={value === false}
          $tom="reprova"
          disabled={disabled}
          onClick={() => onChange(false)}
        >
          <ThumbsDown size={16} /> Não aprovo
        </VotoBotao>
      </VotoBotoesRow>
    </VotoSecao>
  );
}
