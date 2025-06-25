import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllAdsThunk, setCurrentAd } from "../../redux/adSlice";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";
import { generateAdSlug } from "../../utils/slugify";
import FavoriteButton from "../../components/FavoriteButton";
import "../../scss/Home.scss";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allAds = useSelector((state) => state.ads.ads);
  const [imageIndices, setImageIndices] = useState({});
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAds, setFilteredAds] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // console.log(`All Ads: ${JSON.stringify(allAds)}`);
  useEffect(() => {
    document.title = "Onde Tem?";
  }, []);

  useEffect(() => {
    dispatch(getAllAdsThunk());
  }, [dispatch]);

  // Initialize featured ads - only ads with images
  useEffect(() => {
    if (allAds && allAds.length > 0) {
      const adsWithImages = allAds.filter(
        (ad) =>
          ad.images &&
          ad.images.length > 0 &&
          ad.images[0] &&
          ad.images[0].trim() !== ""
      );

      // Randomly shuffle and take first 6
      const shuffled = adsWithImages
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);
      setFeaturedAds(shuffled);
      setCurrentCarouselIndex(0);
    }
  }, [allAds]);

  // Initialize image rotation for ads with images
  useEffect(() => {
    if (allAds && allAds.length > 0) {
      const newImageIndices = {};
      allAds.forEach((ad) => {
        if (ad.images && ad.images.length > 0) {
          newImageIndices[ad.id] = 0;
        }
      });
      setImageIndices(newImageIndices);
    }
  }, [allAds]);

  // Rotate images with random intervals for each ad
  useEffect(() => {
    if (!allAds || allAds.length === 0) return;

    const intervals = {};

    allAds.forEach((ad) => {
      if (ad && ad.images && ad.images.length > 1) {
        // Random interval between 0.9 and 1.5 seconds for each ad
        const randomInterval = Math.random() * (1500 - 900) + 900;

        intervals[ad.id] = setInterval(() => {
          setImageIndices((prev) => ({
            ...prev,
            [ad.id]: (prev[ad.id] + 1) % ad.images.length,
          }));
        }, randomInterval);
      }
    });

    // Cleanup function
    return () => {
      Object.values(intervals).forEach((interval) => clearInterval(interval));
    };
  }, [allAds]); // Remove imageIndices dependency to avoid resetting intervals

  // Auto-rotate featured carousel every 3 seconds
  useEffect(() => {
    if (featuredAds.length > 1) {
      const carouselInterval = setInterval(() => {
        setCurrentCarouselIndex((prev) => (prev + 1) % featuredAds.length);
      }, 3000); // 3 seconds

      return () => clearInterval(carouselInterval);
    }
  }, [featuredAds]);

  const handleAdClick = (ad) => {
    dispatch(setCurrentAd(ad));
    const slug = generateAdSlug(ad);
    const url = `/ad/view/${slug}/${ad.id}`;
    navigate(url, {
      state: { from: "Home" },
    });
  };

  const getCurrentImage = (ad) => {
    if (!ad.images || ad.images.length === 0) {
      return "/images/nophoto.jpg";
    }
    const currentIndex = imageIndices[ad.id] || 0;
    return `${API_URL}/uploads/ad_images/${ad.images[currentIndex]}`;
  };

  const scrollCarousel = (direction) => {
    if (direction === "left") {
      setCurrentCarouselIndex((prev) =>
        prev === 0 ? featuredAds.length - 1 : prev - 1
      );
    } else {
      setCurrentCarouselIndex((prev) =>
        prev === featuredAds.length - 1 ? 0 : prev + 1
      );
    }
  };

  const getFirstImage = (ad) => {
    if (!ad.images || ad.images.length === 0) {
      return "/images/nophoto.jpg";
    }
    return `${API_URL}/uploads/ad_images/${ad.images[0]}`;
  };

  const getPlaceholderStat = (adId, max, offset = 0) => {
    // Use ad ID as seed for consistent random values
    const seed = parseInt(adId) || 1;
    const randomValue = ((seed + offset) * 37) % max;
    return Math.max(1, randomValue + 1);
  };

  if (!allAds || allAds.length === 0) {
    return (
      <Container fluid className="home-container">
        <Row>
          <Col xl={2} lg={2} md={2} className="sidebar-left d-none d-md-block">
            <div className="sidebar-content">
              <h6>Filtros</h6>
              <p>Nenhum filtro disponível</p>
            </div>
          </Col>
          <Col xl={8} lg={8} md={8} sm={12} xs={12} className="main-content">
            <div className="text-center">
              <h2>Todos os Anúncios</h2>
              <p>Nenhum anúncio encontrado.</p>
            </div>
          </Col>
          <Col xl={2} lg={2} md={2} className="sidebar-right d-none d-md-block">
            <div className="sidebar-content">
              <h6>Publicidade</h6>
              <p>Espaço disponível</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="home-container">
      <Row>
        {/* Left Sidebar - 20% */}
        <Col xl={2} lg={2} className="sidebar-left d-none d-lg-block">
          <div className="sidebar-content">
            <h6>Filtros</h6>
            <p>Categorias</p>
            <p>Localização</p>
            <p>Preço</p>
          </div>
        </Col>

        {/* Main Content - 60% on large screens, 100% on medium and below */}
        <Col xl={8} lg={8} md={12} sm={12} xs={12} className="main-content">
          <div className="text-center mb-4">
            <h2>Todos os Anúncios</h2>
            <p className="text-muted">{allAds.length} anúncios encontrados</p>
          </div>

          {/* Featured Ads Carousel */}
          {featuredAds.length > 0 && (
            <div className="featured-ads-section mb-5">
              <h4 className="featured-ads-title mb-3">
                <i className="fas fa-star text-warning me-2"></i>
                Anúncios em Destaque
              </h4>
              <div className="featured-ads-carousel">
                <button
                  className="carousel-btn carousel-btn-prev"
                  onClick={() => scrollCarousel("left")}
                >
                  <span>‹</span>
                </button>

                <div className="carousel-wrapper">
                  <div className="single-ad-container">
                    {featuredAds.length > 0 && (
                      <div
                        key={`featured-${featuredAds[currentCarouselIndex].id}`}
                        className="featured-ad-card-single"
                        onClick={() =>
                          handleAdClick(featuredAds[currentCarouselIndex])
                        }
                      >
                        <div className="featured-ad-image-single">
                          <img
                            src={getFirstImage(
                              featuredAds[currentCarouselIndex]
                            )}
                            alt={featuredAds[currentCarouselIndex].title}
                            onError={(e) => {
                              e.target.src = "/images/nophoto.jpg";
                            }}
                          />
                          <div className="featured-overlay">
                            <div className="featured-overlay-content">
                              <i className="fas fa-eye"></i>
                            </div>
                          </div>
                        </div>
                        <div className="featured-ad-content-single">
                          <h5 className="featured-ad-title-single">
                            {featuredAds[currentCarouselIndex].title}
                          </h5>
                          <p className="featured-ad-price-single">
                            <i className="fas fa-euro-sign me-2"></i>
                            {featuredAds[currentCarouselIndex].price
                              ? `${featuredAds[currentCarouselIndex].price}`
                              : "Sob consulta"}
                          </p>
                          <p className="featured-ad-location-single">
                            <i className="fas fa-map-marker-alt me-2"></i>
                            {featuredAds[currentCarouselIndex].location ||
                              "Localização não especificada"}
                          </p>
                          <p className="featured-ad-description-single">
                            {featuredAds[currentCarouselIndex].short ||
                              featuredAds[
                                currentCarouselIndex
                              ].description?.substring(0, 120) + "..." ||
                              "Sem descrição"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Carousel Indicators */}
                  <div className="carousel-indicators">
                    {featuredAds.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator ${index === currentCarouselIndex ? "active" : ""}`}
                        onClick={() => setCurrentCarouselIndex(index)}
                      />
                    ))}
                  </div>
                </div>

                <button
                  className="carousel-btn carousel-btn-next"
                  onClick={() => scrollCarousel("right")}
                >
                  <span>›</span>
                </button>
              </div>
            </div>
          )}

          <div className="ads-list">
            {allAds.map((ad) => (
              <div
                key={ad.id}
                className="ad-row mb-3"
                onClick={() => handleAdClick(ad)}
              >
                <Row className="align-items-center g-3">
                  {/* Column 1: Rotating Images */}
                  <Col xs={3} className="image-column">
                    <div className="ad-image-container">
                      <img
                        src={getCurrentImage(ad)}
                        alt={ad.title}
                        className="ad-image"
                        onError={(e) => {
                          e.target.src = "/images/nophoto.jpg";
                        }}
                      />
                      {ad.images && ad.images.length > 1 && (
                        <div className="image-counter">
                          {(imageIndices[ad.id] || 0) + 1}/{ad.images.length}
                        </div>
                      )}
                    </div>
                  </Col>

                  {/* Column 2: Title and Description */}
                  <Col xs={8} className="content-column">
                    <h5 className="ad-title">{ad.title}</h5>
                    <p className="ad-description">
                      {ad.short ||
                        ad.description?.substring(0, 150) + "..." ||
                        "Sem descrição"}
                    </p>
                  </Col>

                  {/* Column 3: Stats (Rating, Likes, Comments) */}
                  <Col xs={1} className="stats-column">
                    <div className="stat-line">
                      <img
                        src="/images/star.png"
                        alt="Rating"
                        className="stat-icon"
                      />
                      <span>{ad.rating || "ND"}</span>
                    </div>
                    <div className="stat-line favorite-line">
                      <FavoriteButton
                        adId={ad.id}
                        size="sm"
                        className="home-favorite-btn"
                      />
                      <span>{ad.likes}</span>
                    </div>
                    <div className="stat-line">
                      <img
                        src="/images/comment.png"
                        alt="Comments"
                        className="stat-icon"
                      />
                      <span>{ad.comments}</span>
                    </div>
                  </Col>
                </Row>
              </div>
            ))}
          </div>
        </Col>

        {/* Right Sidebar - 20% */}
        <Col xl={2} lg={2} className="sidebar-right d-none d-lg-block">
          <div className="sidebar-content">
            <h6>Publicidade</h6>
            <div className="ad-space">
              <p>Espaço para anúncios</p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
