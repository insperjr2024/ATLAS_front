import type { ReactNode } from "react";
import {
  NotaRangeInput,
  NotaScaleLabels,
  NotaSliderHeading,
  NotaSliderItem,
  NotaSliderLabel,
  NotaSliderList,
  NotaSliderRow,
  NotaSliderSection,
  NotaSliderValue,
} from "./NotaSlider.styled";

export const NOTA_MIN = 0;
export const NOTA_MAX = 5;
export const NOTA_STEP = 0.5;

export function formatNotaValor(nota: number): string {
  return nota.toFixed(1);
}

function fillPercent(nota: number): number {
  return (nota / NOTA_MAX) * 100;
}

interface NotaSliderProps {
  id?: string;
  label: string;
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
}

export function NotaSlider({ id, label, value, onChange, disabled, showValue = true }: NotaSliderProps) {
  return (
    <NotaSliderItem>
      <NotaSliderLabel htmlFor={id}>{label}</NotaSliderLabel>
      <NotaSliderRow>
        <NotaRangeInput
          id={id}
          type="range"
          min={NOTA_MIN}
          max={NOTA_MAX}
          step={NOTA_STEP}
          value={value}
          disabled={disabled}
          $fillPercent={fillPercent(value)}
          onChange={(e) => onChange?.(Number(e.target.value))}
          aria-valuemin={NOTA_MIN}
          aria-valuemax={NOTA_MAX}
          aria-valuenow={value}
          aria-label={label}
        />
        {showValue && <NotaSliderValue>{formatNotaValor(value)}</NotaSliderValue>}
      </NotaSliderRow>
    </NotaSliderItem>
  );
}

interface NotaSliderGroupProps {
  titulo?: string;
  children: ReactNode;
}

export function NotaSliderGroup({ titulo = "Avalie os seguintes critérios:", children }: NotaSliderGroupProps) {
  return (
    <NotaSliderSection>
      <NotaSliderHeading>{titulo}</NotaSliderHeading>
      <NotaScaleLabels aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </NotaScaleLabels>
      <NotaSliderList>{children}</NotaSliderList>
    </NotaSliderSection>
  );
}
