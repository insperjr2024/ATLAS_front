import type { AvaliadorDaBanca, ComposicaoDaFrente } from "@/types/banca";
import { agruparAvaliadores } from "@/lib/bancas";
import {
  GrupoAvaliadores,
  GrupoCabecalho,
  GrupoCota,
  GrupoRotulo,
  GrupoVazio,
  ListaNomes,
} from "./AvaliadoresAgrupados.styled";

/**
 * Os avaliadores escalados separados por (liderança | membro) × frente da
 * banca, com o "2/3 · falta 1" de cada bloco — a leitura que diz "falta uma
 * liderança de Business", não só "faltam 3".
 *
 * Usada na aba Banca do projeto (`ProjetoBanca`) e no "ver mais" da página
 * `/bancas` (`VerMaisModal`). A REGRA — quem é liderança, de que frente, o que
 * falta pro piso — mora em `agruparAvaliadores`; aqui é só a apresentação.
 * Coordenador de vendas ganha "· vendas" no nome (é liderança sem frente, cai
 * no bloco "outras frentes" e não fecha piso de frente nenhuma).
 */
export function AvaliadoresAgrupados({
  avaliadores,
  frentesDaBanca,
  composicao,
  realizadoEm,
}: {
  avaliadores: AvaliadorDaBanca[];
  frentesDaBanca: { id: number; nome: string }[];
  composicao: ComposicaoDaFrente[] | undefined;
  realizadoEm: string | null;
}) {
  return (
    <>
      {agruparAvaliadores(avaliadores, frentesDaBanca, composicao).map((g) => {
        const estado = g.cota && g.cota.faltando > 0 ? "falta" : "ok";
        return (
          <GrupoAvaliadores key={g.chave}>
            <GrupoCabecalho>
              <GrupoRotulo>{g.rotulo}</GrupoRotulo>
              {g.cota && (
                <GrupoCota $estado={estado}>
                  {g.cota.atual}/{g.cota.min}
                  {g.cota.faltando > 0 && ` · falta ${g.cota.faltando}`}
                </GrupoCota>
              )}
            </GrupoCabecalho>
            {g.avaliadores.length === 0 ? (
              <GrupoVazio>ninguém</GrupoVazio>
            ) : (
              <ListaNomes>
                {g.avaliadores.map((a) => (
                  <li key={a.usuario_id}>
                    {a.nome}
                    {a.coordenador_vendas && " · vendas"}
                    {/* Escalado e compareceu são coisas diferentes: só quem
                        esteve lá entra na conta dos votos. */}
                    {realizadoEm && !a.presente && " · faltou"}
                    {a.ja_votou && " · votou"}
                  </li>
                ))}
              </ListaNomes>
            )}
          </GrupoAvaliadores>
        );
      })}
    </>
  );
}
