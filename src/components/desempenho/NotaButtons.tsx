import type { ReactNode } from "react";
import {
  NotaButton,
  NotaButtonsDescricao,
  NotaButtonsHeading,
  NotaButtonsItem,
  NotaButtonsLabel,
  NotaButtonsLabelGroup,
  NotaButtonsList,
  NotaButtonsRow,
  NotaButtonsSection,
} from "./NotaButtons.styled";

// Nota de desempenho é discreta (1 a 5, de 1 em 1) e a interação real no
// protótipo era botões clicáveis lado a lado, diferente do `NotaSlider`
// (contínuo, 0-5 de 0,5 em 0,5, usado só na avaliação de banca).
const NOTAS = [1, 2, 3, 4, 5] as const;

interface NotaButtonsProps {
  id?: string;
  label: string;
  descricao?: string | null;
  value: number | null;
  onChange?: (value: number) => void;
  disabled?: boolean;
  /** Quando o critério é o único da seção e repete o título dela (comum no
   * formulário de coordenador), o rótulo vira redundante, some da tela mas
   * continua no DOM pra acessibilidade (aria-label/htmlFor). */
  esconderLabel?: boolean;
}

export function NotaButtons({ id, label, descricao, value, onChange, disabled, esconderLabel }: NotaButtonsProps) {
  return (
    <NotaButtonsItem>
      <NotaButtonsLabelGroup>
        <NotaButtonsLabel htmlFor={id} $oculto={esconderLabel}>
          {label}
        </NotaButtonsLabel>
        {descricao && <NotaButtonsDescricao>{descricao}</NotaButtonsDescricao>}
      </NotaButtonsLabelGroup>
      <NotaButtonsRow role="group" aria-label={label} id={id}>
        {NOTAS.map((n) => (
          <NotaButton
            key={n}
            type="button"
            $selected={value === n}
            aria-pressed={value === n}
            disabled={disabled}
            onClick={() => onChange?.(n)}
          >
            {n}
          </NotaButton>
        ))}
      </NotaButtonsRow>
    </NotaButtonsItem>
  );
}

interface NotaButtonsGroupProps {
  titulo?: string;
  children: ReactNode;
}

export function NotaButtonsGroup({ titulo = "Avalie os seguintes critérios:", children }: NotaButtonsGroupProps) {
  return (
    <NotaButtonsSection>
      <NotaButtonsHeading>{titulo}</NotaButtonsHeading>
      <NotaButtonsList>{children}</NotaButtonsList>
    </NotaButtonsSection>
  );
}
