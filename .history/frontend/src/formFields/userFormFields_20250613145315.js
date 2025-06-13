export const userFormFields = {
  name: {
    type: "text",
    value: "",
    name: "fullName",
    maxLength: 100,
    required: true,
    placeholder: "Nome Completo",
  },
  firstName: {
    type: "text",
    value: "",
    name: "nickname",
    maxLength: 20,
    required: true,
    placeholder: "Primeiro nome ou apelido",
  },

  email: {
    type: "email",
    value: "",
    name: "email",
    required: true,
    placeholder: "Email",
  },
  password: {
    label: "Senha",
    type: "password",
    value: "",
    name: "password",
    required: true,
    placeholder: "Senha",
  },
  confirmpassword: {
    label: "Confirme a senha",
    type: "password",
    value: "",
    name: "password2",
    required: true,
    placeholder: "Confirme a senha",
  },
};
