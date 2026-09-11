import type { AvaliadorDaBanca, ComposicaoDaFrente } from "@/types/banca";
import { agruparAvaliadores } from "@/lib/bancas";
import {
  GrupoAvaliadores,
  GrupoCabecalho,
  GrupoCota,
  GrupoRotulo,
  GrupoVazio,
  ListaNomes,
  NomeLinha,
  RemoverBotao,
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
 *
 * `podeRemover`/`onRemover` são opcionais e ligados juntos (2026-09-11, a
 * pedido): só quem tem `pode_gerir_membros` (admin, diretoria) vê o "remover"
 * ao lado do nome — o backend cobra a mesma permissão em
 * `DELETE /candidaturas/{id}` e, pra quem tem, passa por cima da trava dos 7
 * dias (`eh_gestao`), então a ação sempre vale mesmo perto da banca.
 */
export function AvaliadoresAgrupados({
  avaliadores,
  frentesDaBanca,
  composicao,
  realizadoEm,
  podeRemover = false,
  onRemover,
}: {
  avaliadores: AvaliadorDaBanca[];
  frentesDaBanca: { id: number; nome: string }[];
  composicao: ComposicaoDaFrente[] | undefined;
  realizadoEm: string | null;
  podeRemover?: boolean;
  onRemover?: (candidaturaId: number, nome: string) => void;
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
                  <NomeLinha key={a.usuario_id}>
                    <span>
                      {a.nome}
                      {a.coordenador_vendas && " · vendas"}
                      {/* ⭐ 2026-09-05: liderança que sobra além do mínimo
                          exigido também conta pro piso de membros — ver
                          `agruparAvaliadores`. Sem a marca, a mesma pessoa
                          aparecendo em "Liderança" E "Membros" pareceria
                          duplicidade, não a regra explicada. */}
                      {a.cobrindoPiso && " · liderança cobrindo o piso de membro"}
                      {/* Escalado e compareceu são coisas diferentes: quem
                          faltou não avalia a banca. */}
                      {realizadoEm && !a.presente && " · faltou"}
                      {a.ja_enviou && " · avaliou"}
                    </span>
                    {podeRemover && onRemover && (
                      <RemoverBotao
                        type="button"
                        onClick={() => onRemover(a.candidatura_id, a.nome)}
                      >
                        remover
                      </RemoverBotao>
                    )}
                  </NomeLinha>
                ))}
              </ListaNomes>
            )}
          </GrupoAvaliadores>
        );
      })}
    </>
  );
}
