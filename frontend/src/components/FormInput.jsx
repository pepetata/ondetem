import PropTypes from "prop-types";
import { Form } from "react-bootstrap";

const FormInput = ({
  field,
  form,
  label,
  type,
  placeholder,
  maxLength,
  minLength,
  readOnly,
  tabIndex,
  rows,
}) => {
  const { name, value, onChange, onBlur } = field;
  const { touched, errors } = form;
  const metaError = touched[name] && errors[name];

  if (type === "checkbox") {
    return (
      <Form.Group>
        <Form.Check
          id={name}
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

  if (type === "textarea") {
    return (
      <Form.Group>
        {label && <Form.Label htmlFor={name}>{label}</Form.Label>}
        <Form.Control
          as="textarea"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          isInvalid={!!metaError}
          readOnly={readOnly}
          tabIndex={tabIndex}
          rows={rows || 4}
        />
        <Form.Control.Feedback type="invalid">
          {metaError}
        </Form.Control.Feedback>
      </Form.Group>
    );
  }

  return (
    <Form.Group>
      {label && <Form.Label htmlFor={field.name}>{label}</Form.Label>}
      <Form.Control
        id={name}
        name={name}
        value={field.value == null ? "" : field.value}
        onChange={onChange}
        onBlur={onBlur}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        isInvalid={!!metaError}
        readOnly={readOnly}
        tabIndex={tabIndex}
        rows={rows}
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
  minLength: PropTypes.number,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  tabIndex: PropTypes.number,
  rows: PropTypes.number,
};

export default FormInput;
