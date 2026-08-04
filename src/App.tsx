import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { AdminRoute } from "@/routes/AdminRoute";
import { FormularioRoute } from "@/routes/FormularioRoute";
import { RequirePosicao } from "@/routes/RequirePosicao";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Desempenho } from "@/pages/Desempenho";
import { Bancas } from "@/pages/Bancas";
import { Calendario } from "@/pages/Calendario";
import { Nucleo } from "@/pages/Nucleo";
import { Membros } from "@/pages/Membros";
import { Avaliacoes } from "@/pages/Avaliacoes";
import { Config } from "@/pages/Config";
import { ProjetosList } from "@/pages/projetos/ProjetosList";
import { ProjetoNovo } from "@/pages/projetos/ProjetoNovo";
import { ProjetoPage } from "@/pages/projetos/ProjetoPage";
import { ProjetoVisaoGeral } from "@/pages/projetos/ProjetoVisaoGeral";
import { ProjetoHistorico } from "@/pages/projetos/ProjetoHistorico";
import { AbaEmBreve } from "@/pages/projetos/AbaEmBreve";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 🏠 A home é /projetos: é o que a pessoa abre todo dia. */}
          <Route path="/" element={<Navigate to="/projetos" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Desempenho />} />
              <Route path="/bancas" element={<Bancas />} />
              <Route path="/calendario" element={<Calendario />} />

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
                <Route
                  path="cronograma"
                  element={
                    <AbaEmBreve
                      titulo="Cronograma pintado"
                      descricao="O calendário pintável com etapas, marcos e export em PNG/PDF entra na fatia F6."
                    />
                  }
                />
                <Route
                  path="tarefas"
                  element={
                    <AbaEmBreve
                      titulo="Tarefas"
                      descricao="O kanban de 5 colunas com arrastar-e-soltar entra na fatia F7."
                    />
                  }
                />
                <Route
                  path="reunioes"
                  element={
                    <AbaEmBreve
                      titulo="Reuniões semanais"
                      descricao="O registro da reunião na faixa seg–dom entra na fatia F8."
                    />
                  }
                />
                <Route path="historico" element={<ProjetoHistorico />} />
              </Route>

              {/* Esconder o item na Sidebar não protege a rota: sem estes
                  guards, digitar /membros na barra de endereço abre a tela. */}
              <Route element={<FormularioRoute />}>
                <Route path="/avaliacoes" element={<Avaliacoes />} />
              </Route>
              <Route element={<AdminRoute />}>
                <Route path="/nucleo" element={<Nucleo />} />
                <Route path="/membros" element={<Membros />} />
                <Route path="/config" element={<Config />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
