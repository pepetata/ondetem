import { useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserFavorites } from "../../redux/favoritesSlice";
import { generateAdSlug } from "../../utils/slugify";
import FavoriteButton from "../../components/FavoriteButton";
import "../../scss/Favorites.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Favorites = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { favorites, loading, error } = useSelector((state) => state.favorites);

  useEffect(() => {
    document.title = "Meus Favoritos - Onde Tem";
    if (user) {
      dispatch(fetchUserFavorites());
    }
  }, [dispatch, user]);

  const handleAdClick = (ad) => {
    const slug = generateAdSlug(ad) || "anuncio";
    navigate(`/ad/view/${slug}/${ad.id}`);
  };

  const getImageUrl = (ad) => {
    if (ad.images && ad.images.length > 0) {
      return `${API_URL}/uploads/ad_images/${ad.images[0]}`;
    }
    return "/images/nophoto.jpg";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (!user) {
    return (
      <Container className="favorites-container">
        <div className="text-center mt-5">
          <h2>Você precisa estar logado para ver seus favoritos</h2>
          <Button variant="primary" onClick={() => navigate("/login")}>
            Fazer Login
          </Button>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="favorites-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando favoritos...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="favorites-container">
        <div className="text-center mt-5">
          <h2>Erro ao carregar favoritos</h2>
          <p>{error}</p>
          <Button
            variant="primary"
            onClick={() => dispatch(fetchUserFavorites())}
          >
            Tentar Novamente
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="favorites-container">
      <Row>
        <Col>
          <div className="page-header">
            <h1>❤️ Meus Favoritos</h1>
            <p className="text-muted">
              {favorites.length}{" "}
              {favorites.length === 1
                ? "anúncio favoritado"
                : "anúncios favoritados"}
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💔</div>
              <h3>Nenhum favorito ainda</h3>
              <p>Quando você favoritar anúncios, eles aparecerão aqui!</p>
              <Button variant="primary" onClick={() => navigate("/")}>
                Explorar Anúncios
              </Button>
            </div>
          ) : (
            <Row>
              {favorites.map((ad) => (
                <Col key={ad.id} xs={12} sm={6} lg={4} className="mb-4">
                  <Card className="favorite-card h-100">
                    <div className="card-image-container">
                      <Card.Img
                        variant="top"
                        src={getImageUrl(ad)}
                        alt={ad.title}
                        className="card-image"
                        onError={(e) => {
                          e.target.src = "/images/nophoto.jpg";
                        }}
                      />
                      <div className="favorite-overlay">
                        <FavoriteButton adId={ad.id} />
                      </div>
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="ad-title">{ad.title}</Card.Title>
                      {ad.short && (
                        <Card.Text className="ad-short text-muted">
                          {ad.short}
                        </Card.Text>
                      )}

                      <div className="ad-details">
                        {ad.city && (
                          <Badge
                            bg="light"
                            text="dark"
                            className="location-badge"
                          >
                            📍 {ad.city}, {ad.state}
                          </Badge>
                        )}
                        {ad.tags && (
                          <Badge bg="primary" className="tags-badge">
                            🏷️ {ad.tags}
                          </Badge>
                        )}
                      </div>

                      <div className="card-footer-info">
                        <small className="text-muted">
                          Favoritado em {formatDate(ad.favorited_at)}
                        </small>
                      </div>

                      <Button
                        variant="primary"
                        className="mt-auto"
                        onClick={() => handleAdClick(ad)}
                      >
                        Ver Detalhes
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Favorites;
