import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    email,
    password,
  });
  return response.data;
};
export const logout = async () => {
  const response = await axios.post(`${API_URL}/api/auth/logout`);
  return response.data;
};
export const getCurrentUser = async () => {
  const response = await axios.get(`${API_URL}/api/auth/current`);
  return response.data;
};
