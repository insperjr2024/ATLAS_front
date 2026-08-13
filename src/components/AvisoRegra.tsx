import { AlertTriangle, X } from "lucide-react";
import { AvisoBox, AvisoTexto, AvisoFechar } from "./AvisoRegra.styled";

interface Props {
  mensagem: string;
  onFechar: () => void;
}

/**
 * Erro de regra de negócio, o que a plataforma recusou, e por quê.
 *
 * Fica até a pessoa fechar. Antes era um `<p>` vermelho pequeno que a ação
 * seguinte apagava: quem não lesse na hora perdia a explicação, e mensagens
 * como "Composição incompleta (faltam 1 de Tech)" são longas demais para
 * serem lidas de relance.
 *
 * O texto é selecionável de propósito (`user-select`): quem não entende a
 * recusa costuma copiar e mandar para outra pessoa. Um aviso que some não
 * dá nem tempo disso.
 */
export function AvisoRegra({ mensagem, onFechar }: Props) {
  if (!mensagem) return null;
  return (
    <AvisoBox role="alert">
      <AlertTriangle size={16} aria-hidden />
      <AvisoTexto>{mensagem}</AvisoTexto>
      <AvisoFechar type="button" aria-label="Fechar aviso" onClick={onFechar}>
        <X size={14} />
      </AvisoFechar>
    </AvisoBox>
  );
}
