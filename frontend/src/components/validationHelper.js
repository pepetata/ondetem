import * as Yup from "yup";

export const buildValidationSchema = (fields, isNewUser) => {
  const shape = {};

  Object.values(fields).forEach((field) => {
    let validator;

    // Special cases first
    if (field.name === "confirmpassword") {
      shape[field.name] = Yup.string().when("password", {
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
      return;
    }

    if (field.name === "password") {
      validator = Yup.string();
      if (isNewUser) {
        validator = validator.required(field.requiredError || "Obrigatório");
      }
      shape[field.name] = validator;
      return;
    }

    // Main switch for field types
    switch (field.type) {
      // case "text":
      // case "string":
      //   validator = Yup.string();
      //   if (field.minLength) {
      //     validator = validator.min(
      //       field.minLength,
      //       field.minLengthError || `Mínimo de ${field.minLength} caracteres`
      //     );
      //   }
      //   break;
      case "checkbox":
        validator = Yup.boolean();
        if (field.required) {
          validator = validator.oneOf(
            [true],
            field.requiredError || "Obrigatório"
          );
        }
        break;
      case "email":
        validator = Yup.string().email(field.emailError || "Email inválido");
        break;
      case "number":
        validator = Yup.number();
        if (field.min !== undefined) {
          validator = validator.min(field.min, field.minError);
        }
        if (field.max !== undefined) {
          validator = validator.max(field.max, field.maxError);
        }
        break;
      case "date":
        validator = Yup.date();
        break;
      case "url":
        validator = Yup.string().url(
          field.patternError ||
            "Informe uma URL válida (ex: https://www.site.com)"
        );
        break;
      // case "textarea":
      //   validator = Yup.string();
      //   if (field.minLength) {
      //     validator = validator.min(
      //       field.minLength,
      //       field.minLengthError || `Mínimo de ${field.minLength} caracteres`
      //     );
      //   }
      //   break;
      default:
        validator = Yup.string();
        // Pattern validation
        if (field.pattern) {
          validator = validator.matches(field.pattern, field.patternError);
        }
        break;
    }

    // Min/max length for string fields
    if (
      ["string", "email", "url"].includes(field.type) ||
      field.type === undefined
    ) {
      if (field.minLength) {
        validator = validator.min(
          field.minLength,
          field.minLengthError || `Mínimo de ${field.minLength} caracteres`
        );
      }
      if (field.maxLength) {
        validator = validator.max(
          field.maxLength,
          field.maxLengthError || `Máximo de ${field.maxLength} caracteres`
        );
      }
    }

    // Required
    if (field.required) {
      validator = validator.required(field.requiredError || "Obrigatório");
    } else {
      validator = validator.nullable();
    }

    shape[field.name] = validator;
  });

  return Yup.object().shape(shape);
};
