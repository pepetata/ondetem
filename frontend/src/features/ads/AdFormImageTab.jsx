import { Row, Col } from "react-bootstrap";
import AdImageManager from "./AdImageManager";

export default function AdFormImageTab({
  currentAd,
  imagesToAdd,
  setImagesToAdd,
  imagesToDelete,
  setImagesToDelete,
}) {
  return (
    <Row>
      <Col>
        <div className="adform-image-info">
          Você poderá cadastrar até 5 imagens de seu anúncio!
          <br />
          Use apenas imagens do tipo JPEG, PNG ou JPG.
        </div>
        <AdImageManager
          adId={currentAd && currentAd.id}
          imagesToAdd={imagesToAdd}
          setImagesToAdd={setImagesToAdd}
          imagesToDelete={imagesToDelete}
          setImagesToDelete={setImagesToDelete}
        />
      </Col>
    </Row>
  );
}
