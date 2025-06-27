import { Link } from "react-router-dom";
import "./NotFound.scss";

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Página não encontrada</h2>
        <p className="not-found-message">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            Voltar ao início
          </Link>
          <Link to="/ad" className="btn btn-secondary">
            Criar anúncio
          </Link>
        </div>
        <div className="not-found-suggestions">
          <h3>Você pode tentar:</h3>
          <ul>
            <li>Verificar se o endereço está correto</li>
            <li>Usar a busca no menu principal</li>
            <li>Navegar pelas categorias de anúncios</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
