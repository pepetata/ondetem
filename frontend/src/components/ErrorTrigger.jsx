import { useState } from "react";

const ErrorTrigger = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    // This will trigger an error that the ErrorBoundary will catch
    throw new Error("Demonstração de erro capturado pelo ErrorBoundary");
  }

  const triggerJavaScriptError = () => {
    // Add a small delay to make it more obvious what's happening
    setTimeout(() => {
      setShouldError(true);
    }, 100);
  };

  const triggerConsoleError = () => {
    // This will just log an error, not trigger ErrorBoundary
    console.error(
      "Este é apenas um erro no console - não aciona o ErrorBoundary"
    );
    alert(
      "Erro logado no console (veja o F12). Este não aciona o ErrorBoundary."
    );
  };

  return (
    <div
      style={{
        padding: "2rem",
        background: "#f8f9fa",
        borderRadius: "8px",
        margin: "1rem",
        border: "2px solid #e9ecef",
      }}
    >
      <h3>🧪 Teste do ErrorBoundary</h3>
      <p>Use estes botões para demonstrar como o ErrorBoundary funciona:</p>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "1rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={triggerJavaScriptError}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "1rem",
          }}
        >
          ⚠️ Erro JavaScript (Aciona ErrorBoundary)
        </button>

        <button
          onClick={triggerConsoleError}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "1rem",
          }}
        >
          📝 Erro Console (Só loga)
        </button>
      </div>

      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          backgroundColor: "#fff3cd",
          borderRadius: "6px",
          border: "1px solid #ffeaa7",
        }}
      >
        <p style={{ fontSize: "0.9rem", color: "#856404", margin: 0 }}>
          <strong>⚠️ Erro JavaScript:</strong> Irá substituir toda a página pela
          tela do ErrorBoundary
          <br />
          <strong>📝 Erro Console:</strong> Será apenas logado no console (F12)
        </p>
      </div>
    </div>
  );
};

export default ErrorTrigger;
