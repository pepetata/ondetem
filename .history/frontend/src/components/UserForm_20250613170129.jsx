import { Formik, Form as FormikForm, Field } from "formik";
import { Form, Row, Col, Image } from "react-bootstrap";
import { userFormFields } from "../formFields/userFormFields";
import OTButton from "./OTButton";
import FormInput from "./FormInput";
import { validationHelper}
import * as Yup from "yup";

const defaultImg = "/images/nophoto.jpg";

// Build initialValues from userFormFields
const initialValues = Object.fromEntries(
  Object.values(userFormFields).map((f) => [f.name, ""])
);

// Helper to build Yup schema from userFormFields

const validationSchema = buildValidationSchema(userFormFields);
console.log(`Validation Schema: ${JSON.stringify(validationSchema, null, 2)}`);

const UserForm = () => {
  return (
    <div className="container">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnBlur={false}
        validateOnChange={false}
        onSubmit={(e) => {
          // Mark all fields as touched
          setTouched(
            Object.fromEntries(
              Object.keys(initialValues).map((key) => [key, true])
            ),
            true // shouldValidate
          );
          // Optionally, log errors after validation
          setTimeout(() => {
            console.log("AFTER SUBMIT ERRORS", actions.errors);
          }, 0);
          handleSubmit(e);
        }}
      >
        {({
          setTouched,
          setFieldValue,
          values,
          handleSubmit,
          errors,
          touched,
        }) => {
          console.log("errors", errors, "touched", touched);
          return (
            <FormikForm
              id="signup"
              onSubmit={(e) => {
                setTouched(
                  Object.fromEntries(
                    Object.keys(initialValues).map((key) => [key, true])
                  ),
                  true // shouldValidate
                );
                handleSubmit(e);
              }}
            >
              <Row className="userData">
                <Col md={6}>
                  <h3>Informe seus dados:</h3>
                  {Object.values(userFormFields).map((field) => (
                    <Field name={field.name} key={field.name}>
                      {({ form }) => {
                        {
                          /* console.log(`Rendering field: ${field}`); */
                        }
                        return (
                          <FormInput
                            field={{ ...field }}
                            form={form}
                            label={field.label}
                            type={field.type}
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            required={field.required}
                          />
                        );
                      }}
                    </Field>
                  ))}
                  <Form.Group>
                    <Field
                      name="useragreement"
                      type="checkbox"
                      as={Form.Check}
                      label={
                        <>
                          Li e concordo com os termos do{" "}
                          <a
                            href="#"
                            onClick={() =>
                              window.$("#agreementModal").modal("show")
                            }
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
                    <Image id="previewing" src={defaultImg} rounded fluid />
                  </div>
                  <div id="selectImage" className="mt-3">
                    <Form.Label>Selecione sua foto</Form.Label>
                    <Form.Control
                      type="file"
                      name="photo"
                      accept="image/*"
                      onChange={(e) =>
                        setFieldValue("photo", e.target.files[0])
                      }
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
                >
                  Gravar
                </OTButton>
                <OTButton
                  className="cancelbutton"
                  imgSrc="/images/cancel.png"
                  imgAlt="Cancelar"
                >
                  Cancelar
                </OTButton>
                <OTButton
                  imgSrc="/images/comments.png"
                  imgAlt="Meus Comentários"
                >
                  Meus Comentários
                </OTButton>
                <OTButton
                  imgSrc="/images/twohearts.png"
                  imgAlt="Meus Favoritos"
                >
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
            </FormikForm>
          );
        }}
      </Formik>
    </div>
  );
};

export default UserForm;
