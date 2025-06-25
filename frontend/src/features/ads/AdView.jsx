import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Badge, Button } from "react-bootstrap";
import { getAdThunk } from "../../redux/adSlice";
import FavoriteButton from "../../components/FavoriteButton";
import "../../scss/AdView.scss";

const AdView = () => {
  const { id, title } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentAd, loading } = useSelector((state) => state.ads);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Use the id parameter directly
  const actualId = id;

  useEffect(() => {
    if (actualId) {
      dispatch(getAdThunk(actualId));
    }
  }, [actualId, dispatch]);

  // Scroll to top when component mounts or ad changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [actualId]);

  useEffect(() => {
    if (currentAd) {
      document.title = `${currentAd.title} - Onde Tem?`;
    }
  }, [currentAd]);

  // Auto-advance image carousel
  useEffect(() => {
    if (currentAd?.images?.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % currentAd.images.length);
      }, 4000); // 4 seconds

      return () => clearInterval(interval);
    }
  }, [currentAd?.images?.length]);

  if (loading || !currentAd) {
    return (
      <Container className="ad-view-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando anúncio...</p>
        </div>
      </Container>
    );
  }

  const handleImageSelect = (index) => {
    setCurrentImageIndex(index);
  };

  const handleContactClick = (type, value) => {
    switch (type) {
      case "phone":
        window.open(`tel:${value}`);
        break;
      case "whatsapp":
        window.open(`https://wa.me/55${value.replace(/\D/g, "")}`);
        break;
      case "email":
        window.open(`mailto:${value}`);
        break;
      case "website":
        window.open(value, "_blank");
        break;
    }
  };

  const getCurrentImage = () => {
    if (!currentAd.images || currentAd.images.length === 0) {
      return "/images/nophoto.jpg";
    }
    return `${API_URL}/uploads/ad_images/${currentAd.images[currentImageIndex]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="ad-view-container">
      {/* Hero Section with Main Image */}
      <section className="hero-section">
        <div className="hero-image-container">
          <img
            src={getCurrentImage()}
            alt={currentAd.title}
            className="hero-image"
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              e.target.src = "/images/nophoto.jpg";
              setImageLoading(false);
            }}
          />
          {imageLoading && <div className="image-loading-overlay" />}

          {/* Image Navigation */}
          {currentAd.images && currentAd.images.length > 1 && (
            <>
              <button
                className="nav-btn nav-btn-prev"
                onClick={() =>
                  setCurrentImageIndex(
                    currentImageIndex === 0
                      ? currentAd.images.length - 1
                      : currentImageIndex - 1
                  )
                }
              >
                ❮
              </button>
              <button
                className="nav-btn nav-btn-next"
                onClick={() =>
                  setCurrentImageIndex(
                    (currentImageIndex + 1) % currentAd.images.length
                  )
                }
              >
                ❯
              </button>

              {/* Image Counter */}
              <div className="image-counter">
                {currentImageIndex + 1} / {currentAd.images.length}
              </div>
            </>
          )}
        </div>

        {/* Hero Overlay Content */}
        <div className="hero-overlay">
          <Container>
            <Row>
              <Col lg={8}>
                <div className="hero-content">
                  <h1 className="hero-title">{currentAd.title}</h1>
                  {currentAd.short && (
                    <p className="hero-subtitle">{currentAd.short}</p>
                  )}
                  <div className="hero-badges">
                    {currentAd.city && (
                      <Badge bg="light" text="dark" className="location-badge">
                        📍 {currentAd.city}, {currentAd.state}
                      </Badge>
                    )}
                    {currentAd.tags && (
                      <Badge bg="primary" className="tags-badge">
                        🏷️ {currentAd.tags}
                      </Badge>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </section>

      {/* Image Thumbnails */}
      {currentAd.images && currentAd.images.length > 1 && (
        <section className="thumbnails-section">
          <Container>
            <div className="thumbnails-container">
              {currentAd.images.map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail ${index === currentImageIndex ? "active" : ""}`}
                  onClick={() => handleImageSelect(index)}
                >
                  <img
                    src={`${API_URL}/uploads/ad_images/${image}`}
                    alt={`${currentAd.title} - Imagem ${index + 1}`}
                    onError={(e) => {
                      e.target.src = "/images/nophoto.jpg";
                    }}
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Main Content */}
      <Container className="main-content">
        <Row>
          {/* Description Column */}
          <Col lg={8} className="description-section">
            <Card className="glass-card description-card">
              <Card.Body>
                <h2 className="section-title">📝 Descrição</h2>
                <p className="description-text">
                  {currentAd.description || "Nenhuma descrição disponível."}
                </p>
              </Card.Body>
            </Card>

            {/* Location & Schedule */}
            <Row className="info-cards">
              {(currentAd.address1 || currentAd.zipcode) && (
                <Col md={6}>
                  <Card className="glass-card info-card">
                    <Card.Body>
                      <h3 className="card-title">📍 Localização</h3>
                      <div className="location-info">
                        {currentAd.address1 && (
                          <p>
                            {currentAd.address1} {currentAd.streetnumber}
                          </p>
                        )}
                        {currentAd.address2 && <p>{currentAd.address2}</p>}
                        {currentAd.zipcode && <p>CEP: {currentAd.zipcode}</p>}
                        <p>
                          {currentAd.city} - {currentAd.state}
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}

              {(currentAd.startdate ||
                currentAd.finishdate ||
                currentAd.timetext) && (
                <Col md={6}>
                  <Card className="glass-card info-card">
                    <Card.Body>
                      <h3 className="card-title">📅 Horários</h3>
                      <div className="schedule-info">
                        {currentAd.startdate && (
                          <p>
                            <strong>Início:</strong>{" "}
                            {formatDate(currentAd.startdate)}
                          </p>
                        )}
                        {currentAd.finishdate && (
                          <p>
                            <strong>Fim:</strong>{" "}
                            {formatDate(currentAd.finishdate)}
                          </p>
                        )}
                        {currentAd.timetext && (
                          <p>
                            <strong>Horário:</strong> {currentAd.timetext}
                          </p>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          </Col>

          {/* Contact Sidebar */}
          <Col lg={4} className="contact-section">
            <Card className="glass-card contact-card sticky-card">
              <Card.Body>
                <h2 className="section-title">💬 Entre em Contato</h2>

                <div className="contact-buttons">
                  {currentAd.phone1 && (
                    <Button
                      variant="outline-primary"
                      className="contact-btn phone-btn"
                      onClick={() =>
                        handleContactClick("phone", currentAd.phone1)
                      }
                    >
                      📞 {currentAd.phone1}
                    </Button>
                  )}

                  {currentAd.whatsapp && (
                    <Button
                      variant="success"
                      className="contact-btn whatsapp-btn"
                      onClick={() =>
                        handleContactClick("whatsapp", currentAd.whatsapp)
                      }
                    >
                      💬 WhatsApp
                    </Button>
                  )}

                  {currentAd.email && (
                    <Button
                      variant="outline-info"
                      className="contact-btn email-btn"
                      onClick={() =>
                        handleContactClick("email", currentAd.email)
                      }
                    >
                      ✉️ E-mail
                    </Button>
                  )}

                  {currentAd.website && (
                    <Button
                      variant="outline-warning"
                      className="contact-btn website-btn"
                      onClick={() =>
                        handleContactClick("website", currentAd.website)
                      }
                    >
                      🌐 Website
                    </Button>
                  )}

                  {currentAd.phone2 && (
                    <Button
                      variant="outline-secondary"
                      className="contact-btn phone2-btn"
                      onClick={() =>
                        handleContactClick("phone", currentAd.phone2)
                      }
                    >
                      📱 {currentAd.phone2}
                    </Button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <FavoriteButton
                    adId={currentAd.id}
                    variant="outline-danger"
                    className="action-btn favorite-btn"
                    size="md"
                  />

                  <Button
                    variant="outline-primary"
                    className="action-btn share-btn"
                  >
                    🔗 Compartilhar
                  </Button>
                </div>

                {/* Back Button */}
                <Button
                  variant="secondary"
                  className="back-btn"
                  onClick={() => navigate(-1)}
                >
                  ← Voltar
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdView;
