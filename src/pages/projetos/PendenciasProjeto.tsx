import { Link } from "react-router-dom";
import { derivarPendencias } from "@/lib/pendencias-projeto";
import type { ProjetoCompleto } from "@/types/projeto";
import { MotivoDesabilitado } from "@/components/MotivoDesabilitado";
import { PageCard, PageCardContent, PageCardHeader, PageCardTitle } from "@/styles/page.styled";
import { Acao, Linha, Lista, Onde, Prazo, Quem, Sinal, Tudocerto } from "./PendenciasProjeto.styled";

interface Props {
  projeto: ProjetoCompleto;
}

/**
 * ⭐ **Pendências** — a primeira coisa da Visão geral.
 *
 * ⚠ **O que ela substitui: dedução.** A tela dizia o estado de cada coisa em
 * blocos diferentes — datas num card, escopos numa tabela, bancas em outra — e
 * cabia a quem lia cruzar tudo para descobrir o que estava parado. Um escopo
 * sem reunião inicial aparecia só como um travessão numa célula.
 *
 * 📐 **Uma linha por pendência, em colunas fixas** — sinal, o que falta, onde,
 * prazo, quem resolve. A primeira versão deste bloco era um card com título e
 * duas linhas de prosa por item; com quatro pendências viravam nove linhas de
 * texto, que ninguém lê numa tela aberta para dar uma olhada rápida.
 *
 * 📐 A explicação inteira virou **tooltip**, no mesmo componente que a
 * plataforma já usa para explicar botão desabilitado. Quem entende "Banca sem
 * data" não lê nada; quem não entende, alcança.
 */
export function PendenciasProjeto({ projeto }: Props) {
  const pendencias = derivarPendencias(projeto);

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>
          {pendencias.length > 0 ? `Pendências · ${pendencias.length}` : "Pendências"}
        </PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {pendencias.length === 0 ? (
          <Tudocerto>Nada pendente neste projeto.</Tudocerto>
        ) : (
          <Lista>
            {pendencias.map((p) => (
              <Linha key={p.id}>
                <Sinal $gravidade={p.gravidade} aria-hidden />
                <Acao>
                  <MotivoDesabilitado motivo={p.explicacao}>
                    <Link
                      to={
                        p.aba === "visao-geral"
                          ? `/projetos/${projeto.id}`
                          : `/projetos/${projeto.id}/${p.aba}`
                      }
                    >
                      {p.acao}
                    </Link>
                  </MotivoDesabilitado>
                </Acao>
                <Onde>{p.onde}</Onde>
                {p.prazo ? <Prazo $vencido={!!p.vencido}>{p.prazo}</Prazo> : <span />}
                <Quem>{p.dono}</Quem>
              </Linha>
            ))}
          </Lista>
        )}
      </PageCardContent>
    </PageCard>
  );
}
