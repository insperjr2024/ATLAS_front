import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { normalizarTexto } from "@/lib/nucleo";
import {
  LimparSelecao,
  OpcaoMarcavel,
  SelectBusca,
  SelectPanel,
  SelectTrigger,
  SelectVazio,
  SelectWrap,
} from "./MultiSelect.styled";

export interface OpcaoMulti {
  value: string;
  label: string;
}

interface Props {
  /** O que está marcado agora. Vazio = nada marcado, que a barra de filtros
   *  lê como "sem filtro", nunca como "nenhum resultado". */
  valores: string[];
  onChange: (valores: string[]) => void;
  opcoes: OpcaoMulti[];
  /** O texto do gatilho quando nada está marcado — "Todos os status". Diz o
   *  ESTADO ("está tudo aparecendo"), não a ação ("filtrar por status"): o
   *  campo fica ao lado do número que ele recorta, e quem chega na tela
   *  precisa saber o que está vendo antes de saber o que pode fazer. */
  rotuloVazio: string;
  /** O texto do gatilho com 3 ou mais marcados, quando os rótulos não cabem
   *  mais. Recebe a contagem: `(n) => \`${n} status\``. */
  resumo?: (quantidade: number) => string;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  /** Lista longa (pessoas, sobretudo): mostra um campo de busca no topo do
   *  painel que filtra as opções pelo rótulo. O que já está marcado continua
   *  marcado enquanto o filtro esconde — filtrar não desmarca ninguém. */
  pesquisavel?: boolean;
}

/**
 * O irmão de marcar-vários do `SelectCustom`, mesma casca (gatilho, painel em
 * portal, fecha ao clicar fora) e a mesma aparência na barra de filtros.
 *
 * **Por que não o `<select multiple>` nativo:** ele não tem estado fechado. É
 * uma caixa alta e sempre aberta, que empurraria os cards da aba para baixo, e
 * marcar mais de um exige segurar Ctrl — descoberta por ninguém, e impossível
 * no celular, onde metade do Monitoramento é lido.
 *
 * ⚠ O painel NÃO fecha ao marcar uma opção, ao contrário do `SelectCustom`.
 * Marcar várias é o ponto: fechar a cada clique obrigaria a reabrir a lista
 * uma vez por etapa, e cada reabertura dispara uma requisição da aba.
 */
export function MultiSelect({
  valores,
  onChange,
  opcoes,
  rotuloVazio,
  resumo,
  className,
  style,
  "aria-label": ariaLabel,
  pesquisavel,
}: Props) {
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

  // Mesma conta do `SelectCustom`: o painel é `position: fixed` num portal,
  // então não segue o layout sozinho e abre para o lado com mais espaço.
  useLayoutEffect(() => {
    if (!aberto) return;
    function posicionar() {
      const retangulo = ref.current?.getBoundingClientRect();
      if (!retangulo) return;
      const margem = 8;
      const alturaPreferida = 256;
      const espacoAbaixo = window.innerHeight - retangulo.bottom - margem;
      const espacoAcima = retangulo.top - margem;
      const abrePraCima = espacoAbaixo < alturaPreferida && espacoAcima > espacoAbaixo;
      const alturaDisponivel = Math.max(
        Math.min(alturaPreferida, abrePraCima ? espacoAcima : espacoAbaixo),
        80,
      );
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

  // Esc fecha sem mexer no que foi marcado. O painel não tem "confirmar": cada
  // clique já vale, então fechar nunca precisa desfazer nada.
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // Zera a busca a cada abertura, senão o filtro da vez anterior continua
  // escondendo opção na próxima vez que a lista é aberta. O gatilho é o
  // único caminho de abertura, então não precisa de efeito para isso.
  function alternarPainel() {
    setBusca("");
    setAberto((v) => !v);
  }

  function alternar(value: string) {
    // Acrescenta no FIM, preservando a ordem em que a pessoa marcou — é a
    // ordem que aparece no gatilho, e reordenar sozinho faria o rótulo mudar
    // debaixo do cursor.
    onChange(
      valores.includes(value) ? valores.filter((v) => v !== value) : [...valores, value],
    );
  }

  const termo = normalizarTexto(busca.trim());
  const visiveis =
    !pesquisavel || !termo
      ? opcoes
      : opcoes.filter((o) => normalizarTexto(o.label).includes(termo));

  const marcados = opcoes.filter((o) => valores.includes(o.value));
  const rotulo =
    marcados.length === 0
      ? rotuloVazio
      : marcados.length <= 2
        ? marcados.map((o) => o.label).join(", ")
        : (resumo ?? ((n: number) => `${n} selecionados`))(marcados.length);

  return (
    <SelectWrap ref={ref} className={className} style={style}>
      <SelectTrigger
        type="button"
        aria-expanded={aberto}
        aria-haspopup="true"
        aria-label={ariaLabel}
        onClick={alternarPainel}
      >
        <span>{rotulo}</span>
        <ChevronDown size={16} />
      </SelectTrigger>
      {aberto &&
        posicao &&
        createPortal(
          <SelectPanel
            ref={painelRef}
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
              />
            )}
            {visiveis.length === 0 && (
              <SelectVazio>{termo ? "Nenhuma opção encontrada" : "Nenhuma opção disponível"}</SelectVazio>
            )}
            {visiveis.map((opcao) => {
              const marcada = valores.includes(opcao.value);
              return (
                <OpcaoMarcavel key={opcao.value} $marcada={marcada}>
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={() => alternar(opcao.value)}
                  />
                  <span>{opcao.label}</span>
                </OpcaoMarcavel>
              );
            })}
            {marcados.length > 0 && (
              <LimparSelecao type="button" onClick={() => onChange([])}>
                Limpar seleção
              </LimparSelecao>
            )}
          </SelectPanel>,
          document.body,
        )}
    </SelectWrap>
  );
}
