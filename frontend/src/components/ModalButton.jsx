import PropTypes from "prop-types";
import OTButton from "./OTButton";

const ModalButton = ({ className, imgSrc, imgAlt, onClick, children }) => {
  return (
    <OTButton
      className={className}
      imgSrc={imgSrc}
      imgAlt={imgAlt}
      onClick={onClick}
    >
      {children}
    </OTButton>
  );
};

const ModalCancelButton = ({ onClick }) => {
  return (
    <ModalButton
      className="cancelbutton"
      imgSrc="/images/cancel.png"
      imgAlt="Cancelar"
      onClick={onClick}
    >
      Cancelar
    </ModalButton>
  );
};

const ModalConfirmarButton = ({ onClick }) => {
  return (
    <ModalButton
      className="btn-danger"
      imgSrc="/images/delete.png"
      imgAlt="Confirmar"
      onClick={onClick}
    >
      Confirmar
    </ModalButton>
  );
};

ModalCancelButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

ModalConfirmarButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

ModalButton.propTypes = {
  className: PropTypes.string,
  imgSrc: PropTypes.string.isRequired,
  imgAlt: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export { ModalCancelButton, ModalConfirmarButton };
export default ModalButton;
