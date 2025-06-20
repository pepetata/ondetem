import axios from "axios";
let server = import.meta.env.VITE_API_URL;
server ||= process.env.BASEURL;
const baseUrl = server + "/api/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const login = async (email, password) => {
  console.log(`Logging in user: ${baseUrl}/login`);
  const response = await axios.post(`${baseUrl}/login`, {
    email,
    password,
  });
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(`${baseUrl}/logout`);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${baseUrl}/current`);
  return response.data;
};
