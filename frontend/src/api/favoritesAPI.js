import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Set up axios to include the auth token
const getAuthHeader = () => {
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const addToFavorites = async (adId) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/favorites/${adId}`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const removeFromFavorites = async (adId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/favorites/${adId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getUserFavorites = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/favorites`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const checkFavorite = async (adId) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/favorites/${adId}/check`,
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getFavoriteIds = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/favorites/ids`, {
    headers: getAuthHeader(),
  });
  return response.data;
};
