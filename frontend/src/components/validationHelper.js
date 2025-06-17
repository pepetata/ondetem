import * as Yup from "yup";

export const buildValidationSchema = (fields, isNewUser) => {
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
    } else if (field.name === "password") {
      validator = Yup.string();
      if (isNewUser) {
        validator = validator.required(field.requiredError || "Obrigatório");
      }
    } else if (field.name === "confirmpassword") {
      validator = Yup.string().when("password", {
        is: (val) => !!val,
        then: (schema) =>
          schema
            .required(field.requiredError || "Obrigatório")
            .oneOf(
              [Yup.ref("password"), null],
              field.passwordError || "Senhas não coincidem"
            ),
        otherwise: (schema) => schema.notRequired(),
      });
    } else {
      validator = Yup.string();
      if (field.required) {
        validator = validator.required(field.requiredError || "Obrigatório");
      }
    }

    shape[field.name] = validator;
  });

  return Yup.object().shape(shape);
};
