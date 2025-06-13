import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const Menu = ({ onLogin, onSignup, onNewAd }) => (
  <Navbar bg="light" expand="lg" fixed="top" className="py-2">
    <Container>
      <Navbar.Toggle aria-controls="main-navbar-nav" />
      <Navbar.Collapse id="main-navbar-nav">
        {/* Left side: Home & Anuncie Grátis */}
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
        {/* Center: Logo */}
        <Navbar.Brand
          as={Link}
          to="/"
          className="mx-auto d-flex justify-content-center align-items-center"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <img
            src="/images/logo.png"
            height="48"
            className="d-inline-block align-top"
            alt="Onde tem?"
            style={{ maxHeight: 48 }}
          />
        </Navbar.Brand>
        {/* Right side: Entrar & Registre-se */}
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
);

export default Menu;
