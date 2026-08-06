import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { SelectOption, SelectPanel, SelectTrigger, SelectVazio, SelectWrap } from "./SelectCustom.styled";

interface OptionInfo {
  value: string;
  label: ReactNode;
  disabled: boolean;
}

interface Props {
  id?: string;
  value: string | number;
  onChange: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  /** Aceito por compatibilidade com o `<select>` nativo que este componente
   *  substitui — sem elemento de formulário real por trás, a validação
   *  HTML5 nunca dispara sozinha; quem chama já valida manualmente. */
  required?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
  "aria-label"?: string;
}

/**
 * Drop-in pro `<select>` nativo do navegador — mesma API (`value`,
 * `onChange`, filhos `<option>`), painel próprio no estilo do app. Ninguém
 * precisa trocar import: é a implementação por trás de `FieldSelect`,
 * reexportado em `Bancas.styled.ts`, usado em todo o app.
 */
export function SelectCustom({
  id,
  value,
  onChange,
  disabled,
  children,
  className,
  style,
  autoFocus,
  "aria-label": ariaLabel,
}: Props) {
  const valorTexto = String(value);
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  // Recalcula sempre que abre e a cada scroll/resize — o painel vive fora da
  // árvore do gatilho (portal), então não segue o layout sozinho.
  useLayoutEffect(() => {
    if (!aberto) return;
    function posicionar() {
      const retangulo = ref.current?.getBoundingClientRect();
      if (!retangulo) return;
      setPosicao({ top: retangulo.bottom + 4, left: retangulo.left, width: retangulo.width });
    }
    posicionar();
    window.addEventListener("scroll", posicionar, true);
    window.addEventListener("resize", posicionar);
    return () => {
      window.removeEventListener("scroll", posicionar, true);
      window.removeEventListener("resize", posicionar);
    };
  }, [aberto]);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (ref.current?.contains(alvo) || painelRef.current?.contains(alvo)) return;
      setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const opcoes: OptionInfo[] = Children.toArray(children)
    .filter((child): child is ReactElement<any> => isValidElement(child))
    .map((child) => ({
      value: child.props.value !== undefined ? String(child.props.value) : "",
      label: child.props.children,
      disabled: !!child.props.disabled,
    }));

  const atual = opcoes.find((o) => o.value === valorTexto);

  function selecionar(opcao: OptionInfo) {
    if (opcao.disabled) return;
    onChange({ target: { value: opcao.value } });
    setAberto(false);
  }

  return (
    <SelectWrap ref={ref} className={className} style={style}>
      <SelectTrigger
        id={id}
        type="button"
        disabled={disabled}
        autoFocus={autoFocus}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setAberto((v) => !v)}
      >
        <span>{atual?.label ?? valorTexto}</span>
        <ChevronDown size={16} />
      </SelectTrigger>
      {aberto &&
        posicao &&
        createPortal(
          <SelectPanel
            ref={painelRef}
            role="listbox"
            style={{ top: posicao.top, left: posicao.left, width: posicao.width }}
          >
            {opcoes.length === 0 ? (
              <SelectVazio>Nenhuma opção disponível</SelectVazio>
            ) : (
              opcoes.map((opcao, indice) => (
                <SelectOption
                  key={`${opcao.value}-${indice}`}
                  type="button"
                  role="option"
                  aria-selected={opcao.value === valorTexto}
                  $selecionado={opcao.value === valorTexto}
                  disabled={opcao.disabled}
                  onClick={() => selecionar(opcao)}
                >
                  {opcao.label}
                </SelectOption>
              ))
            )}
          </SelectPanel>,
          document.body,
        )}
    </SelectWrap>
  );
}
