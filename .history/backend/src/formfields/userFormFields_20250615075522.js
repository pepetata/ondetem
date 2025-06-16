const userFormFields = {
  fullName: {
    label: "Nome Completo",
    type: "text",
    name: "fullName",
    maxLength: 100,
    minLength: 3,
    required: true,
    placeholder: "Nome Completo",
    requiredError: "Obrigatório",
    lengthError: "Deve ter entre 3 e 100 caracteres",
  },
  nickname: {
    label: "Primeiro nome ou apelido",
    type: "text",
    name: "nickname",
    required: true,
    placeholder: "Primeiro nome ou apelido",
    requiredError: "Obrigatório",
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
    required: true,
    placeholder: "Senha",
  },
  confirmpassword: {
    label: "Confirme a senha",
    type: "password",
    name: "confirmpassword",
    required: true,
    placeholder: "Confirme a senha",
    requiredError: "Obrigatório",
    passwordError: "Senhas não coincidem",
  },
  useragreement: {
    label: "",
    type: "checkbox",
    name: "useragreement",
    required: true,
    requiredError: "Obrigatório",
  },
};

module.exports = { userFormFields };
