import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { AdminRoute } from "@/routes/AdminRoute";
import { FormularioRoute } from "@/routes/FormularioRoute";
import { RequirePosicao } from "@/routes/RequirePosicao";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { EsqueciSenha } from "@/pages/EsqueciSenha";
import { RedefinirSenha } from "@/pages/RedefinirSenha";
import { Desempenho } from "@/pages/Desempenho";
import { Bancas } from "@/pages/Bancas";
import { Calendario } from "@/pages/Calendario";
import { CalendarioGeral } from "@/pages/CalendarioGeral";
import { Nucleo } from "@/pages/Nucleo";
import { Membros } from "@/pages/Membros";
import { Notificacoes } from "@/pages/Notificacoes";
import { Avaliacoes } from "@/pages/Avaliacoes";
import { CalendariosBase } from "@/pages/CalendariosBase";
import { Config } from "@/pages/Config";
import { ProjetosList } from "@/pages/projetos/ProjetosList";
import { ProjetoNovo } from "@/pages/projetos/ProjetoNovo";
import { ProjetoPage } from "@/pages/projetos/ProjetoPage";
import { ProjetoVisaoGeral } from "@/pages/projetos/ProjetoVisaoGeral";
import { ProjetoCronograma } from "@/pages/projetos/ProjetoCronograma";
import { ProjetoHistorico } from "@/pages/projetos/ProjetoHistorico";
import { ProjetoReunioes } from "@/pages/projetos/ProjetoReunioes";
import { ProjetoTarefas } from "@/pages/projetos/ProjetoTarefas";
import { MonitoramentoLayout } from "@/pages/monitoramento/MonitoramentoLayout";
import { VisaoGeralAba } from "@/pages/monitoramento/VisaoGeralAba";
import { ExecucaoAba } from "@/pages/monitoramento/ExecucaoAba";
import { AlocacaoAba } from "@/pages/monitoramento/AlocacaoAba";
import { AtrasosAba } from "@/pages/monitoramento/AtrasosAba";
import { AvaliacaoDesempenho } from "@/pages/avaliacao-desempenho/AvaliacaoDesempenho";
import { MeuRelatorio } from "@/pages/avaliacao-desempenho/MeuRelatorio";
import { MeusMentorados } from "@/pages/avaliacao-desempenho/MeusMentorados";
import { PainelDesempenho } from "@/pages/avaliacao-desempenho/painel/PainelDesempenho";
import { PainelAvaliadores } from "@/pages/avaliacao-desempenho/painel/PainelAvaliadores";
import { PainelAvaliados } from "@/pages/avaliacao-desempenho/painel/PainelAvaliados";
import { PainelRelatorio } from "@/pages/avaliacao-desempenho/painel/PainelRelatorio";
import { PainelLotes } from "@/pages/avaliacao-desempenho/painel/PainelLotes";
import { PainelMentoria } from "@/pages/avaliacao-desempenho/painel/PainelMentoria";
import { PainelPdi } from "@/pages/avaliacao-desempenho/painel/PainelPdi";
import { PainelFormularios } from "@/pages/avaliacao-desempenho/painel/PainelFormularios";
import { TarefasGeraisAba } from "@/pages/monitoramento/TarefasGeraisAba";
import { CronogramasGeraisAba } from "@/pages/monitoramento/CronogramasGeraisAba";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 🏠 A home é /projetos: é o que a pessoa abre todo dia. */}
          <Route path="/" element={<Navigate to="/projetos" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          {/* Pública e obrigatoriamente ACIMA do catch-all: é o destino do link
              que vai no e-mail, e quem clica nele está justamente sem conseguir
              logar. Caindo no `*` iria para /projetos e de lá para /login. */}
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Desempenho />} />
              <Route path="/bancas" element={<Bancas />} />
              {/* /calendario agora agrega os 4 tipos (§6.5); a visão
                  só-de-bancas foi RELOCADA para /bancas/calendario, intacta. */}
              <Route path="/calendario" element={<CalendarioGeral />} />
              <Route path="/bancas/calendario" element={<Calendario />} />

              {/* 🔔 §6.6 — sem guard: todo perfil tem notificação. O que muda
                  é o conteúdo, e quem recorta isso é o backend. */}
              <Route path="/notificacoes" element={<Notificacoes />} />

              <Route path="/projetos" element={<ProjetosList />} />
              {/* Criar projeto é de diretor e gerente — guard por POSIÇÃO,
                  que é dimensão diferente do cargo do AdminRoute. */}
              <Route element={<RequirePosicao posicoes={["diretor", "gerente"]} />}>
                <Route path="/projetos/novo" element={<ProjetoNovo />} />
              </Route>
              {/* Abas como sub-rotas: é o que deixa uma notificação abrir
                  direto em /projetos/42/tarefas. */}
              <Route path="/projetos/:id" element={<ProjetoPage />}>
                <Route index element={<ProjetoVisaoGeral />} />
                <Route path="cronograma" element={<ProjetoCronograma />} />
                <Route path="tarefas" element={<ProjetoTarefas />} />
                <Route path="reunioes" element={<ProjetoReunioes />} />
                <Route path="historico" element={<ProjetoHistorico />} />
              </Route>

              {/* §7: monitoramento é só de diretor e gerente. O backend
                  revalida com require_gestao — o guard aqui evita a tela
                  vazia com 403 em todas as abas. */}
              <Route element={<RequirePosicao posicoes={["diretor", "gerente"]} />}>
                <Route path="/monitoramento" element={<MonitoramentoLayout />}>
                  <Route index element={<VisaoGeralAba />} />
                  <Route path="execucao" element={<ExecucaoAba />} />
                  <Route path="alocacao" element={<AlocacaoAba />} />
                  <Route path="atrasos" element={<AtrasosAba />} />
                  <Route path="tarefas" element={<TarefasGeraisAba />} />
                  <Route path="cronogramas" element={<CronogramasGeraisAba />} />
                </Route>
              </Route>

              {/* Avaliação de Desempenho (periódica/finalização) — não
                  confundir com /avaliacoes (feedback de banca) nem com
                  /dashboard (Desempenho.tsx, % de bancas atendidas). */}
              <Route path="/avaliacao-desempenho" element={<AvaliacaoDesempenho />} />
              <Route path="/avaliacao-desempenho/relatorio" element={<MeuRelatorio />} />

              <Route element={<RequirePosicao posicoes={["coordenador"]} />}>
                <Route path="/avaliacao-desempenho/mentorados" element={<MeusMentorados />} />
              </Route>

              <Route element={<RequirePosicao posicoes={["diretor", "gerente"]} />}>
                <Route path="/avaliacao-desempenho/painel" element={<PainelDesempenho />}>
                  <Route index element={<Navigate to="avaliadores" replace />} />
                  <Route path="avaliadores" element={<PainelAvaliadores />} />
                  <Route path="avaliados" element={<PainelAvaliados />} />
                  <Route path="relatorio" element={<PainelRelatorio />} />
                  <Route path="lotes" element={<PainelLotes />} />
                  <Route path="mentoria" element={<PainelMentoria />} />
                  <Route path="pdi" element={<PainelPdi />} />
                </Route>
              </Route>

              {/* Fora do shell do painel acima — mais restrito (só diretor),
                  sem o TabBar do resto do painel. A Avaliação de Desempenho não
                  está na tabela das 10, então segue travada por posição. */}
              <Route element={<RequirePosicao posicoes={["diretor"]} />}>
                <Route path="/avaliacao-desempenho/painel/formularios" element={<PainelFormularios />} />
              </Route>

              {/* Esconder o item na Sidebar não protege a rota: sem estes
                  guards, digitar /membros na barra de endereço abre a tela. */}
              <Route element={<FormularioRoute />}>
                <Route path="/avaliacoes" element={<Avaliacoes />} />
              </Route>
              <Route element={<RequirePosicao posicoes={["diretor"]} />}>
                <Route path="/nucleo" element={<Nucleo />} />
                <Route path="/config" element={<Config />} />
                <Route path="/calendarios-base" element={<CalendariosBase />} />
              </Route>
              <Route element={<AdminRoute permissao="pode_gerir_membros" />}>
                <Route path="/membros" element={<Membros />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
