import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Form, Tabs, Tab, Modal } from "react-bootstrap";
import { Formik, Form as FormikForm, Field } from "formik";
import Notification from "../../components/Notification";
import OTButton from "../../components/OTButton";
import FormInput from "../../components/FormInput";
import AdFormDescriptionTab from "./AdFormDescriptionTab";
import AdFormContactTab from "./AdFormContactTab";
import AdFormImageTab from "./AdFormImageTab";
import AdFormCalendarTab from "./AdFormCalendarTab";
import AdFormPublicityTab from "./AdFormPublicityTab";
import { adFormFields } from "../../formfields/adFormFiels.js";
import { buildValidationSchema } from "../../components/validationHelper.js";
import {
  createAdThunk,
  updateAdThunk,
  deleteAdThunk,
  getAdThunk,
  clearCurrentAd,
  setCurrentAd,
} from "../../redux/adSlice";
import {
  uploadAdImage,
  clearAdImages,
  deleteAdImage,
} from "../../redux/adImagesSlice";
import { showNotification, clearNotification } from "../../components/helper";
import "../../scss/AdForm.scss";

export default function AdForm() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const cepAsyncError = useRef("");
  const formikRef = useRef();
  const navigate = useNavigate();
  const currentAd = useSelector((state) => state.ads.currentAd);
  const [activeTab, setActiveTab] = useState("description");
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [imagesToAdd, setImagesToAdd] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [ready, setReady] = useState(false);

  const initialValues = currentAd
    ? {
        ...Object.fromEntries(
          Object.values(adFormFields).map((f) => [
            f.name,
            f.type === "checkbox" ? false : "",
          ])
        ),
        ...currentAd,
      }
    : Object.fromEntries(
        Object.values(adFormFields).map((f) => [
          f.name,
          f.type === "checkbox" ? false : "",
        ])
      );

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      dispatch(clearNotification());
      console.log(`Submitting form with values:`, values);
      const formData = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value])
      );
      console.log(`Form data to submit:`, formData);
      console.log(`Ad: `, currentAd);

      let result, ad;
      if (currentAd) {
        // Update existing ad
        result = await dispatch(
          updateAdThunk({ adId: currentAd.id, formData })
        );
        ad = result.payload;
        console.log(`Ad updated:`, currentAd);
      } else {
        // Create new ad
        result = await dispatch(createAdThunk(formData));
        ad = result.payload;
        console.log(`Ad created:`, currentAd);
        if (ad && ad.id) {
          dispatch(setCurrentAd(ad));
          navigate(`/ad/${ad.id}/edit`);
          // Optionally: setImagesToAdd([]), setImagesToDelete([]), etc.
        }
      }
      ad = result.payload;
      // dispatch(setCurrentAd(ad));
      console.log(`Ad: `, ad);
      // Now upload images using the slice
      if (ad && ad.id) {
        // 2. Delete marked images
        for (const filename of imagesToDelete) {
          await dispatch(deleteAdImage({ adId: ad.id, filename }));
        }
        setImagesToDelete([]);
        // 3. Upload new images
        for (const file of imagesToAdd) {
          await dispatch(uploadAdImage({ adId: ad.id, file }));
        }
        // 4. Clear staged changes
        setImagesToAdd([]);
      }
    } catch (err) {
      dispatch(showNotification({ type: "error", message: err.message }));
    }
  };

  const handleTabSelect = (k) => setActiveTab(k);

  const handleCancel = (dirty) => {
    dispatch(clearNotification());
    if (dirty) {
      setPendingAction("back");
      setShowUnsavedModal(true);
      return;
    }
    dispatch(clearCurrentAd());
    dispatch(clearAdImages()); // <-- Add this line
    navigate("/");
  };

  const handleNewAd = (dirty, resetForm) => {
    dispatch(clearNotification());
    if (dirty) {
      setPendingAction("newAd");
      setShowUnsavedModal(true);
      return;
    }
    // dispatch(clearCurrentAd());
    // dispatch(clearAdImages());
    navigate("/ad");
  };

  const handleUnsavedConfirm = (resetForm) => {
    dispatch(clearNotification());
    setShowUnsavedModal(false);
    if (pendingAction === "back") {
      dispatch(clearCurrentAd());
      dispatch(clearAdImages());
      navigate("/");
    } else if (pendingAction === "newAd") {
      dispatch(clearCurrentAd());
      dispatch(clearAdImages());
      resetForm();
    }
    setPendingAction(null);
  };

  const handleUnsavedCancel = () => {
    dispatch(clearNotification());

    setShowUnsavedModal(false);
    setPendingAction(null);
  };
  const handleZipBlur = async (
    e,
    setFieldValue,
    setFieldError,
    setFieldTouched
  ) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length === 8) {
      let timeoutId;
      // Show loading message
      cepAsyncError.current = "Buscando CEP...";
      setFieldTouched("zipcode", true, false);
      setFieldError("zipcode", "Buscando CEP...");
      try {
        const timeoutPromise = new Promise(
          (_, reject) =>
            (timeoutId = setTimeout(
              () => reject(new Error("Tempo de resposta excedido")),
              5000
            ))
        );
        const fetchPromise = fetch(
          `https://viacep.com.br/ws/${cep}/json/`
        ).then((res) => res.json());

        const data = await Promise.race([fetchPromise, timeoutPromise]);

        if (!data.erro) {
          setFieldValue("address1", data.logradouro || "");
          setFieldValue("city", data.localidade || "");
          setFieldValue("state", data.uf || "");
          cepAsyncError.current = "";
          setFieldError("zipcode", undefined);
          setFieldTouched("zipcode", true, true); // <-- Force re-validation and re-render
        } else {
          cepAsyncError.current = "CEP não encontrado";
          setFieldError("zipcode", "CEP não encontrado");
          setFieldTouched("zipcode", true, false);
          setFieldValue("address1", "");
          setFieldValue("city", "");
          setFieldValue("state", "");
          setTimeout(() => e.target.focus(), 0);
        }
      } catch (err) {
        cepAsyncError.current = "Erro ao buscar CEP";
        setFieldError("zipcode", "Erro ao buscar CEP");
        setFieldTouched("zipcode", true, false);
        setTimeout(() => e.target.focus(), 0);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };

  const handleRemoveAd = async (resetForm) => {
    dispatch(clearNotification());
    if (currentAd && currentAd.id) {
      const result = await dispatch(deleteAdThunk(currentAd.id));
      if (deleteAdThunk.fulfilled.match(result)) {
        dispatch(clearCurrentAd());
        resetForm();
        setShowRemoveModal(false);
        dispatch(clearAdImages());
        return;
      }
    } else {
      dispatch(clearCurrentAd());
      dispatch(clearAdImages());
      resetForm();
    }
    setShowRemoveModal(false);
  };

  const handleShowRemoveModal = () => setShowRemoveModal(true);
  const handleCloseRemoveModal = () => setShowRemoveModal(false);

  // When user marks an existing image for deletion:
  const handleMarkDelete = (filename) => {
    setImagesToDelete([...imagesToDelete, filename]);
  };

  //When currentAd changes (e.g., after create/update), update Formik values so the form always reflects the latest ad.
  useEffect(() => {
    if (formikRef.current && currentAd) {
      formikRef.current.setValues({
        ...Object.fromEntries(
          Object.values(adFormFields).map((f) => [
            f.name,
            f.type === "checkbox" ? false : "",
          ])
        ),
        ...currentAd,
      });
    }
  }, [currentAd]);

  // Reset images to add/delete when currentAd changes
  useEffect(() => {
    setImagesToAdd([]);
    setImagesToDelete([]);
  }, [currentAd]);

  // Get the ad ID from the URL
  useEffect(() => {
    let cancelled = false;
    if (id) {
      if (!currentAd || currentAd.id !== id) {
        dispatch(getAdThunk(id)).then(() => {
          if (!cancelled) setReady(true);
        });
      } else {
        setReady(true);
      }
    } else {
      // Only clear state here, and set ready after clearing
      dispatch(clearCurrentAd());
      dispatch(clearAdImages());
      setTimeout(() => {
        if (!cancelled) setReady(true);
      }, 0);
    }
    return () => {
      cancelled = true;
      setReady(false);
    };
  }, [id, currentAd, dispatch]);
  if (!ready) return null;

  const validationSchema = buildValidationSchema(adFormFields, false);

  return (
    <Container className="adform-container px-2 px-lg-5 py-3">
      <Row>
        <Col>
          <h3 className="adform-title mt-4 mb-1 text-center">
            Registre as informações de seus anúncios
          </h3>
        </Col>
      </Row>
      <Formik
        innerRef={formikRef}
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnBlur={true}
        validateOnChange={true}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, resetForm, dirty }) => (
          <FormikForm>
            <Row className="justify-content-center m-4">
              <Col md={6}>
                <Field
                  name={adFormFields.title.name}
                  component={FormInput}
                  {...adFormFields.title}
                />
              </Col>
            </Row>
            <Row className="adform-tabs px-2 px-lg-5 py-3">
              <Col>
                <Tabs
                  id="adform-tabs"
                  activeKey={activeTab}
                  onSelect={handleTabSelect}
                  className="mb-3 center-tabs"
                >
                  <Tab eventKey="description" title="Descrição">
                    <AdFormDescriptionTab adFormFields={adFormFields} />
                  </Tab>
                  <Tab eventKey="contact" title="Contato">
                    <AdFormContactTab
                      adFormFields={adFormFields}
                      formikRef={formikRef}
                    />
                  </Tab>
                  <Tab eventKey="image" title="Fotos">
                    <AdFormImageTab
                      currentAd={currentAd}
                      imagesToAdd={imagesToAdd}
                      setImagesToAdd={setImagesToAdd}
                      imagesToDelete={imagesToDelete}
                      setImagesToDelete={setImagesToDelete}
                    />
                  </Tab>
                  <Tab eventKey="calendar" title="Calendário">
                    <AdFormCalendarTab adFormFields={adFormFields} />
                  </Tab>
                  <Tab
                    eventKey="publicity"
                    title={<span className="spanredbold">Publicidade</span>}
                  >
                    <AdFormPublicityTab />
                  </Tab>
                </Tabs>
              </Col>
            </Row>
            <Notification />
            {/* Action buttons */}
            <div className="adform-actions d-flex flex-wrap gap-2 mt-3 justify-content-center">
              <OTButton
                type="submit"
                className="savebutton"
                imgSrc="/images/save.png"
                imgAlt="Gravar"
              >
                Gravar
              </OTButton>
              <OTButton
                className="cancelbutton"
                imgSrc="/images/return.png"
                imgAlt="Voltar"
                onClick={() => handleCancel(dirty)}
              >
                Voltar
              </OTButton>
              <OTButton
                variant="success"
                imgSrc="/images/plus.png"
                imgAlt="Novo Anúncio"
                disabled={!currentAd}
                onClick={() => handleNewAd(dirty, resetForm)}
              >
                Novo Anúncio
              </OTButton>
              <OTButton
                className="btn-danger"
                imgSrc="/images/delete.png"
                imgAlt="Remover Anúncio"
                onClick={handleShowRemoveModal}
                disabled={!currentAd}
              >
                Remover Anúncio
              </OTButton>
            </div>
            {/* Modals */}
            <Modal show={showRemoveModal} onHide={handleCloseRemoveModal}>
              <Modal.Header closeButton>
                <Modal.Title>Remover Anúncio</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Tem certeza que deseja remover este anúncio?
              </Modal.Body>
              <Modal.Footer>
                <OTButton
                  className="cancelbutton"
                  imgSrc="/images/cancel.png"
                  imgAlt="Cancelar"
                  onClick={handleCloseRemoveModal}
                >
                  Cancelar
                </OTButton>
                <OTButton
                  className="btn-danger"
                  imgSrc="/images/delete.png"
                  imgAlt="Confirmar"
                  onClick={() => handleRemoveAd(resetForm)}
                >
                  Confirmar
                </OTButton>
              </Modal.Footer>
            </Modal>
            <Modal show={showUnsavedModal} onHide={handleUnsavedCancel}>
              <Modal.Header closeButton>
                <Modal.Title>Atenção</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Você tem alterações não salvas. Deseja continuar mesmo assim?
              </Modal.Body>
              <Modal.Footer>
                <OTButton
                  className="cancelbutton"
                  imgSrc="/images/cancel.png"
                  imgAlt="Cancelar"
                  onClick={handleUnsavedCancel}
                >
                  Cancelar
                </OTButton>
                <OTButton
                  className="btn-danger"
                  imgSrc="/images/return.png"
                  imgAlt="Confirmar"
                  onClick={() => handleUnsavedConfirm(resetForm)}
                >
                  Confirmar
                </OTButton>
              </Modal.Footer>
            </Modal>
          </FormikForm>
        )}
      </Formik>
    </Container>
  );
}
