import styled from "styled-components";

/* A mesma linguagem do painel de Contratos (CONTRATOS_front): fundo branco,
   neutros, vinho só no cabeçalho e nas bordas em degradê, Montserrat nos
   títulos. Nada de tema escuro. */
export const GRADIENTE_VINHO = "linear-gradient(135deg, #230606 0%, #691212 100%)";
const ALTURA_CABECALHO = 64;

const cor = {
  fundo: "#ffffff",
  texto: "oklch(0.145 0 0)",
  mudo: "oklch(0.556 0 0)",
  borda: "oklch(0.922 0 0)",
  secundario: "oklch(0.97 0 0)",
  destrutivo: "#DC2626",
};

export const Pagina = styled.div`
  position: relative;
  min-height: 100vh;
  background: ${cor.fundo};
  color: ${cor.texto};
  padding-top: ${ALTURA_CABECALHO}px;
`;

export const Particulas = styled.canvas`
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
`;

export const Cabecalho = styled.header`
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 40;
  height: ${ALTURA_CABECALHO}px;
  background: ${GRADIENTE_VINHO};
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

export const CabecalhoGrade = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1.5rem;
  height: 100%;
  padding: 0 2rem;

  @media (max-width: 640px) {
    gap: 1rem;
    padding: 0 1rem;
  }
`;

export const TituloCabecalho = styled.div`
  justify-self: start;
  font-family: "Montserrat", Helvetica, sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
`;

export const AcoesCabecalho = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-self: end;
`;

export const BotaoCabecalho = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  border: none;
  border-radius: 6px;
  padding: 0.375rem 0.625rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-family: "Montserrat", Helvetica, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: color 150ms ease, background 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #fff;
  }
`;

export const NomeUsuario = styled.span`
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  margin-right: 0.5rem;

  @media (max-width: 640px) {
    display: none;
  }
`;

export const Conteudo = styled.main`
  position: relative;
  z-index: 1;
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 2rem 4rem;

  @media (max-width: 640px) {
    padding: 1.25rem 1rem 3rem;
  }
`;

export const Titulo = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${cor.texto};
`;

export const Descricao = styled.p`
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: ${cor.mudo};
  line-height: 1.5;
`;

export const Caminho = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: ${cor.mudo};

  button {
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    color: ${cor.mudo};
    cursor: pointer;
  }

  button:hover {
    color: ${cor.texto};
  }

  strong {
    color: ${cor.texto};
    font-weight: 500;
  }
`;

export const Barra = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

export const CampoBusca = styled.div`
  position: relative;
  width: 18rem;
  max-width: 100%;

  svg {
    pointer-events: none;
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${cor.mudo};
  }
`;

export const Entrada = styled.input`
  height: 2.25rem;
  width: 100%;
  border-radius: 6px;
  border: 1px solid ${cor.borda};
  background: transparent;
  padding: 0 0.75rem;
  font: inherit;
  font-size: 0.875rem;
  color: ${cor.texto};

  ${CampoBusca} & {
    padding-left: 2rem;
  }

  &::placeholder {
    color: ${cor.mudo};
  }

  &:focus {
    outline: none;
    border-color: oklch(0.708 0 0);
    box-shadow: 0 0 0 3px oklch(0.708 0 0 / 30%);
  }
`;

export const Botao = styled.button<{ $tom?: "primario" | "contorno" | "texto" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.25rem;
  padding: 0 0.875rem;
  border-radius: 6px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease;
  border: 1px solid ${({ $tom }) => ($tom === "contorno" ? cor.borda : "transparent")};
  background: ${({ $tom }) => ($tom === "primario" ? cor.texto : "transparent")};
  color: ${({ $tom }) => ($tom === "primario" ? "#fff" : cor.texto)};

  &:hover:not(:disabled) {
    background: ${({ $tom }) =>
      $tom === "primario" ? "oklch(0.3 0 0)" : cor.secundario};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SecaoTitulo = styled.h2`
  margin: 0 0 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid ${cor.borda};
  font-size: 1rem;
  font-weight: 600;
  color: ${cor.texto};
`;

export const Cartoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

/* O Card do painel de Contratos: borda em degradê vinho pela técnica do
   duplo background, miolo branco, sombra leve. */
export const Cartao = styled.div`
  border-radius: 10px;
  border: 1px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    ${GRADIENTE_VINHO} border-box;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
  padding: 1rem;
`;

export const Etiqueta = styled.span<{ $tom?: "atencao" | "neutro" }>`
  display: inline-block;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid ${({ $tom }) => ($tom === "atencao" ? "rgba(192, 33, 33, 0.25)" : "rgba(26, 26, 24, 0.12)")};
  background: ${({ $tom }) => ($tom === "atencao" ? "rgba(192, 33, 33, 0.08)" : "#F5EDE1")};
  color: ${({ $tom }) => ($tom === "atencao" ? "#7D1414" : "#1A1A18")};
`;

export const Vazio = styled.p`
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: ${cor.mudo};
`;

export const Erro = styled.p`
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: ${cor.destrutivo};
`;

export const Veu = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgb(0 0 0 / 45%);
`;

export const Caixa = styled.div`
  width: 100%;
  max-width: 28rem;
  max-height: 80vh;
  overflow: auto;
  border-radius: 10px;
  border: 1px solid ${cor.borda};
  background: #fff;
  color: ${cor.texto};
  padding: 1.25rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 15%);

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
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
    border-radius: 6px;
    background: #fff;
    color: ${cor.texto};
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }

  button:hover {
    background: ${cor.secundario};
  }

  button svg {
    color: #691212;
  }
`;

export const LinhaInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

/* A lista única, como num explorador de arquivos: pastas e arquivos nas
   mesmas linhas, ícone diz o que é cada um. Um card em volta da lista
   inteira, nunca em volta de cada arquivo. */
export const Lista = styled.div`
  border-radius: 10px;
  border: 1px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    ${GRADIENTE_VINHO} border-box;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
  /* Sem overflow hidden: o menu "⋯" de cada linha abre pra fora do card e
     ficava cortado. Os cantos arredondados vão no cabeçalho e na última
     linha. */
`;

export const Item = styled.div<{ $pasta?: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.9rem;
  border-bottom: 1px solid ${cor.borda};
  cursor: default;
  user-select: none;

  &:last-child {
    border-bottom: none;
    border-radius: 0 0 9px 9px;
  }

  &:hover {
    background: ${cor.secundario};
  }

  > svg {
    flex-shrink: 0;
    color: ${({ $pasta }) => ($pasta ? "#691212" : cor.mudo)};
  }

  .nome {
    min-width: 0;
    font-size: 0.875rem;
    font-weight: ${({ $pasta }) => ($pasta ? 500 : 400)};
    color: ${cor.texto};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    font-size: 0.75rem;
    color: ${cor.mudo};
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .meta {
      display: none;
    }
  }
`;

export const CabecalhoLista = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 0.75rem;
  padding: 0.45rem 0.9rem;
  border-bottom: 1px solid ${cor.borda};
  border-radius: 9px 9px 0 0;
  background: ${cor.secundario};
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${cor.mudo};
`;

export const MenuWrap = styled.div`
  position: relative;
`;

export const MenuGatilho = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${cor.mudo};
  cursor: pointer;

  &:hover {
    background: oklch(0.922 0 0);
    color: ${cor.texto};
  }
`;

export const MenuPainel = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 0.25rem);
  z-index: 20;
  min-width: 11rem;
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid ${cor.borda};
  background: #fff;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 12%);

  button {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.6rem;
    border: none;
    border-radius: 6px;
    background: none;
    font: inherit;
    font-size: 0.85rem;
    color: ${cor.texto};
    text-align: left;
    cursor: pointer;
  }

  button:hover {
    background: ${cor.secundario};
  }

  button.perigo {
    color: ${cor.destrutivo};
  }

  hr {
    margin: 0.25rem 0;
    border: none;
    border-top: 1px solid ${cor.borda};
  }
`;
