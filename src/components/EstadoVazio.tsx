import type { ReactNode } from "react";
import { Caixa, Motivo, Titulo } from "./EstadoVazio.styled";

/**
 * Por que a lista está vazia. São três causas, e cada uma pede uma reação
 * diferente de quem está olhando:
 *
 * - `vazio` — ainda não existe nada. A pessoa (ou outra) precisa **criar**.
 * - `filtro` — existe, mas o recorte atual escondeu. A pessoa precisa
 *   **afrouxar o filtro**.
 * - `acesso` — existe, mas não é dela. A pessoa precisa **falar com alguém**.
 *
 * ⚠ Sem essa distinção, as três viram "Nenhum X" e a pessoa não sabe se
 * espera, se mexe no filtro, ou se pede acesso — e o caso mais frustrante é o
 * do filtro, porque a informação está ali, a um clique de distância, e a tela
 * afirma que não existe.
 */
export type CausaDoVazio = "vazio" | "filtro" | "acesso";

interface Props {
  causa: CausaDoVazio;
  /** A frase curta: o que não há. Ex.: "Nenhum projeto atrasado". */
  titulo: string;
  /**
   * Por que está assim e o que fazer — uma frase.
   *
   * Obrigatório de propósito: é ele que separa "não existe" de "seu filtro
   * escondeu", e é a única parte que faz a pessoa parar de perguntar.
   */
  motivo: ReactNode;
}

/**
 * A tela vazia que diz **por que** está vazia.
 *
 * 📐 Não é um erro e não usa cor de erro. Lista vazia costuma ser o estado
 * normal — um núcleo sem atraso nenhum é sucesso, não defeito, e pintar isso
 * de vermelho ensinaria a ignorar o vermelho que importa.
 */
export function EstadoVazio({ causa, titulo, motivo }: Props) {
  return (
    <Caixa role="status" $causa={causa}>
      <Titulo>{titulo}</Titulo>
      <Motivo>{motivo}</Motivo>
    </Caixa>
  );
}
