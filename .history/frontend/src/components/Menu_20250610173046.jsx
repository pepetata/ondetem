import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const Menu = ({ onLogin, onSignup, onNewAd }) => (
  <Navbar bg="light" expand="lg" fixed="top">
    <Container>
      <Navbar.Brand as={Link} to="/">
        <img
          src="/images/logo.png"
          height="40"
          className="d-inline-block align-top"
          alt="Onde tem?"
        />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="main-navbar-nav" />
      <Navbar.Collapse id="main-navbar-nav">
        <Nav className="me-auto">
          <Nav.Link as={Link} to="/">
            Home
          </Nav.Link>
          <Button
            variant="outline-success"
            className="ms-2"
            onClick={onNewAd}
            style={{ marginLeft: "10px" }}
          >
            Anuncie Grátis
          </Button>
        </Nav>
        <Nav>
          <Button variant="outline-primary" className="me-2" onClick={onLogin}>
            Entrar
          </Button>
          <Button variant="primary" onClick={onSignup}>
            Registre-se
          </Button>
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

export default Menu;
