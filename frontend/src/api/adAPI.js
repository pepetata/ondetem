import axios from "axios";
let server = import.meta.env.VITE_API_URL;
server = server || process.env.BASEURL;
const baseUrl = server + "/api/ads";

// Helper to get token from state or storage
export function getToken(getState) {
  const state = typeof getState === "function" ? getState() : {};
  return (
    state?.auth?.token ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken")
  );
}

export const createAd = async (formData, token) => {
  console.log(`Creating ad with data:`, formData);

  // Convert to FormData if it's not already
  let data = formData;
  if (!(formData instanceof FormData)) {
    data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });
  }

  const response = await axios.post(`${baseUrl}/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type manually for FormData - let browser set it with boundary
    },
  });
  return response.data;
};

export const updateAd = async (adId, formData, token) => {
  // Convert to FormData if it's not already
  let data = formData;
  if (!(formData instanceof FormData)) {
    data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });
  }

  const response = await axios.put(`${baseUrl}/${adId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type manually for FormData - let browser set it with boundary
    },
  });
  return response.data;
};

export const deleteAd = async (adId, token) => {
  const response = await axios.delete(`${baseUrl}/${adId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getAd = async (adId) => {
  const response = await axios.get(`${baseUrl}/${adId}`);
  return response.data;
};

export const getAllAds = async () => {
  const response = await axios.get(`${baseUrl}/`);
  return response.data;
};

export const searchAds = async (searchTerm) => {
  const response = await axios.get(`${baseUrl}/search`, {
    params: { q: searchTerm },
  });
  return response.data;
};

export const getUserAds = async (token) => {
  const response = await axios.get(`${baseUrl}/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const uploadAdImages = async (adId, file, token) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await axios.post(`${baseUrl}/${adId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getAdImages = async (adId) => {
  const response = await axios.get(`${baseUrl}/${adId}/images`);
  return response.data;
};

export const deleteAdImages = async (adId, filename, token) => {
  const response = await axios.delete(`${baseUrl}/${adId}/images/${filename}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
