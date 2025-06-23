import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserAdsThunk, setCurrentAd } from "../../redux/adSlice";
import { useNavigate } from "react-router-dom";
import { Col } from "react-bootstrap";
import OTButton from "../../components/OTButton";

export default function MyAdsList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userAds = useSelector((state) => state.ads.userAds);

  useEffect(() => {
    dispatch(getUserAdsThunk());
  }, [dispatch]);

  const handleAdClick = (ad) => {
    dispatch(setCurrentAd(ad));
    navigate(`/ad/${ad.id}/edit`, {
      state: { from: "MyAdsList" },
    });
  };

  if (!userAds || userAds.length === 0) {
    return (
      <div>
        {" "}
        <Col md={12} className="text-center mb-4">
          <h2>Meus Anúncios</h2>
        </Col>
        Você ainda não possui anúncios.
      </div>
    );
  }

  return (
    <div>
      <Col md={12} className="text-center mb-4">
        <h2>Meus Anúncios</h2>
      </Col>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {userAds.map((ad) => (
          <li key={ad.id} style={{ marginBottom: "1rem" }}>
            <OTButton
              variant="outline-primary"
              onClick={() => handleAdClick(ad)}
              style={{ width: "100%", textAlign: "left" }}
            >
              {ad.title}
            </OTButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
