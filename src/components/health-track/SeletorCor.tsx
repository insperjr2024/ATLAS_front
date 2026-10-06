import { ROTULO_COR, type Classificacao, type CorHealthTrack } from "@/lib/health-track";
import { ICONE_COR } from "./icones";
import { GrupoCores, OpcaoCor } from "./HealthTrack.styled";

const CORES: CorHealthTrack[] = ["verde", "amarelo", "vermelho"];

interface Props {
  /** Agrupa os radios: precisa ser único na tela (um por pilar). */
  nome: string;
  /** O nome do pilar, para o leitor de tela anunciar "Cliente, grupo". */
  rotulo: string;
  valor: CorHealthTrack | null;
  classificacoes: Classificacao[];
  onChange: (cor: CorHealthTrack) => void;
  desabilitado?: boolean;
}

/** As três cores de um pilar como um grupo de radios nativo. */
export function SeletorCor({ nome, rotulo, valor, classificacoes, onChange, desabilitado }: Props) {
  return (
    <GrupoCores role="radiogroup" aria-label={rotulo}>
      {CORES.map((cor) => {
        const Icone = ICONE_COR[cor];
        const classificacao = classificacoes.find((c) => c.cor === cor);
        return (
          <OpcaoCor key={cor} $cor={cor} $marcada={valor === cor} title={classificacao?.descricao}>
            <input
              type="radio"
              name={nome}
              value={cor}
              checked={valor === cor}
              onChange={() => onChange(cor)}
              disabled={desabilitado}
            />
            <Icone aria-hidden="true" />
            {classificacao?.nome ?? ROTULO_COR[cor]}
          </OpcaoCor>
        );
      })}
    </GrupoCores>
  );
}
