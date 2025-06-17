import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import "../scss/Menu.scss";

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const userPhoto = user && user.photo ? user.photo : "/images/user.png";

  const handleLogout = () => {
    if (window.confirm("Tem certeza que deseja encerrar sua sessão?")) {
      dispatch(logout());
      navigate("/");
    }
  };

  return (
    <Navbar expand="lg" fixed="top" className="py-2 navbar-bg-logo">
      <Container>
        {/* Logo always visible at the top */}
        <Navbar.Brand as={Link} to="/" className="mx-auto d-lg-none">
          <img src="/images/logo.png" alt="Onde tem?" height="48" />
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
              <img src="/images/logo.png" alt="Onde tem?" height="48" />
            </Navbar.Brand>

            {/* Right: Icons or menu items */}
            <div className="d-flex flex-column flex-lg-row align-items-center">
              {user ? (
                <>
                  {/* Small screens: icon + text */}
                  <Nav.Link
                    as={Link}
                    to="/favorites"
                    className="d-lg-none mb-2"
                  >
                    <img src="/images/twohearts35.png" alt="" height="24" />{" "}
                    Meus Favoritos
                  </Nav.Link>
                  <Nav.Link as={Link} to="/my-ads" className="d-lg-none mb-2">
                    <img src="/images/portfolio.png" alt="" height="24" /> Meus
                    Anúncios
                  </Nav.Link>
                  <Nav.Link as={Link} to="/user" className="d-lg-none mb-2">
                    <img
                      src={userPhoto}
                      alt=""
                      height="24"
                      style={{ borderRadius: "50%" }}
                    />{" "}
                    Meu Perfil
                  </Nav.Link>
                  <Nav.Link onClick={handleLogout} className="d-lg-none mb-2">
                    <img src="/images/logout.png" alt="" height="24" /> Encerrar
                    Sessão
                  </Nav.Link>
                  {/* Large screens: icons only */}
                  <Button
                    variant="link"
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={() => navigate("/favorites")}
                    title="Lista de meus favoritos"
                    style={{ padding: 0, border: "none", background: "none" }}
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
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={() => navigate("/my-ads")}
                    title="Lista de meus anúncios"
                    style={{ padding: 0, border: "none", background: "none" }}
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
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={() => navigate("/user")}
                    title="Alterar meus dados"
                    style={{ padding: 0, border: "none", background: "none" }}
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
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={handleLogout}
                    title="Encerrar sessão"
                    style={{ padding: 0, border: "none", background: "none" }}
                  >
                    <img
                      src="/images/logout.png"
                      alt="Encerrar sessão"
                      height="40"
                    />
                  </Button>
                </>
              ) : (
                <>
                  <Nav.Link
                    onClick={() => navigate("/login")}
                    className="d-lg-none mb-2"
                  >
                    Entrar
                  </Nav.Link>
                  <Nav.Link
                    onClick={() => navigate("/signup")}
                    className="d-lg-none mb-2"
                  >
                    Registre-se
                  </Nav.Link>
                  <Button
                    variant="link"
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={() => navigate("/login")}
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
                  <Button
                    variant="link"
                    className="menu-icon-btn d-none d-lg-inline"
                    onClick={() => navigate("/signup")}
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
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Menu;
