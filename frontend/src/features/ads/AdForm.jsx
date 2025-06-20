import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Container, Row, Col, Form, Tabs, Tab, Modal } from "react-bootstrap";
import { Formik, Form as FormikForm, Field } from "formik";
import Notification from "../../components/Notification";
import OTButton from "../../components/OTButton";
import FormInput from "../../components/FormInput";
import { adFormFields } from "../../formfields/adFormFiels.js";
import { buildValidationSchema } from "../../components/validationHelper.js";
import { createAdThunk, updateAdThunk } from "../../redux/adSlice";
import { showNotification } from "../../components/helper";
import "../../scss/AdForm.scss";

const initialValues = Object.fromEntries(
  Object.values(adFormFields).map((f) => [
    f.name,
    f.type === "checkbox" ? false : "",
  ])
);

export default function AdForm({ user, ad }) {
  const dispatch = useDispatch();
  const cepAsyncError = useRef("");
  const [activeTab, setActiveTab] = useState("description");
  const [showLogout, setShowLogout] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    console.log(`Submitting form with values:`, values);
    const formData = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value])
    );
    console.log(`Form data to submit:`, formData);
    console.log(`Ad: `, ad);

    if (ad) {
      // Update existing user
      const updatedAd = await dispatch(
        updateAdThunk({ adId: ad.id, formData })
      );
      if (updateAdThunk.fulfilled.match(updatedAd)) {
        console.log(`Ad updated:`, updatedAd.payload);
        ad = updatedAd.payload;
        // Update ad in Redux
        // dispatch(setAd(updatedAd.payload));
        // Update storage for persistence
      }
    } else {
      // Create new ad
      await dispatch(createAdThunk(formData));
    }
  };

  const handleTabSelect = (k) => setActiveTab(k);

  const handleShowLogout = () => setShowLogout(true);
  const handleCloseLogout = () => setShowLogout(false);

  const handleCancel = () => {
    // Logic to handle cancel action, e.g., navigate back or reset form
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

  const validationSchema = buildValidationSchema(adFormFields, false);

  return (
    <Container className="px-2 px-lg-5 py-3 adform-container">
      <Row>
        <Col>
          <h3 className="mt-4 mb-1 text-center">
            Registre as informações de seus anúncios
          </h3>
        </Col>
      </Row>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnBlur={true}
        validateOnChange={true}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue }) => (
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
            <Row className="px-2 px-lg-5 py-3 adform-container">
              <Col>
                <Tabs
                  id="adform-tabs"
                  activeKey={activeTab}
                  onSelect={handleTabSelect}
                  className="mb-3 center-tabs"
                >
                  {/* Descrição Tab */}
                  <Tab eventKey="description" title="Descrição">
                    <Row className="justify-content-center">
                      <Col md={8}>
                        <Field name={adFormFields.short.name}>
                          {({ field, form }) => (
                            <FormInput
                              field={field}
                              form={form}
                              {...adFormFields.short}
                            />
                          )}
                        </Field>
                        <Field name={adFormFields.description.name}>
                          {({ field, form }) => (
                            <FormInput
                              field={field}
                              form={form}
                              {...adFormFields.description}
                            />
                          )}
                        </Field>
                        <Field name={adFormFields.tags.name}>
                          {({ field, form }) => (
                            <FormInput
                              field={field}
                              form={form}
                              {...adFormFields.tags}
                            />
                          )}
                        </Field>
                      </Col>
                      <Col md={4}>
                        {/* Categories selection UI goes here */}
                        <Form.Group>
                          <Form.Label>Categorias selecionadas:</Form.Label>
                          <div className="selectedCategories">
                            <span style={{ color: "red" }}>
                              Nenhuma categoria selecionada.
                            </span>
                          </div>
                        </Form.Group>
                        <Form.Group>
                          <Form.Label>
                            Categorias (clique nas categorias):
                          </Form.Label>
                          {/* Render categories tree here */}
                        </Form.Group>
                        <Form.Group>
                          <Form.Label>
                            <a
                              href="#"
                              onClick={() => {
                                /* show modal */
                              }}
                            >
                              Não encontro minha categoria
                            </a>
                          </Form.Label>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab>
                  {/* Contato Tab */}
                  <Tab eventKey="contact" title="Contato">
                    <Row className="justify-content-center px-2 px-lg-5">
                      <Row>
                        <Col md={3}>
                          <Field
                            name={adFormFields.zipcode.name}
                            validate={() => {
                              if (cepAsyncError.current)
                                return cepAsyncError.current;
                              return undefined;
                            }}
                          >
                            {({ field, form }) => (
                              <FormInput
                                field={{
                                  ...field,
                                  onBlur: (e) => {
                                    field.onBlur(e);
                                    handleZipBlur(
                                      e,
                                      form.setFieldValue,
                                      form.setFieldError,
                                      form.setFieldTouched
                                    );
                                  },
                                  onChange: (e) => {
                                    cepAsyncError.current = "";
                                    form.setFieldError("zipcode", undefined);
                                    field.onChange(e);
                                  },
                                }}
                                form={form}
                                {...adFormFields.zipcode}
                              />
                            )}
                          </Field>
                        </Col>
                        <Col md={7}>
                          <Field name={adFormFields.city.name}>
                            {({ field, form }) => (
                              <FormInput
                                field={field}
                                form={form}
                                {...adFormFields.city}
                              />
                            )}
                          </Field>
                        </Col>
                        <Col md={2}>
                          <Field name={adFormFields.state.name}>
                            {({ field, form }) => (
                              <FormInput
                                field={field}
                                form={form}
                                {...adFormFields.state}
                              />
                            )}
                          </Field>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Field name={adFormFields.address1.name}>
                            {({ field, form }) => (
                              <FormInput
                                field={field}
                                form={form}
                                {...adFormFields.address1}
                              />
                            )}
                          </Field>
                        </Col>
                        <Col md={2}>
                          <Field name={adFormFields.streetNumber.name}>
                            {({ field, form }) => (
                              <FormInput
                                field={field}
                                form={form}
                                {...adFormFields.streetNumber}
                              />
                            )}
                          </Field>
                        </Col>
                        <Col md={4}>
                          <Field name={adFormFields.address2.name}>
                            {({ field, form }) => (
                              <FormInput
                                field={field}
                                form={form}
                                {...adFormFields.address2}
                              />
                            )}
                          </Field>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          {/* Custom select for radius */}
                          <Form.Group>
                            <Form.Label>{adFormFields.radius.label}</Form.Label>
                            <Field
                              as="select"
                              name={adFormFields.radius.name}
                              className="form-select"
                            >
                              {adFormFields.radius.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Field>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <Field name={adFormFields.phone1.name}>
                            {({ field, form }) => (
                              <FormInput
                                field={field}
                                form={form}
                                {...adFormFields.phone1}
                              />
                            )}
                          </Field>
                        </Col>
                        <Col md={4}>
                          <Field name={adFormFields.phone2.name}>
                            {({ field, form }) => (
                              <FormInput
                                field={field}
                                form={form}
                                {...adFormFields.phone2}
                              />
                            )}
                          </Field>
                        </Col>
                        <Col md={4}>
                          <Field name={adFormFields.whatsapp.name}>
                            {({ field, form }) => (
                              <FormInput
                                field={field}
                                form={form}
                                {...adFormFields.whatsapp}
                              />
                            )}
                          </Field>
                        </Col>
                      </Row>
                      <Form.Group controlId="email" className="mb-3">
                        <Field name={adFormFields.email.name}>
                          {({ field, form }) => (
                            <FormInput
                              field={field}
                              form={form}
                              {...adFormFields.email}
                            />
                          )}
                        </Field>
                      </Form.Group>
                      <Form.Group controlId="website" className="mb-3">
                        <Field name={adFormFields.website.name}>
                          {({ field, form }) => (
                            <FormInput
                              field={field}
                              form={form}
                              {...adFormFields.website}
                            />
                          )}
                        </Field>
                      </Form.Group>
                    </Row>
                  </Tab>
                  {/* Fotos Tab */}
                  <Tab eventKey="photo" title="Fotos">
                    <Row>
                      <Col md={6}>
                        <div style={{ textAlign: "center" }}>
                          Você poderá cadastrar até 3 fotos de seu anúncio (10
                          fotos se tiver contrato de publicidade)!
                          <br />
                          Use apenas imagens do tipo JPEG, PNG ou JPG.
                        </div>
                        {/* Implement photo upload logic here */}
                      </Col>
                    </Row>
                  </Tab>
                  {/* Calendário Tab */}
                  <Tab eventKey="calendar" title="Calendário">
                    <Row>
                      <Col md={6}>
                        <div style={{ textAlign: "center" }}>
                          Informe claramente o período e horários de seu
                          serviço, negócio ou evento!
                        </div>
                        <Field name={adFormFields.startdate.name}>
                          {({ field, form }) => (
                            <FormInput
                              field={field}
                              form={form}
                              {...adFormFields.startdate}
                            />
                          )}
                        </Field>
                        <Field name={adFormFields.finishdate.name}>
                          {({ field, form }) => (
                            <FormInput
                              field={field}
                              form={form}
                              {...adFormFields.finishdate}
                            />
                          )}
                        </Field>
                        <Field name={adFormFields.timetext.name}>
                          {({ field, form }) => (
                            <FormInput
                              field={field}
                              form={form}
                              {...adFormFields.timetext}
                            />
                          )}
                        </Field>
                      </Col>
                    </Row>
                  </Tab>
                  {/* Publicidade Tab */}
                  <Tab
                    eventKey="publicity"
                    title={<span className="spanredbold">Publicidade</span>}
                  >
                    <Row>
                      <Col className="text-center">
                        <h4>Contrate publicidade para seu anúncio!!</h4>
                      </Col>
                    </Row>
                  </Tab>
                </Tabs>
              </Col>
            </Row>
            <Notification />
            {/* Action buttons */}
            <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
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
                onClick={handleCancel}
              >
                Voltar
              </OTButton>
              <OTButton
                variant="success"
                imgSrc="/images/plus.png"
                imgAlt="Novo Anúncio"
              >
                Novo Anúncio
              </OTButton>
              <OTButton
                className="btn-danger"
                imgSrc="/images/delete.png"
                imgAlt="Remover Anúncio"
              >
                Remover Anúncio
              </OTButton>
            </div>
            {/* Modals */}
            <Modal show={showLogout} onHide={handleCloseLogout}>
              <Modal.Header closeButton>
                <Modal.Title>Logout</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Você realmente deseja desconectar seu usuário?
              </Modal.Body>
              <Modal.Footer>
                <OTButton variant="primary" onClick={handleCloseLogout}>
                  Sim
                </OTButton>
                <OTButton variant="warning" onClick={handleCloseLogout}>
                  Não
                </OTButton>
              </Modal.Footer>
            </Modal>
          </FormikForm>
        )}
      </Formik>
    </Container>
  );
}
