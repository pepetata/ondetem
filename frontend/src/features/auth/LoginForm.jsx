import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import Notification from "../../components/Notification.jsx";
import OTButton from "../../components/OTButton.jsx";
import { loginThunk } from "../../redux/authSlice.js";
import { fetchUserThunk } from "../../redux/userSlice";
import { setUser } from "../../redux/authSlice";
import "../../scss/LoginForm.scss";

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    const { email, password, rememberMe } = values;
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      const { token, user } = result.payload;
      if (rememberMe) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("authToken", token);
        sessionStorage.setItem("user", JSON.stringify(user));
      }
      // Fetch full user profile and update Redux
      const profileResult = await dispatch(fetchUserThunk());
      if (fetchUserThunk.fulfilled.match(profileResult)) {
        dispatch(setUser(profileResult.payload)); // <-- This updates auth.user!
        // Optionally update storage with full user:
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify(profileResult.payload));
        } else {
          sessionStorage.setItem("user", JSON.stringify(profileResult.payload));
        }
      }
      navigate("/");
    } else {
      setFieldError("email", result.payload);
      setFieldError("password", result.payload);
    }
    setSubmitting(false);
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleSignup = () => {
    navigate("/user");
  };

  return (
    <div className="container">
      <Formik
        initialValues={{ email: "", password: "", rememberMe: false }}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange }) => (
          <Form>
            <div className="row justify-content-center">
              <div className="col-12 col-sm-8 col-md-6 col-lg-4">
                <p>Informe suas credenciais para entrar no sistema:</p>
                <div className="mb-3">
                  <label>Email</label>
                  <Field
                    name="email"
                    type="email"
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="mb-3">
                  <label>Senha</label>
                  <Field
                    name="password"
                    type="password"
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="mb-3 form-check">
                  <Field
                    name="rememberMe"
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Lembrar-me
                  </label>
                </div>
                <Notification className="error" />
                <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
                  <OTButton type="submit" className="savebutton">
                    Entrar
                  </OTButton>
                  <OTButton onClick={handleSignup}>Registre-se</OTButton>
                  <OTButton
                    className="cancelbutton"
                    imgSrc="/images/return.png"
                    imgAlt="Voltar"
                    onClick={handleCancel}
                  >
                    Voltar
                  </OTButton>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default LoginForm;
