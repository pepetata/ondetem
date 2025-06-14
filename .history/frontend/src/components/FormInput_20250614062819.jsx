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
  const { name, value, onChange, onBlur } = field;
  const { touched, errors } = form;
  const metaError = touched[name] && errors[name];

  if (type === "checkbox") {
    return (
      <Form.Group>
        <Form.Check
          name={name}
          checked={!!value}
          onChange={onChange}
          onBlur={onBlur}
          label={label}
          isInvalid={!!metaError}
          feedback={metaError}
          feedbackType="invalid"
        />
      </Form.Group>
    );
  }

  return (
    <Form.Group>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        isInvalid={!!metaError}
      />
      <Form.Control.Feedback type="invalid">{metaError}</Form.Control.Feedback>
    </Form.Group>
  );
};

FormInput.propTypes = {
  field: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  type: PropTypes.string,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
  required: PropTypes.bool,
};

export default FormInput;
