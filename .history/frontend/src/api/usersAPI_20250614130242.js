import axios from "axios";

export const createUser = async (formData) => {
  const response = await axios.post(
    "http://localhost:3000/api/users",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const updateUser = async (userId, formData) => {
  const response = await axios.put(
    `http://localhost:3000/api/users/${userId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};
