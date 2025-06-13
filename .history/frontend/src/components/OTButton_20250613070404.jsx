import { Form, Button, Row, Col, Image } from "react-bootstrap";

const OTButton = ({ variant, className, onClick, children }) => {
  const defaultImg = "/images/empty.jpg";
  return (
    <Button
      variant={variant}
      className={`ot-button ${className}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};
export default OTButton;
