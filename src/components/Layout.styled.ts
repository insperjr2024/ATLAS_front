import styled from "styled-components";

export const LayoutWrapper = styled.div`
  display: flex;
  min-height: 100vh;
`;

export const Main = styled.main`
  flex: 1;
  /* Sem isso, um filho com largura mínima grande (o grid do kanban de
     projetos, por exemplo) empurra o Main inteiro pra ficar mais largo em
     vez de rolar internamente — e a página toda passa a arrastar pro lado,
     cabeçalho junto. */
  min-width: 0;
  padding: 1.5rem;
  background: var(--sidebar);
  min-height: 100vh;
`;
