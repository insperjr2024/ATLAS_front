import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { normalizarTexto } from "@/lib/nucleo";
import {
  SelectBusca,
  SelectOption,
  SelectPanel,
  SelectTrigger,
  SelectVazio,
  SelectWrap,
} from "./SelectCustom.styled";

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
   *  substitui, sem elemento de formulário real por trás, a validação
   *  HTML5 nunca dispara sozinha; quem chama já valida manualmente. */
  required?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  autoFocus?: boolean;
  "aria-label"?: string;
  /** Lista longa (pessoas, sobretudo): mostra um campo de busca no topo do
   *  painel que filtra as opções pelo texto visível. */
  pesquisavel?: boolean;
}

/**
 * Drop-in pro `<select>` nativo do navegador, mesma API (`value`,
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
  pesquisavel,
}: Props) {
  const valorTexto = String(value);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [posicao, setPosicao] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  // Recalcula sempre que abre e a cada scroll/resize, o painel vive fora da
  // árvore do gatilho (portal), então não segue o layout sozinho.
  useLayoutEffect(() => {
    if (!aberto) return;
    function posicionar() {
      const retangulo = ref.current?.getBoundingClientRect();
      if (!retangulo) return;
      // Sem isto, um gatilho perto do fim da tela abria o painel pra baixo
      // do mesmo jeito, e como ele é `position: fixed`, a parte que sobrava
      // fora da janela ficava simplesmente inalcançável (scroll da página
      // não move elemento fixo). Abre pro lado com mais espaço, e limita a
      // altura ao que cabe ali, o `overflow-y: auto` do painel faz o resto.
      const margem = 8;
      const alturaPreferida = 256; // mesmo valor do `max-height: 16rem` do CSS
      const espacoAbaixo = window.innerHeight - retangulo.bottom - margem;
      const espacoAcima = retangulo.top - margem;
      const abrePraCima = espacoAbaixo < alturaPreferida && espacoAcima > espacoAbaixo;
      const alturaDisponivel = Math.max(
        Math.min(alturaPreferida, abrePraCima ? espacoAcima : espacoAbaixo),
        80,
      );
      // `bottom`, não `top`, pro lado de cima: uma lista curta (3 opções) não
      // enche a `alturaDisponivel` inteira, e ancorar por `top` supondo que
      // ela enche deixava um vão entre o painel e o gatilho. Com `bottom` o
      // painel cresce PRA CIMA a partir da borda de baixo, do tamanho que
      // for, sem precisar adivinhar a altura antes de renderizar.
      setPosicao(
        abrePraCima
          ? {
              bottom: window.innerHeight - retangulo.top + 4,
              left: retangulo.left,
              width: retangulo.width,
              maxHeight: alturaDisponivel,
            }
          : {
              top: retangulo.bottom + 4,
              left: retangulo.left,
              width: retangulo.width,
              maxHeight: alturaDisponivel,
            },
      );
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

  // Zera a busca a cada abertura, senão o filtro da vez anterior continua
  // escondendo opção na próxima vez que a lista é aberta.
  useEffect(() => {
    if (aberto) setBusca("");
  }, [aberto]);

  const opcoesTodas: OptionInfo[] = Children.toArray(children)
    .filter((child): child is ReactElement<any> => isValidElement(child))
    .map((child) => ({
      value: child.props.value !== undefined ? String(child.props.value) : "",
      label: child.props.children,
      disabled: !!child.props.disabled,
    }));

  const atual = opcoesTodas.find((o) => o.value === valorTexto);

  const termo = normalizarTexto(busca.trim());
  const opcoes = !pesquisavel || !termo
    ? opcoesTodas
    : opcoesTodas.filter((o) => normalizarTexto(typeof o.label === "string" ? o.label : "").includes(termo));

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
            style={{
              top: posicao.top,
              bottom: posicao.bottom,
              left: posicao.left,
              width: posicao.width,
              maxHeight: posicao.maxHeight,
            }}
          >
            {pesquisavel && (
              <SelectBusca
                type="text"
                autoFocus
                placeholder="Buscar…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {opcoes.length === 0 ? (
              <SelectVazio>{termo ? "Nenhuma opção encontrada" : "Nenhuma opção disponível"}</SelectVazio>
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
