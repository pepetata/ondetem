import { Button } from "react-bootstrap";
import PropTypes from "prop-types";
import "../scss/OTButton.scss";

const OTButton = ({
  variant,
  className,
  onClick,
  imgSrc,
  imgAlt,
  type,
  children,
}) => (
  <Button
    variant={variant}
    className={`otbutton ${className || ""}`}
    onClick={onClick}
    type={type || "button"}
  >
    {imgSrc && (
      <img
        src={imgSrc}
        alt={imgAlt || ""}
        style={{
          height: 20,
          width: 20,
          marginRight: 6,
          verticalAlign: "middle",
        }}
      />
    )}
    {children}
  </Button>
);

OTButton.propTypes = {
  variant: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  imgSrc: PropTypes.string,
  imgAlt: PropTypes.string,
  children: PropTypes.node,
};

export default OTButton;
