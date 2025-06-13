import { useFormFields } from "./hooks";

export const userFormFields = useFormFields({
  name: {
    type: "text",
    label: "Name",
    value: "",
    name: "name",
    placeholder: "Type the name",
    maxLength: "100",
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
