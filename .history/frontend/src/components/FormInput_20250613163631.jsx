import PropTypes from "prop-types";
import { Form } from "react-bootstrap";

const FormInput = ({
  field,
  form,
  label,
  type,
  placeholder,
  maxLength,
  required,
}) => {
  const { name } = field;
  const { touched, errors } = form;
  const metaError = touched[name] && errors[name];

  return (
    <Form.Group>
      {props.label && <Form.Label>{props.label}</Form.Label>}
      <Form.Control {...field} {...props} isInvalid={!!metaError} />
      <Form.Control.Feedback type="invalid">{metaError}</Form.Control.Feedback>
    </Form.Group>
  );
};

FormInput.propTypes = {
  field: PropTypes.object.isRequired, // Provided by Formik's <Field>
  form: PropTypes.object.isRequired, // Provided by Formik's <Field>
  label: PropTypes.string,
};

export default FormInput;
