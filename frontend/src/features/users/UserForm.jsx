import { useEffect } from "react";
import { Formik, Form as FormikForm, Field } from "formik";
import { Form, Row, Col, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  createUserThunk,
  updateUserThunk,
  fetchUserThunk,
} from "../../redux/userSlice";
import { setUser } from "../../redux/authSlice";
import Notification from "../../components/Notification.jsx";
import OTButton from "../../components/OTButton.jsx";
import FormInput from "../../components/FormInput.jsx";
import { userFormFields } from "../../formfields/userFormFields.js";
import { buildValidationSchema } from "../../components/validationHelper.js";

const defaultImg = "/images/nophoto.jpg";

// Build initialValues from userFormFields
const initialValues = Object.fromEntries(
  Object.values(userFormFields).map((f) => [
    f.name,
    f.type === "checkbox" ? false : "",
  ])
);

// change the label for useragreement to have a link
userFormFields.useragreement.label = (
  <>
    Li e concordo com os termos do{" "}
    <a href="#" onClick={() => window.$("#agreementModal").modal("show")}>
      Acordo de Usuários
    </a>
  </>
);
// console.log(`Initial values for user form:`, userFormFields);

// const isNewUser = false; //!currentUser;
// const validationSchema = buildValidationSchema(userFormFields, isNewUser);

///////////////////////////////////////////////////////////////////////
const UserForm = ({ user }) => {
  const { message, type } = useSelector((state) => state.notification);
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.user.user); // <-- get user from Redux if not passed as prop
  const { loading, error, userId } = useSelector((state) => state.user);
  const navigate = useNavigate();
  console.log(`UserForm mounted with user:`, user);

  const isNewUser = !user;
  const filteredFields = isNewUser
    ? userFormFields
    : Object.fromEntries(
        Object.entries(userFormFields).filter(
          ([k, v]) => v.name !== "useragreement"
        )
      );
  const validationSchema = buildValidationSchema(filteredFields, isNewUser);

  useEffect(() => {
    if (!user) {
      dispatch(fetchUserThunk());
    }
  }, [user, dispatch]);

  const handleCancel = () => {
    console.log(`canceling`);
    // if (setShowUserForm) setShowUserForm(false);
    navigate("/");
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    console.log(`Submitting form with values:`, values);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (
        key !== "confirmpassword" &&
        key !== "useragreement" &&
        !(key === "password" && !value)
      ) {
        formData.append(key, value);
      }
    });

    if (user) {
      // Update existing user
      const updatedUser = await dispatch(
        updateUserThunk({ userId: user.id, formData })
      );
      if (updateUserThunk.fulfilled.match(updatedUser)) {
        console.log(`User updated:`, updatedUser.payload);
        // Update auth.user in Redux
        dispatch(setUser(updatedUser.payload));
        // Update storage for persistence
        localStorage.setItem("user", JSON.stringify(updatedUser.payload));
        sessionStorage.setItem("user", JSON.stringify(updatedUser.payload));
      }
    } else {
      // Create new user
      await dispatch(createUserThunk(formData));
    }
  };

  const currentUser = user;

  // Build initialValues from user data if available
  const initialValues = currentUser
    ? {
        ...Object.fromEntries(
          Object.values(userFormFields).map((f) => [
            f.name,
            f.type === "checkbox"
              ? !!currentUser[f.name]
              : currentUser[f.name] || "",
          ])
        ),
      }
    : Object.fromEntries(
        Object.values(userFormFields).map((f) => [
          f.name,
          f.type === "checkbox" ? false : "",
        ])
      );

  return (
    <div className="container">
      <Formik
        enableReinitialize
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
                  {Object.values(userFormFields)
                    .filter(
                      (field) =>
                        // Hide useragreement if editing an existing user
                        !(field.name === "useragreement" && currentUser)
                    )
                    .map((field) => (
                      <Field name={field.name} key={field.name}>
                        {({ field: formikField, form }) => (
                          <FormInput
                            field={formikField}
                            form={form}
                            label={field.label}
                            type={field.type}
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            minLength={field.minLength}
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
                <Notification className="error" />
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
                  imgSrc="/images/return.png"
                  imgAlt="Voltar"
                  onClick={handleCancel}
                >
                  Voltar
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
  user: PropTypes.object,
  onCancel: PropTypes.func,
  // setShowUserForm: PropTypes.func,
};

export default UserForm;
