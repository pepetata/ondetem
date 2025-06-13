import PropTypes from "prop-types";
import { Form } from "react-bootstrap";

const FormInput = ({ field, form }) => {
  const {
    label,
    type,
    value,
    name,
    placeholder,
    maxLength,
    required,
    onChange,
    ...inputProps
  } = field;
  // const { values, errors, touched } = form;

  return (
    <Form.Group>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        // onBlur={form.handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        isInvalid={touched[field.name] && !!errors[field.name]}
      />
      {/* <Form.Control.Feedback type="invalid">
        {errors[field.name]}
      </Form.Control.Feedback> */}
    </Form.Group>
  );
};

FormInput.propTypes = {
  field: PropTypes.shape({
    label: PropTypes.string,
    type: PropTypes.string.isRequired,
    value: PropTypes.any,
    placeholder: PropTypes.string,
    maxLength: PropTypes.number,
    required: PropTypes.bool,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  form: PropTypes.shape({
    values: PropTypes.object.isRequired,
    errors: PropTypes.object,
    touched: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    handleBlur: PropTypes.func.isRequired,
  }).isRequired,
};

export default FormInput;
