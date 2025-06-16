import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
// import { useAuth } from "../context/AuthContext";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import "../scss/Menu.scss";

const Menu = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const isSignup = location.pathname === "/signup";
  const isLogin = location.pathname === "/login";

  const handleSignup = () => navigate("/signup");
  const handleLogin = () => navigate("/login");
  const handleFavorites = () => navigate("/favorites");
  const handleAds = () => navigate("/my-ads");
  const handleProfile = () => navigate("/profile");
  const handleLogout = () => {
    if (window.confirm("Tem certeza que deseja encerrar sua sessã?")) {
      dispatch(logout()); // <-- Correct: dispatch the action!
      navigate("/");
    }
  };

  // User photo logic
  const userPhoto = user && user.photo ? user.photo : "/images/user.png";

  console.log("User:", user);
  console.log(`isSignup: ${isSignup}, isLogin: ${isLogin}`);
  return (
    <Navbar
      expand="lg"
      fixed="top"
      className="py-2 navbar-bg-logo"
      // style={{ top: 64 }}
    >
      <Container className="navbar-content">
        {/* Left side buttons */}
        <Nav className="align-items-center d-none d-lg-flex">
          <Button
            as={Link}
            to="/"
            variant="outline-primary"
            className="me-2 menu-btn"
            onClick={() => setShowUserForm(false)}
          >
            Home
          </Button>
          {!isLogin && (
            <Button
              variant="outline-success"
              className="me-2 menu-btn bt-add-ad"
              // onClick={onNewAd}
            >
              Anuncie Grátis
            </Button>
          )}
        </Nav>

        {/* Logo */}
        <div className="navbar-center">
          <Link to="/" className="d-flex align-items-center">
            <img
              src="/images/logo.png"
              alt="Onde tem?"
              className="logo-img"
              height="48"
            />
          </Link>
        </div>

        <Navbar.Toggle
          aria-controls="main-navbar-nav"
          className="ms-2 d-lg-none navbar-toggle-custom"
        />

        {/* Right side buttons */}
        <Nav className="align-items-center ms-auto">
          {!isSignup && !user && (
            <>
              {!isLogin && (
                <Button
                  variant="link"
                  className="menu-icon-btn"
                  onClick={handleLogin}
                  style={{ padding: 0, border: "none", background: "none" }}
                  title="Entrar"
                >
                  <img
                    src="/images/entrar.png"
                    alt="Entrar"
                    height="48"
                    style={{ marginRight: 8 }}
                  />
                </Button>
              )}
              <Button
                variant="link"
                className="menu-icon-btn"
                onClick={handleSignup}
                style={{ padding: 0, border: "none", background: "none" }}
                title="Registre-se"
              >
                <img
                  src="/images/registrar.png"
                  alt="Registre-se"
                  height="48"
                />
              </Button>
            </>
          )}

          {/* Show these if user is logged in */}
          {user && (
            <>
              <Button
                variant="link"
                className="menu-icon-btn"
                onClick={handleFavorites}
                style={{ padding: 0, border: "none", background: "none" }}
                title="Lista de meus favoritos"
              >
                <img
                  src="/images/twohearts35.png"
                  alt="Meus Favoritos"
                  height="40"
                  style={{ marginRight: 8 }}
                />
              </Button>
              <Button
                variant="link"
                className="menu-icon-btn"
                onClick={handleAds}
                style={{ padding: 0, border: "none", background: "none" }}
                title="Lista de meus anúncios"
              >
                <img
                  src="/images/portfolio.png"
                  alt="Meus Anúncios"
                  height="40"
                  style={{ marginRight: 8 }}
                />
              </Button>
              <Button
                variant="link"
                className="menu-icon-btn"
                onClick={handleProfile}
                style={{ padding: 0, border: "none", background: "none" }}
                title="Alterar meus dados"
              >
                <img
                  src={userPhoto}
                  alt="Alterar meus dados"
                  height="40"
                  style={{
                    marginRight: 8,
                    borderRadius: "50%",
                    border: "2px solid #ccc",
                    objectFit: "cover",
                  }}
                />
              </Button>
              <Button
                variant="link"
                className="menu-icon-btn"
                onClick={handleLogout}
                style={{ padding: 0, border: "none", background: "none" }}
                title="Encerrar sessão"
              >
                <img
                  src="/images/logout.png"
                  alt="Encerrar sessão"
                  height="40"
                />
              </Button>
            </>
          )}
        </Nav>

        {/* Collapsible content for mobile */}
        <Navbar.Collapse id="main-navbar-nav" className="d-lg-none">
          <Nav className="flex-column align-items-center w-100">
            <Button
              as={Link}
              to="/"
              variant="outline-primary"
              className="my-2 menu-btn"
            >
              Home
            </Button>
            {!isLogin && (
              <Button
                variant="outline-success"
                className="me-2 menu-btn bt-add-ad"
                // onClick={onNewAd}
              >
                Anuncie Grátis
              </Button>
            )}
            {!isSignup && (
              <>
                {!isLogin && !user && (
                  <Button
                    variant="outline-primary"
                    className="my-2 menu-btn"
                    onClick={handleLogin}
                  >
                    Entrar
                  </Button>
                )}
                {!user && (
                  <Button
                    variant="primary"
                    onClick={handleSignup}
                    className="my-2 menu-btn"
                  >
                    Registre-se
                  </Button>
                )}
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
Menu.propTypes = {
  showUserForm: PropTypes.any,
  setShowUserForm: PropTypes.any,
};

export default Menu;
