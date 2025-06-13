import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const Menu = ({ onLogin, onSignup, onNewAd }) => (
  <Navbar bg="light" expand="lg" fixed="top" className="py-2">
    <Container>
      {/* Left side: Home & Anuncie Grátis */}
      <Nav className="align-items-center">
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
      {/* Logo in the center */}
      <Navbar.Brand
        as={Link}
        to="/"
        className="mx-auto order-0"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <img
          src="/images/logo.png"
          height="48"
          alt="Onde tem?"
          style={{ maxHeight: 48 }}
        />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="main-navbar-nav" className="ms-auto" />
      <Navbar.Collapse id="main-navbar-nav" className="justify-content-end">
        {/* Right side: Entrar & Registre-se */}
        <Nav className="align-items-center ms-auto">
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
