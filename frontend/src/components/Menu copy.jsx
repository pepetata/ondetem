import { Navbar, Nav, Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../css/Menu.scss";

const Menu = ({ onNewAd }) => (
  <Navbar expand="lg" fixed="top" className="navbar-bg-logo py-2">
    <Container className="navbar-content">
      {/* Left side */}
      <Nav className="align-items-center d-none d-lg-flex">
        <Nav.Link as={Link} to="/">
          Home
        </Nav.Link>
        <Button
          variant="outline-success"
          className="menu-btn bt-add-ad"
          onClick={onNewAd}
        >
          Anuncie Grátis
        </Button>
      </Nav>
      {/* Center logo */}
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
      {/* Right side */}
      <Nav className="align-items-center d-none d-lg-flex">
        <Nav.Link as={Link} to="/favorites" title="Lista de Favoritos">
          <img
            alt="Favoritos"
            className="images-twohearts35"
            src="/images/empty.png"
          />
        </Nav.Link>
        <Nav.Link as={Link} to="/myads" title="Meus Anúncios">
          <img
            alt="Meus Anúncios"
            className="images-portfolio"
            src="/images/empty.png"
          />
        </Nav.Link>
        <Nav.Link as={Link} to="/user" title="Meus Dados">
          <img alt="Usuário" className="images-user" src="/images/empty.png" />
        </Nav.Link>
        <Nav.Link as={Link} to="/logout" title="Sair">
          <img alt="Sair" className="images-logout" src="/images/empty.png" />
        </Nav.Link>
      </Nav>
      {/* Mobile menu */}
      <Navbar.Toggle
        aria-controls="main-navbar-nav"
        className="ms-2 d-lg-none navbar-toggle-custom"
      />
      <Navbar.Collapse id="main-navbar-nav" className="d-lg-none">
        <Nav className="flex-column align-items-center w-100">
          <Nav.Link as={Link} to="/">
            Home
          </Nav.Link>
          <Button
            variant="outline-success"
            className="menu-btn bt-add-ad"
            onClick={onNewAd}
          >
            Anuncie Grátis
          </Button>
          <Nav.Link as={Link} to="/favorites" title="Lista de Favoritos">
            <img
              alt="Favoritos"
              className="images-twohearts35"
              src="/images/empty.png"
            />
          </Nav.Link>
          <Nav.Link as={Link} to="/myads" title="Meus Anúncios">
            <img
              alt="Meus Anúncios"
              className="images-portfolio"
              src="/images/empty.png"
            />
          </Nav.Link>
          <Nav.Link as={Link} to="/user" title="Meus Dados">
            <img
              alt="Usuário"
              className="images-user"
              src="/images/empty.png"
            />
          </Nav.Link>
          <Nav.Link as={Link} to="/logout" title="Sair">
            <img alt="Sair" className="images-logout" src="/images/empty.png" />
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

export default Menu;
