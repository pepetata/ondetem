import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Form, Button, Row, Col, Image } from "react-bootstrap";
import OTButton from "./OTButton";

const defaultImg = "/images/nophoto.jpg";

const UserForm = () => {
  const [form, setForm] = useState({
    fullName: "",
    firstName: "",
    nickname: "",
    email: "",
    password: "",
    password2: "",
    useragreement: false,
    photo: "",
  });
  const [preview, setPreview] = useState(defaultImg);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "fullName" && !form.firstName) {
      setForm((f) => ({ ...f, firstName: value.split(" ")[0] }));
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((f) => ({ ...f, photo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave(form);
  };

  const onCancel = () => {
    navigate("/");
  };

  const handleSave = () => {};

  return (
    <div className="container">
      <Form id="signup" onSubmit={handleSubmit}>
        <Row className="userData">
          <Col md={6}>
            <h3>Informe seus dados:</h3>
            <Form.Group className="required">
              <Form.Label>Nome Completo</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                placeholder="Nome Completo"
                maxLength={100}
              />
            </Form.Group>
            <Form.Group className="required">
              <Form.Label>Primeiro Nome</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="Primeiro nome"
                maxLength={20}
              />
            </Form.Group>
            <Form.Group className="required">
              <Form.Label>Apelido</Form.Label>
              <Form.Control
                type="text"
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
                required
                placeholder="Apelido"
                maxLength={20}
              />
            </Form.Group>
            <Form.Group className="required">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Email"
              />
            </Form.Group>
            <Form.Group className="required">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Senha"
              />
            </Form.Group>
            <Form.Group className="required">
              <Form.Label>Confirme a senha</Form.Label>
              <Form.Control
                type="password"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                placeholder="Confirme a senha"
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="checkbox"
                name="useragreement"
                checked={form.useragreement}
                onChange={handleChange}
                label={
                  <>
                    Li e concordo com os termos do{" "}
                    <a
                      href="#"
                      onClick={() => window.$("#agreementModal").modal("show")}
                    >
                      Acordo de Usuários
                    </a>
                  </>
                }
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <div id="image_preview">
              <Image id="previewing" src={preview} rounded fluid />
            </div>
            <div id="selectImage" className="mt-3">
              <Form.Label>Selecione sua foto</Form.Label>
              <Form.Control
                type="file"
                name="file"
                accept="image/*"
                onChange={handleFile}
              />
            </div>
          </Col>
        </Row>
        <Row className="mt-3">
          <OTButton
            variant="primary"
            imgSrc="/images/save.png"
            imgAlt="Salvar"
            onClick={handleSave}
          >
            Gravar
          </OTButton>
          <OTButton variant="secondary" className="otbutton" onClick={onCancel}>
            {/* type="button"
            as={Link}
            to="/"
            className="btn btn-default otbutton"
            onClick={onCancel}
          > */}
            <img className="images-cancel" src="/images/empty.png" alt="" />{" "}
            Cancelar
          </OTButton>
          <Button type="button" className="btn btn-default otbutton">
            <img className="images-comments" src="/images/empty.png" alt="" />{" "}
            Meus Comentários
          </Button>
          <Button type="button" className="btn btn-default otbutton">
            <img
              className="images-twohearts"
              src="/images/empty.png"
              height="20"
              alt=""
            />{" "}
            Meus Favoritos
          </Button>
          <Button type="button" className="btn btn-danger otbutton">
            <img
              className="images-userRemove"
              src="/images/empty.png"
              height="20"
              alt=""
            />{" "}
            Remover Perfil
          </Button>
        </Row>
      </Form>
    </div>
  );
};

export default UserForm;
