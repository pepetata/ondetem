import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Tabs,
  Tab,
  Modal,
  InputGroup,
} from "react-bootstrap";
// import FroalaEditorComponent from "react-froala-wysiwyg";
// import "froala-editor/js/plugins.pkgd.min.js";
// import "froala-editor/css/froala_editor.pkgd.min.css";
// import "froala-editor/css/themes/gray.min.css";
// import "froala-editor/css/froala_style.min.css";
// import "froala-editor/css/plugins/colors.min.css";
// import "froala-editor/css/plugins/emoticons.min.css";
// import "froala-editor/css/plugins/fullscreen.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Notification from "../../components/Notification";
import OTButton from "../../components/OTButton";
import "../../scss/AdForm.scss";

// You may need to install and import a React star rating component
// import StarRatings from 'react-star-ratings';

const initialForm = {
  title: "",
  short: "",
  description: "",
  tags: "",
  address1: "",
  address2: "",
  city: "",
  state: "--",
  zipcode: "",
  radius: "0",
  phone1: "",
  phone2: "",
  phone3: "",
  whatsapp: "",
  email: "",
  website: "",
  startdate: "",
  finishdate: "",
  timetext: "",
  dominio: "",
  // ...other fields
};

const states = [
  "--",
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export default function AdForm() {
  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState("description");
  const [showLogout, setShowLogout] = useState(false);
  const [showSaving, setShowSaving] = useState(false);
  // ...other modal states

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFroalaChange = (content) => {
    setForm((prev) => ({ ...prev, description: content }));
  };

  const handleTabSelect = (k) => setActiveTab(k);

  // Modal handlers (example)
  const handleShowLogout = () => setShowLogout(true);
  const handleCloseLogout = () => setShowLogout(false);

  const handleCancel = () => {
    // Logic to handle cancel action, e.g., navigate back or reset form
  };

  const handleZipBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length === 8) {
      console.log(`handleZipBlur called with value: ${cep}`);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        console.log(`Fetched data for CEP ${cep}:`, data);
        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            address1: data.logradouro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching CEP data:", err);
        // Optionally, you can set an error state or show a notification
        // handle error (optional)
      }
    }
  };

  return (
    <Container>
      {/* Navbar/Header would be a separate component */}
      <Row>
        <Col>
          <h3 className="mt-4 mb-3">
            Registre as informações de seus anúncios
          </h3>
        </Col>
      </Row>
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group controlId="title" className="mb-3">
              <Form.Label>Título</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Título do serviço, negócio, evento ou produto"
                maxLength={100}
                required
              />
            </Form.Group>
            {/* Counters can be added here as disabled inputs */}
          </Col>
        </Row>
        <Row>
          <Col>
            <Tabs
              id="adform-tabs"
              activeKey={activeTab}
              onSelect={handleTabSelect}
              className="mb-3 center-tabs"
            >
              {/* Descrição Tab */}
              <Tab eventKey="description" title="Descrição">
                <Row>
                  <Col md={7}>
                    <Form.Group controlId="short" className="mb-3">
                      <Form.Label>Descrição resumida</Form.Label>
                      <Form.Control
                        type="text"
                        name="short"
                        value={form.short}
                        onChange={handleChange}
                        placeholder="Descrição resumida"
                        maxLength={255}
                      />
                    </Form.Group>
                    <Form.Group controlId="description" className="mb-3">
                      <Form.Label>Descrição detalhada</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={8}
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Coloque aqui a descrição detalhada de seu negócio..."
                        maxLength={2000}
                      />
                    </Form.Group>
                    <Form.Group controlId="tags" className="mb-3">
                      <Form.Label>Tags, palavras-chave</Form.Label>
                      <Form.Control
                        type="text"
                        name="tags"
                        value={form.tags}
                        onChange={handleChange}
                        placeholder="Informe as palavras-chave (tags)..."
                        maxLength={255}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    {/* Categories selection UI goes here */}
                    <Form.Group>
                      <Form.Label>Categorias selecionadas:</Form.Label>
                      <div className="selectedCategories">
                        {/* Render selected categories here */}
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
                <Row>
                  <Col md={3}>
                    <Form.Group controlId="zipcode" className="mb-3">
                      <Form.Label>CEP</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipcode"
                        value={form.zipcode}
                        onChange={handleChange}
                        onBlur={handleZipBlur}
                        placeholder="CEP"
                        maxLength={9}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={7}>
                    <Form.Group controlId="city" className="mb-3">
                      <Form.Label>Cidade</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={form.city}
                        // onChange={handleChange}
                        // placeholder="Cidade"
                        // maxLength={30}
                        readOnly
                        tabIndex={-1}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="state" className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={form.state}
                        // onChange={handleChange}
                        // placeholder="Cidade"
                        // maxLength={30}
                        readOnly
                        tabIndex={-1}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="address1" className="mb-3">
                      <Form.Label>Endereço</Form.Label>
                      <Form.Control
                        type="text"
                        name="address1"
                        value={form.address1}
                        // onChange={handleChange}
                        // placeholder="exemplo: Av. Mandaqui"
                        // maxLength={100}
                        readOnly
                        tabIndex={-1}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="streetNumber" className="mb-3">
                      <Form.Label>Número</Form.Label>
                      <Form.Control
                        type="text"
                        name="streetNumber"
                        value={form.streetNumber}
                        onChange={handleChange}
                        placeholder="197"
                        maxLength={20}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="address2" className="mb-3">
                      <Form.Label>Complemento</Form.Label>
                      <Form.Control
                        type="text"
                        name="address2"
                        value={form.address2}
                        onChange={handleChange}
                        placeholder="exemplo: sala 32, Limão"
                        maxLength={100}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group controlId="radius" className="mb-3">
                      <Form.Label>Raio de Atendimento</Form.Label>
                      <Form.Select
                        name="radius"
                        value={form.radius}
                        onChange={handleChange}
                      >
                        <option value="0">----</option>
                        <option value="1">até 1 km</option>
                        <option value="2">até 2 km</option>
                        <option value="3">até 3 km</option>
                        <option value="4">até 4 km</option>
                        <option value="5">até 5 km</option>
                        <option value="10">até 10 km</option>
                        <option value="15">até 15 km</option>
                        <option value="20">até 20 km</option>
                        <option value="25">até 25 km</option>
                        <option value="30">até 30 km</option>
                        <option value="35">até 35 km</option>
                        <option value="40">até 40 km</option>
                        <option value="45">até 45 km</option>
                        <option value="50">até 50 km</option>
                        <option value="60">até 60 km</option>
                        <option value="70">até 70 km</option>
                        <option value="80">até 80 km</option>
                        <option value="90">até 90 km</option>
                        <option value="100">até 100 km</option>
                        <option value="150">até 150 km</option>
                        <option value="200">até 200 km</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group controlId="phone1" className="mb-3">
                      <Form.Label>Telefone 1</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone1"
                        value={form.phone1}
                        onChange={handleChange}
                        placeholder="(xx)xxxx-xxxx"
                        maxLength={20}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="phone2" className="mb-3">
                      <Form.Label>Telefone 2</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone2"
                        value={form.phone2}
                        onChange={handleChange}
                        placeholder="(xx)xxxx-xxxx"
                        maxLength={20}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="whatsapp" className="mb-3">
                      <Form.Label>WhatsApp</Form.Label>
                      <Form.Control
                        type="text"
                        name="whatsapp"
                        value={form.whatsapp}
                        onChange={handleChange}
                        placeholder="(xx)xxxx-xxxx"
                        maxLength={20}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row></Row>
                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    maxLength={100}
                  />
                </Form.Group>
                <Form.Group controlId="website" className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="exemplo: https://www.ondetem.org"
                    maxLength={100}
                  />
                </Form.Group>
              </Tab>
              {/* Fotos Tab */}
              <Tab eventKey="photo" title="Fotos">
                <Row>
                  <Col md={6}>
                    <div style={{ textAlign: "center" }}>
                      Você poderá cadastrar até 3 fotos de seu anúncio (10 fotos
                      se tiver contrato de publicidade)!
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
                      Informe claramente o período e horários de seu serviço,
                      negócio ou evento!
                    </div>
                    <Form.Group controlId="startdate" className="mb-3">
                      <Form.Label>Data Inicial:</Form.Label>
                      <Form.Control
                        type="date"
                        name="startdate"
                        value={form.startdate}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group controlId="finishdate" className="mb-3">
                      <Form.Label>Data Final:</Form.Label>
                      <Form.Control
                        type="date"
                        name="finishdate"
                        value={form.finishdate}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group controlId="timetext" className="mb-3">
                      <Form.Label>Horários</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        name="timetext"
                        value={form.timetext}
                        onChange={handleChange}
                        placeholder="Horários"
                        maxLength={1000}
                      />
                    </Form.Group>
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
        <Row className="justify-content-center mt-4">
          <Col xs="auto">
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
              // className="btn-danger"
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
            {/* ...other buttons */}
          </Col>
        </Row>
      </Form>
      {/* Modals */}
      <Modal show={showLogout} onHide={handleCloseLogout}>
        <Modal.Header closeButton>
          <Modal.Title>Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Você realmente deseja desconectar seu usuário?</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseLogout}>
            Sim
          </Button>
          <Button variant="warning" onClick={handleCloseLogout}>
            Não
          </Button>
        </Modal.Footer>
      </Modal>
      {/* ...other modals */}
    </Container>
  );
}
