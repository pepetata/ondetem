import { error } from "console";

export const userFormFields = {
  name: {
    label: "",
    type: "text",
    value: "",
    name: "fullName",
    maxLength: 100,
    required: true,
    placeholder: "Nome Completo",
    requiredError: "Obrigatório",
  },
  nickname: {
    label: "",
    type: "text",
    value: "",
    name: "nickname",
    maxLength: 20,
    required: true,
    placeholder: "Primeiro nome ou apelido",
    requiredError: "Obrigatório",
  },

  email: {
    label: "",
    type: "email",
    value: "",
    name: "email",
    required: true,
    placeholder: "Email",
    requiredError: "Obrigatório",
    emailError: "Email inválido",
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
