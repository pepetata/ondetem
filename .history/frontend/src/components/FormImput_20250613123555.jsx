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
