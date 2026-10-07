import styled from "styled-components";
import { theme } from "@/styles/theme";

/* Paleta própria desta página: escura, sem a barra lateral do ATLAS. */
const cor = {
  fundo: "#0b1020",
  fundo2: "#111833",
  borda: "rgba(148, 163, 184, 0.18)",
  texto: "#e6edf7",
  mudo: "#8d9bb5",
  acento: "#ff5b5b",
  acento2: "#5bb8ff",
};

export const Tela = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(1200px 500px at 10% -10%, rgba(91, 184, 255, 0.14), transparent 60%),
    radial-gradient(900px 400px at 100% 0%, rgba(255, 91, 91, 0.12), transparent 60%),
    ${cor.fundo};
  color: ${cor.texto};
  padding: 1.5rem clamp(1rem, 4vw, 3rem) 3rem;
`;

export const Topo = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const Marca = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: ${theme.fontWeight.semibold};
    letter-spacing: 0.02em;
  }

  span {
    font-size: 0.8rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${cor.mudo};
  }
`;

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

export const Botao = styled.button<{ $tom?: "primario" | "fantasma" | "perigo" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.25rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
  border: 1px solid ${({ $tom }) => ($tom === "primario" ? cor.acento : cor.borda)};
  background: ${({ $tom }) =>
    $tom === "primario" ? cor.acento : $tom === "perigo" ? "rgba(255, 91, 91, 0.12)" : "rgba(255,255,255,0.04)"};
  color: ${({ $tom }) => ($tom === "perigo" ? "#ffb4b4" : cor.texto)};

  &:hover:not(:disabled) {
    background: ${({ $tom }) =>
      $tom === "primario" ? "#ff7373" : $tom === "perigo" ? "rgba(255, 91, 91, 0.22)" : "rgba(255,255,255,0.09)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const BotaoMini = styled(Botao)`
  height: 1.9rem;
  padding: 0 0.7rem;
  font-size: 0.78rem;
`;

export const Busca = styled.input`
  height: 2.25rem;
  min-width: 16rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  border: 1px solid ${cor.borda};
  background: rgba(255, 255, 255, 0.05);
  color: ${cor.texto};
  font: inherit;
  font-size: 0.85rem;

  &::placeholder {
    color: ${cor.mudo};
  }

  &:focus {
    outline: none;
    border-color: ${cor.acento2};
  }
`;

export const Caminho = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: ${cor.mudo};

  button {
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    color: ${cor.acento2};
    cursor: pointer;
  }

  strong {
    color: ${cor.texto};
    font-weight: ${theme.fontWeight.medium};
  }
`;

export const Painel = styled.section`
  border: 1px solid ${cor.borda};
  border-radius: 1rem;
  background: rgba(17, 24, 51, 0.7);
  backdrop-filter: blur(6px);
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
`;

export const PainelTitulo = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${cor.mudo};
`;

export const GradePastas = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: 0.75rem;
`;

export const Pasta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid ${cor.borda};
  border-radius: 0.75rem;
  background: ${cor.fundo2};
  cursor: pointer;
  transition: border-color 150ms ease, transform 150ms ease;

  &:hover {
    border-color: ${cor.acento2};
    transform: translateY(-1px);
  }

  svg {
    color: #ffd166;
    flex-shrink: 0;
  }

  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
  }
`;

export const PastaAcoes = styled.div`
  display: flex;
  gap: 0.25rem;
  opacity: 0.75;

  button {
    border: none;
    background: none;
    padding: 0.15rem;
    color: ${cor.mudo};
    cursor: pointer;
    border-radius: 0.35rem;
  }

  button:hover {
    color: ${cor.texto};
    background: rgba(255, 255, 255, 0.08);
  }
`;

export const Tabela = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;

  th,
  td {
    text-align: left;
    padding: 0.55rem 0.5rem;
    border-bottom: 1px solid ${cor.borda};
    vertical-align: middle;
  }

  th {
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${cor.mudo};
    font-weight: ${theme.fontWeight.medium};
  }

  td.nome {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  td.nome svg {
    color: ${cor.acento2};
    flex-shrink: 0;
  }

  td.acoes {
    white-space: nowrap;
    text-align: right;
  }

  td.mudo {
    color: ${cor.mudo};
    white-space: nowrap;
  }
`;

export const Etiqueta = styled.span<{ $tom?: "atlas" | "importado" | "deletado" }>`
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid ${cor.borda};
  color: ${({ $tom }) => ($tom === "deletado" ? "#ffb4b4" : $tom === "atlas" ? "#9ad7ff" : cor.mudo)};
`;

export const Vazio = styled.p`
  margin: 0.5rem 0;
  color: ${cor.mudo};
  font-size: 0.9rem;
`;

export const Erro = styled.p`
  margin: 0.5rem 0;
  color: #ffb4b4;
  font-size: 0.85rem;
`;

export const LinhaInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

export const Campo = styled.input`
  height: 2rem;
  padding: 0 0.7rem;
  border-radius: 0.5rem;
  border: 1px solid ${cor.borda};
  background: rgba(255, 255, 255, 0.06);
  color: ${cor.texto};
  font: inherit;
  font-size: 0.85rem;
  min-width: 14rem;

  &:focus {
    outline: none;
    border-color: ${cor.acento2};
  }
`;

export const Veu = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(3, 6, 16, 0.7);
`;

export const Caixa = styled.div`
  width: 100%;
  max-width: 30rem;
  max-height: 80vh;
  overflow: auto;
  border: 1px solid ${cor.borda};
  border-radius: 1rem;
  background: ${cor.fundo2};
  color: ${cor.texto};
  padding: 1.25rem;

  h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
  }

  p {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    color: ${cor.mudo};
  }
`;

export const ListaEscolha = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.5rem 0 0.75rem;

  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-align: left;
    padding: 0.5rem 0.7rem;
    border: 1px solid ${cor.borda};
    border-radius: 0.6rem;
    background: rgba(255, 255, 255, 0.04);
    color: ${cor.texto};
    font: inherit;
    font-size: 0.88rem;
    cursor: pointer;
  }

  button:hover {
    border-color: ${cor.acento2};
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;
