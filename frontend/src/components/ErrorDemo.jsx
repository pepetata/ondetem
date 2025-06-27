import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, handleErrorNotification } from "../utils/apiErrorHandler";
import { useDispatch } from "react-redux";
import { setNotification } from "../redux/notificationSlice";
import ErrorTrigger from "./ErrorTrigger";
import "./ErrorDemo.scss";

const ErrorDemo = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const testApiErrors = async (endpoint, description) => {
    setLoading(true);
    try {
      await apiFetch(`http://localhost:3000${endpoint}`);
      dispatch(
        setNotification({
          type: "success",
          message: `${description}: Sucesso inesperado!`,
          duration: 3000,
        })
      );
    } catch (error) {
      handleErrorNotification(error, (notification) =>
        dispatch(setNotification(notification))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="error-demo-container">
      <div className="error-demo-content">
        <h1>🛠️ Demonstração de Tratamento de Erros</h1>
        <p className="demo-description">
          Esta página demonstra como a aplicação trata diferentes tipos de erros
          de forma amigável ao usuário.
        </p>

        <div className="demo-section">
          <h2>📱 Erros de Página (Frontend)</h2>
          <p>Teste como o frontend lida com páginas que não existem:</p>
          <div className="demo-buttons">
            <Link to="/pagina-inexistente" className="btn btn-outline">
              Página Inexistente
            </Link>
            <Link to="/admin/dashboard" className="btn btn-outline">
              Área Admin (não existe)
            </Link>
            <Link to="/user/999999/profile" className="btn btn-outline">
              Perfil Inválido
            </Link>
          </div>
        </div>

        <div className="demo-section">
          <h2>🌐 Erros de API (Backend)</h2>
          <p>
            Teste como a aplicação trata erros da API com mensagens amigáveis:
          </p>
          <div className="demo-buttons">
            <button
              onClick={() =>
                testApiErrors("/api/users/999999", "Usuário inexistente")
              }
              className="btn btn-outline"
              disabled={loading}
            >
              Usuário ID inválido (404)
            </button>
            <button
              onClick={() =>
                testApiErrors("/api/ads/invalid-uuid", "Anúncio UUID inválido")
              }
              className="btn btn-outline"
              disabled={loading}
            >
              UUID inválido (404)
            </button>
            <button
              onClick={() =>
                testApiErrors(
                  "/api/endpoint-inexistente",
                  "Endpoint inexistente"
                )
              }
              className="btn btn-outline"
              disabled={loading}
            >
              Endpoint inexistente (404)
            </button>
          </div>
        </div>

        <div className="demo-section">
          <h2>🛡️ Teste do ErrorBoundary</h2>
          <p>Demonstre como o sistema captura e trata erros JavaScript:</p>
          <ErrorTrigger />
        </div>

        <div className="demo-section">
          <h2>✨ Recursos Implementados</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🎯 Página 404 Personalizada</h3>
              <p>
                Página amigável com orientações claras e botões de ação para
                usuários perdidos.
              </p>
            </div>
            <div className="feature-card">
              <h3>🔍 Validação de Entrada</h3>
              <p>
                Backend valida UUIDs e formatos antes de consultar o banco de
                dados.
              </p>
            </div>
            <div className="feature-card">
              <h3>💬 Mensagens em Português</h3>
              <p>
                Todas as mensagens de erro são claras e em português brasileiro.
              </p>
            </div>
            <div className="feature-card">
              <h3>🛡️ Tratamento Robusto</h3>
              <p>
                Sistema lida graciosamente com erros de rede, APIs e navegação.
              </p>
            </div>
          </div>
        </div>

        <div className="demo-actions">
          <Link to="/" className="btn btn-primary">
            ← Voltar ao início
          </Link>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Testando...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDemo;
