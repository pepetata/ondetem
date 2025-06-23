import { useRef } from "react";
import { Field, ErrorMessage } from "formik";
import FormInput from "./FormInput";

export default function ZipCodeField({ name, formik, adFormFields }) {
  const cepAsyncError = useRef("");

  const handleZipBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length === 8) {
      let timeoutId;
      cepAsyncError.current = "Buscando CEP...";
      formik.setFieldTouched(name, true, false);
      formik.setFieldError(name, "Buscando CEP...");
      try {
        const timeoutPromise = new Promise(
          (_, reject) =>
            (timeoutId = setTimeout(
              () => reject(new Error("Tempo de resposta excedido")),
              5000
            ))
        );
        const fetchPromise = fetch(
          `https://viacep.com.br/ws/${cep}/json/`
        ).then((res) => res.json());

        const data = await Promise.race([fetchPromise, timeoutPromise]);

        if (!data.erro) {
          formik.setFieldValue("address1", data.logradouro || "");
          formik.setFieldValue("city", data.localidade || "");
          formik.setFieldValue("state", data.uf || "");
          cepAsyncError.current = "";
          formik.setFieldError(name, undefined);
          formik.setFieldTouched(name, true, true);
        } else {
          cepAsyncError.current = "CEP não encontrado";
          formik.setFieldError(name, "CEP não encontrado");
          formik.setFieldTouched(name, true, false);
          formik.setFieldValue("address1", "");
          formik.setFieldValue("city", "");
          formik.setFieldValue("state", "");
          setTimeout(() => e.target.focus(), 0);
        }
      } catch (err) {
        cepAsyncError.current = "Erro ao buscar CEP";
        formik.setFieldError(name, "Erro ao buscar CEP");
        formik.setFieldTouched(name, true, false);
        setTimeout(() => e.target.focus(), 0);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };

  return (
    <Field name={name}>
      {({ field, form }) => (
        <FormInput
          field={{
            ...field,
            onBlur: (e) => {
              field.onBlur(e);
              handleZipBlur(e);
            },
            onChange: (e) => {
              cepAsyncError.current = "";
              form.setFieldError(name, undefined);
              field.onChange(e);
            },
          }}
          form={form}
          {...adFormFields[name]}
        />
      )}
    </Field>
  );
}
