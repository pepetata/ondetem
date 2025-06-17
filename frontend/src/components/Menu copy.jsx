import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import "../scss/Menu.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Menu = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const isSignup = location.pathname === "/signup";
  const isLogin = location.pathname === "/login";

  const userPhoto =
    user && user.photoPath
      ? `${API_BASE_URL}/${user.photoPath.replace(/\\/g, "/").replace(/^\/+/, "")}`
      : "/images/user.png";

  const handleLogout = () => {
    if (window.confirm("Tem certeza que deseja encerrar sua sessão?")) {
      dispatch(logout());
      navigate("/");
    }
  };
  const handleFavorites = () => {
    if (user) {
      navigate("/favorites");
    }
  };
  const handleMyAds = () => {
    if (user) {
      navigate("/my-ads");
    }
  };
  const handleProfile = () => {
    if (user) {
      navigate("/user");
    }
  };
  const handleLogin = () => {
    if (!user) {
      navigate("/login");
    }
  };
  const handleSignup = () => {
    if (!user) {
      navigate("/signup");
    }
  };

  return (
    <Navbar expand="lg" fixed="top" className="py-2 navbar-bg-logo">
      <Container>
        {/* Logo always visible at the top */}
        <Navbar.Brand as={Link} to="/" className="mx-auto d-lg-none">
          <img
            src="/images/logo.png"
            alt="Onde tem?"
            className="logo-img"
            aria-hidden="true"
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar-nav" />

        <Navbar.Collapse id="main-navbar-nav">
          {/* Left: Home & Anuncie Grátis, Center: Logo, Right: Icons or menu items */}
          <div className="w-100 d-flex flex-column flex-lg-row align-items-center justify-content-between">
            {/* Left: Home & Anuncie Grátis */}
            <div className="d-flex flex-column flex-lg-row align-items-center">
              <Button
                as={Link}
                to="/"
                variant="outline-primary"
                className="me-0 me-lg-2 mb-2 mb-lg-0 menu-btn"
              >
                Home
              </Button>
              <Button
                as={Link}
                to="/anuncie"
                variant="outline-success"
                className="mb-2 mb-lg-0 menu-btn bt-add-ad"
              >
                Anuncie Grátis
              </Button>
            </div>

            {/* Center: Logo (only on large screens) */}
            <Navbar.Brand
              as={Link}
              to="/"
              className="mx-auto d-none d-lg-block"
            >
              <img
                src="/images/logo.png"
                alt="Onde tem?"
                className="logo-img"
                aria-hidden="true"
              />
            </Navbar.Brand>

            {/* Right: Icons or menu items */}
            <div className="d-flex flex-column flex-lg-row align-items-center">
              {user && (
                <>
                  {/* Small screens: icon + text */}
                  <Nav.Link
                    as={Link}
                    to="/favorites"
                    className="d-lg-none mb-2"
                  >
                    <img
                      src="/images/twohearts35.png"
                      alt="Meus Favoritos"
                      height="24"
                      aria-hidden="true"
                    />{" "}
                    Meus Favoritos
                  </Nav.Link>
                  <Nav.Link as={Link} to="/my-ads" className="d-lg-none mb-2">
                    <img
                      src="/images/portfolio.png"
                      alt="Meus Anúncios"
                      height="24"
                      aria-hidden="true"
                    />{" "}
                    Meus Anúncios
                  </Nav.Link>
                  <Nav.Link as={Link} to="/user" className="d-lg-none mb-2">
                    <img
                      src={userPhoto}
                      alt="Meu Perfil"
                      height="24"
                      className="menu-user-photo"
                      aria-hidden="true"
                    />{" "}
                    Meu Perfil
                  </Nav.Link>
                  <Nav.Link onClick={handleLogout} className="d-lg-none mb-2">
                    <img
                      src="/images/logout.png"
                      alt="Encerrar Sessão"
                      height="24"
                      aria-hidden="true"
                    />{" "}
                    Encerrar Sessão
                  </Nav.Link>
                  {/* Large screens: icons only */}
                  <Button
                    variant="link"
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={handleFavorites}
                    title="Lista de meus favoritos"
                  >
                    <img
                      src="/images/twohearts35.png"
                      alt="Meus Favoritos"
                      height="40"
                      aria-hidden="true"
                    />
                  </Button>
                  <Button
                    variant="link"
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={handleMyAds}
                    title="Lista de meus anúncios"
                  >
                    <img
                      src="/images/portfolio.png"
                      alt="Meus Anúncios"
                      height="40"
                      aria-hidden="true"
                    />
                  </Button>
                  <Button
                    variant="link"
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={handleProfile}
                    title="Alterar meus dados"
                  >
                    <img
                      src={userPhoto}
                      alt="Alterar meus dados"
                      height="40"
                      className="menu-user-photo"
                      aria-hidden="true"
                    />
                  </Button>
                  <Button
                    variant="link"
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={handleLogout}
                    title="Encerrar sessão"
                  >
                    <img
                      src="/images/logout.png"
                      alt="Encerrar sessão"
                      height="40"
                      aria-hidden="true"
                    />
                  </Button>
                </>
              )}
              {!user && !isSignup && (
                <>
                  {!isLogin && (
                    <Button
                      variant="link"
                      className="menu-icon-btn mb-2"
                      onClick={handleLogin}
                      title="Entrar"
                    >
                      <img src="/images/entrar.png" alt="Entrar" height="48" />
                    </Button>
                  )}
                  <Button
                    variant="link"
                    className="menu-icon-btn mb-2"
                    onClick={handleSignup}
                    title="Registre-se"
                  >
                    <img
                      src="/images/registrar.png"
                      alt="Registre-se"
                      height="48"
                      aria-hidden="true"
                    />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Menu;
