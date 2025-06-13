import { Form, Button, Row, Col, Image } from "react-bootstrap";

const OTButton = ({ variant, className, onClick, children }) => {
    /images/empty.png
    
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
