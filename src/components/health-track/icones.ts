import { CircleCheck, OctagonX, TriangleAlert, type LucideIcon } from "lucide-react";
import type { CorHealthTrack } from "@/lib/health-track";

/** Uma forma por cor, além da cor: quem não distingue verde de vermelho
 *  ainda lê círculo, triângulo e octógono, e o rótulo vem sempre junto. */
export const ICONE_COR: Record<CorHealthTrack, LucideIcon> = {
  verde: CircleCheck,
  amarelo: TriangleAlert,
  vermelho: OctagonX,
};
