import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Form, Button, Row, Col, Image } from "react-bootstrap";
import { useFormFields } from "../hooks";
import { userFormFields } from "../formFields/userFormFields";
import OTButton from "./OTButton";
import FormInput from "./FormInput";

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
  const [fields, clearFields] = useFormFields(userFormFields);
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
    console.log(`saving`);
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
            {/* <Form.Group className="required">
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
            </Form.Group> */}
                      <FormInput 
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
        <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
          <OTButton
            type="submit"
            className="savebutton"
            imgSrc="/images/save.png"
            imgAlt="Gravar"
            onClick={handleSave}
          >
            Gravar
          </OTButton>
          <OTButton
            className="cancelbutton"
            onClick={onCancel}
            imgSrc="/images/cancel.png"
            imgAlt="Cancelar"
          >
            Cancelar
          </OTButton>
          <OTButton imgSrc="/images/comments.png" imgAlt="Meus Comentários">
            Meus Comentários
          </OTButton>
          <OTButton imgSrc="/images/twohearts.png" imgAlt="Meus Favoritos">
            Meus Favoritos
          </OTButton>
          <OTButton
            className="btn-danger"
            imgSrc="/images/userRemove.png"
            imgAlt="Remover Perfil"
          >
            Remover Perfil
          </OTButton>
        </div>
      </Form>
    </div>
  );
};

export default UserForm;
