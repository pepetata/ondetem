import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../css/Menu.scss"; // Import the CSS file

// Always-visible logo bar
const LogoBar = () => (
  <div className="logo-bar">
    <Link to="/">
      <img
        src="/images/logo.png"
        height="48"
        alt="Onde tem?"
        className="logo-img"
      />
    </Link>
  </div>
);

const Menu = ({ onLogin, onSignup, onNewAd }) => (
  <>
    <LogoBar />
    <Navbar
      // bg="light"
      expand="lg"
      fixed="top"
      className="py-2 navbar-bg-logo"
      style={{ top: 64 }} // push navbar below logo bar
    >
      <Container>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto align-items-center">
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
              onClick={onNewAd}
            >
              Anuncie Grátis
            </Button>
          </Nav>
          <Nav className="ms-auto align-items-center">
            <Button
              variant="outline-primary"
              className="me-2 menu-btn"
              onClick={onLogin}
            >
              Entrar
            </Button>
            <Button variant="primary" onClick={onSignup} className="menu-btn">
              Registre-se
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    {/* Add padding to push content below logo+navbar */}
    <div style={{ height: 128 }} />
  </>
);

export default Menu;
