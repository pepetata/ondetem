import { Modal, Button } from "react-bootstrap";
import PropTypes from "prop-types";

const LoginPromptModal = ({ show, onHide, onLogin }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>⚠️ Login Necessário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Você precisa estar logado para favoritar anúncios e aproveitar outras
          funcionalidades exclusivas.
        </p>
        <p>
          <strong>Deseja fazer login agora?</strong>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Voltar
        </Button>
        <Button variant="primary" onClick={onLogin}>
          Fazer Login
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

LoginPromptModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
};

export default LoginPromptModal;
