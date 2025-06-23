import { Row, Col, Form } from "react-bootstrap";
import { Field } from "formik";
import FormInput from "../../components/FormInput";

export default function AdFormDescriptionTab({ adFormFields }) {
  return (
    <Row className="justify-content-center">
      <Col md={8}>
        <Field name={adFormFields.short.name}>
          {({ field, form }) => (
            <FormInput field={field} form={form} {...adFormFields.short} />
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
            <FormInput field={field} form={form} {...adFormFields.tags} />
          )}
        </Field>
      </Col>
      <Col md={4}>
        <Form.Group>
          <Form.Label>Categorias selecionadas:</Form.Label>
          <div className="selectedCategories">
            <span style={{ color: "red" }}>Nenhuma categoria selecionada.</span>
          </div>
        </Form.Group>
        <Form.Group>
          <Form.Label>Categorias (clique nas categorias):</Form.Label>
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
  );
}
