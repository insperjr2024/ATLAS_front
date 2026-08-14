/**
 * Uma etapa pode ocupar TRECHOS separados: pinta uma semana, pula três dias,
 * pinta mais.
 *
 * O banco guarda um intervalo por linha de `cronograma_etapa`, e isso não
 * muda aqui. Um trecho separado é outra linha com o MESMO nome e cor, que é
 * o que o próprio modelo documenta como correto, porque o vão entre os
 * trechos é justamente a pausa que o cronograma quer visível. O agrupamento
 * em "uma etapa com N trechos" acontece só na interface.
 *
 * Este módulo é a aritmética disso, separada da tela de propósito: é pura,
 * então dá para conferir no olho e testar sem montar React.
 */

export interface Trecho {
  inicio: string;
  fim: string;
}

/** O dia seguinte a uma chave `yyyy-MM-dd`. Meio-dia para não escorregar de fuso. */
function diaSeguinte(chave: string): string {
  const d = new Date(`${chave}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Funde os intervalos que se sobrepõem ou se encostam.
 *
 * "Encostar" conta como sobrepor: pintar 18–21 entre um trecho que acaba em 17
 * e outro que começa em 22 tem que resultar num bloco só, e não em três linhas
 * coladas que a legenda mostraria como três trechos.
 */
export function unirTrechos(trechos: Trecho[]): Trecho[] {
  if (trechos.length === 0) return [];
  const ordenados = [...trechos].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const unidos: Trecho[] = [{ ...ordenados[0] }];

  for (const atual of ordenados.slice(1)) {
    const ultimo = unidos[unidos.length - 1];
    if (atual.inicio <= diaSeguinte(ultimo.fim)) {
      // Sobrepõe ou encosta: estica o que já estava aberto.
      if (atual.fim > ultimo.fim) ultimo.fim = atual.fim;
    } else {
      unidos.push({ ...atual });
    }
  }
  return unidos;
}

/** O dia anterior a uma chave `yyyy-MM-dd`. */
function diaAnterior(chave: string): string {
  const d = new Date(`${chave}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Tira um intervalo dos trechos, a borracha.
 *
 * Apagar o miolo de um trecho o PARTE em dois, e é isso que faz a borracha
 * valer a pena: sem ela, tirar três dias do meio de uma etapa de duas semanas
 * exigiria apagar a etapa toda e repintar os dois lados.
 */
export function subtrairTrecho(trechos: Trecho[], remover: Trecho): Trecho[] {
  const resultado: Trecho[] = [];
  for (const t of trechos) {
    // Sem interseção: o trecho passa inteiro.
    if (remover.fim < t.inicio || remover.inicio > t.fim) {
      resultado.push(t);
      continue;
    }
    // Sobra à esquerda do que foi apagado.
    if (remover.inicio > t.inicio) {
      resultado.push({ inicio: t.inicio, fim: diaAnterior(remover.inicio) });
    }
    // Sobra à direita. As duas podem existir ao mesmo tempo, é o corte no meio.
    if (remover.fim < t.fim) {
      resultado.push({ inicio: diaSeguinte(remover.fim), fim: t.fim });
    }
  }
  return resultado;
}

export interface LinhaExistente extends Trecho {
  id: number;
}

/**
 * O plano de escrita para deixar o grupo com exatamente os trechos desejados,
 * reaproveitando as linhas que já existem.
 *
 * Reaproveitar importa: apagar tudo e recriar trocaria os ids a cada pincelada,
 * e a etapa perderia `criado_em` e `criado_por`, que o histórico usa.
 */
export interface PlanoDeEscrita {
  atualizar: { id: number; inicio: string; fim: string }[];
  criar: Trecho[];
  remover: number[];
}

export function planejarEscrita(
  existentes: LinhaExistente[],
  desejados: Trecho[],
): PlanoDeEscrita {
  const ordenadas = [...existentes].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const atualizar: PlanoDeEscrita["atualizar"] = [];
  const criar: Trecho[] = [];

  desejados.forEach((trecho, i) => {
    const linha = ordenadas[i];
    if (!linha) {
      criar.push(trecho);
    } else if (linha.inicio !== trecho.inicio || linha.fim !== trecho.fim) {
      // Só escreve o que de fato mudou, trecho intacto não vira requisição.
      atualizar.push({ id: linha.id, inicio: trecho.inicio, fim: trecho.fim });
    }
  });

  const remover = ordenadas.slice(desejados.length).map((l) => l.id);
  return { atualizar, criar, remover };
}
