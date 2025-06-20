import axios from "axios";
let server = import.meta.env.VITE_API_URL;
server = server || process.env.BASEURL;
const baseUrl = server + "/api/users";

export const createUser = async (formData) => {
  console.log(`usersAPI createUser`, Array.from(formData.entries()));
  const response = await axios.post(`${baseUrl}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateUser = async (userId, formData, token) => {
  console.log(`usersAPI updateUser`, { userId, formData });
  const response = await axios.put(`${baseUrl}/${userId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const fetchCurrentUser = async (token) => {
  const response = await axios.get(`${baseUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
