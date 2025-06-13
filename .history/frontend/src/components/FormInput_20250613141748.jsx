import PropTypes from "prop-types";
import { Form } from "react-bootstrap";

const FormInput = ({ field, form }) => {
  const { label, type, placeholder, maxLength, required } = field;
  const { values, errors, touched } = form;

  return (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={type}
        name={field.name}
        value={values[field.name] || ""}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        isInvalid={touched[field.name] && !!errors[field.name]}
      />
      <Form.Control.Feedback type="invalid">
        {errors[field.name]}
      </Form.Control.Feedback>
    </Form.Group>
  );
};

FormInput.propTypes = {
  field: PropTypes.shape({
    label: PropTypes.string.isRequired,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    maxLength: PropTypes.number,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
  }).isRequired,
  form: PropTypes.shape({
    values: PropTypes.object.isRequired,
    errors: PropTypes.object,
    touched: PropTypes.object,
    handleChange: PropTypes.func.isRequired,
    handleBlur: PropTypes.func.isRequired,
  }).isRequired,
};

export default FormInput;
