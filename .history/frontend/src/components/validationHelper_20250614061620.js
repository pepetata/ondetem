import * as Yup from "yup";

export const buildValidationSchema = (fields) => {
  const shape = {};

  Object.values(fields).forEach((field) => {
    let validator;

    if (field.type === "checkbox") {
      validator = Yup.boolean();
      if (field.required) {
        validator = validator.oneOf(
          [true],
          field.requiredError || "Obrigatório"
        );
      }
    } else if (field.type === "email") {
      validator = Yup.string().email(field.emailError || "Email inválido");
      if (field.required) {
        validator = validator.required(field.requiredError || "Obrigatório");
      }
    } else {
      validator = Yup.string();
      if (field.required) {
        validator = validator.required(field.requiredError || "Obrigatório");
      }
      if (field.name === "confirmpassword") {
        validator = validator.oneOf(
          [Yup.ref("password"), null],
          field.passwordError || "Senhas não coincidem"
        );
      }
    }

    shape[field.name] = validator;
  });

  return Yup.object().shape(shape);
};
