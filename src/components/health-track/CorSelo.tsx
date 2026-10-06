import { ROTULO_COR, type CorHealthTrack } from "@/lib/health-track";
import { Selo } from "./HealthTrack.styled";
import { ICONE_COR } from "./icones";

interface Props {
  cor: CorHealthTrack;
  /** O nome vindo de `/classificacoes`; sem ele, o rótulo padrão. */
  rotulo?: string;
  grande?: boolean;
}

/** A cor de um pilar ou do projeto, sempre com ícone e nome. */
export function CorSelo({ cor, rotulo, grande }: Props) {
  const Icone = ICONE_COR[cor];
  return (
    <Selo $cor={cor} $grande={grande}>
      <Icone aria-hidden="true" />
      {rotulo ?? ROTULO_COR[cor]}
    </Selo>
  );
}
