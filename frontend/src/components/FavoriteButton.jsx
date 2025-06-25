import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  addToFavorites,
  removeFromFavorites,
  fetchFavoriteIds,
} from "../redux/favoritesSlice";
import { showNotification } from "../components/helper";
import LoginPromptModal from "./LoginPromptModal";
import PropTypes from "prop-types";

const FavoriteButton = ({ adId, className = "", size = "sm" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const favoriteIds = useSelector((state) => state.favorites.favoriteIds);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isFavorite = favoriteIds.includes(adId);

  useEffect(() => {
    // Load favorite IDs when user is available
    if (user && favoriteIds.length === 0) {
      dispatch(fetchFavoriteIds());
    }
  }, [user, favoriteIds.length, dispatch]);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Show modal instead of notification
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await dispatch(removeFromFavorites(adId)).unwrap();
      } else {
        await dispatch(addToFavorites(adId)).unwrap();
        // Trigger heart animation when adding to favorites
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 800);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      dispatch(
        showNotification({
          type: "error",
          message: "Erro ao atualizar favorito. Tente novamente.",
        })
      );
    }
    setIsLoading(false);
  };

  const handleLoginModalConfirm = () => {
    // Store current location to return after login
    sessionStorage.setItem("redirectAfterLogin", location.pathname);
    setShowLoginModal(false);
    navigate("/login");
  };

  const handleLoginModalCancel = () => {
    setShowLoginModal(false);
  };

  const iconSize = size === "sm" ? "20" : size === "lg" ? "28" : "24";

  return (
    <>
      <button
        className={`favorite-btn ${className} ${isFavorite ? "favorite-btn--active" : ""} ${size !== "md" ? `size-${size}` : ""} ${isAnimating ? "favorite-btn--animating" : ""}`}
        onClick={handleFavoriteClick}
        disabled={isLoading}
        title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        aria-label={
          isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
        }
      >
        {isLoading ? (
          <div className="favorite-btn__spinner">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <img
            src={isFavorite ? "/images/twohearts.png" : "/images/favorite.png"}
            alt={isFavorite ? "Favorito" : "Não favorito"}
            height={iconSize}
            className="favorite-btn__icon"
          />
        )}
        {size !== "sm" && (
          <span className="favorite-btn__text">
            {isFavorite ? "Remover" : "Favoritar"}
          </span>
        )}
      </button>

      <LoginPromptModal
        show={showLoginModal}
        onHide={handleLoginModalCancel}
        onLogin={handleLoginModalConfirm}
      />
    </>
  );
};

FavoriteButton.propTypes = {
  adId: PropTypes.string.isRequired,
  className: PropTypes.string,
  size: PropTypes.string,
};

export default FavoriteButton;
