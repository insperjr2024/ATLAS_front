import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Desempenho } from "@/pages/Desempenho";
import { Bancas } from "@/pages/Bancas";
import { Calendario } from "@/pages/Calendario";
import { Nucleo } from "@/pages/Nucleo";
import { Membros } from "@/pages/Membros";
import { Avaliacoes } from "@/pages/Avaliacoes";
import { Config } from "@/pages/Config";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Desempenho />} />
              <Route path="/bancas" element={<Bancas />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/avaliacoes" element={<Avaliacoes />} />
              <Route path="/nucleo" element={<Nucleo />} />
              <Route path="/membros" element={<Membros />} />
              <Route path="/config" element={<Config />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
