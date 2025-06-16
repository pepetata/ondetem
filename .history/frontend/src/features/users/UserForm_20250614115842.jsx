import { Formik, Form as FormikForm, Field } from "formik";
import { Form, Row, Col, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { userFormFields } from "../../formFields/userFormFields.jsx";
import { useDispatch, useSelector } from "react-redux";
import { createUserThunk } from "../../redux/userSlice";

import OTButton from "../../components/OTButton.jsx";
import FormInput from "../../components/FormInput.jsx";
import { buildValidationSchema } from "../../components/validationHelper.js";
import PropTypes from "prop-types";
import Notification from "../../components/Notification.jsx";

const defaultImg = "/images/nophoto.jpg";

// Build initialValues from userFormFields
const initialValues = Object.fromEntries(
  Object.values(userFormFields).map((f) => [
    f.name,
    f.type === "checkbox" ? false : "",
  ])
);

// Helper to build Yup schema from userFormFields

const validationSchema = buildValidationSchema(userFormFields);

const UserForm = ({ onCancel, setShowUserForm }) => {
  const { message, type } = useSelector((state) => state.notification);
  const dispatch = useDispatch();
  const { loading, error, userId } = useSelector((state) => state.user);

  const navigate = useNavigate();

  const handleCancel = () => {
    console.log(`canceling`);
    if (setShowUserForm) setShowUserForm(false);
    navigate("/");
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    console.log(`Submitting form with values:`, values);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    await dispatch(createUserThunk(formData));
  };

  return (
    <div className="container">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnBlur={true}
        validateOnChange={true}
        onSubmit={handleSubmit}
      >
        {({
          setTouched,
          setFieldValue,
          values,
          handleSubmit,
          errors,
          touched,
        }) => {
          return (
            <FormikForm id="signup" onSubmit={handleSubmit}>
              <Row className="userData">
                <Col md={6}>
                  <h3>Informe seus dados:</h3>
                  {Object.values(userFormFields).map((field) => (
                    <Field name={field.name} key={field.name}>
                      {({ field: formikField, form }) => (
                        <FormInput
                          field={formikField}
                          form={form}
                          label={field.label}
                          type={field.type}
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          required={field.required}
                        />
                      )}
                    </Field>
                  ))}
                  {/* <Form.Group>
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
                  </Form.Group> */}
                </Col>
                <Col md={6}>
                  <div id="image_preview">
                    <Image
                      id="previewing"
                      src={
                        values.photo
                          ? typeof values.photo === "string"
                            ? values.photo
                            : URL.createObjectURL(values.photo)
                          : defaultImg
                      }
                      rounded
                      fluid
                    />
                  </div>
                  <div id="selectImage" className="mt-3">
                    <Form.Label>Selecione sua foto</Form.Label>
                    <Form.Control
                      type="file"
                      name="photo"
                      accept="image/*"
                      onChange={(e) => {
                        setFieldValue("photo", e.target.files[0]);
                      }}
                    />
                  </div>
                </Col>
              </Row>
              <div>
                <Notification />
              </div>
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
                  onClick={handleCancel}
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
UserForm.propTypes = {
  onCancel: PropTypes.func,
  setShowUserForm: PropTypes.func,
};

export default UserForm;
