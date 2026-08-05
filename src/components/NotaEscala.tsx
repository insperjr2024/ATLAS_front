import type { ReactNode } from "react";
import {
  NotaBotao,
  NotaBotoesRow,
  NotaItem,
  NotaLabel,
  NotaLista,
  NotaSecao,
  NotaTitulo,
} from "./NotaEscala.styled";

/** Escala fechada: 1 a 5, inteiros, sem nota parcial. */
export const NOTA_VALORES = [1, 2, 3, 4, 5] as const;

interface NotaEscalaProps {
  id?: string;
  label: string;
  value: number | null;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export function NotaEscala({ id, label, value, onChange, disabled }: NotaEscalaProps) {
  const labelId = id ? `${id}-label` : undefined;
  return (
    <NotaItem>
      <NotaLabel id={labelId}>{label}</NotaLabel>
      <NotaBotoesRow role="radiogroup" aria-labelledby={labelId}>
        {NOTA_VALORES.map((n) => (
          <NotaBotao
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            $selecionado={value === n}
            disabled={disabled}
            onClick={() => onChange?.(n)}
          >
            {n}
          </NotaBotao>
        ))}
      </NotaBotoesRow>
    </NotaItem>
  );
}

interface NotaEscalaGrupoProps {
  titulo?: string;
  children: ReactNode;
}

export function NotaEscalaGrupo({ titulo = "Avalie os seguintes critérios (1 a 5):", children }: NotaEscalaGrupoProps) {
  return (
    <NotaSecao>
      <NotaTitulo>{titulo}</NotaTitulo>
      <NotaLista>{children}</NotaLista>
    </NotaSecao>
  );
}
