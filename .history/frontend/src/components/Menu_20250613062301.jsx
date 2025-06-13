import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../css/Menu.scss";

const Menu = ({ onLogin, onSignup, onNewAd }) => (
  <Navbar
    expand="lg"
    fixed="top"
    className="py-2 navbar-bg-logo"
    style={{ top: 64 }}
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
          onClick={onNewAd}
        >
          Anuncie Grátis
        </Button>
      </Nav>

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
      <Nav className="align-items-center d-none d-lg-flex">
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
            onClick={onNewAd}
          >
            Anuncie Grátis
          </Button>
          <Button
            variant="outline-primary"
            className="my-2 menu-btn"
            onClick={onLogin}
          >
            Entrar
          </Button>
          <Button
            variant="primary"
            onClick={onSignup}
            className="my-2 menu-btn"
          >
            Registre-se
          </Button>
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

export default Menu;
