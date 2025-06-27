const userFormFields = {
  fullName: {
    label: "Nome Completo",
    type: "text",
    name: "fullName",
    maxLength: 100,
    minLength: 3,
    required: true,
    placeholder: "Nome Completo",
  },
  nickname: {
    label: "Primeiro nome ou apelido",
    type: "text",
    name: "nickname",
    maxLength: 50,
    minLength: 3,
    required: true,
    placeholder: "Primeiro nome ou apelido",
  },

  email: {
    label: "Email",
    type: "email",
    name: "email",
    required: true,
    placeholder: "Email",
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
  },
};

// Dynamically generate lengthError for each field
Object.values(userFormFields).forEach((field) => {
  if (field.minLength && field.maxLength) {
    field.lengthError = `${field.label} deve ter entre ${field.minLength} e ${field.maxLength} caracteres!`;
  } else if (field.minLength) {
    field.lengthError = `${field.label} deve ter no mínimo ${field.minLength} caracteres!`;
  } else if (field.maxLength) {
    field.lengthError = `${field.label} deve ter no máximo ${field.maxLength} caracteres!`;
  }
  if (field.required && !field.requiredError) {
    field.requiredError = `${field.label} é obrigatório!`;
  }
});

module.exports = { userFormFields };
