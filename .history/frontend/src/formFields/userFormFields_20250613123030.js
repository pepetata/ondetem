import { useFormFields } from "../hooks";

export const userFormFields = useFormFields({
  name: {
    type: "text",
    label: "Nome Completo",
    value: "",
    name: "name",
    maxLength: "100",
    required: true,
    placeholder: "Type the full name",
  },
  number: {
    label: "Number",
    value: "",
    name: "number",
    placeholder: "Type the number",
  },
  email: {
    label: "Email",
    value: "",
    name: "email",
    placeholder: "Type the email",
  },
  address: {
    label: "Address",
    value: "",
    name: "address",
    placeholder: "Type the address",
  },
});
