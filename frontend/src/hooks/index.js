import { useState } from "react";

export const useFormFields = (initialFields) => {
  // Helper to add id, name, and onChange to each field
  const addProps = (fields, handleChange) =>
    Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [
        key,
        {
          ...field,
          id: field.name || key,
          name: field.name || key,
          onChange: handleChange,
        },
      ])
    );

  const [fields, setFields] = useState(() =>
    addProps(initialFields, handleChange)
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setFields((prev) =>
      addProps(
        {
          ...prev,
          [name]: {
            ...prev[name],
            value,
          },
        },
        handleChange
      )
    );
  }

  const clear = () => setFields(addProps(initialFields, handleChange));

  return [fields, clear];
};

export const useField = (type, name) => {
  const [value, setValue] = useState("");

  const onChange = (event) => {
    setValue(event.target.value);
  };

  const clear = () => setValue("");

  return {
    type,
    id: name,
    name,
    value,
    onChange,
    clear,
  };
};

// modules can have several named exports

export const useAnotherHook = () => {
  // ...
};
