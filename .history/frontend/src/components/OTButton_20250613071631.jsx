import { Button } from "react-bootstrap";

const OTButton = ({
  variant,
  className,
  onClick,
  imgSrc,
  imgAlt,
  children,
}) => (
  <Button
    variant={variant}
    className={`otbutton ${className || ""}`}
    onClick={onClick}
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

export default OTButton;
