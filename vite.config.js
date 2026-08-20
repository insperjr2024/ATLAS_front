import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
    // Espelha no dev o rewrite que a Vercel faz em produção (vercel.json): o
    // navegador só fala com o dev server, e ele repassa para o Railway. Serve
    // para quando a rede bloqueia o domínio `.up.railway.app`.
    //
    // ⚠ Só tem efeito com `VITE_API_URL=/api` no `.env` — sem isso o front usa
    // o fallback `http://localhost:8000` (src/config/config.ts) e nada passa
    // por aqui. E com ele o dev passa a escrever no banco de PRODUÇÃO.
    server: {
        proxy: {
            "/api": {
                target: "https://atlas-back-production-xcfvgh.up.railway.app",
                changeOrigin: true,
                // As rotas do back não têm o prefixo `/api` (/auth/login, /bancas…),
                // então ele sai aqui.
                rewrite: (rota) => rota.replace(/^\/api/, ""),
            },
        },
    },
});
