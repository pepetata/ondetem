import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

// Always-visible logo bar
const LogoBar = () => (
  <div
    style={{
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#fff",
      zIndex: 1051,
      position: "fixed",
      top: 0,
      left: 0,
      height: 64,
      borderBottom: "1px solid #eee",
    }}
  >
    <Link to="/">
      <img
        src="/images/logo.png"
        height="48"
        alt="Onde tem?"
        style={{ maxHeight: 48 }}
      />
    </Link>
  </div>
);

const Menu = ({ onLogin, onSignup, onNewAd }) => (
  <>
    <LogoBar />
    <Navbar
      bg="light"
      expand="lg"
      fixed="top"
      className="py-2"
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
              className="me-2"
              style={{ minWidth: 120 }}
            >
              Home
            </Button>
            <Button
              variant="outline-success"
              className="me-2"
              onClick={onNewAd}
              style={{ minWidth: 120 }}
            >
              Anuncie Grátis
            </Button>
          </Nav>
          <Nav className="ms-auto align-items-center">
            <Button
              variant="outline-primary"
              className="me-2"
              onClick={onLogin}
              style={{ minWidth: 120 }}
            >
              Entrar
            </Button>
            <Button
              variant="primary"
              onClick={onSignup}
              style={{ minWidth: 120 }}
            >
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
