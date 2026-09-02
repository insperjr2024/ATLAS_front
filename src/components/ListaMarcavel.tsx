import { useState } from "react";
import { normalizarTexto } from "@/lib/nucleo";
import { CheckboxGrid, CheckboxLabel } from "@/pages/Bancas.styled";
import { Busca, Vazio } from "./ListaMarcavel.styled";

export interface OpcaoMarcavel {
  id: number;
  nome: string;
}

interface Props {
  /** Já na ordem em que devem aparecer — o componente não reordena. */
  opcoes: OpcaoMarcavel[];
  marcados: (id: number) => boolean;
  onAlternar: (id: number) => void;
  /** O que dizer quando não há nada a marcar (lista de origem vazia). */
  vazio: string;
  placeholder?: string;
  "aria-label"?: string;
}

/**
 * Lista de marcar-vários com rolagem própria e busca no topo.
 *
 * A `CheckboxGrid` sozinha já rolava, mas achar uma pessoa no meio do núcleo
 * inteiro exigia percorrer a lista de olho, num quadro de dez linhas de
 * altura. É o mesmo problema que o `pesquisavel` do `SelectCustom` resolve
 * para o campo de escolher-um, e a solução aqui é a mesma: filtrar pelo
 * texto visível, sem tirar a rolagem de quem prefere só rolar.
 */
export function ListaMarcavel({
  opcoes,
  marcados,
  onAlternar,
  vazio,
  placeholder = "Buscar…",
  "aria-label": ariaLabel,
}: Props) {
  const [busca, setBusca] = useState("");

  const termo = normalizarTexto(busca.trim());
  const visiveis = termo ? opcoes.filter((o) => normalizarTexto(o.nome).includes(termo)) : opcoes;

  return (
    <CheckboxGrid>
      <Busca
        type="text"
        value={busca}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(e) => setBusca(e.target.value)}
      />
      {opcoes.length === 0 && <Vazio>{vazio}</Vazio>}
      {opcoes.length > 0 && visiveis.length === 0 && <Vazio>Nenhum resultado para "{busca}".</Vazio>}
      {visiveis.map((opcao) => (
        <CheckboxLabel key={opcao.id}>
          <input type="checkbox" checked={marcados(opcao.id)} onChange={() => onAlternar(opcao.id)} />
          {opcao.nome}
        </CheckboxLabel>
      ))}
    </CheckboxGrid>
  );
}
