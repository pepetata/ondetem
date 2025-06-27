import React from "react";
import PropTypes from "prop-types";
import "./ErrorBoundary.scss";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Oops! Algo deu errado</h2>
            <p>
              Encontramos um problema inesperado. Por favor, recarregue a página
              ou tente novamente mais tarde.
            </p>
            <div className="error-actions">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Recarregar página
              </button>
              <button
                onClick={() => {
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                  });
                }}
                className="btn btn-secondary"
              >
                Tentar novamente
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-details">
                <summary>Detalhes técnicos (modo desenvolvimento)</summary>
                <pre>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default ErrorBoundary;
