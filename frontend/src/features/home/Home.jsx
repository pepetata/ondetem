import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllAdsThunk,
  searchAdsThunk,
  setCurrentAd,
} from "../../redux/adSlice";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";
import { generateAdSlug } from "../../utils/slugify";
import FavoriteButton from "../../components/FavoriteButton";
import "../../scss/Home.scss";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allAds = useSelector((state) => state.ads.ads);
  const searchLoading = useSelector((state) => state.ads.searchLoading);
  const [imageIndices, setImageIndices] = useState({});
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showCategories, setShowCategories] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Category images with their search terms
  const categoryImages = [
    {
      image: "beautyshop.png",
      searchTerm: "beleza",
      label: "Beleza e Estética",
    },
    { image: "bussiness.jpg", searchTerm: "negócio", label: "Negócios" },
    { image: "food.jpg", searchTerm: "restaurante", label: "Alimentação" },
    { image: "furniture.jpg", searchTerm: "móveis", label: "Móveis" },
    {
      image: "matconstrucao.jpg",
      searchTerm: "construção",
      label: "Construção",
    },
    { image: "pet.jpg", searchTerm: "pet", label: "Animais" },
  ];

  // console.log(`All Ads: ${JSON.stringify(allAds)}`);
  useEffect(() => {
    document.title = "Onde Tem?";
  }, []);

  // Load ads initially to show featured carousel and for category searches
  useEffect(() => {
    dispatch(getAllAdsThunk());
  }, [dispatch]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() === "") {
        // If search is empty, show categories and hide ads
        setIsSearching(false);
        setShowCategories(true);
      } else {
        // Perform database search and hide categories
        setIsSearching(true);
        setShowCategories(false);
        dispatch(searchAdsThunk(searchTerm.trim()));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, dispatch]);

  // Initialize featured ads - only ads with images - Show only during search results
  useEffect(() => {
    if (allAds && allAds.length > 0 && isSearching) {
      const adsWithImages = allAds.filter(
        (ad) =>
          ad.images &&
          ad.images.length > 0 &&
          ad.images[0] &&
          ad.images[0].trim() !== ""
      );

      // Get 10 random ads for the carousel from search results
      const shuffled = adsWithImages
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
      setFeaturedAds(shuffled);
      setCurrentCarouselIndex(0);
    } else {
      // Don't show featured ads on initial home page
      setFeaturedAds([]);
    }
  }, [allAds, isSearching]);

  // Initialize image rotation for ads with images (DISABLED to prevent server overload)
  useEffect(() => {
    if (allAds && allAds.length > 0) {
      const newImageIndices = {};
      allAds.forEach((ad) => {
        if (ad.images && ad.images.length > 0) {
          newImageIndices[ad.id] = 0; // Always show first image
        }
      });
      setImageIndices(newImageIndices);
    }
  }, [allAds]);

  // REMOVED: Auto-rotating images to prevent server overload
  // Users can still see all images when they click on the ad

  // Manual carousel control (no auto-rotation to prevent server overload)
  // Users can click arrows to navigate

  // Handle category image click
  const handleCategoryClick = (category) => {
    setSearchTerm(category.searchTerm);
  };

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

  // Show message when search returns no results
  const showNoResults = isSearching && allAds && allAds.length === 0;
  const showAds = !showCategories && allAds && allAds.length > 0;

  return (
    <Container fluid className="home-container">
      {/* Search Bar - Full width, no columns */}
      <div className="search-section-top mb-4">
        <Container>
          <div className="search-container-top">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="form-control search-input"
                placeholder="pesquisar anúncios por título, descrição ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={searchLoading}
              />
              <button
                className="search-btn"
                type="button"
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  >
                    <span className="visually-hidden">Pesquisando...</span>
                  </div>
                ) : (
                  <img
                    src="/images/search.png"
                    alt="Search"
                    className="search-icon"
                  />
                )}
              </button>
            </div>
            {searchTerm && (
              <div className="search-results-info">
                {isSearching ? (
                  <>Pesquisando por &ldquo;{searchTerm}&rdquo;</>
                ) : (
                  <>
                    Mostrando {allAds?.length || 0} resultado(s) para &ldquo;
                    {searchTerm}&rdquo;
                  </>
                )}
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                  disabled={searchLoading}
                >
                  <i className="fas fa-times"></i> Limpar
                </button>
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* Category Images - Show when not searching */}
      {showCategories && (
        <div
          className="categories-section category-grid mb-5"
          data-testid="category-grid"
        >
          <Container>
            <Row className="justify-content-center" data-testid="category-row">
              {categoryImages.map((category, index) => (
                <Col
                  xs={6}
                  sm={4}
                  md={4}
                  lg={4}
                  xl={4}
                  key={index}
                  className="mb-4"
                >
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="category-image-container">
                      <img
                        src={`/images/${category.image}`}
                        alt={category.label}
                        className="category-image"
                        data-testid="category-image"
                        onError={(e) => {
                          e.target.src = "/images/nophoto.jpg";
                        }}
                      />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </div>
      )}

      {/* Featured Ads Carousel - Show only during search results */}
      {!showCategories && featuredAds.length > 0 && (
        <div className="featured-ads-section">
          <Container>
            <h3 className="featured-ads-title text-center mb-4">
              <i className="fas fa-star"></i> Anúncios em Destaque
            </h3>
            <div className="featured-ads-carousel">
              {featuredAds.length > 1 && (
                <button
                  className="carousel-btn carousel-btn-left"
                  onClick={() => scrollCarousel("left")}
                  aria-label="Anúncio anterior"
                >
                  <span>‹</span>
                </button>
              )}

              <div className="carousel-wrapper">
                <div className="single-ad-container">
                  {featuredAds[currentCarouselIndex] && (
                    <div
                      className="featured-ad-card-single"
                      onClick={() =>
                        handleAdClick(featuredAds[currentCarouselIndex])
                      }
                    >
                      <div className="featured-ad-image-single">
                        <img
                          src={getFirstImage(featuredAds[currentCarouselIndex])}
                          alt={featuredAds[currentCarouselIndex].title}
                          onError={(e) => {
                            e.target.src = "/images/nophoto.jpg";
                          }}
                        />
                        <div className="featured-overlay">
                          <div className="featured-overlay-content">
                            <i className="fas fa-search"></i>
                          </div>
                        </div>
                      </div>
                      <div className="featured-ad-content-single">
                        <h4 className="featured-ad-title-single">
                          {featuredAds[currentCarouselIndex].title}
                        </h4>
                        <div className="featured-ad-price-single">
                          <i className="fas fa-tag"></i> R${" "}
                          {featuredAds[currentCarouselIndex].price ||
                            "Consulte"}
                        </div>
                        <div className="featured-ad-location-single">
                          <i className="fas fa-map-marker-alt"></i>{" "}
                          {featuredAds[currentCarouselIndex].city},{" "}
                          {featuredAds[currentCarouselIndex].state}
                        </div>
                        <p className="featured-ad-description-single">
                          {featuredAds[currentCarouselIndex].short ||
                            featuredAds[
                              currentCarouselIndex
                            ].description?.substring(0, 150) + "..." ||
                            "Veja mais detalhes clicando no anúncio"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {featuredAds.length > 1 && (
                <button
                  className="carousel-btn carousel-btn-right"
                  onClick={() => scrollCarousel("right")}
                  aria-label="Próximo anúncio"
                >
                  <span>›</span>
                </button>
              )}
            </div>

            {/* Carousel Indicators */}
            {featuredAds.length > 1 && (
              <div className="carousel-indicators">
                {featuredAds.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${index === currentCarouselIndex ? "active" : ""}`}
                    onClick={() => setCurrentCarouselIndex(index)}
                    aria-label={`Ir para anúncio ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </Container>
        </div>
      )}

      {/* Search Results - Show when searching */}
      {!showCategories && (
        <div className="search-results-section">
          <Container fluid>
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
              <Col
                xl={8}
                lg={8}
                md={12}
                sm={12}
                xs={12}
                className="main-content"
              >
                <div className="text-center mb-4">
                  <h2>Resultados da Pesquisa</h2>
                  <p className="text-muted">
                    {searchLoading
                      ? "Pesquisando..."
                      : allAds?.length && allAds?.length > 0
                        ? `${allAds?.length || 0} anúncios encontrados`
                        : ""}
                  </p>
                </div>

                {/* No Results Message */}
                {showNoResults && (
                  <div className="no-results-message text-center mb-4">
                    <i
                      className="fas fa-search text-muted"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <p className="text-muted">
                      Não encontramos anúncios que correspondam à sua pesquisa.
                      <br />
                      Tente usar termos diferentes ou menos específicos.
                    </p>
                  </div>
                )}

                {/* Ads List - only show when there are results */}
                {showAds && (
                  <div className="ads-list">
                    {allAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="ad-row mb-3"
                        onClick={() => handleAdClick(ad)}
                      >
                        <Row className="align-items-center g-3">
                          {/* Column 1: Static Image (no rotation to prevent server overload) */}
                          <Col xs={3} className="image-column">
                            <div className="ad-image-container">
                              <img
                                src={getFirstImage(ad)}
                                alt={ad.title}
                                className="ad-image"
                                onError={(e) => {
                                  e.target.src = "/images/nophoto.jpg";
                                }}
                              />
                              {ad.images && ad.images.length > 1 && (
                                <div className="image-counter">
                                  1/{ad.images.length}
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
                )}
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
        </div>
      )}
    </Container>
  );
};

export default Home;
