import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Desempenho } from "@/pages/Desempenho"; // ← import novo
import { Bancas } from "@/pages/Bancas";         // ← import novo

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Desempenho />} /> {/* ← trocado */}
              <Route path="/bancas" element={<Bancas />} />         {/* ← linha nova */}
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}