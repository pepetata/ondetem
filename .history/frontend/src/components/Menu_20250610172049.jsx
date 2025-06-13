import { Link } from "react-router-dom";

const Menu = ({
  isLoggedIn,
  userPhoto,
  onLogin,
  onLogout,
  onSignup,
  onNewAd,
  onFavorites,
  onMyAds,
}) => {
  return (
    <nav className="navbar navbar-default navbar-fixed-top" role="navigation">
      <div className="container-fluid">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#navbar"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <Link hidden id="logoHeaderBrand" className="navbar-brand" to="/">
            <img alt="Onde tem?" src="/images/logo.png" />
          </Link>
        </div>
        <div className="collapse navbar-collapse" id="navbar">
          <ul className="nav navbar-nav" id="navbarHome">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <button
                id="btregister"
                type="button"
                className="btn btn-default navbar-btn btnav btregproduct"
                onClick={onNewAd}
                title="Anuncie gratuitamente seu negócio, evento, serviço e produto"
              >
                Anuncie Grátis
              </button>
            </li>
          </ul>
          <div id="logoDiv">
            <Link id="logoHeader" className="navbar-brand" to="/">
              <img alt="Onde tem?" src="/images/logo.png" />
            </Link>
          </div>
          <ul className="nav navbar-nav navbar-right" id="navlogin">
            {isLoggedIn ? (
              <>
                <li>
                  <a
                    id="btfavorites"
                    className="headerImg"
                    href="#"
                    onClick={onFavorites}
                    title="Lista de Favoritos"
                  >
                    <img
                      alt="Lista de Favoritos"
                      className="images-twohearts35"
                      src="/images/empty.png"
                    />
                  </a>
                </li>
                <li>
                  <a
                    id="btmyads"
                    className="headerImg"
                    href="#"
                    onClick={onMyAds}
                    title="Lista de seus anúncios"
                  >
                    <img
                      alt="Lista de Anúncios"
                      className="images-portfolio"
                      src="/images/empty.png"
                    />
                  </a>
                </li>
                <li>
                  <Link
                    id="btmyaccount"
                    className={
                      userPhoto ? "headerPic" : "headerNoPic images-user"
                    }
                    to="/user"
                    title="Alterar seus dados"
                  >
                    <img
                      id="btmyaccountimg"
                      alt="Foto do Usuário"
                      src={userPhoto || "/images/empty.png"}
                    />
                  </Link>
                </li>
                <li>
                  <a
                    id="btsair"
                    className="headerImg"
                    href="#"
                    onClick={onLogout}
                    title="Encerrar a sessão"
                  >
                    <img
                      alt="Encerrar a sessão"
                      className="images-logout"
                      src="/images/empty.png"
                    />
                  </a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <a
                    id="btlogin"
                    className="headerImgLogin"
                    href="#"
                    onClick={onLogin}
                    title="Efetuar login"
                  >
                    <img
                      alt="Efetuar Login"
                      className="images-user25"
                      src="/images/empty.png"
                    />
                    Entrar
                  </a>
                </li>
                <li>
                  <a
                    id="btsignin"
                    href="#"
                    onClick={onSignup}
                    title="Faça seu registro para anunciar e fazer comentários"
                  >
                    Registre-se
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Menu;
