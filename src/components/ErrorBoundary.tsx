import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  erro: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error("Erro na aplicação:", erro, info.componentStack);
  }

  render() {
    if (this.state.erro) {
      return (
        <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "40rem" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Algo deu errado</h1>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            A aplicação encontrou um erro. Tente recarregar a página.
          </p>
          <pre
            style={{
              padding: "1rem",
              background: "#f5f5f5",
              borderRadius: "8px",
              overflow: "auto",
              fontSize: "0.875rem",
            }}
          >
            {this.state.erro.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
