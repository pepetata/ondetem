export const buildValidationSchema = (fields) => {
  const shape = {};

  Object.values(fields).forEach((field) => {
    console.log(field.name, "required?", field.required);
    let validator = Yup.string();

    if (field.type === "email") {
      validator = validator.email(field.emailError || "Email inválido");
    }
    if (field.required) {
      validator = validator.required(field.requiredError || "Obrigatório");
    }
    if (field.name === "confirmpassword") {
      validator = validator.oneOf(
        [Yup.ref("password"), null],
        field.passwordError || "Senhas não coincidem"
      );
    }
    shape[field.name] = validator;
  });

  return Yup.object().shape(shape);
};