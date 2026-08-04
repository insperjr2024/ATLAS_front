import { EmBrevePanel } from "./Projetos.styled";

/**
 * As abas que ainda não têm fatia entregue. Existem como rota desde já para
 * o shell não quebrar e para os links diretos (`/projetos/42/tarefas`) já
 * responderem alguma coisa.
 */
export function AbaEmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <EmBrevePanel>
      <h2>{titulo}</h2>
      <p>{descricao}</p>
    </EmBrevePanel>
  );
}
