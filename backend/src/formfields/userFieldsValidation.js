const userFormFields = {
  fullName: {
    label: "Nome Completo",
    type: "text",
    name: "fullName",
    maxLength: 100,
    minLength: 3,
    required: true,
    placeholder: "Nome Completo",
    // requiredError: "O nome é obrigatório",
    // lengthError: "O apelido deve ter entre 3 e 100 caracteres",
  },
  nickname: {
    label: "Primeiro nome ou apelido",
    type: "text",
    name: "nickname",
    maxLength: 50,
    minLength: 3,
    required: true,
    placeholder: "Primeiro nome ou apelido",
    // requiredError: "Obrigatório",
    // requiredError: "O apelido é obrigatório",
    // lengthError: "O apelido deve ter entre 3 e 100 caracteres",
  },

  email: {
    label: "Email",
    type: "email",
    name: "email",
    required: true,
    placeholder: "Email",
    // requiredError: "Obrigatório",
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
    // requiredError: "A senha é obrigatória",
    // lengthError: "A senha deve ter entre 3 e 100 caracteres",
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
  // console.log(`file=`, field.name, `, field=`, field);
});

module.exports = { userFormFields };
