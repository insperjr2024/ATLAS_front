import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
