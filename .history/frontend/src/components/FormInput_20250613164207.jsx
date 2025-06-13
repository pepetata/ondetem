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
  console.log(`field`, field);

  return (
    <Form.Group>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control {...field} isInvalid={!!metaError} />
      <Form.Control.Feedback type="invalid">{metaError}</Form.Control.Feedback>
    </Form.Group>
  );
};

FormInput.propTypes = {
  field: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
  required: PropTypes.bool,
};

export default FormInput;
