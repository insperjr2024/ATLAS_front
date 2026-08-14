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
import { DefinirSenha } from "@/pages/DefinirSenha";
import { Desempenho } from "@/pages/Desempenho";
import { Bancas } from "@/pages/Bancas";
import { MeuPerfil } from "@/pages/MeuPerfil";
import { Vagas } from "@/pages/Vagas";
import { CalendarioGeral } from "@/pages/CalendarioGeral";
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
import { ProjetoBanca } from "@/pages/projetos/ProjetoBanca";
import { ProjetoHistorico } from "@/pages/projetos/ProjetoHistorico";
import { ProjetoTarefas } from "@/pages/projetos/ProjetoTarefas";
import { MonitoramentoLayout } from "@/pages/monitoramento/MonitoramentoLayout";
import { VisaoGeralAba } from "@/pages/monitoramento/VisaoGeralAba";
import { AprovacoesAba } from "@/pages/monitoramento/AprovacoesAba";
import { ExecucaoAba } from "@/pages/monitoramento/ExecucaoAba";
import { AlocacaoAba } from "@/pages/monitoramento/AlocacaoAba";
import { AtrasosAba } from "@/pages/monitoramento/AtrasosAba";
import { GraficosAba } from "@/pages/monitoramento/GraficosAba";
import { HistoricoAba } from "@/pages/monitoramento/HistoricoAba";
import { AvaliacaoDesempenho } from "@/pages/avaliacao-desempenho/AvaliacaoDesempenho";
import { MeuRelatorio } from "@/pages/avaliacao-desempenho/MeuRelatorio";
import { MeusMentorados } from "@/pages/avaliacao-desempenho/MeusMentorados";
import { PainelDesempenho } from "@/pages/avaliacao-desempenho/painel/PainelDesempenho";
import { PainelAvaliadores } from "@/pages/avaliacao-desempenho/painel/PainelAvaliadores";
import { PainelAvaliados } from "@/pages/avaliacao-desempenho/painel/PainelAvaliados";
import { PainelRelatorio } from "@/pages/avaliacao-desempenho/painel/PainelRelatorio";
import { PainelLotes } from "@/pages/avaliacao-desempenho/painel/PainelLotes";
import { PainelMentoria } from "@/pages/avaliacao-desempenho/painel/PainelMentoria";
import { PainelFormularios } from "@/pages/avaliacao-desempenho/painel/PainelFormularios";
import { TarefasGeraisAba } from "@/pages/monitoramento/TarefasGeraisAba";
import { CronogramasGeraisAba } from "@/pages/monitoramento/CronogramasGeraisAba";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* A home é /projetos: é o que a pessoa abre todo dia. */}
          <Route path="/" element={<Navigate to="/projetos" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          {/* Pública e obrigatoriamente ACIMA do catch-all: é o destino do link
              que vai no e-mail, e quem clica nele está justamente sem conseguir
              logar. Caindo no `*` iria para /projetos e de lá para /login. */}
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route element={<PrivateRoute />}>
            {/* Primeiro acesso: dentro do PrivateRoute (exige sessão) e
                FORA do Layout, quem ainda não definiu a senha não deve ver o
                menu de uma plataforma que o backend recusa a servir. */}
            <Route path="/definir-senha" element={<DefinirSenha />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Desempenho />} />
              <Route path="/bancas" element={<Bancas />} />
                <Route path="/meu-perfil" element={<MeuPerfil />} />
                <Route path="/vagas" element={<Vagas />} />
              {/* /calendario agora agrega os 4 tipos; a visão
                  só-de-bancas foi RELOCADA para /bancas/calendario, intacta. */}
              {/* /calendario agrega os 4 tipos; a página só-de-bancas
                  foi removida, o filtro "Banca" aqui já cobre o mesmo caso
                  de uso ("calendário pra não sobrepor horários") sem
                  duplicar a tela. */}
              <Route path="/calendario" element={<CalendarioGeral />} />

              {/* Sem guard: todo perfil tem notificação. O que muda
                  é o conteúdo, e quem recorta isso é o backend. */}
              <Route path="/notificacoes" element={<Notificacoes />} />

              <Route path="/projetos" element={<ProjetosList />} />
              {/* Criar projeto é a caixa de permissão `pode_criar_projeto` —
                  a mesma que decide o botão em `ProjetosList` e que o backend
                  já checava (`require_pode_criar_projeto`). Guard por posição
                  aqui travava quem tinha a caixa delegada sem ser
                  diretor/gerente: via o botão, clicava, e caía numa rota que
                  não deixava entrar. "Arquivados" não é rota própria, é só a
                  mesma <ProjetosList /> com outro recorte de conteúdo
                  (?modo=arquivados), travada por dentro com a permissão
                  `arquivar_projeto`. */}
              <Route element={<AdminRoute permissao="pode_criar_projeto" />}>
                <Route path="/projetos/novo" element={<ProjetoNovo />} />
              </Route>
              {/* Abas como sub-rotas: é o que deixa uma notificação abrir
                  direto em /projetos/42/tarefas. */}
              <Route path="/projetos/:id" element={<ProjetoPage />}>
                <Route index element={<ProjetoVisaoGeral />} />
                <Route path="cronograma" element={<ProjetoCronograma />} />
                <Route path="banca" element={<ProjetoBanca />} />
                <Route path="tarefas" element={<ProjetoTarefas />} />
                <Route path="historico" element={<ProjetoHistorico />} />
              </Route>

              {/* monitoramento é por CARGO (`pode_ver_monitoramento`), não
                  por posição, mesma caixa que a Sidebar já lê pra decidir se
                  mostra o link. Guardar por posição aqui deixava o link
                  visível pra quem tivesse a permissão de cargo mas não fosse
                  literalmente diretor/gerente, e a rota chutava pra
                  /projetos ao clicar. O backend revalida com require_gestao. */}
              <Route element={<AdminRoute permissao="pode_ver_monitoramento" />}>
                <Route path="/monitoramento" element={<MonitoramentoLayout />}>
                  <Route index element={<VisaoGeralAba />} />
                  {/* Só a diretoria decide, o backend cobra
                      `require_diretor` na rota; o guard aqui evita a tela
                      vazia com 403 para quem chega pela URL. */}
                  <Route path="aprovacoes" element={<AprovacoesAba />} />
                  <Route path="execucao" element={<ExecucaoAba />} />
                  <Route path="alocacao" element={<AlocacaoAba />} />
                  <Route path="atrasos" element={<AtrasosAba />} />
                  <Route path="graficos" element={<GraficosAba />} />
                <Route path="historico" element={<HistoricoAba />} />
                  <Route path="tarefas" element={<TarefasGeraisAba />} />
                  <Route path="cronogramas" element={<CronogramasGeraisAba />} />
                </Route>
              </Route>

              {/* Avaliação de Desempenho (periódica/finalização), não
                  confundir com /avaliacoes (feedback de banca) nem com
                  /dashboard (Desempenho.tsx, % de bancas atendidas). */}
              <Route path="/avaliacao-desempenho" element={<AvaliacaoDesempenho />} />
              <Route path="/avaliacao-desempenho/relatorio" element={<MeuRelatorio />} />

              {/* Mentor pode ser coordenador, gerente ou diretor (2026-08-06) —
                  não só coordenador. */}
              <Route element={<RequirePosicao posicoes={["coordenador", "gerente", "diretor"]} />}>
                <Route path="/avaliacao-desempenho/mentorados" element={<MeusMentorados />} />
              </Route>

              <Route element={<AdminRoute permissao="pode_administrar_desempenho" />}>
                <Route path="/avaliacao-desempenho/painel" element={<PainelDesempenho />}>
                  <Route index element={<Navigate to="avaliadores" replace />} />
                  <Route path="avaliadores" element={<PainelAvaliadores />} />
                  <Route path="avaliados" element={<PainelAvaliados />} />
                  <Route path="relatorio" element={<PainelRelatorio />} />
                  <Route path="lotes" element={<PainelLotes />} />
                  <Route path="mentoria" element={<PainelMentoria />} />
                </Route>
              </Route>

              {/* Fora do shell do painel acima, sem o TabBar do resto do
                  painel. Editar os formulários é mais sensível que administrar
                  lotes/mentoria/pdi (muda o que todo mundo é avaliado), então
                  tem caixa de cargo própria. */}
              <Route element={<AdminRoute permissao="pode_editar_formularios_desempenho" />}>
                <Route path="/avaliacao-desempenho/painel/formularios" element={<PainelFormularios />} />
              </Route>

              {/* Esconder o item na Sidebar não protege a rota: sem estes
                  guards, digitar /membros na barra de endereço abre a tela. */}
              <Route element={<FormularioRoute />}>
                <Route path="/avaliacoes" element={<Avaliacoes />} />
              </Route>
              {/* Config edita as permissões de qualquer posição, inclusive
                  esta mesma caixa, então é a mais sensível das 4
                  estendidas. Calendários base entrou junto por já viver na
                  mesma trava antes. */}
              <Route element={<AdminRoute permissao="pode_administrar_configuracoes" />}>
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
