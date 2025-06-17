import axios from "axios";

export const createUser = async (formData) => {
  console.log(`usersAPI createUser`, { formData });
  const response = await axios.post(
    "http://localhost:3000/api/users",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const updateUser = async (userId, formData) => {
  console.log(`usersAPI updateUser`, { userId, formData });
  const response = await axios.put(
    `http://localhost:3000/api/users/${userId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const fetchCurrentUser = async (token) => {
  const response = await axios.get("http://localhost:3000/api/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
