export const userFormFields = {
  fullName: {
    label: "Nome Completo",
    type: "text",
    name: "fullName",
    maxLength: 100,
    minLength: 3,
    required: true,
    placeholder: "Nome Completo",
    requiredError: "O nome é obrigatório",
    lengthError: "O apelido deve ter entre 3 e 100 caracteres",
  },
  nickname: {
    label: "Primeiro nome ou apelido",
    type: "text",
    name: "nickname",
    maxLength: 100,
    minLength: 3,
    required: true,
    placeholder: "Primeiro nome ou apelido",
    // requiredError: "Obrigatório",
    requiredError: "O apelido é obrigatório",
    lengthError: "O apelido deve ter entre 3 e 100 caracteres",
  },

  email: {
    label: "Email",
    type: "email",
    name: "email",
    required: true,
    placeholder: "Email",
    requiredError: "Obrigatório",
    emailError: "Email inválido",
  },
  password: {
    label: "Senha",
    type: "password",
    name: "password",
    maxLength: 100,
    minLength: 3,
    required: true,
    placeholder: "Senha",
    requiredError: "A senha é obrigatória",
    lengthError: "A senha deve ter entre 3 e 100 caracteres",
  },
  // confirmpassword: {
  //   label: "Confirme a senha",
  //   type: "password",
  //   name: "confirmpassword",
  //   required: true,
  //   placeholder: "Confirme a senha",
  //   requiredError: "Confirme a senha é obrigatória",
  //   passwordError: "Senhas não coincidem",
  // },
  useragreement: {
    label: "",
    type: "checkbox",
    name: "useragreement",
    required: true,
    requiredError: "Obrigatório",
  },
};

// Dynamically generate lengthError for each field
Object.values(userFormFields).forEach((field) => {
  if (field.minLength && field.maxLength) {
    field.lengthError = `O ${field.label.toLowerCase()} deve ter entre ${
      field.minLength
    } e ${field.maxLength} caracteres`;
  } else if (field.minLength) {
    field.lengthError = `O ${field.label.toLowerCase()} deve ter no mínimo ${
      field.minLength
    } caracteres`;
  } else if (field.maxLength) {
    field.lengthError = `O ${field.label.toLowerCase()} deve ter no máximo ${
      field.maxLength
    } caracteres`;
  }
});
