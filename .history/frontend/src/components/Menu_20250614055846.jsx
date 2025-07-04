import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../css/Menu.scss";
import PropTypes from "prop-types";

const Menu = ({ setShowUserForm, showUserForm }) => {
  const navigate = useNavigate();

  const handleSignup = () => {
    setShowUserForm(true);
    navigate("/signup");
  };

  console.log(`showUserForm`, showUserForm);

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
          >
            Home
          </Button>
          <Button
            variant="outline-success"
            className="me-2 menu-btn bt-add-ad"
            // onClick={onNewAd}
          >
            Anuncie Grátis
          </Button>
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
        {!showUserForm && (
          <Nav className="align-items-center d-none d-lg-flex">
            <Button
              variant="outline-primary"
              className="me-2 menu-btn"
              // onClick={onLogin}
            >
              Entrar
            </Button>
            <Button
              variant="primary"
              onClick={handleSignup}
              className="menu-btn"
            >
              Registre-se
            </Button>
          </Nav>
        )}

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
            <Button
              variant="outline-success"
              className="my-2 menu-btn bt-add-ad"
              // onClick={onNewAd}
            >
              Anuncie Grátis
            </Button>
            <Button
              variant="outline-primary"
              className="my-2 menu-btn"
              // onClick={onLogin}
            >
              Entrar
            </Button>
            <Button
              variant="primary"
              onClick={handleSignup}
              className="my-2 menu-btn"
            >
              Registre-se
            </Button>
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
